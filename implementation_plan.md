# Deployment Preparation & Implementation Plan

This plan details the necessary steps to transition the Task Management App from a local development environment to a production-ready, deployable application.

## User Review Required

> [!WARNING]
> **File Upload Storage**: Currently, profile photos are saved to the local `uploads/` folder. If we deploy to a cloud platform like Render, Vercel, or Heroku, this local folder will be erased every time the server restarts. 
> *Decision needed*: Do you want to implement a cloud storage solution (like Cloudinary or AWS S3) for profile photos, or do you plan to deploy this on a Virtual Private Server (VPS) where local files are permanent?

## Open Questions

> [!IMPORTANT]
> **Hosting Platform**: Where do you plan to host this application? 
> 1. A single unified platform (like Render or Heroku) where the Node.js server also serves the React frontend.
> 2. Separate platforms (e.g., Frontend on Vercel/Netlify, Backend on Render/Railway).
> *(This plan assumes a unified platform approach for simplicity and to avoid CORS issues, but can be adjusted based on your preference.)*

## Proposed Changes

---

### Frontend Components & API Utilities

Currently, the API base URL (`http://192.168.1.4:5000/api`) is hardcoded across multiple files (`Auth.jsx`, `TasksPage.jsx`, `Dashboard.jsx`, etc.). We will consolidate this to use environment variables.

#### [NEW] `frontend/src/config.js` (or similar utility)
- Create a central configuration file to export the `API_BASE` URL dynamically.
- In development, it will point to `http://localhost:5000/api` (or a local IP).
- In production, it will point to `/api` (if hosted together) or a production domain via `import.meta.env.VITE_API_URL`.

#### [MODIFY] `frontend/src/pages/*.jsx`
- Import `API_BASE` from the new config file instead of hardcoding it.
- Remove all hardcoded `192.168.1.4:5000` URLs.

#### [NEW] `frontend/.env`
- Add `.env` to define local environment variables (`VITE_API_URL`).

---

### Backend Configuration

We need to configure the backend to safely handle production environments and potentially serve the frontend files.

#### [MODIFY] `backend/server.js`
- **Static File Serving**: Add Express middleware to serve the static frontend files from `frontend/dist` when `process.env.NODE_ENV === 'production'`.
- **Catch-All Route**: Add a catch-all route (`app.get('*', ...)`) to send `index.html` for any unrecognized routes. This is required for React Router to work correctly in production without throwing a "404 Not Found" error when refreshing pages like `/dashboard`.
- **Security Enhancements**: (Optional) integrate `helmet` for basic HTTP security headers.

#### [MODIFY] `backend/package.json`
- Add a `build` script that can trigger the frontend build process.
- Add a `start` script for production execution (e.g., `node server.js` instead of `nodemon`).

## Verification Plan

### Automated Tests
- N/A for this infrastructure change.

### Manual Verification
1. Run `npm run build` in the frontend to ensure Vite successfully bundles the app into `dist/`.
2. Start the backend in production mode (`NODE_ENV=production node server.js`).
3. Visit the backend's `http://localhost:5000` (or whatever port it runs on) and verify that the React frontend loads correctly, API calls succeed, and React Router navigation (e.g., clicking refresh on `/tasks`) works without throwing a 404 error.
