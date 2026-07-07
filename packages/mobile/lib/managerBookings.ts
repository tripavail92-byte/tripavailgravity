import { supabase } from '@/lib/supabase'

/**
 * Hotel-manager package bookings — mirrors web bookingService.getOwnerBookings.
 * RLS scopes package_bookings to the package owner; we filter via the embedded
 * packages!inner join on owner_id (same pattern as lib/operator.ts).
 */

export interface ManagerBooking {
  id: string
  status: string | null
  total_price: number
  guest_count: number | null
  check_in_date: string | null
  check_out_date: string | null
  booking_date: string | null
  payment_status: string | null
  currency: string
  packageName: string
}

export async function fetchManagerBookings(ownerId: string): Promise<ManagerBooking[]> {
  const { data, error } = await supabase
    .from('package_bookings')
    .select(
      'id,status,total_price,guest_count,check_in_date,check_out_date,booking_date,payment_status,package:packages!inner(name,owner_id,currency)',
    )
    .eq('package.owner_id', ownerId)
    .order('booking_date', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((b: any) => {
    const pkg = Array.isArray(b.package) ? b.package[0] : b.package
    return {
      id: b.id,
      status: b.status,
      total_price: Number(b.total_price) || 0,
      guest_count: b.guest_count ?? null,
      check_in_date: b.check_in_date ?? null,
      check_out_date: b.check_out_date ?? null,
      booking_date: b.booking_date ?? null,
      payment_status: b.payment_status ?? null,
      currency: pkg?.currency || 'PKR',
      packageName: pkg?.name || 'Package booking',
    }
  })
}
