# Arcane Descent - Frontend

This repository contains the browser client for Arcane Descent, a cooperative escape room game developed as part of a university project. The frontend is responsible for the player-facing side of the experience: navigation, authentication, session handling, room rendering, puzzle widgets, waiting-room flow, leaderboard views, and settings.

The project combines a classic React application shell with real-time game communication and a more playful presentation layer. React handles routing and shared state, Pixi.js powers the room view, and several puzzle widgets are implemented as Svelte custom elements.

## What This Frontend Does

- provides the landing flow for solo and co-op play
- handles lobby creation, joining, and role selection for co-op sessions
- renders the in-room experience for the Wizard's Library, the Alchemist's Laboratory, and the final corridor
- implements account flows such as login, registration, email verification, password reset, account recovery, and account deletion
- shows leaderboard and settings pages
- stores local music preferences and keeps them in sync across tabs
- rehydrates authenticated sessions after reloads and refreshes access tokens when needed

## Architecture At a Glance

- React is used for routing, page-level UI, shared state, and authentication flows.
- Pixi.js is used for the main room scene and supports the game-facing view layer.
- Svelte custom elements are used for self-contained puzzle widgets.
- Socket.IO connects the client to the authoritative backend room state.
- A centralized session provider keeps login state, token refresh, and socket reconnect behavior in one place.

## Tech Stack

- React 19
- Vite
- React Router
- Socket.IO Client
- Pixi.js
- Svelte custom elements
- Tailwind CSS and DaisyUI

## Quick Start

### Requirements

- Node.js 20 or newer
- npm
- the backend running locally, usually on `http://127.0.0.1:3000`

### Install and Run

```bash
npm install
npm run dev
```

By default, the Vite dev server proxies `/api` and `/socket.io` to `http://127.0.0.1:3000`.

Open the app in your browser once Vite has started. In a standard local setup that will be `http://127.0.0.1:5173`.

## Optional Environment Variables

You usually do not need extra frontend configuration for local development, but these variables are useful in a few situations:

| Variable | Purpose | Typical local use |
| --- | --- | --- |
| `VITE_PROXY_TARGET` | Overrides the Vite dev proxy target for `/api` and `/socket.io` | `http://127.0.0.1:3000` |
| `VITE_BACKEND_URL` | Uses a fixed backend base URL instead of the current origin | useful for deployed frontend + separate backend |
| `VITE_SOCKET_MOCK` | Switches the socket layer to the mock implementation | `true` for isolated UI work |

Example `.env.local`:

```env
VITE_PROXY_TARGET=http://127.0.0.1:3000
VITE_SOCKET_MOCK=false
```

## Available Scripts

- `npm run dev` starts the Vite development server.
- `npm run build` creates the production bundle.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint.

## Project Structure

```text
src/
  App.jsx                      # top-level routes and app shell
  pages/                       # page-level views such as Home, Auth, Waiting, Leaderboard, RoomView
  components/
    Layout/                    # page wrapper, top bar, shared layout pieces
    InteractionLayers/         # clickable overlays for room interactions
    inventory/                 # inventory UI
    svelte/                    # Svelte-based puzzle widgets
    audio/                     # background music management
    auth/                      # shared auth form helpers and password rules
  state/
    session.jsx                # centralized login state and refresh handling
    api.js                     # HTTP wrapper and token refresh recovery
    socket.real.js             # Socket.IO client setup
    inventoryAdapter.js        # maps backend inventory state to the UI
    musicSettings.js           # local music preferences
  config/                      # widgets, items, audio tracks, wall image overrides
  assets/                      # room art, inventory assets, puzzle images
public/
  icon.png                     # branding assets served as static files
  Loop door.mp4                # background video
```

## Main User Flows

### Solo mode

A solo session creates its own room, connects a socket, and loads the full room progression inside a single browser session.

### Co-op mode

A co-op session starts in the waiting room. Two players choose roles `A` and `B`, which map to the Wizard's Library and the Alchemist's Laboratory. Once both roles are occupied, the backend creates the shared room and both clients transition into the game.

### Account-related flows

The frontend supports:

- registration with email verification
- login and logout
- password reset via email token
- password change and email change from settings
- account deletion and recovery

## Development Notes

- Keep the frontend and backend on one canonical host during local development. Mixing `localhost` and `127.0.0.1` can make refresh-cookie behavior look inconsistent after reloads.
- If you work on auth or session recovery, the main entry points are `src/state/session.jsx`, `src/state/api.js`, and `src/state/socket.real.js`.
- If you work on puzzle UI, most room-specific components live in `src/components/svelte/` and are mounted through `src/pages/RoomView.jsx`.
- If you only want to iterate on the static UI, `VITE_SOCKET_MOCK=true` can be helpful.

## Build and Deployment

The included `Dockerfile` creates a production build with Vite and serves it through Nginx. The `nginx.conf` file contains the SPA fallback so React Router routes continue to work after refreshes.

In the integrated deployment setup, this frontend is usually served behind Caddy together with the backend API.

## Related Repositories

This repository is meant to work together with the backend in `EscapeRoomBackEnd`. For backend setup, security configuration, database requirements, and email configuration, see the backend README.
