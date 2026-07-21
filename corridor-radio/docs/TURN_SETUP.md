# TURN Server Setup (coturn)

This guide explains how to stand up a [coturn](https://github.com/coturn/coturn)
TURN server so Corridor Radio's peer-to-peer audio works reliably for
drivers on **any** network.

---

## 1. Why a TURN server is needed

Corridor Radio uses **WebRTC** to carry voice directly between drivers
(a peer-to-peer mesh). For two peers to connect, WebRTC has to find a
network path between them. It tries, in order:

1. **Direct / host** — same LAN. Rare between two trucks.
2. **STUN (Session Traversal Utilities for NAT)** — each peer discovers
   its public IP:port and the two punch a hole through their routers.
   The app already ships with Google's public STUN servers, and this
   works for most home and office networks.
3. **TURN (Traversal Using Relays around NAT)** — when hole-punching
   fails, traffic is **relayed** through a server that both peers *can*
   reach.

The catch: truckers connect through **cell-carrier CGNAT, truck-stop
Wi-Fi captive portals, and corporate firewalls** — exactly the
"symmetric NAT" / port-restricted setups where STUN hole-punching does
**not** work. Without a TURN relay, those drivers can join a channel and
chat, but their audio silently never connects.

A TURN server fixes that: it gives every peer a guaranteed relay path,
so audio works even behind the strictest NAT or firewall. STUN handles
the easy cases for free; TURN is the fallback that makes it work for
everyone. Budget for TURN bandwidth — relayed calls flow through your
server, not peer-to-peer.

> **TLS matters:** the frontend is served over HTTPS, and browsers block
> mixing secure pages with insecure TURN. Use `turns:` (TURN over TLS)
> on port **5349** so relayed traffic isn't blocked by strict firewalls
> that only allow "HTTPS-looking" traffic on 443/5349.

---

## 2. Install coturn on Ubuntu

```sh
sudo apt-get update
sudo apt-get install coturn
```

Enable the service so it can be managed by systemd. Edit
`/etc/default/coturn` and uncomment:

```sh
TURNSERVER_ENABLED=1
```

---

## 3. Configure `/etc/turnserver.conf`

Back up the packaged default, then replace it with a minimal, secure
config:

```sh
sudo cp /etc/turnserver.conf /etc/turnserver.conf.bak
sudo nano /etc/turnserver.conf
```

Key options:

```ini
# --- Listening ---------------------------------------------------------
# Standard TURN/STUN port. coturn listens for both UDP and TCP here.
listening-port=3478

# TLS port for turns:// (TURN over TLS). Recommended for HTTPS sites and
# for punching through firewalls that only trust TLS traffic.
tls-listening-port=5349

# Public IPv4 of this server. On a cloud VM behind 1:1 NAT, set the
# PUBLIC address here (add external-ip=PUBLIC/PRIVATE if it differs).
# listening-ip=0.0.0.0
external-ip=YOUR.SERVER.PUBLIC.IP

# --- Integrity / security ---------------------------------------------
# Add a message-integrity fingerprint to TURN messages (recommended).
fingerprint

# Use long-term credential mechanism: clients must authenticate with a
# username/password before they can allocate a relay. Prevents your
# server being used as an open relay by strangers.
lt-cred-mech

# The authentication realm — use your domain.
realm=yourdomain.com

# A TURN user. Format is user=NAME:PASSWORD.
# Use a strong password and rotate it; see the note on this below.
user=trucker:yourpassword

# --- TLS certificate (for turns:// on 5349) ---------------------------
# Point these at a real certificate + key. Let's Encrypt certs for your
# domain work well; make sure coturn (user 'turnserver') can read them.
cert=/etc/ssl/certs/yourdomain.com.fullchain.pem
pkey=/etc/ssl/private/yourdomain.com.key.pem

# --- Hardening (optional but recommended) -----------------------------
# Don't relay to loopback/multicast/private ranges from the internet.
no-multicast-peers
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=172.16.0.0-172.31.255.255

# Reduce log noise once things work.
# no-stdout-log
# syslog
```

### What each key option does

| Option | Purpose |
|--------|---------|
| `listening-port=3478` | Standard TURN/STUN port (UDP + TCP). |
| `tls-listening-port=5349` | Port for `turns:` (TURN over TLS). |
| `fingerprint` | Adds integrity fingerprints to messages. |
| `lt-cred-mech` | Requires username/password auth (no open relay). |
| `realm=yourdomain.com` | Auth realm advertised to clients. |
| `user=trucker:yourpassword` | A valid TURN credential. |
| `cert=` / `pkey=` | TLS certificate + private key for `turns:`. |

> **Credential note:** `user=trucker:yourpassword` stores a static
> password in plaintext. That's fine to start. For production at scale,
> switch to **time-limited (ephemeral) TURN credentials**: set a shared
> secret with `use-auth-secret` + `static-auth-secret=...` and have your
> backend hand each client a short-lived username/password derived from
> that secret (HMAC), so credentials can't be scraped from the page and
> reused.

---

## 4. Add the TURN server to the WebRTC config

Open **`www/index.html`** and find the `ICE_CONFIG` object (near the top
of the `<script>` block). It currently ships with STUN only:

```js
var ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};
```

Add your TURN server so peers behind strict NAT get a relay path. Keep
STUN entries too — WebRTC uses TURN only when direct/STUN paths fail:

```js
var ICE_CONFIG = {
  iceServers: [
    // STUN — free, handles the easy NAT cases.
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },

    // Your own STUN/TURN (coturn). turns: (TLS) is the firewall-friendly one.
    { urls: "stun:yourdomain.com:3478" },
    {
      urls: [
        "turn:yourdomain.com:3478?transport=udp",
        "turn:yourdomain.com:3478?transport=tcp",
        "turns:yourdomain.com:5349?transport=tcp"
      ],
      username: "trucker",
      credential: "yourpassword"
    }
  ]
};
```

Replace `yourdomain.com`, `trucker`, and `yourpassword` with the values
from your `turnserver.conf`. Because the frontend is served from `www/`
(and bind-mounted in Docker / copied to `/opt/corridor-radio/www` by the
installer), you can edit this file and just reload the browser — no
rebuild needed.

> The `username`/`credential` here must match a `user=` line in
> `turnserver.conf`. If you move to ephemeral credentials (section 3),
> fetch them from your backend at connect time instead of hardcoding.

---

## 5. Start coturn as a service

```sh
# Start now and enable on boot
sudo systemctl enable --now coturn

# Check it's running
sudo systemctl status coturn

# Follow the logs
sudo journalctl -u coturn -f
```

To apply config changes later:

```sh
sudo systemctl restart coturn
```

### Verify it works

From another machine, test that the relay allocates. Install the coturn
utils (`sudo apt-get install coturn` ships `turnutils_uclient`) and run:

```sh
turnutils_uclient -v -u trucker -w yourpassword -y yourdomain.com
```

You can also paste your TURN URL/credentials into the WebRTC sample at
<https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/>
and confirm you get a candidate of type **`relay`**. A `relay` candidate
means TURN is working.

---

## 6. Firewall rules

Open these ports to the coturn server. TURN needs **both TCP and UDP**,
and both the plain (3478) and TLS (5349) ports:

| Port | Protocol | Purpose |
|------|----------|---------|
| 3478 | TCP | TURN/STUN |
| 3478 | UDP | TURN/STUN |
| 5349 | TCP | TURN/STUN over TLS (`turns:`) |
| 5349 | UDP | TURN/STUN over DTLS |

coturn also hands out **relay ports** from an ephemeral UDP range
(default `49152–65535`). Those must be reachable for relayed media to
flow; open the range (or narrow it with `min-port`/`max-port` in
`turnserver.conf` and open just that).

### UFW

```sh
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
# Relay media range (adjust if you set min-port/max-port)
sudo ufw allow 49152:65535/udp
sudo ufw reload
```

### firewalld

```sh
sudo firewall-cmd --permanent --add-port=3478/tcp
sudo firewall-cmd --permanent --add-port=3478/udp
sudo firewall-cmd --permanent --add-port=5349/tcp
sudo firewall-cmd --permanent --add-port=5349/udp
sudo firewall-cmd --permanent --add-port=49152-65535/udp
sudo firewall-cmd --reload
```

### Cloud security groups

If the server is on AWS/GCP/Azure/etc., add the **same** inbound rules
to the instance's security group / network firewall — the host firewall
alone isn't enough.

---

## Quick checklist

- [ ] `coturn` installed and `TURNSERVER_ENABLED=1`
- [ ] `/etc/turnserver.conf` has `lt-cred-mech`, `fingerprint`, `realm`, a `user`, and `cert`/`pkey`
- [ ] Valid TLS cert readable by the `turnserver` user
- [ ] `ICE_CONFIG` in `www/index.html` points at your TURN server
- [ ] `systemctl enable --now coturn` and status is active
- [ ] Ports 3478 + 5349 (tcp/udp) and the relay UDP range are open in the host **and** cloud firewall
- [ ] Trickle-ICE test shows a `relay` candidate
