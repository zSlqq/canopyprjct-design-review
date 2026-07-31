# Release checklist

- [ ] `npm ci` completes without dependency resolution changes.
- [ ] `npm run features:build` reports complete project and entry coverage.
- [ ] `npm run delivery:build` reports passing integrity checks.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `npm run release:prepare` creates `dist/forestoflight-hub`.
- [ ] `npm run release:verify` passes.
- [ ] `/api/health` returns HTTP 200 from the standalone server.
- [ ] Every canonical route returns HTTP 200 from the standalone server.
- [ ] The deliberate missing route returns HTTP 404.
- [ ] No visitor-time GitHub image requests are present.
- [ ] `NEXT_PUBLIC_SITE_URL` matches the deployment origin.
- [ ] Previous release artifact is retained for rollback.
- [ ] Deployment fingerprint matches `release-manifest.json`.
