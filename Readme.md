# bdgrp_local

A local server for a girl rhythm game.

## Supported Servers

- [x] TW
- [x] JP
- [ ] CN
- [ ] GL

## Requirements

- Copy `.env.example` and rename it to `.env` before starting.

## Configuration

Open `.env` and set `SERVER=` to your target server (`TW` / `JP`). Default is `TW`.

## Proxy Setup

Redirect the following URLs to `http://IP:8482`:

- TW: `https://vXXX-bd.mobimon.com.tw` (replace `XXX` with the actual number)
- JP: `https://api.garupa.jp`

## Features

- [x] Free live
- [x] Multi live (not recommended)
- [x] Area items
- [x] Profile (settings not available)
- [x] Outfits
- [x] Stories
- [ ] NFO
- [ ] Area talk (Album)