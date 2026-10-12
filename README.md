# ApexMind AI Studio

ApexMind is a web app for drafting short-form video scripts, generating voiceovers, choosing media, and managing YouTube-oriented workflows. The UI is a React + TypeScript app built with Vite, and its API is a FastAPI application served by Uvicorn.

## Getting started

### Requirements

- Node.js and npm
- Python 3.10+ with the packages in `requirements.txt`
- A Gemini API key for live Gemini features; without it, some flows use demo/fallback behavior

### Install and run the main app

```sh
npm install
python -m pip install -r requirements.txt
```

Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to your key. Keep `.env` private and never commit it.

```sh
npm run dev
```

`npm run dev` starts the frontend first and starts the backend after the frontend is reachable. The frontend uses port `5173` and the backend uses port `8000` by default. Useful scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the frontend, then the backend |
| `npm run frontend` | Run only the Vite frontend |
| `npm run backend` | Run only the FastAPI backend |
| `npm run build` | Build the frontend into `frontend/dist` |
| `npm run preview` | Preview the frontend production build |
| `npm run lint` | Run the configured TypeScript check |

## Project map

- `backend/` — FastAPI application and feature routers.
- `script/` — Node.js launch scripts for the frontend and backend.
- `frontend/` — Vite app entry point and static HTML shell.
- `frontend/src/app/` — Application navigation, route definitions, and shared page layout.
- `frontend/src/features/` — User-facing feature modules (auth, dashboard, landing, notifications, profile, settings, workspace, and YouTube).
- `frontend/src/shared/` — UI primitives, feedback/loading components, and global styles.

Folders under `backend/` that currently contain only a README are reserved organizational locations; the active backend code remains in the files directly under `backend/`.

## Frontend flow

The application is initialized in `frontend/src/main.tsx`. `App.tsx` owns the current page and login gate; `app/AppRouter.tsx` selects a page, while `app/AppLayout.tsx` adds the signed-in studio shell. Feature pages call their corresponding API modules under `features/<feature>/api/`.

## Backend notes

The FastAPI application is implemented in `backend/main.py` and served with Uvicorn. The Vite development server proxies `/api` requests to `http://127.0.0.1:8000` by default. Set `BACKEND_URL` if the API is running at a different address, or set `PYTHON` to select the Python executable.

## Security and demo behavior

- Configure secrets using environment variables; do not put API keys in frontend code.
- The current frontend login is a demo flow and does not authenticate credentials.
- Review generated content and confirm asset usage rights before publishing.
