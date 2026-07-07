// Per-icon Phosphor entry points (lib/module/icons/*.js) ship without co-located
// .d.ts files. Type each per-icon default export as a Phosphor Icon so
// `import Mountains from 'phosphor-react-native/lib/module/icons/Mountains'` is typed.
declare module 'phosphor-react-native/lib/module/icons/*' {
  import type { Icon } from 'phosphor-react-native'

  const icon: Icon
  export default icon
}
