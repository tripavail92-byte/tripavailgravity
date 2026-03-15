import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const from = vi.fn()
  const rpc = vi.fn()
  return {
    from,
    rpc,
    supabase: { from, rpc },
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: mocks.supabase,
}))

import { normalizeTourSchedules, tourService } from './tourService'

function makeToursChain(returnId = 'tour-1') {
  const chain: any = {}
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.select = vi.fn(() => chain)
  chain.single = vi.fn(async () => ({ data: { id: returnId }, error: null }))
  return chain
}

describe('tour schedule sync', () => {
  beforeEach(() => {
    mocks.from.mockReset()
    mocks.rpc.mockReset()
  })

  it('normalizes date/time schedules into start/end timestamps', () => {
    const rows = normalizeTourSchedules(
      [{ date: '2030-07-18', time: '10:30', capacity: 22 }],
      10,
      4,
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]?.capacity).toBe(22)
    expect(rows[0]?.status).toBe('scheduled')
    expect(typeof rows[0]?.start_time).toBe('string')
    expect(typeof rows[0]?.end_time).toBe('string')
    const startMs = new Date(rows[0]!.start_time).getTime()
    const endMs = new Date(rows[0]!.end_time).getTime()
    expect(endMs - startMs).toBe(3 * 24 * 60 * 60 * 1000)
  })

  it('syncs schedules via rpc when saving a draft', async () => {
    const toursChain = makeToursChain('tour-abc')
    mocks.from.mockImplementation((table: string) => {
      if (table === 'tours') return toursChain
      throw new Error(`Unexpected table: ${table}`)
    })
    mocks.rpc.mockResolvedValue({ error: null })

    const result = await tourService.saveWorkflowDraft(
      {
        title: 'My Tour',
        duration_days: 3,
        schedules: [{ date: '2030-08-12', time: '09:00', capacity: 18 }],
        max_participants: 18,
      },
      'operator-1',
    )

    expect(result.success).toBe(true)
    expect(result.tourId).toBe('tour-abc')
    expect(mocks.rpc).toHaveBeenCalledTimes(1)

    const [fnName, payload] = mocks.rpc.mock.calls[0]
    expect(fnName).toBe('sync_tour_schedules_from_json')
    expect(payload.p_tour_id).toBe('tour-abc')
    expect(payload.p_default_capacity).toBe(18)
    expect(Array.isArray(payload.p_schedules)).toBe(true)
    expect(payload.p_schedules[0].capacity).toBe(18)
    const startMs = new Date(payload.p_schedules[0].start_time).getTime()
    const endMs = new Date(payload.p_schedules[0].end_time).getTime()
    expect(endMs - startMs).toBe(2 * 24 * 60 * 60 * 1000)
  })
})
