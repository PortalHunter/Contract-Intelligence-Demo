# Contract Intelligence — Public Demo

This repository hosts a **standalone interactive interface demonstration** for an offline-first government-contract subcontract flow-down review concept.

**[Open the browser demo](https://portalhunter.github.io/Contract-Intelligence-Demo/)**

> **Synthetic demonstration only.** All displayed contract documents, excerpts, page references, classifications, and review outcomes are illustrative. The demo does not make validated regulatory or legal determinations and is not legal advice.

## What the demo includes

- Overview/dashboard and sample document inventory.
- Illustrative analysis workflow.
- Searchable, filterable FAR/DFARS flow-down matrix.
- Fictional evidence inspector and review questions.
- Browser-generated **synthetic** CSV export.

The site is an ordinary, static HTML document. It does **not** upload documents, run a Python backend, perform OCR, query a FAR/DFARS database, call external services, or collect user information. No genuine contract documents, customer information, private project history, AI models, or confidential business logic belong in this repository.

## Security and publishing

- Only `public/index.html` is deployed to GitHub Pages.
- `scripts/verify_public_demo.py` checks the site bundle for external connections, inputs, unnecessary assets, and disclosure text.
- `.github/workflows/pages.yml` runs that check before every Pages publication. The workflow has read-only repository access and narrowly scoped deployment permissions.
- **Never add real contracts, customer documents, keys, internal work materials, or personally identifying data.**
- The offline application and its source stay in a *different, private repository*. This demo is not a fork, and its commit history does not inherit that private project.

## Deployment

On a public repository, GitHub Pages is available without exposing any private app code:

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, select **GitHub Actions** as the source if not already enabled.
3. The **Publish synthetic demo to GitHub Pages** workflow runs on updates to `main`. It can also be rerun manually under **Actions**.
4. After successful deployment, visit **https://portalhunter.github.io/Contract-Intelligence-Demo/**.

The preview will return a 404 until GitHub Pages is enabled and the deployment succeeds.

## Scope

This public repository is for reviewing **look and feel**, interaction design, and demo flow only. Do not interpret example classifications as legal advice or proof of a working contract-analysis engine. The real offline product must be separately installed, validated, and independently reviewed before use for compliance decisions.
