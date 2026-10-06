# Milkline: herd overview

The first screen a dairy farmer sees at 5am: which animals need me today, where are they, and can I trust what I'm looking at. Built with SvelteKit (Svelte 5), TypeScript and Tailwind CSS v4, against a mock API.

**Stack note:** the brief asks for React or Next. I chose Svelte 5 / SvelteKit instead. The concerns the brief grades (reusable components, server-state handling, tokens, live-versus-held data) do not depend on the framework: the domain logic in `src/lib/domain` is plain TypeScript, and the `StreamClient` and fetch layers are framework-free.

**Live demo:** https://marcellokabora.github.io/Milkline/ (GitHub Pages, redeployed on every push to `main`). It can be installed as an app (PWA), see [Install as an app](#install-as-an-app-pwa).

## Run it

```sh
npm install
npm run dev        # http://localhost:5173, open it at phone width (DevTools device mode)
npm test           # unit tests: sorting, stream reducer, freshness, search, copy
npm run check      # svelte-check
npm run build && node build   # production build (adapter-node, because the mock API is a server route)
```

If `npm install` fails with an `edgesOut` error, use `npm install --legacy-peer-deps`.

## See the failure modes

In dev mode (`npm run dev`) a flask button appears in the top bar with the demo controls; it is hidden in production builds. The `?mock=` URLs work in both. Start the page in a state:

| What | How |
| --- | --- |
| Slow initial fetch (3.5 s) | `/?mock=slow`, or switch on **Slow connection** and reload |
| Initial fetch fails | `/?mock=fail` (with nothing saved yet) |
| Lost network mid-session | **No network** switch. Also reacts to the browser's real offline events |
| Connected but nothing arrives (stale) | **Silent stream** switch |
| A live alert | **Raise an alert** / **Raise a critical alert** (one also arrives by itself every 20-40 s) |

A copy of the last herd is kept in `localStorage` so reopening in a dead zone shows it, clearly labelled with its age. That means a second `?mock=fail` load shows the saved herd with a "Can't reach Milkline" banner instead of the full error screen. Use **Clear saved data**, then reload, to see the full loading and error screens again.

## The mock API

Nothing here needs a real backend; the brief asks for a mock that is shaped like the real one.

- `GET /api/v1/herds/{herdId}/animals?page=n`: a real SvelteKit route ([+server.ts](src/routes/api/v1/herds/[herdId]/animals/+server.ts)), 50 per page, `asOf`, 120 deterministic animals ([generate.ts](src/lib/api/mock/generate.ts)). Slow and failing responses come from an `x-mock-scenario` header.
- `WS .../stream`: SvelteKit has no built-in WebSocket server, so the stream is an in-browser emitter ([stream.ts](src/lib/api/stream.ts)) that produces the four documented message shapes. It sits behind a `StreamClient` interface; the real client replaces `createMockStream` in the store and nothing else changes.

## Integrating with the real API

The UI only talks to two seams, so going live touches very little:

| Seam | Today | To go live |
| --- | --- | --- |
| Herd fetch ([herdApi.ts](src/lib/api/herdApi.ts)) | `fetch('/api/v1/herds/{id}/animals?page=n')`, relative URL, same origin | Proxy `/api` to the real backend (Vite `server.proxy` in dev, reverse proxy in production), or prefix the URL with a base URL. Add auth headers in `fetchPage`. Delete the `x-mock-scenario` header and the mock route in `src/routes/api/` |
| Live stream ([stream.ts](src/lib/api/stream.ts)) | `createMockStream`, an in-browser emitter | Implement `StreamClient` (`connect(handlers)`, `disconnect()`) over `new WebSocket('/api/v1/herds/{id}/stream')`. Call `onOpen` on open and `onEvent` with each parsed message (`vitals_update`, `flag_raised`, `flag_cleared`, `sensor_offline`). Then replace `createMockStream` in [herd.svelte.ts](src/lib/state/herd.svelte.ts) |
| Herd id | Hard-coded `h_4417` in `herd.svelte.ts` | Take it from the session or user profile, or a route param |

Things to know when wiring it up:

- The API is paginated and unordered, so `fetchHerd` loads every page before ranking. A 400-animal herd is 8 requests, fired in parallel after page 1.
- The response shape follows the brief (`AnimalsPage`, `StreamEvent` in [types.ts](src/lib/api/types.ts)). Unknown flag codes or statuses are not handled yet.
- The stream client owns reconnecting. The store treats a missing `onOpen` or silence as "not live" and shows it through [freshness.ts](src/lib/domain/freshness.ts). Nothing else needs to change.
- The cached herd in `localStorage` is keyed by herd id and has a version field (`v: 1`). Bump it if the `Animal` shape changes.
- CORS and auth are not handled. Same-origin or proxy is assumed.

## Install as an app (PWA)

The app has a web manifest ([manifest.webmanifest](static/manifest.webmanifest), icons in `static/icons`) and a service worker ([service-worker/index.ts](src/service-worker/index.ts)), which SvelteKit registers automatically in production builds.

