# Another Life Research

Static website for Another Life Research.

## Files

- `index.html`: page content and structure.
- `styles.css`: responsive styling.
- `app.js`: navigation and the interactive particle ecosystem.
- `.nojekyll`: serves the files without Jekyll processing.

No build step, packages, API keys, or external services are required. The ecosystem runs locally in the visitor’s browser. The public contact address is `anotherlife@agentmail.to`.

## Local preview

Run `python3 -m http.server 4173 --bind 127.0.0.1` from this directory, then open `http://127.0.0.1:4173`.

## GitHub Pages

Place these files at the root of a new repository. In Settings → Pages, choose Deploy from a branch, then select your branch and `/(root)`.

See [GitHub’s publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The relative asset paths support both a repository subpath and a custom domain. Configuring `anotherlife.is` and its DNS records is a separate step.
