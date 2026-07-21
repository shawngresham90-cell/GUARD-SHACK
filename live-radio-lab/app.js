"use strict";
/*
 * TLWS LIVE RADIO — Phase 0.5 technical spike (/live-radio-lab)
 *
 * Media plane:   LiveKit (vendored UMD client SDK, global `LivekitClient`)
 * Control plane: Supabase Edge Function (token minting; URL comes from
 *                live-radio-lab/config.js -> window.TLWS_RADIO_LAB_CONFIG)
 *
 * Spike constraints honored here:
 *  - No recording, no transcripts, no text chat.
 *  - Guest handles only (sessionStorage, cleared with the tab).
 *  - Listen-only mode; explicit microphone permission flow.
 *  - Hold-to-talk; the mic track is disabled SYNCHRONOUSLY on release.
 *  - Courtesy single-speaker lockout (client-side "channel busy").
 *  - Local mute + report action; no moderation dashboard.
 *  - Fail-soft everywhere: no config / no service => calm offline card.
 */

/* ================= Channels (Phase 0.5 set) ================= */
var CHANNELS = [
  { id: "nationwide-19", label: "Channel 19", sub: "Nationwide" },
  { id: "i-40", label: "I-40", sub: "Interstate" },
  { id: "i-65", label: "I-65", sub: "Interstate" },
  { id: "i-75", label: "I-75", sub: "Interstate" },
  { id: "i-95", label: "I-95", sub: "Interstate" }
];

/* ================= State ================= */
var S = {
  config: (window.TLWS_RADIO_LAB_CONFIG || {}),
  handle: (function () {
    try { return sessionStorage.getItem("tlws-lab-handle") || ""; } catch (e) { return ""; }
  })(),
  mode: "listen",            // "listen" | "talk"
  channel: null,             // channel object while joined
  room: null,                // LiveKit Room
  connState: "idle",         // idle|connecting|connected|reconnecting|failed|offline
  micState: "none",          // none|prompt|granted|denied|unavailable
  transmitting: false,
  channelBusy: false,        // someone else is speaking (courtesy lockout)
  mutedIdentities: {},       // identity -> true (local mute)
  retries: 0
};

var MAX_AUTO_RETRIES = 3;

/* ================= DOM helpers ================= */
function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function show(el, on) { el.classList.toggle("hidden", !on); }

var els = {};
function grabEls() {
  ["safetyGate","safetyOk","joinCard","handleInput","modeListen","modeTalk",
   "joinBtn","joinErr","radioCard","statusDot","statusText","countBadge",
   "channelGrid","currentChannel","memberList","ptt","pttHint","micNotice",
   "offlineCard","offlineDetail","retryBtn","leaveBtn","srLive"
  ].forEach(function (id) { els[id] = $(id); });
}

/* ================= Status / announcements ================= */
function announce(msg) {           // screen-reader live region (terse)
  els.srLive.textContent = msg;
}
function setConnState(state, detail) {
  S.connState = state;
  var map = {
    idle:        ["", "Not connected"],
    connecting:  ["conn", "Connecting…"],
    connected:   ["ok", "Connected"],
    reconnecting:["warn", "Reconnecting…"],
    failed:      ["err", "Connection lost"],
    offline:     ["err", "Radio offline"]
  };
  var m = map[state] || map.idle;
  els.statusDot.className = "dot " + m[0];
  els.statusText.textContent = detail || m[1];
  announce(detail || m[1]);
  updatePtt();
}

/* ================= Fail-soft ================= */
function goOffline(reason) {
  setConnState("offline");
  show(els.radioCard, false);
  show(els.joinCard, false);
  show(els.offlineCard, true);
  els.offlineDetail.textContent = reason ||
    "Live Radio is temporarily offline. The rest of the site is unaffected.";
}

/* ================= Join flow ================= */
function validHandle(h) {
  if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{2,19}$/.test(h)) return false;
  var reserved = /^(admin|mod|moderator|staff|shawn|tlws|police|911|emergency|dispatch|fcc)$/i;
  return !reserved.test(h.trim());
}

function join() {
  var h = els.handleInput.value.trim();
  if (!validHandle(h)) {
    els.joinErr.textContent = "Handle: 3–20 letters/numbers (no reserved names).";
    return;
  }
  els.joinErr.textContent = "";
  S.handle = h;
  try { sessionStorage.setItem("tlws-lab-handle", h); } catch (e) {}
  S.mode = els.modeTalk.checked ? "talk" : "listen";
  show(els.joinCard, false);
  show(els.radioCard, true);
  renderChannels();
  connectTo(CHANNELS[0]); // default to Channel 19
}

