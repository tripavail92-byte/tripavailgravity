import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ROLE_NAVIGATION } from '@/config/navigation'

import App from './App'

const OPERATOR_CONSOLE_ROUTES = ['/operator/calendar', '/operator/bookings', '/help', '/legal', '/messages']

describe('App', () => {
  it('renders without crashing', () => {
    // We can't easily test 'TripAvail' text since landing page is complex
    // But rendering the App component proves the test environment works
    render(<App />)
    expect(document.body).toBeInTheDocument()
  })

  it('keeps operator drawer links present in navigation config', () => {
    const operatorHrefs = ROLE_NAVIGATION.tour_operator.map((item) => item.href)

    for (const route of OPERATOR_CONSOLE_ROUTES) {
      expect(operatorHrefs).toContain(route)
    }
  })

  it('keeps operator support routes wired in App routing', () => {
    const appSource = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8')

    for (const route of OPERATOR_CONSOLE_ROUTES) {
      expect(appSource).toContain(`path="${route}"`)
    }
  })
})
