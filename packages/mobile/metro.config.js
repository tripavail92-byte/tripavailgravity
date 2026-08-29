const Module = require('module')
const path = require('path')

const originalResolveFilename = Module._resolveFilename
Module._resolveFilename = function patchedResolveFilename(request, parent, isMain, options) {
  if (request === 'metro-cache/src/stores/FileStore') {
    request = 'metro-cache/private/stores/FileStore'
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

const { getDefaultConfig } = require('expo/metro-config')
Module._resolveFilename = originalResolveFilename
const { withNativeWind } = require('nativewind/metro')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch all packages in the monorepo
config.watchFolders = [workspaceRoot]

// Pin Metro's SERVER root to this package. Watching the workspace root makes Metro derive its
// server root from the common ancestor (D:/Tripfinal), and everything relative is then resolved
// from there: `--entry-file index.js` looked for <root>/index.js, and babel-preset-expo /
// metro-runtime were resolved from the workspace root where pnpm doesn't hoist them. Release
// bundling failed as a result — locally AND on EAS ("Bundle JavaScript" phase) — while dev was
// unaffected because Metro serves those by URL. Watch folders still cover @tripavail/shared.
config.server = { ...config.server, unstable_serverRoot: projectRoot }

// Resolve node_modules from both the mobile project and workspace root (pnpm hoisting)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Required for pnpm symlinks
config.resolver.unstable_enableSymlinks = true

// SVG support — import .svg files as React components (react-native-svg-transformer).
// The /expo entry composes with Expo's default transformer; NativeWind wraps on top.
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo')
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg')
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg']

module.exports = withNativeWind(config, { input: './global.css' })
