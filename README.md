## Vercel preview

This project is configured as a static frontend deployment for Vercel. The root `index.html` is the UI entry point, and the supporting assets (`styles.css`, `app.js`) are served alongside it.

To preview locally:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

In Vercel, the project should deploy successfully from the repo root because the UI is a static site. If Vercel still tries to run the Node script as a server, use the included `vercel.json` configuration to force static-host behavior.
