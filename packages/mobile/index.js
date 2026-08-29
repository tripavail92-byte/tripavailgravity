// Local app entry.
//
// `main` used to point straight at "expo-router/entry", which pnpm resolves into the shared
// .pnpm store OUTSIDE this package. Release bundling then broke: the RN Gradle plugin passes
// --entry-file relative to the app dir ("./../../node_modules/.pnpm/…"), while Metro resolves
// from the workspace root (metro.config.js watches ../.. for @tripavail/shared) — so the path
// landed one level too high and the bundler couldn't resolve the entry. It failed the same way
// locally and on EAS ("Bundle JavaScript" phase).
//
// Keeping the entry inside the package makes both agree. This is the documented Expo Router
// setup for monorepos; behaviour is identical, it just re-exports the same entry.
import 'expo-router/entry'
