# Danmaku Chat Overlay (StreamElements)

A customizable danmaku-style (bullet chat) overlay for StreamElements, designed for YouTube and Twitch chat.

Chat messages, subscriptions, gifted subs, tips, and super chats fly across the screen with configurable lanes, speed, scaling, and animations — inspired by classic danmaku / bullet-hell UIs.

Built with vanilla HTML, CSS, and JavaScript and designed to work both inside StreamElements Custom Widgets and locally in a dev/testing environment.

---

## Features

- Danmaku-style flying chat messages
- Subscriber and gifted sub highlighting
- Donations, tips, and super chats with scaling
- Smart lane system to reduce overlap
- Fixed-speed movement with configurable variation
- CSS-driven animations per event type
- Local dev mode with event simulation
- Runtime configuration (speed, lane gap, etc.)

---

## Supported Events

- Chat messages
- Subscribers
- Gifted subs (single and bulk)
- Tips / donations
- Super Chats

StreamElements normalizes these events across platforms.

---

## Project Structure

```
.
├── src
│   ├── overlay.html      StreamElements widget HTML
│   ├── overlay.css       Styles and animations
│   └── overlay.js        Core danmaku engine
│
├── dev
│   ├── dev.html        Local dev playground
│   ├── dev.css           Dev-only UI styles
│   └── dev.js            Event simulation and controls
│
├── README.md
└── .gitignore
```
---

## Usage (StreamElements)

1. Create a Custom Widget in StreamElements
2. Paste:
   - overlay.html into the HTML tab
   - overlay.css into the CSS tab
   - overlay.js into the JS tab
3. Set widget size (recommended 1920x1080)
4. Enable the widget in OBS

Chat messages will appear automatically when live.

---

## Local Development

This project includes a local dev lab for rapid testing.

To run locally, open dev/index.html using:
- VS Code Live Server
- any static file server

Dev features include:
- Simulated chat messages
- Simulated subs, gifts, tips, and super chats
- Runtime sliders for speed and lane gap
- Stress testing via spam buttons

No StreamElements account or live stream is required.

---

## Configuration

Runtime values live in the RUNTIME object and are user-adjustable:
- Base speed
- Lane gap
- Speed variation
- Toggles

Static engine values live in CONFIG.

---

## Tech Stack

- Vanilla JavaScript
- CSS animations and transforms
- StreamElements Custom Widget API

No frameworks and no build step.

---

## Notes

- Chat events are detected via listener === "message"
- Non-chat events use event.type
- StreamElements payloads are normalized internally
- CSS handles all visual effects, JS handles logic only

---
