# 📻 Corridor Radio

**Internet CB Radio for Truckers** — a real-time voice and text channel
system organized the way drivers actually think about the road: by
**interstate corridor**, by **major city**, and **nationwide**.

Think of it as a modern CB radio that works anywhere you have a data
connection. Pick a channel — say **I-40** or **Dallas** — key up the
push-to-talk button, and talk to other drivers on that same channel in
real time. No hardware, no range limit, just a web browser.

---

## Who it's for

Corridor Radio is built for **truck drivers** who want to stay connected
on the road:

- **Long-haul drivers** who want company and road intel across a whole
  interstate, not just the few miles a physical CB reaches.
- **Regional drivers** who live on one corridor (I-95, I-10…) and want a
  channel that's always there.
- **Drivers near a city** who want local updates — traffic, weigh
  stations, parking — on a city channel like **Atlanta** or **Phoenix**.
- **Everyone**, on the **ALL USA** nationwide channel.

It runs in any modern phone or laptop browser, so it works from the cab
without installing an app.

---

## Features

- 🛣️ **Interstate Corridors** — one channel per major interstate:
  I-5, I-10, I-15, I-20, I-25, I-35, I-40, I-55, I-65, I-70, I-75, I-80,
  I-85, I-90, I-95.
- 🏙️ **Major Cities** — dedicated channels for Atlanta, Chicago, Dallas,
  Denver, Houston, Los Angeles, Memphis, Miami, New York, Phoenix, and
  Seattle.
- 🇺🇸 **Nationwide** — the **ALL USA** channel where everyone can talk.
- 🎙️ **Push-to-Talk (PTT)** — hold the big red button (or the spacebar,
  or touch-and-hold on mobile) to transmit, just like a real CB mic.
- 💬 **Channel chat** — type messages with timestamps alongside the voice
  channel.
- 🟢 **Live speaking indicators** — see who's talking with a pulsing
  green dot next to their handle.
- 👥 **Member list** — see everyone currently on your channel.
- 🔄 **Instant channel switching** — jump between corridors and cities
  with one tap; voice reconnects automatically.
- 📱 **Works on phone and desktop** — responsive, touch-friendly layout.

---

## How it works (architecture)

Voice travels **directly between drivers** (peer-to-peer) using WebRTC,
so it stays low-latency and doesn't bog down the server. The server's job
is just to serve the web page and to introduce drivers to each other
("signaling").

```
                        ┌───────────────────────────────┐
                        │        Your server (VPS)       │
                        │                                │
   Browser  ──HTTPS──▶  │  nginx :443  ──▶  corridor-    │
  (driver)             │   (TLS, proxy)     server :7681 │
      │   ◀─WebSocket──▶│                 (C, libwebsockets)
      │   (signaling)   │   serves www/index.html        │
      │                 └───────────────────────────────┘
      │
      │   Voice does NOT go through the server. After the server
      │   introduces two drivers on the same channel, their audio
      │   flows peer-to-peer over WebRTC:
      │
      ▼
  ┌─────────┐   WebRTC audio (P2P)   ┌─────────┐
  │ Driver A │◀──────────────────────▶│ Driver B │
  └─────────┘                        └─────────┘
      ▲                                   ▲
      │        ┌─────────┐                │
      └───────▶│ Driver C │◀──────────────┘
               └─────────┘
     Everyone on a channel connects to everyone else
     (a "full mesh"). See Scaling notes below.

  Optional: a TURN server relays audio for drivers behind strict
  cell-carrier / truck-stop firewalls. See docs/TURN_SETUP.md.
```

**In plain terms:**
1. The browser loads the page from the server over HTTPS.
2. It opens a WebSocket to the server and says "I'm *Big Rig* joining
   **I-40**."
3. The server tells everyone else on I-40 about the newcomer, and helps
   them exchange the technical details needed to connect.
4. From then on, voice goes **straight between drivers' devices**.

---

## Quick start (local)

For running it on your own computer to try it out.

### 1. Install dependencies

You need a C compiler and the libwebsockets library.

```sh
# Debian / Ubuntu
sudo apt-get update
sudo apt-get install build-essential libwebsockets-dev

# Fedora
sudo dnf install gcc make libwebsockets-devel

# macOS (Homebrew)
brew install libwebsockets
```

### 2. Build

```sh
make
```

This compiles the server into a program called `corridor-server`.

### 3. Run

```sh
./corridor-server 7681
```

Then open **http://localhost:7681/** in your browser. Enter a handle,
click **Connect**, and you're on the air. To test voice, open a second
browser window (or another device on your network) and join the same
channel.

To stop the server, press **Ctrl-C**. To remove the built program, run
`make clean`.

