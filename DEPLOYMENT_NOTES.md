# Deployment Notes (Vercel)

This project is a **static site** (no build step).

## Recommended Vercel settings
- Framework Preset: **Other**
- Build Command: **None**
- Output Directory: `./`

## Why `vercel.json` is included
- Enforces correct MIME type for ES module JavaScript (fixes cases where the left navigation is empty).
- Adds a rewrite to `index.html` so refreshing on deep links works.

## Local preview
```bash
python3 -m http.server 5173
```
Then open: http://localhost:5173
