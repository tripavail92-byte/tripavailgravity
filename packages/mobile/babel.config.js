module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      // unstable_transformImportMeta: @tripavail/shared dist probes `import.meta.env`
      // (Vite vs Node env detection) — Hermes has no import.meta, so Babel must
      // transform it or the bundle fails with a SyntaxError at load.
      ['babel-preset-expo', { jsxImportSource: 'nativewind', unstable_transformImportMeta: true }],
      'nativewind/babel',
    ],
    // Reanimated 4 worklets — must be the LAST plugin.
    plugins: ['react-native-worklets/plugin'],
  }
}
