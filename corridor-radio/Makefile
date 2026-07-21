# Makefile for Corridor Radio

CC      := gcc
CFLAGS  := -Wall -O2 -std=c99
LDLIBS  := -lwebsockets

SRC     := src/server.c
BIN     := corridor-server

.PHONY: all clean

all: $(BIN)

$(BIN): $(SRC)
	$(CC) $(CFLAGS) -o $@ $(SRC) $(LDLIBS)

clean:
	rm -f $(BIN)
