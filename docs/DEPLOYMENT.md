# Development and publication

## Local environment

Use Node.js 24, npm and Python 3.12+. Dependencies are locked in `package-lock.json`.

```sh
npm ci
npx playwright install chromium
npm run check
npm run dev
```

Open the URL Vite prints. The default repository base is `/octg-materials-intelligence/`. A different host path can be set explicitly, for example `VITE_BASE_PATH=/ npm run dev`. Never hardcode root asset paths in application code.

## Production preview

```sh
npm run build
npm run preview
```

Open `http://127.0.0.1:4173/octg-materials-intelligence/`. Navigation uses hashes such as `#/database`, so refreshing a selected module requests the existing static index. There are no server routes to configure.

## GitHub Pages

The `main` push workflow validates the source dataset, runs all unit/integration tests, builds the production app, runs Chromium desktop/mobile workflows against that build and uploads `dist`. A separate job receives only the Pages and OIDC permissions required to deploy. Pull requests run the same checks without deployment permissions.

Enable **Settings → Pages → Source → GitHub Actions**. For a renamed repository, the build workflow derives `VITE_BASE_PATH` from `github.event.repository.name`; local defaults and Playwright base URLs must be updated to match. For a custom domain or account-root site, configure `/` as appropriate and test that deployment path explicitly.

The workflow uses GitHub's [custom Pages workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), with official `configure-pages`, `upload-pages-artifact` and `deploy-pages` actions. Only successful production checks permit the deploy job.

After deployment, verify the live URL, the JSON data URL and at least one refreshed hash route on desktop and mobile. A green build alone is not proof that the published site works.

## If publishing from a new authenticated checkout

```sh
gh repo create octg-materials-intelligence --public --source . --remote origin
git push -u origin main
gh api --method POST repos/OWNER/octg-materials-intelligence/pages -f build_type=workflow
gh workflow run deploy.yml
```

Replace `OWNER` with the actual account. Create Pages before dispatching if it is not already enabled. Keep authentication in the operating-system credential store; do not place tokens in the repository or commands.
