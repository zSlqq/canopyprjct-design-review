# Launch certification

The launch audit runs against the prepared standalone production release rather than the development server.

## Coverage

Every canonical route is checked in desktop and mobile Chromium for:

- HTTP status;
- exactly one primary heading;
- English document language;
- main landmark presence;
- duplicate element IDs;
- unnamed enabled interactive controls;
- disabled Markdown task-list markers are treated as document content, not controls;
- broken images and missing `alt` attributes;
- horizontal overflow;
- generic feature headings;
- browser, console, request, and response errors;
- visitor-time GitHub requests;
- initial documentation and feature shard preloading;
- heavyweight repository animations are interaction-deferred;
- static documentation images use responsive widths and explicit lazy decoding.

Representative full-page screenshots are generated for the homepage, feature library, documentation, search, status, and Canopy project page.

## Performance budgets

| Metric | Maximum |
|---|---:|
| Per-route transfer | 4,000,000 bytes |
| Per-route JavaScript transfer | 800,000 bytes |
| DOM nodes | 3,500 |
| First contentful paint | 3,500 ms |

These are release guardrails, not marketing measurements. Routes are measured sequentially so the first-contentful-paint budget reflects one visitor navigation rather than artificial contention from several Chromium pages loading at once. CI hardware and local development machines can still produce different timings.

## Commands

Complete certification:

```bash
npm run launch:certify
```

Browser audit only, after preparing the release:

```bash
npm run launch:audit
```

Reports are written to:

```text
.stage31/launch-audit
```
