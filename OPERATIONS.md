# Operations

## Development server

```bash
npm run site
```

## Full local quality gate

```bash
npm run quality
```

This rebuilds generated libraries, verifies types and lint, creates the production build, prepares the standalone release, and checks release integrity.

## Documentation synchronization

```bash
npm run sync:docs
npm run features:build
npm run delivery:build
npm run quality
```

The scheduled GitHub Actions workflow performs this sequence and opens or updates a reviewable pull request when synchronized content changes.

## Health and diagnostics

- Application health: `/api/health`
- Delivery status: `/status`
- Sitemap: `/sitemap.xml`
- Documentation search: `/search`
- Feature library: `/features`

## Rollback

Deployments should keep the previous standalone artifact. Rollback consists of restoring that artifact and restarting:

```bash
node server.js
```

Generated documentation changes should enter through the automated synchronization pull request rather than direct edits to generated JSON.
