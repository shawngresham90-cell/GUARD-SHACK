# Corridor Radio

A minimal C project with a web frontend. The backend is a
[libwebsockets](https://libwebsockets.org/)-based server that serves the
static frontend from `www/` and exposes a WebSocket endpoint that echoes
messages back to connected clients.

## Project structure

```
corridor-radio/
├── src/
│   └── server.c      # libwebsockets HTTP + WebSocket server
├── www/
│   └── index.html    # web frontend (WebSocket client)
├── Makefile          # build rules
├── README.md
└── .gitignore
```

## Prerequisites

- `gcc`
- `libwebsockets` development headers and library

Install libwebsockets:

```sh
# Debian / Ubuntu
sudo apt-get install libwebsockets-dev

# Fedora
sudo dnf install libwebsockets-devel

# macOS (Homebrew)
brew install libwebsockets
```

## Building

```sh
make
```

This compiles `src/server.c` with `gcc -Wall -O2 -std=c99`, links against
`libwebsockets`, and produces the `corridor-server` binary.

To remove build artifacts:

```sh
make clean
```

## Running

```sh
./corridor-server [port]
```

The server listens on port `8080` by default; pass a port number as the
first argument to override it. Once running, open
<http://localhost:8080/> in a browser to load the frontend and connect
to the WebSocket endpoint.
