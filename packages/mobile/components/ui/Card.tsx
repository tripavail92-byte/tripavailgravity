import type { ViewProps } from 'react-native'
import { View } from 'react-native'

interface CardProps extends ViewProps {
  className?: string
  /** Remove the soft elevation shadow (e.g. for inset/nested cards). */
  flat?: boolean
}

/**
 * Elevated surface with a soft, premium shadow + hairline border.
 * Shadow is applied via style so it renders consistently on iOS + Android.
 */
export function Card({ className, flat = false, style, children, ...rest }: CardProps) {
  return (
    <View
      className={`bg-surface rounded-3xl border border-line ${className ?? ''}`}
      style={[
        flat
          ? null
          : {
              shadowColor: '#0f172a',
              shadowOpacity: 0.06,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 3,
            },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}
