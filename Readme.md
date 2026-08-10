# bdgrp_local

A local server for a girl rhythm game.

## Supported Servers

- [x] TW
- [x] JP
- [ ] KR
- [ ] CN
- [x] GL

## Requirements

- [Bun](https://bun.sh)
- Copy `.env.example` and rename it to `.env` before starting.

## Configuration

Open `.env` and set `SERVER=` to your target server (`TW` / `JP` / `GL`). Default is `TW`.

## Proxy Setup

Redirect the following URLs to `http://IP:8482`:

- TW: `https://vXXX-bd.mobimon.com.tw` (replace `XXX` with the actual number)
- JP: `https://api.garupa.jp`
- GL: `https://api.app-bang-dream-gbp.com`

## Run server

Open a terminal in the project directory and run:

```
bun .
```
or you can create a script

## Features

- [x] Free live
- [x] Multi live (not recommended)
- [x] Area items
- [x] Profile (settings not available)
- [x] Outfits
- [x] Stories
- [ ] NFO
- [x] Area talk (Album)