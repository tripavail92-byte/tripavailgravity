module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Reanimated 4 worklets — must be the LAST plugin.
    plugins: ['react-native-worklets/plugin'],
  }
}
