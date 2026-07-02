# Deployment Instructions

The app builds to a fully static bundle (`dist/`) with relative asset paths, a web
manifest and a service worker — deployable to any static host, offline classroom
machine, or an Android/iOS WebView wrapper.

## 1. Build

```bash
npm ci
npm run validate:data   # fail fast on scenario data problems
npm run build           # typecheck + vite build → dist/
```

## 2. Static hosting

| Host | Settings |
|---|---|
| **Netlify** | Build command `npm run build`, publish directory `dist` |
| **Vercel** | Framework preset "Vite", output `dist` |
| **GitHub Pages** | Push `dist/` to `gh-pages` (relative base means no path config needed) |
| **Any web server** | Serve `dist/` as static files; no server-side code required |

No environment variables are required. All state is client-side (localStorage).

## 3. Offline / classroom use

1. Deploy or copy `dist/` to the training room machine.
2. Serve with any static server (`npx serve dist`, IIS, nginx…).
3. Load the app once while online (or on the LAN) — the service worker then caches the
   full app for offline use.
4. Delegate progress and tutor settings persist in the browser's localStorage per device.

## 4. Android APK (Capacitor)

```bash
npm i -D @capacitor/core @capacitor/cli @capacitor/android
npx cap init "SafeSite Planner" com.yourco.safesite --web-dir dist
npx cap add android
npm run build && npx cap sync
npx cap open android      # build/sign the APK in Android Studio
```

Recommended: landscape orientation lock for tablets (already hinted in the manifest).

## 5. Production hardening checklist

- [ ] Replace `TUTOR_ACCESS_CODE` in `src/screens/TutorScreen.tsx` (or wire to licensing backend)
- [ ] Replace `STRIPE_PAYMENT_LINKS` placeholders in `src/screens/LicenceScreen.tsx`
- [ ] Connect licence key validation to a licensing server (current check is format-only)
- [ ] Apply training-provider branding to the certificate view if licensed
- [ ] Bump the service worker cache name (`CACHE` in `public/sw.js`) on each release
- [ ] Re-run `npm run validate:data` and the smoke tests before each release
