# MCP Maps Client

This repository contains the browser-based client for MCP Maps. It is a Vite and TypeScript single-page application that sends chat prompts to the separately deployed Express backend on Railway. The backend calls Gemini and returns a reply plus map search information. For single-place answers, the backend also geocodes the place with the Google Geocoding API and returns its latitude and longitude as `coordinates`. The client does no geocoding itself: it displays the reply and the Lat/Long, and embeds Google Maps.

## How the client connects

- The client sends `POST /api/chat` to the URL configured by `VITE_API_BASE_URL`.
- For the deployed client, set `VITE_API_BASE_URL` to the public Railway backend URL (for example, `https://your-service.up.railway.app`).
- During local development, set the same variable to the Railway URL to use the deployed backend, or leave it empty to use the Vite `/api` proxy to a locally running backend at `http://localhost:3001`.
- The map embed uses `VITE_GOOGLE_MAPS_API_KEY` in the browser.
- Lat/Long comes from the backend's `coordinates` response field, not from the browser. When it is present, the client shows `Lat/Long` in the Gemini message and in Developer diagnostics, and adds `center` and `zoom` to the Embed `place` URL so the map opens on the place instead of the world view. When it is `null` (search results, a failed lookup, or no backend geocoding key), the map uses the place name alone.

## Local development

1. Install this project's dependencies with `npm install`.
2. Copy `.env.local.example` to `.env.local` and set:
   - `VITE_API_BASE_URL` to the Railway backend URL, or leave it empty if running the backend locally.
   - `VITE_GOOGLE_MAPS_API_KEY` to a key enabled for the Google Maps Embed API.
3. Start the client with `npm run dev`.
4. Open the local URL printed by Vite. The configured default is `http://localhost:4000`.

To use a local backend instead of Railway, start the companion `My-MCP-Maps-Backend` project on port `3001`. With `VITE_API_BASE_URL` empty, Vite forwards `/api` requests to that server. The backend requires its own `GEMINI_API_KEY` environment variable; see that project's README for backend setup. The frontend does not need the Gemini key or the Geocoding key; the backend uses `GEMINI_API_KEY` and `GOOGLE_MAPS_API_KEY_GEOCODING`.

## Build and preview

- `npm run build` creates the static production site in `dist/`.
- `npm run preview` serves that build locally for a production-like check.

## Deployment configuration

The `VITE_*` values are substituted into the static files at build time. For a GitHub Pages deployment, configure `VITE_API_BASE_URL` and `VITE_GOOGLE_MAPS_API_KEY` in the GitHub Actions workflow environment before running the build; `.env.local` is ignored by Git and is not uploaded. A change to either value requires a new build and deployment.

The Maps key is necessarily used by client-side code, so it is not a server-side secret. Restrict it in Google Cloud to the deployed site's HTTP referrer and only the APIs it needs. Keep `GEMINI_API_KEY` and `GOOGLE_MAPS_API_KEY_GEOCODING` private in the Railway backend environment; never put them in a `VITE_*` variable. The browser key is referrer-restricted and cannot be used for backend geocoding.

## Notes

- The Railway backend is a separate service/repository. It handles Gemini requests and returns errors when Gemini is unavailable; the client does not generate fallback answers.
- `vite.config.ts` contains a development-only proxy from `/api` to `http://localhost:3001`. A deployed static site does not use this proxy and must be built with the backend URL configured.
- The client includes a PWA service worker, which can cache the app shell. After deployment changes, a browser may need a refresh/update to load the newest client build.
