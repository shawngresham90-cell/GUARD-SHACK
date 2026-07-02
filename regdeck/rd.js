/* ============================================================
   Reg Deck shared layer — config, Pro gate, free-use meter.
   Every tool page loads this. All storage is on-device
   (localStorage); nothing is uploaded anywhere.
   ============================================================ */
"use strict";

const RD = {
  /* ---- swap these when the Stan products exist ---- */
  // The $9.99/mo Reg Deck Pro membership product on Stan.
  // Until a dedicated membership product exists, this lands on the store.
  PRO_URL: "https://stan.store/TRUCKINGLIFEWITHSHAWN",
  PRO_PRICE: "$9.99/mo",
  // Unlock code delivered to buyers after checkout (put it in the Stan
  // product's delivery message / welcome email). Case-insensitive.
  UNLOCK_CODE: "SHAWN17",
  // Free checks per day across the gated tools.
  FREE_PER_DAY: 3,

  /* ---- existing products ---- */
  STORE: "https://stan.store/TRUCKINGLIFEWITHSHAWN",
  CDL_URL: "https://stan.store/TRUCKINGLIFEWITHSHAWN/p/save-your-cdl",
  COACH_URL: "https://stan.store/TRUCKINGLIFEWITHSHAWN/p/book-a-11-call-with-me-wxbdizeg",
  DATAQ_URL: "https://godatq.netlify.app",
  SITE: "https://truckinglifewithshawn.com",
  YT: "https://youtube.com/@truckinglifewithshawn"
};

/* ---------------- Pro state ---------------- */
function rdIsPro(){ return localStorage.getItem("rd_pro") === "1"; }

function rdTryUnlock(code){
  if ((code || "").trim().toUpperCase() === RD.UNLOCK_CODE.toUpperCase()){
    localStorage.setItem("rd_pro", "1");
    return true;
  }
  return false;
}

/* ---------------- Free-use meter ----------------
   Shared daily counter across all gated tools.
   Returns how many free checks remain today. */
function rdFreeLeft(){
  if (rdIsPro()) return Infinity;
  const today = new Date().toISOString().slice(0, 10);
  let rec = {};
  try { rec = JSON.parse(localStorage.getItem("rd_meter") || "{}"); } catch(e){}
  if (rec.d !== today) return RD.FREE_PER_DAY;
  return Math.max(0, RD.FREE_PER_DAY - (rec.n || 0));
}

/* Spend one free check. Returns true if allowed (or Pro). */
function rdSpend(){
  if (rdIsPro()) return true;
  const today = new Date().toISOString().slice(0, 10);
  let rec = {};
  try { rec = JSON.parse(localStorage.getItem("rd_meter") || "{}"); } catch(e){}
  if (rec.d !== today) rec = { d: today, n: 0 };
  if (rec.n >= RD.FREE_PER_DAY) return false;
  rec.n++;
  localStorage.setItem("rd_meter", JSON.stringify(rec));
  return true;
}

/* ---------------- Gate UI ----------------
   rdGateHTML(msg) -> markup for the upgrade wall.
   rdMountGate(el, msg) -> renders it and wires the unlock form. */
function rdGateHTML(msg){
  return `
  <div class="rd-gate">
    <div class="rd-gate-badge">REG DECK PRO</div>
    <h3>${msg || "You used your free checks for today."}</h3>
    <p class="rd-gate-sub">Pro unlocks unlimited checks on every tool —
    Before You Move, Violation Checker, CSA Estimator, Fix-It Letters,
    and the Document Vault. Built by a 17-year driver with zero violations.</p>
    <a class="rd-gate-btn" href="${RD.PRO_URL}" target="_blank" rel="noopener">
      GO PRO — ${RD.PRO_PRICE} →</a>
    <div class="rd-gate-alt">Free again tomorrow · cancel anytime</div>
    <div class="rd-unlock">
      <div class="rd-unlock-lbl">Already a member? Enter your unlock code:</div>
      <form class="rd-unlock-form">
        <input type="text" placeholder="CODE" autocomplete="off">
        <button type="submit">UNLOCK</button>
      </form>
      <div class="rd-unlock-msg"></div>
    </div>
  </div>`;
}

function rdMountGate(el, msg){
  el.innerHTML = rdGateHTML(msg);
  const form = el.querySelector(".rd-unlock-form");
  const out = el.querySelector(".rd-unlock-msg");
  form.addEventListener("submit", ev => {
    ev.preventDefault();
    const v = form.querySelector("input").value;
    if (rdTryUnlock(v)){
      out.textContent = "✓ Pro unlocked. Reloading…";
      out.style.color = "var(--good)";
      setTimeout(() => location.reload(), 700);
    } else {
      out.textContent = "That code didn't match. Check your purchase email.";
      out.style.color = "var(--danger)";
    }
  });
}

/* Small "N free checks left today" chip for tool pages. */
function rdMeterChip(){
  if (rdIsPro()) return `<span class="rd-chip rd-chip-pro">★ PRO — UNLIMITED</span>`;
  const left = rdFreeLeft();
  return `<span class="rd-chip">${left} FREE CHECK${left === 1 ? "" : "S"} LEFT TODAY</span>`;
}

function rdEsc(s){
  return (s || "").replace(/[&<>"']/g, c => (
    {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