> **Microphone note:** browsers only allow microphone access on
> `localhost` or over **HTTPS**. For real use on a domain, set up TLS
> (see below) — otherwise push-to-talk won't have mic access.

---

## Production deployment

To run Corridor Radio on a real server with your own domain and HTTPS,
the repo includes everything you need:

| Step | What | Guide |
|------|------|-------|
| 1 | Pick a server & open firewall ports | [`docs/CLOUD_DEPLOY.md`](docs/CLOUD_DEPLOY.md) |
| 2 | Build + install as a background service | [`scripts/install.sh`](scripts/install.sh) → installs [`systemd/corridor-radio.service`](systemd/corridor-radio.service) |
| 3 | Put nginx in front for HTTPS | [`nginx/corridor-radio.conf`](nginx/corridor-radio.conf) |
| 4 | Get a free SSL certificate (Let's Encrypt) | [`docs/CLOUD_DEPLOY.md` §6](docs/CLOUD_DEPLOY.md) |
| 5 | (Optional) Relay for strict networks | [`docs/TURN_SETUP.md`](docs/TURN_SETUP.md) |

**The short version**, on a fresh Ubuntu 22.04 server:

```sh
# Install deps, clone, and build
sudo apt-get update && sudo apt-get install -y build-essential libwebsockets-dev nginx git
git clone https://github.com/shawngresham90-cell/GUARD-SHACK.git
cd GUARD-SHACK/corridor-radio
make

# Install + start the service (creates /opt/corridor-radio, runs as www-data)
sudo ./scripts/install.sh

# Put nginx + HTTPS in front (see docs/CLOUD_DEPLOY.md for full detail)
sudo cp nginx/corridor-radio.conf /etc/nginx/sites-available/corridor-radio.conf
sudo ln -s /etc/nginx/sites-available/corridor-radio.conf /etc/nginx/sites-enabled/
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d radio.yourdomain.com --redirect
```

**Docker alternative:** if you'd rather use containers,
`docker compose up --build -d` builds and runs the server (see
[`docker-compose.yml`](docker-compose.yml)). You'd still put nginx +
HTTPS in front for production.

Full, provider-specific instructions (AWS, DigitalOcean, Hetzner) are in
[`docs/CLOUD_DEPLOY.md`](docs/CLOUD_DEPLOY.md).

---

## File structure

```
corridor-radio/
├── src/
│   └── server.c              # The server (C, libwebsockets): serves the
│                             # web page + relays signaling messages
├── www/
│   └── index.html            # The entire frontend (HTML/CSS/JS in one file)
├── nginx/
│   └── corridor-radio.conf   # Reverse proxy: TLS on 443, proxies to :7681
├── systemd/
│   └── corridor-radio.service# Runs the server as a background service
├── scripts/
│   └── install.sh            # One-command production install
├── docs/
│   ├── CLOUD_DEPLOY.md        # Deploy on AWS / DigitalOcean / Hetzner / VPS
│   └── TURN_SETUP.md          # Optional voice relay for strict networks
├── Dockerfile                # Container image build
├── docker-compose.yml        # Run the server with Docker
├── Makefile                  # Build rules (make / make clean)
├── .gitignore
├── .dockerignore
└── README.md                 # You are here
```

---

## Protocol documentation

The browser and server talk over a WebSocket using simple, human-readable
text messages. Each message is one line, with fields separated by the
pipe character `|`. The WebSocket sub-protocol name is
**`corridor-protocol`**, and the server listens on port **7681**.

### Messages the server sends to the browser

| Message | Meaning |
|---------|---------|
| `WELCOME\|<id>` | "You're connected; here's your unique id." |
| `PEERS\|<id>:<handle>,<id>:<handle>,...` | The current roster when you join a channel. |
| `PEER_JOIN\|<id>\|<handle>` | A new driver joined your channel. |
| `PEER_LEAVE\|<id>` | A driver left your channel. |
| `OFFER\|<fromId>\|<sdp>` | WebRTC connection offer from another driver. |
| `ANSWER\|<fromId>\|<sdp>` | WebRTC connection answer from another driver. |
| `ICE\|<fromId>\|<candidate>` | A network path candidate from another driver. |
| `CHAT\|<fromId>\|<handle>\|<text>` | A chat message from another driver. |
| `PTT\|<fromId>\|DOWN` / `PTT\|<fromId>\|UP` | Another driver keyed up / released. |

### Messages the browser sends to the server

| Message | Meaning |
|---------|---------|
| `JOIN\|<room>\|<handle>` | "Put me on this channel as this handle." |
| `LEAVE\|<room>` | "Take me off this channel." |
| `OFFER\|<toId>\|<sdp>` | Send a WebRTC offer to a specific driver. |
| `ANSWER\|<toId>\|<sdp>` | Send a WebRTC answer to a specific driver. |
| `ICE\|<toId>\|<candidate>` | Send a network candidate to a specific driver. |
| `CHAT\|<room>\|<text>` | Send a chat message to the channel. |
| `PTT\|<room>\|DOWN` / `PTT\|<room>\|UP` | Tell the channel you keyed up / released. |

**How signaling flows:** the `OFFER`, `ANSWER`, and `ICE` messages are
how two browsers set up a direct voice connection. The browser addresses
them to a specific peer id (`<toId>`); the server relays each one to that
peer, rewriting the id field to say who it came *from* (`<fromId>`).
`CHAT` and `PTT` are broadcast to everyone else on the channel. The
`<sdp>` and `<candidate>` blobs are WebRTC's own connection data, sent
Base64-encoded so they survive the pipe-delimited format.

> The reference `src/server.c` in this repo is a minimal libwebsockets
> server that serves `www/` and echoes messages. A production deployment
> needs the server to implement the room roster + relay/broadcast
> behavior described above. The message format is fixed by the frontend;
> the server side is where you plug in that logic.

---

## Scaling notes (mesh vs. SFU)

Corridor Radio currently uses a **full mesh**: every driver on a channel
holds a direct voice connection to every other driver on that channel.

- ✅ **Great for small channels.** Simple, lowest latency, and almost no
  server bandwidth — audio never touches your server.
- ⚠️ **Doesn't scale to large rooms.** In a mesh, each person sends their
  audio to *everyone* else. With **N** people on a channel, that's
  roughly **N × (N-1)** connections total, and each phone uploads N-1
  copies of its own audio. That's fine for ~4–8 drivers on a channel,
  but a busy **ALL USA** channel with dozens of people would overwhelm
  individual devices' upload bandwidth and CPU.

**When channels get big, move to an SFU** (Selective Forwarding Unit). An
SFU is a media server that each driver connects to **once**: they send
their audio up a single time, and the SFU forwards it to everyone else.

| | Full mesh (today) | SFU (for scale) |
|--|-------------------|-----------------|
| Each device uploads | N−1 copies of its audio | 1 copy |
| Server media load | None | Handles all forwarding |
| Best for | Small channels (~4–8) | Large/busy channels |
| Complexity | Low | Higher (run a media server) |

Popular open-source SFUs that fit this model: **mediasoup**, **Janus**,
and **LiveKit**. A practical path is a **hybrid**: keep the cheap mesh
for small channels, and switch a channel to the SFU once it grows past a
threshold. This doesn't change the channel/PTT/chat concepts — only how
the audio is routed under the hood.

(Independently, a **TURN** server — see
[`docs/TURN_SETUP.md`](docs/TURN_SETUP.md) — is about *reachability* for
drivers behind strict firewalls, not room size. You may want both.)

---

## Troubleshooting

| Problem | Likely cause & fix |
|---------|--------------------|
| **Build fails: `libwebsockets.h: No such file`** | The library isn't installed. Run `sudo apt-get install libwebsockets-dev` (or the equivalent for your OS). |
| **Server starts but "ERROR opening socket"** | Usually a host with IPv6 disabled, or the port is already in use. The server binds IPv4 only; make sure nothing else is on 7681 (`ss -tlnp | grep 7681`). |
| **Page loads but status stays "OFFLINE"** | The WebSocket didn't connect. Behind nginx, confirm the proxy passes the WebSocket upgrade headers (the shipped config does) and that you reloaded nginx. |
| **Push-to-talk does nothing / no mic** | Browsers only grant microphone access over **HTTPS** (or on `localhost`). Set up TLS for your domain — see `docs/CLOUD_DEPLOY.md`. Also check the browser's mic permission prompt. |
| **I can hear myself but not connect to others** | You're the only one on that channel, or the other person is on a different channel. Confirm you're both on the same corridor/city. |
| **Some drivers can't hear each other at all** | They're likely behind strict cell-carrier / truck-stop firewalls. Set up a **TURN** relay — see `docs/TURN_SETUP.md`. |
| **HTTPS certificate errors** | Certbot couldn't validate your domain. Check the DNS **A record** points at your server and that port **80** is open. See `docs/CLOUD_DEPLOY.md`. |
| **Service isn't running after a reboot** | Enable it: `sudo systemctl enable corridor-radio` (the installer does this automatically). Check logs with `journalctl -u corridor-radio -f`. |

---

## License

No license has been specified for this project yet. Until a license file
is added, all rights are reserved by the project owner. If you intend to
reuse, distribute, or contribute to this code, please contact the owner
to agree on terms, or add a license file (for example, MIT) to make the
terms explicit.
