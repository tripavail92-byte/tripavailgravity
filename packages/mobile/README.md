# TripAvail Mobile — Official Architecture

> iOS + Android app built with **Expo + React Native + TypeScript**, sharing the same Supabase backend as the web app. Part of the `tripavail` pnpm/Turborepo monorepo.

---

## ✅ Architecture Decision (Approved)

**We use Expo + React Native + TypeScript. We are _not_ switching to Flutter.**

Rationale:

- Aligns with our existing **React web app** (same mental model, same patterns).
- Reuses our **Supabase** backend and Edge Functions with zero changes.
- Same **TanStack Query** data-fetching pattern as web.
- **NativeWind** brings our Tailwind design language to native.
- Lives in the existing **pnpm + Turborepo** monorepo, sharing `@tripavail/shared`.

React Native + Expo is a modern, production-grade stack. With disciplined UI work (below) it produces a premium app on par with Flutter — the difference is in execution, not the framework.

---

## 📐 Architecture Rules (non-negotiable)

1. **Server state → TanStack Query.** All remote data (tours, bookings, profiles) goes through `@tanstack/react-query`. No manual `useEffect` fetch-and-store.
2. **Client state → Zustand, lightweight only.** Auth/session and small UI/local state. Do not duplicate server data into Zustand.
3. **Auth sessions → `expo-secure-store`.** Never `localStorage` / `AsyncStorage` for tokens. (Configured in `lib/supabase.ts`.)
4. **`@tripavail/shared` → mobile-safe types/utilities only.** Import **types** and pure helpers. Never import the web Supabase client or anything that touches `import.meta.env`, `window`, or `document`.
5. **No web-only client files in mobile.** The mobile Supabase client lives in `lib/supabase.ts`. Do not import `packages/shared/src/core/client.ts` (Vite-only) — it will break the RN bundle.
6. **Design tokens stay consistent with the brand.** Use the tokens in `tailwind.config.js` and the kit in `components/ui/`. No ad-hoc hex colors or one-off card/button styles.
7. **Stage 2 native modules** (added per-phase, not upfront): Stripe (`@stripe/stripe-react-native`), camera/image picker for KYC (`expo-camera`, `expo-image-picker`), push (`expo-notifications`).

---

## 🎨 Premium-Native Quality Bar

**The app must feel premium-native — never like a website in a phone frame.** Every screen must have:

- **A clean, reusable component system** — build from `components/ui/`, don't re-style inline.
- **Consistent spacing** — use the token scale; align gutters (20px screen padding standard).
- **Native transitions** — use Expo Router's stack/tab animations; no abrupt swaps.
- **Loading states** — skeletons or spinners, never a blank screen.
- **Empty states** — use `<EmptyState>` with icon + helpful copy + an action.
- **Error states** — graceful fallback + a way to recover (retry / go back).
- **Consistent cards / buttons / badges** — one `Card`, one `Button` (3 variants), one `Badge` (5 tones).
- **Optimized images** — sized, `resizeMode="cover"`, fallback URLs; lazy where possible.
- **Proper native flows** — real map, calendar, and booking interactions (not web embeds).

If a screen looks like the website, it's wrong. Rebuild it with the kit.

---

## 🧱 Stack

| Concern | Technology |
|---|---|
| Framework | Expo SDK ~52 (managed) |
| Runtime | React Native 0.76 |
| UI | React 18.3 |
| Language | TypeScript ~5.3 (strict) |
| Navigation | Expo Router ~4 (file-based, typed routes) |
| Styling | NativeWind v4 (Tailwind for RN) + `react-native-css-interop` |
| Icons | `lucide-react-native` (system icons, mirrors web) + custom `react-native-svg` / `.svg` |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Backend | `@supabase/supabase-js` (shared Supabase project) |
| Secure storage | `expo-secure-store` |
| Build | Metro (pnpm-aware) + Babel (`babel-preset-expo`, `nativewind/babel`) |
| Monorepo | pnpm workspaces + Turborepo |

---

## 📁 Project Structure

```
packages/mobile/
├── app/                      # Expo Router routes (file = screen)
│   ├── (auth)/login.tsx      # auth group (no tab bar)
│   ├── (tabs)/               # Explore, Search, Tours, Trips, Profile
│   ├── tours/[id].tsx        # tour detail
│   ├── operators/[slug].tsx  # operator storefront
│   ├── explore/…             # category / collection
│   ├── settings/…            # account settings, verification
│   └── trips/[bookingId].tsx # booking detail
├── components/ui/            # the design-system kit (single source of truth)
├── hooks/useAuth.ts          # Zustand auth store
├── lib/                      # supabase client, queryClient, data services
├── tailwind.config.js        # design tokens
└── babel/metro.config.js     # pnpm-aware build config
```

