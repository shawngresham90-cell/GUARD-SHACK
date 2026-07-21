# Cloud Deployment Guide

How to take Corridor Radio from a fresh Ubuntu server to a live,
HTTPS-secured deployment on any cloud provider. Covers **AWS EC2**,
**DigitalOcean**, **Hetzner Cloud**, and **any generic Ubuntu VPS**.

Related guides:
- TLS/relay for voice behind strict NAT → [`TURN_SETUP.md`](./TURN_SETUP.md)
- Reverse proxy config → [`../nginx/corridor-radio.conf`](../nginx/corridor-radio.conf)
- Service unit + installer → [`../systemd/corridor-radio.service`](../systemd/corridor-radio.service), [`../scripts/install.sh`](../scripts/install.sh)

---

## Contents

1. [Minimum specs](#1-minimum-specs)
2. [Firewall ports (all providers)](#2-firewall-ports-all-providers)
3. [Provider setup](#3-provider-setup)
   - [AWS EC2](#31-aws-ec2)
   - [DigitalOcean Droplet](#32-digitalocean-droplet)
   - [Hetzner Cloud](#33-hetzner-cloud)
   - [Any Ubuntu VPS](#34-any-ubuntu-vps)
4. [DNS setup](#4-dns-setup-a-record)
5. [Fresh Ubuntu → live server (step by step)](#5-fresh-ubuntu--live-server)
6. [SSL with Let's Encrypt](#6-ssl-with-lets-encrypt-certbot)
7. [Verify](#7-verify-the-deployment)
8. [Updating & troubleshooting](#8-updating--troubleshooting)

---

## 1. Minimum specs

Corridor Radio's server is a lightweight C process; the heavy lifting
(audio) is peer-to-peer over WebRTC and never touches your server unless
a call falls back to your TURN relay.

| Resource | Minimum | Notes |
|----------|---------|-------|
| vCPU | **1** | Plenty for the signaling + static file server. |
| RAM  | **1 GB** | Comfortable headroom for nginx + coturn too. |
| Disk | **20 GB SSD** | OS + app + logs, with room to spare. |
| OS   | **Ubuntu 22.04 LTS** | Commands below assume 22.04. |

> **When to size up:** if you run your own TURN relay and expect many
> simultaneous relayed calls, bump bandwidth and RAM — relayed audio
> flows through the box. Signaling alone stays tiny.

Provider instance types that fit:

| Provider | Instance | Specs |
|----------|----------|-------|
| AWS EC2 | `t3.micro` / `t3.small` | 2 vCPU burstable, 1–2 GB |
| DigitalOcean | Basic Droplet | 1 vCPU, 1 GB, 25 GB |
| Hetzner | `CX22` (or `CPX11`) | 2 vCPU, ~4 GB / 2 GB |

---

## 2. Firewall ports (all providers)

Open these regardless of provider. On cloud platforms you set them in
the **security group / cloud firewall**, and optionally mirror them in
the host firewall (UFW) — see §5.

| Port | Proto | Purpose |
|------|-------|---------|
| 22 | TCP | SSH administration |
| 80 | TCP | HTTP (redirects to HTTPS; also serves ACME challenges) |
| 443 | TCP | HTTPS (nginx → app) |
| 7681 | TCP | Corridor Radio app (only if exposed directly; behind nginx it can stay internal) |
| 3478 | UDP | TURN/STUN (voice relay) |
| 3478 | TCP | TURN/STUN |
| 5349 | TCP/UDP | TURN/STUN over TLS (recommended — see TURN_SETUP.md) |

> **Security tip:** if you front the app with nginx (recommended), you
> do **not** need to expose **7681** to the world — nginx talks to it on
> `127.0.0.1:7681`. Open 7681 publicly only if clients connect straight
> to the app without the reverse proxy. TURN also uses an ephemeral UDP
> relay range (default `49152–65535`) — open it if you host coturn.

---

## 3. Provider setup

### 3.1 AWS EC2

1. **Launch instance**
   - AMI: **Ubuntu Server 22.04 LTS** (64-bit x86).
   - Instance type: **t3.micro** (or t3.small for more headroom).
   - Storage: **20 GB gp3** SSD.
   - Key pair: create/download one for SSH.

2. **Security group** — add inbound rules:

   | Type | Protocol | Port range | Source |
   |------|----------|-----------|--------|
   | SSH | TCP | 22 | *Your IP* (not 0.0.0.0/0 if avoidable) |
   | HTTP | TCP | 80 | 0.0.0.0/0, ::/0 |
   | HTTPS | TCP | 443 | 0.0.0.0/0, ::/0 |
   | Custom TCP | TCP | 7681 | 0.0.0.0/0 *(only if bypassing nginx)* |
   | Custom UDP | UDP | 3478 | 0.0.0.0/0 |
   | Custom TCP | TCP | 3478 | 0.0.0.0/0 |
   | Custom TCP | TCP | 5349 | 0.0.0.0/0 |
   | Custom UDP | UDP | 5349 | 0.0.0.0/0 |
   | Custom UDP | UDP | 49152–65535 | 0.0.0.0/0 *(if hosting coturn)* |

3. **Elastic IP** (so the address survives stop/start):
   - EC2 → **Elastic IPs** → *Allocate Elastic IP address*.
   - *Associate* it with your instance.
   - Use this Elastic IP as the DNS **A record** target (§4).

4. **Connect:**
   ```sh
   ssh -i /path/to/key.pem ubuntu@YOUR.ELASTIC.IP
   ```

Then continue with [§5](#5-fresh-ubuntu--live-server).

---

### 3.2 DigitalOcean Droplet

1. **Create Droplet**
   - Image: **Ubuntu 22.04 (LTS) x64**.
   - Plan: **Basic → Regular**, 1 vCPU / 1 GB / 25 GB ($6/mo tier).
   - Authentication: add your **SSH key**.
   - (Optional) Enable **backups**.

2. **Cloud firewall** (Networking → Firewalls → Create):
   - **Inbound**: SSH 22 (your IP), TCP 80, TCP 443, TCP 7681 *(if no nginx)*,
     UDP 3478, TCP 3478, TCP 5349, UDP 5349, and UDP 49152–65535 *(if coturn)*.
   - Assign the firewall to your Droplet.

3. **Reserved IP** (DO's static IP): Networking → **Reserved IPs** →
   assign one to the Droplet, and point DNS at it.

4. **Connect:**
   ```sh
   ssh root@YOUR.DROPLET.IP
   ```

Then continue with [§5](#5-fresh-ubuntu--live-server). (On DO you're
`root`; skip `sudo` or keep it — it's harmless.)

---

### 3.3 Hetzner Cloud

1. **Create Server** (console.hetzner.cloud):
   - Image: **Ubuntu 22.04**.
   - Type: **CX22** (2 vCPU / 4 GB / 40 GB) or **CPX11**.
   - Add your **SSH key**.

2. **Firewall** (Hetzner Cloud → Firewalls → Create):
   - **Inbound rules**: TCP 22 (your IP), TCP 80, TCP 443, TCP 7681 *(if no nginx)*,
     UDP 3478, TCP 3478, TCP 5349, UDP 5349, UDP 49152–65535 *(if coturn)*.
   - Apply it to the server.

3. **Primary IP**: Hetzner assigns a static public IPv4 by default — use
   that as your DNS **A record** (and the IPv6 for an `AAAA` record if
   you want).

4. **Connect:**
   ```sh
   ssh root@YOUR.SERVER.IP
   ```

Then continue with [§5](#5-fresh-ubuntu--live-server).

---

### 3.4 Any Ubuntu VPS

Works on Vultr, Linode/Akamai, OVH, Lightsail, a home server, etc.

1. Provision **Ubuntu 22.04**, ≥ 1 vCPU / 1 GB / 20 GB.
2. Ensure you have a **static public IP** (or a DDNS hostname).
3. If the provider has a **network firewall**, open the ports from §2.
4. SSH in as your admin user and continue with §5. The host-level UFW
   rules in §5 cover firewalling when there's no cloud firewall layer.

---

## 4. DNS setup (A record)

At your domain registrar / DNS host (Cloudflare, Route 53, Namecheap…):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `radio` (→ `radio.yourdomain.com`) | **your server's public IP** | 300 |
| A | `@` or `www` | *(optional)* same IP | 300 |
| AAAA | `radio` | *(optional)* server IPv6 | 300 |

- Use the **Elastic IP / Reserved IP / Primary IP** from §3 so it doesn't
  change on reboot.
- If using **Cloudflare**, set the record to **DNS only (grey cloud)**
  during setup — Let's Encrypt HTTP-01 and WebSocket traffic are simpler
  without the proxy in front. You can enable the orange cloud later, but
  make sure WebSockets stay enabled.
- Verify propagation before requesting a certificate:
  ```sh
  dig +short radio.yourdomain.com
  ```

---

## 5. Fresh Ubuntu → live server

Run these on the server, in order. Replace `radio.yourdomain.com`
throughout. Prefix with `sudo` if you're not root.

```sh
# ---- 5.1 Update the system ----
sudo apt-get update && sudo apt-get upgrade -y

# ---- 5.2 (Recommended) create a non-root admin user ----
# Skip if your provider already gave you a sudo user.
sudo adduser deploy
sudo usermod -aG sudo deploy
# then log back in as: ssh deploy@YOUR.SERVER.IP

# ---- 5.3 Install build tools, libwebsockets, nginx, git ----
sudo apt-get install -y build-essential libwebsockets-dev git nginx

# ---- 5.4 Host firewall (UFW) ----
sudo ufw allow 22/tcp        # SSH
sudo ufw allow 80/tcp        # HTTP
sudo ufw allow 443/tcp       # HTTPS
# App port — only needed if clients connect directly (no nginx in front):
# sudo ufw allow 7681/tcp
# TURN (only if you host coturn on this box — see TURN_SETUP.md):
sudo ufw allow 3478/udp
sudo ufw allow 3478/tcp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp
sudo ufw --force enable
sudo ufw status verbose

# ---- 5.5 Get the code and build ----
# Replace with your repository URL / path to the corridor-radio project.
git clone https://github.com/shawngresham90-cell/GUARD-SHACK.git
cd GUARD-SHACK/corridor-radio
make                         # builds ./corridor-server (gcc -Wall -O2 -std=c99)

# ---- 5.6 Install as a systemd service ----
# install.sh: creates /opt/corridor-radio, copies binary + www/, sets
# permissions, installs the unit, enables + starts it (runs as www-data,
# port 7681, restart=always). See systemd/corridor-radio.service.
sudo ./scripts/install.sh
systemctl status corridor-radio --no-pager
# Sanity check the app is serving locally:
curl -I http://127.0.0.1:7681/

# ---- 5.7 Reverse proxy with nginx ----
# The provided config terminates TLS on 443, redirects 80->443, and
# proxies everything (including the WebSocket upgrade) to 127.0.0.1:7681.
sudo cp nginx/corridor-radio.conf /etc/nginx/sites-available/corridor-radio.conf
# Edit the placeholders: server_name + ssl_certificate/key paths.
sudo sed -i 's/radio\.yourdomain\.com/radio.yourdomain.com/g' \
     /etc/nginx/sites-available/corridor-radio.conf
sudo nano /etc/nginx/sites-available/corridor-radio.conf   # review!
sudo ln -sf /etc/nginx/sites-available/corridor-radio.conf \
     /etc/nginx/sites-enabled/corridor-radio.conf
sudo rm -f /etc/nginx/sites-enabled/default   # drop the default site
```

> Don't run `nginx -t` yet — the config references TLS certs that don't
> exist until §6. Certbot will create them and reload nginx for you.

Continue to §6 to obtain the certificate.

---

## 6. SSL with Let's Encrypt (certbot)

```sh
# ---- 6.1 Install certbot (nginx plugin) ----
sudo apt-get install -y certbot python3-certbot-nginx

# ---- 6.2 Obtain + install the certificate ----
# certbot reads server_name from the nginx config, provisions a cert via
# the HTTP-01 challenge on port 80, writes it, and reloads nginx.
sudo certbot --nginx -d radio.yourdomain.com \
     --non-interactive --agree-tos -m you@yourdomain.com --redirect

# ---- 6.3 Verify auto-renewal (certs last 90 days) ----
sudo systemctl status certbot.timer --no-pager
sudo certbot renew --dry-run
```

Certbot's certs land at:

```
/etc/letsencrypt/live/radio.yourdomain.com/fullchain.pem
/etc/letsencrypt/live/radio.yourdomain.com/privkey.pem
```

If you used the shipped `nginx/corridor-radio.conf`, point its
`ssl_certificate` / `ssl_certificate_key` at those paths (certbot's
`--nginx` plugin usually rewrites them for you; double-check), then:

```sh
sudo nginx -t && sudo systemctl reload nginx
```

> **TURN certs:** coturn (TURN_SETUP.md) can reuse the same Let's Encrypt
> cert. Point its `cert=`/`pkey=` at the `fullchain.pem`/`privkey.pem`
> above and make sure the `turnserver` user can read them (e.g. add a
> renewal `--deploy-hook` that copies them and restarts coturn).

---

## 7. Verify the deployment

```sh
# App is up locally
curl -I http://127.0.0.1:7681/

# HTTP redirects to HTTPS
curl -sI http://radio.yourdomain.com/ | grep -i location

# HTTPS serves the frontend
curl -sI https://radio.yourdomain.com/ | head -1

# Service will restart on reboot
systemctl is-enabled corridor-radio
```

Then open **https://radio.yourdomain.com/** in a browser:
- The Corridor Radio UI loads over HTTPS (padlock, valid cert).
- Enter a handle → **Connect** → the status bar shows **ONLINE**
  (the WebSocket upgraded through nginx).
- Open a second device/browser, join the same channel, and test PTT.
  If audio doesn't connect for someone on cellular/strict NAT, set up a
  TURN relay per [`TURN_SETUP.md`](./TURN_SETUP.md).

---

## 8. Updating & troubleshooting

**Deploy an update:**
```sh
cd ~/GUARD-SHACK && git pull
cd corridor-radio && make
sudo ./scripts/install.sh          # re-copies binary + www/, restarts service
```

**Logs:**
```sh
journalctl -u corridor-radio -f      # app
sudo tail -f /var/log/nginx/error.log
journalctl -u coturn -f              # TURN, if installed
```

**Common issues:**

| Symptom | Likely cause / fix |
|---------|--------------------|
| Browser can't reach site | DNS not propagated, or 80/443 blocked in the **cloud** firewall (not just UFW). |
| `certbot` fails HTTP-01 | Port 80 closed, DNS A record wrong, or Cloudflare proxy on — set DNS-only. |
| Site loads but "OFFLINE" | WebSocket not upgrading — confirm nginx has the `Upgrade`/`Connection` headers (it does in the shipped config) and that you reloaded nginx. |
| Voice never connects for some users | Strict NAT — stand up TURN (TURN_SETUP.md) and open 3478/5349. |
| Service not running after reboot | `systemctl enable corridor-radio` (install.sh does this). |
| `nginx -t` cert error | Certs not issued yet — run certbot (§6) first. |
