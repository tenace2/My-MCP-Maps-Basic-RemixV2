# MCP Maps Basic

This project is a Vite + TypeScript app that uses a local Express backend to connect Gemini with an embedded Google Maps view.

## Local setup

1. Configure the backend first. In `My-MCP-Maps-Backend/.env.local`, add:
   - `GEMINI_API_KEY` for the Gemini API
   - `GEMINI_MODEL` (optional, defaults to `gemini-flash-latest`)
   - `PORT` (optional, defaults to `3001`)
2. Copy `.env.local.example` to `.env.local` in this project.
3. Add `VITE_GOOGLE_MAPS_API_KEY` for the embedded Maps iframe. Leave `VITE_API_BASE_URL` empty to use the Vite proxy locally, or set it to `http://localhost:3001`.
4. Install dependencies in both projects with `npm install`.
5. Start the backend in one terminal with `npm run dev`.
6. Start the frontend in another terminal with `npm run dev`.

The frontend runs at `http://localhost:3000` and the backend runs at `http://localhost:3001`.

## Notes

- .env.local is ignored by git and should stay local to your machine.
- Gemini is the only response source. The backend returns an error when Gemini is unavailable; it does not use local heuristic fallback responses.
- Keep `GEMINI_API_KEY` in the backend environment only. Never put it in a `VITE_*` variable because Vite exposes those values to the browser.