## 🎛️ Design System

Tokens live in `tailwind.config.js`: `primary` (teal scale), `ink` (text), `surface`/`page`/`sunken`, `line` (borders), `success`/`warning`/`danger`.

Kit in `components/ui/` (import from the barrel):

```tsx
import { Screen, AppHeader, Card, Button, Badge, EmptyState, Avatar, TourCard } from '@/components/ui'
```

| Component | Use |
|---|---|
| `Screen` | Safe-area + page background wrapper (every screen) |
| `AppHeader` | Title/subtitle + optional back button |
| `Card` | Elevated surface with soft cross-platform shadow |
| `Button` | `primary` / `secondary` / `ghost`, with loading |
| `Badge` | Status pills, 5 tones |
| `EmptyState` | Icon + title + description + action |
| `Avatar` | Image or initials fallback |
| `TourCard` | Unified tour card, `grid` or `list` layout |

---

## 🎨 Icons

React Native has **no built-in SVG** — `react-native-svg` is set up for this. Three ways to add icons:

**1. Lucide (system icons)** — `lucide-react-native`, matching the web app. Import **per-icon** (never the barrel — it bloats the dev bundle) via the local re-export:

```tsx
import { Star, MapPin } from '@/components/icons/lucide'
```

Add a line to `components/icons/lucide.ts` to use a new icon. System resolvers in `components/icons/registry.tsx` map data → icons exactly like the web: `tourTypeIcon`, `tourFeatureIcon`, `amenityIcon`, `packageTypeIcon`.

**2. Custom code icons** (`components/icons/`) — themeable line icons built with `react-native-svg`:

```tsx
import { MountainIcon, CompassIcon } from '@/components/icons'
;<MountainIcon size={26} color="#0f766e" strokeWidth={1.8} />
```

To add one, copy an existing icon and swap the `<Path d="…">` data.

**3. Drop-in `.svg` files** (`assets/icons/`) — export from Figma or any icon set, import as a component (via `react-native-svg-transformer`):

```tsx
import CompassIcon from '@/assets/icons/compass.svg'
;<CompassIcon width={24} height={24} />
```

For a recolorable file, set `fill="currentColor"` in the `.svg` and pass `color`.

> ⚠️ Do **not** use web SVG (`<svg>`/`<path>` JSX or Framer Motion) — that's exactly why the web app's icon components can't be imported into mobile. Rewrite them with `react-native-svg` primitives or export as `.svg`.

---

## ▶️ Running the App

```bash
# from repo root
pnpm install
pnpm dev:mobile          # or: cd packages/mobile && npx expo start
```

Then open **Expo Go** on a device (same Wi-Fi) and scan the QR, or press `a` for an Android emulator.

Environment: copy `.env.example` → `.env.local` with `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

> **Google OAuth** requires `tripavail://auth/callback` registered in Supabase → Auth → URL Configuration. Email/password works without it.

## ✔️ Verifying a Build

```bash
pnpm --filter @tripavail/mobile typecheck     # TS
# then start Metro and confirm "Android Bundled … (N modules)" with no errors
```

Typecheck does **not** catch missing native/runtime deps — only a real Metro bundle does.

---

## ⚠️ Monorepo Setup Gotchas (pnpm)

pnpm's strict linking hides transitive deps that Babel/NativeWind inject into app code. These must be **direct deps** of this package (already added):

- `@babel/runtime` — injected by `babel-preset-expo`
- `react-native-css-interop` — NativeWind's JSX runtime (pin to match `nativewind`)

Other notes:

- `pnpm install` may prompt to purge `node_modules` — run `echo y | pnpm install` to proceed non-interactively.
- `react-native-css-interop` pulls `react-native-reanimated@4.x` (built for RN 0.81+). Harmless while unused; **pin to `~3.16`** if we add animations on SDK 52.

---

## 🗺️ Roadmap

**Stage 1 — Traveler UI (DONE):** full design system + all traveler screens (discovery, tour detail, operator storefront, trips, profile, settings, verification, booking detail). Bundles clean.

**Stage 2 — Wiring the heavy flows:**
1. Book Now → Stripe checkout (`@stripe/stripe-react-native`)
2. KYC capture (`expo-camera`, `expo-image-picker`)
3. Realtime messaging (Supabase channels)
4. Push notifications (`expo-notifications`)

**Stage 3 — Ship:** EAS build profiles (`eas.json`), Play Store / App Store submission.