/* ================= Channel UI ================= */
function renderChannels() {
  els.channelGrid.innerHTML = "";
  CHANNELS.forEach(function (ch) {
    var b = document.createElement("button");
    b.className = "chan" + (S.channel && S.channel.id === ch.id ? " active" : "");
    b.setAttribute("aria-pressed", S.channel && S.channel.id === ch.id ? "true" : "false");
    b.innerHTML = "<b>" + esc(ch.label) + "</b><span>" + esc(ch.sub) + "</span>";
    b.addEventListener("click", function () {
      if (!S.channel || S.channel.id !== ch.id) connectTo(ch);
    });
    els.channelGrid.appendChild(b);
  });
}

/* ================= LiveKit connect / room lifecycle ================= */
function fetchToken(ch) {
  if (!S.config.tokenEndpoint) {
    return Promise.reject({ failSoft: true, msg:
      "Live Radio is not configured in this environment (no token endpoint). " +
      "This is the expected state until the LiveKit dev project is set up — see docs/SETUP.md." });
  }
  return fetch(S.config.tokenEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "token", channelId: ch.id, handle: S.handle, mode: S.mode })
  }).then(function (r) {
    if (r.status === 429) throw { failSoft: false, msg: "Too many attempts — wait a minute and retry." };
    if (!r.ok) throw { failSoft: true, msg: "Radio service unavailable (HTTP " + r.status + ")." };
    return r.json();
  });
}

function connectTo(ch) {
  disconnectRoom();                     // leave old channel first
  S.channel = ch;
  els.currentChannel.textContent = ch.label + " — " + ch.sub;
  renderChannels();
  setConnState("connecting");

  fetchToken(ch).then(function (t) {
    var LK = window.LivekitClient;
    var room = new LK.Room({ adaptiveStream: true, dynacast: true });
    S.room = room;
    wireRoomEvents(room);
    return room.connect(t.sfuUrl, t.token).then(function () {
      setConnState("connected", "Connected — " + ch.label);
      S.retries = 0;
      if (S.mode === "talk") prepareMic();
      renderMembers();
    });
  }).catch(function (err) {
    console.warn("connect failed", err);
    var detail = (err && (err.msg || err.message)) || String(err);
    if (detail === "Failed to fetch" || /NetworkError|load failed/i.test(detail)) {
      detail = "The radio service refused this page (likely a CORS/ALLOWED_ORIGIN mismatch) or is unreachable.";
    }
    if (err && err.failSoft) return goOffline(err.msg);
    if (S.retries < MAX_AUTO_RETRIES) {
      S.retries++;
      var wait = 1000 * Math.pow(2, S.retries);
      setConnState("reconnecting", "Retrying in " + (wait / 1000) + "s… (" + detail + ")");
      setTimeout(function () { if (S.channel === ch) connectTo(ch); }, wait);
    } else {
      goOffline("Could not connect. Technical reason: " + detail);
    }
  });
}

function wireRoomEvents(room) {
  var E = window.LivekitClient.RoomEvent;
  room
    .on(E.ParticipantConnected, renderMembers)
    .on(E.ParticipantDisconnected, renderMembers)
    .on(E.Reconnecting, function () { setConnState("reconnecting"); })
    .on(E.Reconnected, function () { setConnState("connected", "Reconnected"); renderMembers(); })
    .on(E.Disconnected, function () {
      if (S.connState !== "offline" && S.channel) {
        setConnState("failed", "Disconnected — attempting to rejoin…");
        stopTransmit(true);
        var ch = S.channel;
        if (S.retries < MAX_AUTO_RETRIES) { S.retries++; setTimeout(function () { connectTo(ch); }, 1500 * S.retries); }
        else goOffline("Lost connection to the radio service.");
      }
    })
    .on(E.TrackSubscribed, function (track, pub, participant) {
      if (track.kind === "audio") {
        var el = track.attach();
        el.setAttribute("data-identity", participant.identity);
        document.getElementById("audioSink").appendChild(el);
        if (S.mutedIdentities[participant.identity]) participant.setVolume(0);
      }
    })
    .on(E.TrackUnsubscribed, function (track) { track.detach().forEach(function (el) { el.remove(); }); })
    .on(E.ActiveSpeakersChanged, function (speakers) {
      var othersTalking = speakers.some(function (p) { return p !== room.localParticipant; });
      S.channelBusy = othersTalking;
      updatePtt();
      renderMembers(speakers);
    });
}