**Install it from the live site:** open https://marcellokabora.github.io/Milkline/ and install it.

- **Chrome / Edge (desktop and Android):** use the **Install** button in the top bar, or the install icon in the address bar.
- **iOS Safari:** Share → **Add to Home Screen**.

The app icons (192, 512, maskable and Apple touch) are rendered from the same drop logo as [favicon.svg](static/favicon.svg), so the home-screen icon matches the browser tab.

- The service worker caches the app shell and static assets, so the app opens with no signal. Navigations are network-first and fall back to the cached shell.
- `/api/*` is never cached by the service worker, so herd data is never served stale without saying so. The last herd lives in `localStorage` instead, with its age shown.
- To try it: `npm run build && node build`, open it in Chrome, then use the **Install** button in the top bar (shown when the browser offers installation). Switch DevTools to offline and reload to check the shell loads.
- In `npm run dev` the service worker is not a reliable test, so use the production build.

## Deploy to GitHub Pages

[deploy.yml](.github/workflows/deploy.yml) runs on every push to `main`: `npm ci`, `npm run check`, `npm test`, a static build, then deploys it to GitHub Pages at `https://<user>.github.io/<repo>/`. For this repository that is https://marcellokabora.github.io/Milkline/.

One-time setup: in the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. Then push to `main` (or run the workflow by hand from the **Actions** tab). The deployed URL is shown on the `deploy` job.

How a static host works with this app:

- `DEPLOY_TARGET=pages` switches the build from `adapter-node` to `adapter-static` (a single-page app, `index.html` fallback). `BASE_PATH=/<repo>` is the sub-path Pages serves from. Both are read in [vite.config.ts](vite.config.ts). Without them, `npm run build` is the normal Node build.
- Pages has no server, so the mock API cannot be a SvelteKit route there. In this build `fetchPage` calls the same mock code in the browser ([handler.ts](src/lib/api/mock/handler.ts)), which the server route also uses, so both behave the same. `?mock=slow`, `?mock=fail` and the simulate panel all work.
- The manifest uses relative URLs and the service worker derives its paths from its own scope, so installing and offline work under `/<repo>/`.

Test the production build locally, the way Pages will serve it:

```
$env:DEPLOY_TARGET='pages'; $env:BASE_PATH='/Milkline'; npm run build
```

Then serve the `build` folder under `/Milkline/` (for example copy it to `some-dir/Milkline` and run `npx serve some-dir`) and open `http://localhost:3000/Milkline/`. To check the live site, open the deployed URL, confirm "120 animals" loads, try `?mock=fail`, and use **Install** in Chrome.

## Capacitor versus React Native for the app stores

These are estimates, not measurements; nothing has been ported. The question: what does it cost to ship this app to the Apple and Google stores with Capacitor, compared with rebuilding it in React Native?

**React Native means a rewrite, and more code.** The pure logic (`src/lib/domain/`, `herdApi.ts`, `types.ts`, the mock generator) has no Svelte in it and carries over unchanged. The rest is rebuilt:

- **State** ([herd.svelte.ts](src/lib/state/herd.svelte.ts)): React has no `$derived`, so every derived value becomes a `useMemo` with a dependency array (or a selector in a library such as Zustand). The timers, listeners and abort controller in `start()` become `useEffect` and `useRef`. Expect roughly 30-50% more code, plus the usual hooks pitfalls (stale closures, missing dependencies).
- **UI:** HTML and CSS are replaced by `View`, `Text`, `FlatList` and `StyleSheet`, so every component is rewritten. The Tailwind tokens and dark mode need a native equivalent. JSX with handlers is also longer than Svelte markup, roughly 10-30% more.
- **Platform APIs:** `AsyncStorage` replaces `localStorage`, and `NetInfo` and `AppState` replace the `online`/`offline`/`pagehide` events. The service worker and PWA code go away.
- **Overall:** about 15-25% more code, concentrated in the state and UI layers, and the UI work is a rewrite rather than a conversion.

**Capacitor keeps the Svelte app and adds a thin native shell,** so the cost is mostly configuration, probably under 100 lines of new code:

- Add `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` and `@capacitor/android`.
- A `capacitor.config.ts` of about 10 lines (app id, app name, `webDir: 'build'`).
- `npx cap add ios` and `npx cap add android` generate the native projects. Generate icons and splash screens from the existing artwork.
- Optional native plugins: `@capacitor/network` and `@capacitor/app` (more reliable than `navigator.onLine` and `pagehide`), and push notifications for critical alerts.

Two things must change first:

1. **The build must be static.** The project uses `adapter-node`. Capacitor needs `adapter-static` with `fallback: 'index.html'` and `ssr = false` in `+layout.ts`, about 5 lines.
2. **The mock API will not exist inside the app.** [+server.ts](src/routes/api/v1/herds/[herdId]/animals/+server.ts) is a server route and a static app has no server. Point `fetchPage` at an absolute base URL for the real backend (see "Integrating with the real API"), or move the mock generator into the client for a demo build. This is the largest change. Also disable the service worker in the native build.

