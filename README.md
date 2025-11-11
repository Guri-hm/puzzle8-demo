# 8puzzle — GitHub Pages deployment

This repository contains a small static 8-puzzle site. The repository is configured to automatically deploy to GitHub Pages on pushes to the `main` branch.

What was added
- `.github/workflows/deploy-pages.yml` — GitHub Actions workflow that uploads the repo root as a Pages artifact and deploys it on push to `main`.
- `.nojekyll` — prevents GitHub Pages from processing files with Jekyll.

How it works
1. Push to `main`.
2. The workflow runs and uploads the repository root as the Pages artifact.
3. GitHub deploys the artifact to GitHub Pages. The Pages deployment is created automatically by the workflow.

Verify
- After pushing, open the Actions tab on GitHub and inspect the `Deploy to GitHub Pages` run.
- When the deployment finishes, the Pages URL will be available in the repository Settings → Pages page, or in the Actions run summary.

Notes
- If you later add a build step (for example a bundler or static site generator), update `deploy-pages.yml` to run the build and upload the build output directory instead of the repository root.
- To use a custom domain, add a `CNAME` file to the repository root with your domain and configure DNS accordingly.