function disconnectRoom() {
  stopTransmit(true);
  if (S.room) { try { S.room.disconnect(); } catch (e) {} S.room = null; }
  var sink = document.getElementById("audioSink");
  if (sink) sink.innerHTML = "";
}

function leave() {
  S.channel = null;
  disconnectRoom();
  setConnState("idle");
  show(els.radioCard, false);
  show(els.joinCard, true);
}

/* ================= Microphone (explicit permission flow) ================= */
function prepareMic() {
  S.micState = "prompt";
  els.micNotice.textContent = "Requesting microphone permission…";
  // Enable then IMMEDIATELY mute: prompts once, keeps the track cold.
  S.room.localParticipant.setMicrophoneEnabled(true)
    .then(function () { return S.room.localParticipant.setMicrophoneEnabled(false); })
    .then(function () {
      S.micState = "granted";
      els.micNotice.textContent = "";
      updatePtt();
      announce("Microphone ready. Hold the talk button or Space to transmit.");
    })
    .catch(function (err) {
      S.micState = (err && err.name === "NotFoundError") ? "unavailable" : "denied";
      S.mode = "listen";
      els.micNotice.textContent = S.micState === "denied"
        ? "Microphone permission was denied — you're in listen-only mode. Allow the mic in your browser settings and rejoin to talk."
        : "No microphone found — you're in listen-only mode.";
      updatePtt();
    });
}

/* ================= PTT ================= */
function canTransmit() {
  return S.connState === "connected" && S.mode === "talk" &&
         S.micState === "granted" && !S.channelBusy;
}

function updatePtt() {
  var p = els.ptt;
  if (S.mode !== "talk") {
    p.disabled = true;
    p.querySelector("span").textContent = "LISTEN ONLY";
    els.pttHint.textContent = "You joined in listen-only mode.";
    return;
  }
  p.disabled = !canTransmit() && !S.transmitting;
  p.querySelector("span").textContent = S.transmitting ? "ON AIR" : (S.channelBusy ? "CHANNEL BUSY" : "HOLD TO TALK");
  els.pttHint.textContent = S.channelBusy && !S.transmitting
    ? "Someone is talking — wait for the channel to clear."
    : "Hold the button or Space bar. Release to stop.";
}

function startTransmit() {
  if (S.transmitting || !canTransmit()) return;
  S.transmitting = true;
  els.ptt.classList.add("tx");
  els.ptt.setAttribute("aria-pressed", "true");
  updatePtt();
  announce("Transmitting");
  S.room.localParticipant.setMicrophoneEnabled(true).catch(function () { stopTransmit(true); });
  sendData({ t: "ptt", on: true });
}

function stopTransmit(silent) {
  if (!S.transmitting) return;
  S.transmitting = false;
  // SYNCHRONOUS hard-disable of the raw device track before the async SDK call:
  try {
    S.room.localParticipant.audioTrackPublications.forEach(function (pub) {
      if (pub.track && pub.track.mediaStreamTrack) pub.track.mediaStreamTrack.enabled = false;
    });
  } catch (e) {}
  if (S.room) S.room.localParticipant.setMicrophoneEnabled(false).catch(function () {});
  els.ptt.classList.remove("tx");
  els.ptt.setAttribute("aria-pressed", "false");
  updatePtt();
  if (!silent) announce("Off air");
  sendData({ t: "ptt", on: false });
}

function sendData(obj) {
  try {
    if (!S.room) return;
    var bytes = new TextEncoder().encode(JSON.stringify(obj));
    S.room.localParticipant.publishData(bytes, { reliable: true });
  } catch (e) {}
}