React Native has the same backend requirement, since it also cannot call a SvelteKit route.

**Getting into the stores is mostly non-code work, and identical for both:**

- An Apple Developer account (about $99 a year) and a Google Play account (about $25 once), a Mac with Xcode for iOS builds, and signing certificates and provisioning profiles.
- Store listings: screenshots, a privacy policy and an age rating.
- App review. Apple can reject thin web wrappers (guideline 4.2), so a Capacitor app should use at least some native features, such as push notifications. React Native apps are native UI and do not have this risk.

**Verdict:** for a list-and-status app like this one, Capacitor is the cheaper route because all the existing UI, state and tests are reused. React Native is worth it only if the app later needs very smooth, native-feeling interactions or deep native integration.

## How it is put together

```
src/lib/api/        types, fetch client, mock generator, mock stream
src/lib/domain/     pure logic: priority sort, flag copy, freshness, search, stream reducer (all tested)
src/lib/state/      herd.svelte.ts (Svelte 5 runes store), theme, localStorage cache
src/lib/components/ one component per idea; ui/ holds primitives (Button, StatusChip, Sheet, Skeleton)
src/routes/layout.css  design tokens
```

- **State:** one runes store (`$state` / `$derived`), no store library. `animals` is always live. `displayed` is a frozen snapshot of who is in which group and in what order.
- **Tokens, not hex:** colours are CSS variables mapped to Tailwind names (`bg-surface`, `text-content-muted`, `border-status-critical`, `bg-primary`). Dark mode swaps the variables, so components have no `dark:` variants. Contrast was checked per pair: everything is AA or better, nearly all AAA, in both themes.
- **Status is never colour alone:** each status has its own icon and word.

## Decisions worth knowing

- **Priority order** (explainable, deterministic): status, then worst flag severity, then confidence, then longest-running first.
- **Why flagged, in words:** "Chewing less than normal. 4 h 51 min a day, usually 7 h 48 min". Confidence is a word (Very likely / Likely / Possible), never a decimal. No charts.
- **Live versus held still:** status, flags, counts and freshness update the moment they arrive. List membership and order do not move under the farmer's thumb: new or changed animals queue behind an "N changes · tap to update" pill, which turns red when a critical change is waiting. A card that is already on screen changes in place; if its animal recovers, the card says so and leaves on the next update.
- **Never lies about freshness:** one function ([freshness.ts](src/lib/domain/freshness.ts)) decides Live (under 15 s), Delayed, Stale (over 2 min) or Offline. Disconnected always wins over a recent timestamp. When data is not live, the verdict reads "Last known · 4:11 PM", cards desaturate, and a banner explains what happened and what the app is doing about it. Clock times add the day when they are not today.
- **Silent sensors are not healthy:** animals with no signal get their own group and are excluded from the healthy count.
- **"I've seen her":** the detail sheet has a button that marks an unhealthy animal as handled. She leaves her section and the summary counts and moves to a collapsed "Seen today" section (with Undo in the sheet). It is stored in `localStorage`, lasts until midnight, and is cancelled if her status or flags change (a new flag puts her back on the list). Logic in [acknowledge.ts](src/lib/domain/acknowledge.ts).
- **Gloves and one hand:** 56 px minimum touch targets (64 px cards), search in the thumb zone at the bottom, no gesture is required (there is a visible Refresh button, not only pull-to-refresh).

## What is not finished

- Figma file and the written rationale are separate deliverables.
- The animal detail screen is a stub sheet (out of scope by the brief).
- The mock stream runs in the browser, not over a real socket, and no reconnect backoff exists for the stream itself (the herd fetch retries at 5, 10, 20, 30 s).
- The service worker is basic (precache plus network-first navigation). No update prompt when a new version is deployed, and no background sync. It has not been tested on iOS Safari.
- No auth, base-URL config or env vars for the real API (see "Integrating with the real API").
- No push notifications: alerts only reach a farmer who has the app open.
- Tests cover the pure domain logic only; the store and components are verified by hand and in a browser.

## What I would do next

- Push notifications for critical alerts, so they reach a farmer who has the app closed (see "Next step: push notifications for alerts").
- Replace the mock stream with the real WebSocket, with reconnect backoff and heartbeat-based staleness instead of message-based.
- Move the cached herd from `localStorage` to IndexedDB (in the service worker's reach), and add an "update available" prompt.
- Test with farmers: tap accuracy with gloves, glare, and whether "tap to update" is understood.
- Let a farmer acknowledge ("I've seen her") so handled animals drop out of today's list.
- Group and filter by pen or barn for 400-animal herds; paginate or virtualise the healthy list.

## Where AI helped

Built with GitHub Copilot in VS Code. About 95% of the code was written by the AI. I spent about 3 hours in total and used about 1,134 tokens.

My part was the direction: reading the brief, deciding what the screen should do and what to leave out, and reviewing and steering what the AI produced.