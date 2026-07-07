// Lets TypeScript treat imported .svg files as React components.
// Enables: import CompassIcon from '@/assets/icons/compass.svg'
declare module '*.svg' {
  import type React from 'react'
  import type { SvgProps } from 'react-native-svg'
  const content: React.FC<SvgProps>
  export default content
}
