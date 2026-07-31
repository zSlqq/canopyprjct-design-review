# Deployment

The project produces a self-contained Next.js standalone release in:

```text
dist/forestoflight-hub
```

## Required environment

- Node.js 22
- `NODE_ENV=production`
- `PORT=3000` or another assigned port
- `HOSTNAME=0.0.0.0`
- `NEXT_PUBLIC_SITE_URL` set to the public origin before building

## Local production release

```bash
npm ci
npm run features:build
npm run delivery:build
npm run build
npm run release:prepare
npm run release:verify

cd dist/forestoflight-hub
HOSTNAME=0.0.0.0 PORT=3000 node server.js
```

Health endpoint:

```text
/api/health
```

## Container deployment

```bash
docker build -t forestoflight-hub .
docker run --rm \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://docs.example.com \
  forestoflight-hub
```

The runtime image:

- runs as a non-root user;
- includes only the standalone server, static assets, and public files;
- exposes port 3000;
- uses `/api/health` for the container health check.

## Reverse proxy

Preserve these paths exactly:

- `/_next/static/*`
- `/_docs-index/*`
- `/_feature-library/*`
- `/_docs-media/*`
- `/_project-media/*`
- `/brand/*`

Do not strip immutable caching headers from content-addressed assets.
