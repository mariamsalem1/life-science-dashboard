# Deploy Life Science Operations to Vercel

The existing dashboard is ready to deploy as a static application. Its complete
frontend is in `dist/`; no npm dependencies, installation, or compilation are required.
The root `vercel.json` selects this folder and disables installation and build steps.

## Deploy from GitHub

1. Commit and push the deployment files to `mariamsalem1/life-science-dashboard`.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Keep **Root Directory** at the repository root (`./`), not `dist`.
4. Use **Framework Preset: Other**. The configuration supplies Output Directory
   `dist` and empty Install and Build commands. Remove conflicting dashboard overrides.
5. Deploy. Vercel returns the deployment URL; future pushes to the connected
   production branch update that deployment.

## Deploy from PowerShell instead

Run from the `life-science-operations` project directory:

```powershell
npx vercel@latest login
npx vercel@latest
```

Select the account/project when prompted and keep the project directory `./`.
The first deployment is a preview. To publish to production:

```powershell
npx vercel@latest --prod
```

## Data and integrations

- Demo views, local JSON imports, 3D models, illustrative CCTV, and browser report
  export work with the static deployment. PDF export uses the browser print dialog.
- Browser-stored imports, documents, settings, and layouts are local to each
  browser and origin. Reimport them on the new Vercel URL if needed; data from
  the previous site is not transferred automatically.
- Live Connections require a separate HTTPS gateway. `gateway/server.py` is a
  persistent Python/SQLite reference server and is excluded from this deployment.
  Configure the gateway's `OPS_ALLOWED_ORIGINS` with the exact Vercel production
  origin, then sign in to the gateway and connect through the dashboard. Follow
  `INTEGRATION.md` for the gateway protocol and credentialed CORS requirements.
- Keep gateway secrets on the gateway server. No Vercel environment variables
  are required for this static frontend.
- Map tiles and weather require internet access and their external providers.
  The illustrated workforce network uses a bundled image and needs no map API key.

## Verify after deployment

Open the returned URL, check navigation and factory selection, rotate a 3D view,
open CCTV from Factory Overview, and try a filtered Quality PDF in Reports.
Verify a configured gateway separately if using live data.