/* PTT input bindings (pointer + touch + keyboard) */
function bindPtt() {
  var p = els.ptt;
  p.addEventListener("pointerdown", function (e) { e.preventDefault(); p.setPointerCapture(e.pointerId); startTransmit(); });
  p.addEventListener("pointerup",   function (e) { e.preventDefault(); stopTransmit(); });
  p.addEventListener("pointercancel", function () { stopTransmit(); });
  p.addEventListener("lostpointercapture", function () { stopTransmit(); });
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space" && !e.repeat &&
        document.activeElement !== els.handleInput) { e.preventDefault(); startTransmit(); }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "Space") { e.preventDefault(); stopTransmit(); }
  });
  window.addEventListener("blur", function () { stopTransmit(true); });   // never stay keyed
  document.addEventListener("visibilitychange", function () { if (document.hidden) stopTransmit(true); });
}

/* ================= Members / count / local mute / report ================= */
function participants() {
  if (!S.room) return [];
  var list = [];
  S.room.remoteParticipants.forEach(function (p) { list.push(p); });
  return list;
}

function renderMembers(activeSpeakers) {
  var speaking = {};
  (activeSpeakers || (S.room ? S.room.activeSpeakers : []) || []).forEach(function (p) { speaking[p.identity] = true; });

  var remote = participants();
  els.countBadge.textContent = (remote.length + (S.room ? 1 : 0)) + " on channel";

  var ul = els.memberList;
  ul.innerHTML = "";
  if (S.room) ul.appendChild(memberRow(S.handle + " (you)", S.transmitting, null));
  remote.forEach(function (p) {
    ul.appendChild(memberRow(p.name || p.identity, !!speaking[p.identity], p));
  });
  if (!remote.length) {
    var li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No other drivers on this channel yet.";
    ul.appendChild(li);
  }
}

function memberRow(label, talking, participant) {
  var li = document.createElement("li");
  var dot = document.createElement("span");
  dot.className = "spk" + (talking ? " on" : "");
  dot.setAttribute("aria-hidden", "true");
  var name = document.createElement("span");
  name.className = "mname";
  name.textContent = label + (talking ? " — talking" : "");
  li.appendChild(dot); li.appendChild(name);

  if (participant) {
    var id = participant.identity;
    var muteBtn = document.createElement("button");
    muteBtn.className = "mini";
    muteBtn.textContent = S.mutedIdentities[id] ? "Unmute" : "Mute";
    muteBtn.setAttribute("aria-label", (S.mutedIdentities[id] ? "Unmute " : "Mute ") + label + " for you only");
    muteBtn.addEventListener("click", function () {
      S.mutedIdentities[id] = !S.mutedIdentities[id];
      participant.setVolume(S.mutedIdentities[id] ? 0 : 1);
      renderMembers();
    });
    var repBtn = document.createElement("button");
    repBtn.className = "mini warn";
    repBtn.textContent = "Report";
    repBtn.setAttribute("aria-label", "Report " + label);
    repBtn.addEventListener("click", function () { reportUser(participant, label, repBtn); });
    li.appendChild(muteBtn); li.appendChild(repBtn);
  }
  return li;
}

function reportUser(participant, label, btn) {
  if (!window.confirm("Report " + label + " to TLWS moderators?")) return;
  btn.disabled = true;
  var done = function (ok) {
    btn.textContent = ok ? "Reported" : "Report failed";
    if (!ok) setTimeout(function () { btn.disabled = false; btn.textContent = "Report"; }, 3000);
  };
  if (!S.config.tokenEndpoint) return done(false);
  fetch(S.config.tokenEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "report", channelId: S.channel && S.channel.id,
                           targetIdentity: participant.identity, reporterHandle: S.handle })
  }).then(function (r) { done(r.ok); }).catch(function () { done(false); });
}

/* ================= Boot ================= */
function boot() {
  grabEls();
  bindPtt();

  // Safety gate first — nothing works until acknowledged.
  els.safetyOk.addEventListener("click", function () {
    show(els.safetyGate, false);
    els.handleInput.focus();
  });

  els.handleInput.value = S.handle;
  els.joinBtn.addEventListener("click", join);
  els.handleInput.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); join(); } });
  els.leaveBtn.addEventListener("click", leave);
  els.retryBtn.addEventListener("click", function () {
    S.retries = 0;
    show(els.offlineCard, false);
    show(els.joinCard, true);
    setConnState("idle");
  });

  if (!window.LivekitClient) {
    goOffline("The radio component failed to load. Try refreshing the page.");
    return;
  }
  if (!window.isSecureContext) {
    goOffline("Live Radio needs a secure (HTTPS) connection for microphone access.");
  }
}

document.addEventListener("DOMContentLoaded", boot);
