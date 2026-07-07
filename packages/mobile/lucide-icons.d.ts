// The per-icon Lucide entry points (dist/esm/icons/*.js) ship without co-located
// .d.ts files. This wildcard declaration types each per-icon default export as a
// LucideIcon, so `import Star from 'lucide-react-native/dist/esm/icons/star'` is typed.
declare module 'lucide-react-native/dist/esm/icons/*' {
  import type { LucideIcon } from 'lucide-react-native'

  const icon: LucideIcon
  export default icon
}
