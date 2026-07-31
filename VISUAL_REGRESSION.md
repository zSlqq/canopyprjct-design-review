# S–S+ visual regression

This project treats visual quality as a release requirement, not an informal review step.

## Certified scenes

The baseline covers the core product experience in desktop and mobile layouts:

- homepage;
- complete feature library;
- documentation index;
- Canopy project page;
- Canopy repository documentation.

The comparison runs against the standalone production release with:

- Chromium;
- a fixed UTC timezone and `en-US` locale;
- light color scheme;
- reduced motion;
- one-pixel device scale;
- animations and transitions disabled after the audited document has loaded;
- Web Animations API activity finalized or cancelled before capture;
- fonts and non-deferred images settled before capture;
- every page is scrolled through once to activate lazy media before returning to the top;
- every scene is captured twice and must pass the same pixel thresholds internally before it can become or be compared with a baseline.

## Tolerance

A scene fails when either limit is exceeded:

- more than `0.3%` of pixels changed;
- more than `2,500` pixels changed.

Anti-aliasing differences are excluded by Pixelmatch. A dimension change always fails.

## Commands

Create or deliberately update the approved baseline:

```bash
npm run visual:baseline
```

Compare the current production release with the approved baseline:

```bash
npm run visual:check
```

Run the complete S–S+ quality gate:

```bash
npm run quality:splus
```

Visual reports, actual captures, and failure diffs are written to:

```text
.stage32/visual
```

Baseline updates should be reviewed as design changes. They must not be regenerated merely to silence a failed comparison.
