# ============================================================
#  Corridor Radio - server image
# ============================================================
FROM ubuntu:22.04

# Avoid interactive prompts during apt operations.
ENV DEBIAN_FRONTEND=noninteractive

# Build tools + libwebsockets (dev headers for building, the shared
# library it pulls in serves as the runtime dependency too).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libwebsockets-dev \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the build inputs first so the compile layer is cached until
# the sources actually change.
COPY Makefile ./
COPY src/ ./src/

# Compile corridor-server (gcc -Wall -O2 -std=c99, links libwebsockets).
RUN make

# Copy the web frontend into the image. This is also bind-mounted in
# docker-compose for live editing, but baking it in keeps the image
# self-contained for `docker run`.
COPY www/ ./www/

# WebSocket + HTTP port.
EXPOSE 7681

# Launch the server on port 7681.
ENTRYPOINT ["./corridor-server", "7681"]
