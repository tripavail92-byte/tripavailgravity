import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { isSurfaceEnabled } from '@tripavail/shared/config/launchScope'
import { lazy, Suspense, useEffect } from 'react'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

// LAUNCH SCOPE — hotel/packages/events routes redirect into Tours until their
// surface flips on (Phase 2 = events, Phase 3 = hotels). Kept as route-level
// redirects (not deletions) so old links/bookmarks/deep-links never 404 into a
// gated vertical, and the pages come back by flipping the flag.
const HOTELS_ON = isSurfaceEnabled('hotels')
const EVENTS_ON = isSurfaceEnabled('events')

import { AdminGuard } from '@/components/auth/AdminGuard'
import { DashboardRedirect } from '@/components/auth/DashboardRedirect'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { TourManager } from '@/components/tour/TourManager'
import { SignInPrompt } from '@/components/auth/SignInPrompt'
import { useAuth } from '@/hooks/useAuth'
// Eager load critical components
import AdminLayout from '@/layouts/AdminLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import TravellerLayout from '@/layouts/TravellerLayout'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { useAppVersionWatcher } from '@/lib/useAppVersionWatcher'
import LoginPage from '@/pages/auth/LoginPage'
import LandingPage from '@/pages/LandingPage'

// Lazy load all other pages
const PartnerSelectionPage = lazy(() => import('@/pages/partner/PartnerSelectionPage'))
const HotelDetailsPage = lazy(() => import('@/pages/traveller/HotelDetailsPage'))
const MixedCollectionPage = lazy(() => import('@/pages/traveller/MixedCollectionPage'))
const SearchPage = lazy(() => import('@/pages/traveller/SearchPage'))
const ListHotelPage = lazy(() => import('@/pages/manager/ListHotelPage'))
const ListPackagePage = lazy(() => import('@/pages/manager/ListPackagePage'))
const DashboardPage = lazy(() => import('@/pages/hotel-manager/DashboardPage'))
const HotelManagerBookingsPage = lazy(
  () => import('@/pages/hotel-manager/HotelManagerBookingsPage'),
)
const HotelManagerCalendarPage = lazy(
  () => import('@/pages/hotel-manager/HotelManagerCalendarPage'),
)
const OperatorDashboardPage = lazy(() => import('@/pages/tour-operator/OperatorDashboardPage'))
const OperatorCalendarPage = lazy(() => import('@/pages/tour-operator/OperatorCalendarPage'))
const OperatorBookingsPage = lazy(() => import('@/pages/tour-operator/OperatorBookingsPage'))
const OperatorCommercialPage = lazy(() => import('@/pages/tour-operator/OperatorCommercialPage'))
const TourOperatorSetupPage = lazy(
  () => import('@/pages/tour-operator/setup/TourOperatorSetupPage'),
)
const HotelManagerSetupPage = lazy(
  () => import('@/pages/hotel-manager/setup/HotelManagerSetupPage'),
)
const CreateTourPage = lazy(() => import('@/pages/tour-operator/tours/create/CreateTourPage'))
const TourDetailsPage = lazy(() => import('@/pages/traveller/TourDetailsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const TourCheckoutPage = lazy(() => import('@/pages/checkout/TourCheckoutPage'))
const BookingConfirmationPage = lazy(() => import('@/pages/checkout/BookingConfirmationPage'))
const PackageBookingConfirmationPage = lazy(
  () => import('@/pages/checkout/PackageBookingConfirmationPage'),
)
const PackageDetailsPage = lazy(() => import('@/pages/traveller/PackageDetailsPage'))
const PackageCheckoutPage = lazy(() => import('@/pages/checkout/PackageCheckoutPage'))
const Homepage = lazy(() => import('@/pages/traveller/Homepage'))
const HotelsPage = lazy(() => import('@/pages/traveller/HotelsPage'))
const ToursPage = lazy(() => import('@/pages/traveller/ToursPage'))
const EventsPage = lazy(() => import('@/pages/traveller/EventsPage'))
const PackageCategoryPage = lazy(() => import('@/pages/traveller/PackageCategoryPage'))
const TourCategoryPage = lazy(() => import('@/pages/traveller/TourCategoryPage'))
const TourCollectionPage = lazy(() => import('@/pages/traveller/TourCollectionPage'))
const TravellerProfilePage = lazy(() => import('@/pages/traveller/TravellerProfilePage'))
const AccountSettingsPage = lazy(() => import('@/pages/traveller/AccountSettingsPage'))
const WishlistPage = lazy(() => import('@/pages/traveller/WishlistPage'))
const MyTripsPage = lazy(() => import('@/pages/traveller/MyTripsPage'))
const TravelerBookingDetailPage = lazy(() => import('@/pages/traveller/TravelerBookingDetailPage'))
const TravelerDashboardPage = lazy(() => import('@/pages/traveller/TravelerDashboardPage'))
const PaymentMethodsPage = lazy(() => import('@/pages/traveller/PaymentMethodsPage'))
const HotelManagerSettingsPage = lazy(
  () => import('@/pages/hotel-manager/HotelManagerSettingsPage'),
)
const TourOperatorSettingsPage = lazy(
  () => import('@/pages/tour-operator/TourOperatorSettingsPage'),
)
const OperatorReviewsPage = lazy(() => import('@/pages/tour-operator/OperatorReviewsPage'))
const OperatorReputationPage = lazy(() => import('@/pages/tour-operator/OperatorReputationPage'))
const OperatorStorefrontAnalyticsPage = lazy(
  () => import('@/pages/tour-operator/OperatorStorefrontAnalyticsPage'),
)
const OperatorProfilePage = lazy(() => import('@/pages/traveller/OperatorProfilePage'))
const VerificationStatusPage = lazy(() => import('@/pages/shared/VerificationStatusPage'))
const HelpSupportHubPage = lazy(() => import('@/pages/shared/HelpSupportHubPage'))
const LegalPoliciesHubPage = lazy(() => import('@/pages/shared/LegalPoliciesHubPage'))
const MessagesInboxPage = lazy(() => import('@/pages/shared/MessagesInboxPage'))
const MessageThreadPage = lazy(() => import('@/pages/shared/MessageThreadPage'))
const MobileKYCPage = lazy(() => import('@/pages/shared/verification/MobileKYCPage'))

// Admin (Phase 2 skeleton)
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminPartnersPage = lazy(() => import('@/pages/admin/AdminPartnersPage'))
const AdminListingsPage = lazy(() => import('@/pages/admin/AdminListingsPage'))
const AdminBookingsPage = lazy(() => import('@/pages/admin/AdminBookingsPage'))
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'))
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/AdminAuditLogsPage'))
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'))
const AdminKYCPage = lazy(() => import('@/pages/admin/AdminKYCPage'))
const AdminCommercialPage = lazy(() => import('@/pages/admin/AdminCommercialPage'))

// Legal (public)
const TermsPage = lazy(() => import('@/pages/legal/TermsPage'))
const PrivacyPage = lazy(() => import('@/pages/legal/PrivacyPage'))
const RefundsPage = lazy(() => import('@/pages/legal/RefundsPage'))
const ContactPage = lazy(() => import('@/pages/legal/ContactPage'))

// Loading component
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

/**
 * Placed INSIDE <BrowserRouter> so it can use useNavigate.
 * Redirects admin users to /admin/dashboard immediately, no matter
 * which page they land on (e.g. opening "/" directly).
 */
function AdminRedirector() {
  const { activeRole, initialized } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!initialized) return
    if (activeRole?.role_type === 'admin' && !location.pathname.startsWith('/admin')) {
      console.log('[AdminRedirector] Admin detected, redirecting to /admin/dashboard')
      navigate('/admin/dashboard', { replace: true })
    }
  }, [activeRole, initialized, navigate, location.pathname])

  return null
}

function OperatorPublicPreviewRedirect() {
  const { user, initialized } = useAuth()
  const [target, setTarget] = useState<string | null>(null)

  useEffect(() => {
    if (!initialized) return

    let cancelled = false

    const load = async () => {
      if (!user?.id) {
        if (!cancelled) setTarget('/auth')
        return
      }

      try {
        const { data, error } = await supabase
          .from('tour_operator_profiles')
          .select('slug')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        const slug = typeof data?.slug === 'string' ? data.slug.trim() : ''
        if (!cancelled) {
          setTarget(slug ? `/operators/${slug}` : '/operator/dashboard')
        }
      } catch (error) {
        console.error('[OperatorPublicPreviewRedirect] Failed to resolve slug', error)
        if (!cancelled) setTarget('/operator/dashboard')
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [initialized, user?.id])

  if (!initialized || !target) {
    return <PageLoader />
  }

  return <Navigate to={target} replace />
}

function App() {
  const { initialize, initialized, activeRole } = useAuth()

  // Prompt a one-click refresh when a newer build is deployed while this tab is open.
  useAppVersionWatcher()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Apply role-based theme
  useEffect(() => {
    if (activeRole?.role_type) {
      document.documentElement.setAttribute(
        'data-role',
        activeRole.role_type === 'admin' ? 'traveller' : activeRole.role_type,
      )
    } else {
      // Default to traveller if no role or not logged in
      document.documentElement.setAttribute('data-role', 'traveller')
    }
  }, [activeRole])

  if (!initialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {/* Global admin redirect — must be inside BrowserRouter */}
        <AdminRedirector />
        <Toaster position="top-center" />
        <TourManager />
        {/* Soft sign-in prompt for logged-out visitors — captures the login early, dismissible. */}
        <SignInPrompt />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/auth" element={<LoginPage />} />
            {/* Public mobile KYC capture page — no auth required, session_token is the credential */}
            <Route path="/kyc/mobile" element={<MobileKYCPage />} />

            {/* Traveller Routes (Teal Theme) */}
            <Route element={<TravellerLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/hotels"
                element={HOTELS_ON ? <HotelsPage /> : <Navigate to="/tours" replace />}
              />
              <Route path="/tours" element={<ToursPage />} />
              <Route
                path="/events"
                element={EVENTS_ON ? <EventsPage /> : <Navigate to="/tours" replace />}
              />
              <Route
                path="/dashboard/overview"
                element={
                  <AuthGuard>
                    <TravelerDashboardPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/payment-methods"
                element={
                  <AuthGuard>
                    <PaymentMethodsPage />
                  </AuthGuard>
                }
              />
              {/* Launch scope: /explore (Homepage) is a hotel+package discovery
                  surface. Until Phase 3 the trips-only LandingPage is the home, so
                  send /explore there rather than render package rails that dead-end. */}
              <Route
                path="/explore"
                element={HOTELS_ON ? <Homepage /> : <Navigate to="/" replace />}
              />
              {/* Hotel Packages Categories */}
              <Route
                path="/explore/hotel-packages/:kind"
                element={HOTELS_ON ? <PackageCategoryPage /> : <Navigate to="/tours" replace />}
              />
              {/* Back-compat: old path, still shows hotel packages */}
              <Route
                path="/explore/packages/:kind"
                element={HOTELS_ON ? <PackageCategoryPage /> : <Navigate to="/tours" replace />}
              />

              {/* Tours Categories */}
              <Route path="/explore/tours/categories/:category" element={<TourCategoryPage />} />
              {/* Tours Collections (region/collection pages) */}
              <Route
                path="/explore/tours/collections/:collection"
                element={<TourCollectionPage />}
              />
              {/* Back-compat: old path treated as a collection */}
              <Route path="/explore/tours/:collection" element={<TourCollectionPage />} />
              <Route
                path="/packages/:id"
                element={HOTELS_ON ? <PackageDetailsPage /> : <Navigate to="/tours" replace />}
              />
              <Route
                path="/stays/:id"
                element={HOTELS_ON ? <PackageDetailsPage /> : <Navigate to="/tours" replace />}
              />
              {/* Full-grid "View All" for the home mixed rows: /collections/new, /collections/top-rated */}
              <Route path="/collections/:kind" element={<MixedCollectionPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route
                path="/hotel/:id"
                element={HOTELS_ON ? <HotelDetailsPage /> : <Navigate to="/tours" replace />}
              />
              <Route path="/tours/:id" element={<TourDetailsPage />} />
              {/* Public operator storefront */}
              <Route path="/operators/:slug" element={<OperatorProfilePage />} />
              <Route path="/checkout/tour/:id" element={<TourCheckoutPage />} />
              <Route
                path="/checkout/package/:id"
                element={HOTELS_ON ? <PackageCheckoutPage /> : <Navigate to="/tours" replace />}
              />
              <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
              <Route
                path="/booking/package/confirmation"
                element={
                  HOTELS_ON ? <PackageBookingConfirmationPage /> : <Navigate to="/" replace />
                }
              />

              {/* Profile & Settings — private: any signed-in user, redirect logged-out to /auth. */}
              <Route
                path="/profile"
                element={
                  <AuthGuard>
                    <TravellerProfilePage />
                  </AuthGuard>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <AuthGuard>
                    <WishlistPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/trips"
                element={
                  <AuthGuard>
                    <MyTripsPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/trips/:bookingId"
                element={
                  <AuthGuard>
                    <TravelerBookingDetailPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/settings"
                element={
                  <AuthGuard>
                    <AccountSettingsPage />
                  </AuthGuard>
                }
              />

              {/* Legal */}
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/refunds" element={<RefundsPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            {/* Authenticated Routes with Drawer (Purple Theme) */}
            <Route element={<DashboardLayout />}>
              {/* /search is registered under TravellerLayout above; with identical paths
              React Router only ever matches the first, so this copy was unreachable. */}
              <Route
                path="/hotels/:id"
                element={HOTELS_ON ? <HotelDetailsPage /> : <Navigate to="/tours" replace />}
              />
              <Route path="/partner/onboarding" element={<PartnerSelectionPage />} />

              {/* Hotel-manager back office. Launch scope: gated to Phase 3 so it
                  matches mobile (app/manager/_layout.tsx redirects the whole group)
                  — a legacy hotel_manager is bounced home until hotels return.
                  Kept intact behind the flag; RoleGuard still guards the role. */}
              <Route
                path="/manager/dashboard"
                element={
                  HOTELS_ON ? (
                    <RoleGuard allowedRoles={['hotel_manager']}>
                      <DashboardPage />
                    </RoleGuard>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              <Route
                path="/manager/bookings"
                element={
                  HOTELS_ON ? (
                    <RoleGuard allowedRoles={['hotel_manager']}>
                      <HotelManagerBookingsPage />
                    </RoleGuard>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              <Route
                path="/manager/calendar"
                element={
                  HOTELS_ON ? (
                    <RoleGuard allowedRoles={['hotel_manager']}>
                      <HotelManagerCalendarPage />
                    </RoleGuard>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              <Route
                path="/operator/dashboard"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <OperatorDashboardPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/operator/calendar"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <OperatorCalendarPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/operator/bookings"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <OperatorBookingsPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/operator/commercial"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <OperatorCommercialPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/operator/tours/new"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <CreateTourPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/operator/tours/edit/:id"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <CreateTourPage />
                  </RoleGuard>
                }
              />

              {/* Hotel Manager Settings — launch-scope gated (see back office above) */}
              <Route
                path="/manager/settings"
                element={
                  HOTELS_ON ? (
                    <RoleGuard allowedRoles={['hotel_manager']}>
                      <HotelManagerSettingsPage />
                    </RoleGuard>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              <Route
                path="/messages"
                element={
                  <RoleGuard allowedRoles={['tour_operator', 'hotel_manager', 'traveller']}>
                    <MessagesInboxPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/messages/:conversationId"
                element={
                  <RoleGuard allowedRoles={['tour_operator', 'hotel_manager', 'traveller']}>
                    <MessageThreadPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/help"
                element={
                  <RoleGuard allowedRoles={['tour_operator', 'hotel_manager', 'traveller']}>
                    <HelpSupportHubPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/legal"
                element={
                  <RoleGuard allowedRoles={['tour_operator', 'hotel_manager', 'traveller']}>
                    <LegalPoliciesHubPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/operator/settings"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <TourOperatorSettingsPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/operator-dashboard/business-profile"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <TourOperatorSettingsPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/operator-dashboard/fleet"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <TourOperatorSettingsPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/operator/reviews"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <OperatorReviewsPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/operator/reputation"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <OperatorReputationPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/operator/analytics"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <OperatorStorefrontAnalyticsPage />
                  </RoleGuard>
                }
              />

              <Route
                path="/manager/verification"
                element={
                  HOTELS_ON ? (
                    <RoleGuard allowedRoles={['hotel_manager']}>
                      <VerificationStatusPage />
                    </RoleGuard>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              <Route
                path="/operator/verification"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <Navigate to="/operator-dashboard/verification" replace />
                  </RoleGuard>
                }
              />

              <Route
                path="/operator-dashboard/verification"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <VerificationStatusPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/operator-dashboard/public-preview"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <OperatorPublicPreviewRedirect />
                  </RoleGuard>
                }
              />
              <Route
                path="/operator/public-profile"
                element={
                  <RoleGuard allowedRoles={['tour_operator']}>
                    <OperatorPublicPreviewRedirect />
                  </RoleGuard>
                }
              />

              <Route path="/dashboard" element={<DashboardRedirect />} />
            </Route>

            {/* Admin Routes (Phase 2 skeleton) */}
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="partners" element={<AdminPartnersPage />} />
              <Route path="kyc" element={<AdminKYCPage />} />
              <Route path="listings" element={<AdminListingsPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="commercial" element={<AdminCommercialPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Full Screen Flows — hotel supply creation. RoleGuard-gated to
                hotel_manager (a role no one can acquire in the trips-only
                launch), plus a launch-scope redirect as defense-in-depth so
                even a legacy hotel_manager can't open these until Phase 3. */}
            <Route
              path="/manager/list-hotel"
              element={
                HOTELS_ON ? (
                  <RoleGuard allowedRoles={['hotel_manager']}>
                    <ListHotelPage />
                  </RoleGuard>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/manager/list-package"
              element={
                HOTELS_ON ? (
                  <RoleGuard allowedRoles={['hotel_manager']}>
                    <ListPackagePage />
                  </RoleGuard>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/manager/setup"
              element={
                HOTELS_ON ? (
                  <RoleGuard allowedRoles={['hotel_manager']}>
                    <HotelManagerSetupPage />
                  </RoleGuard>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/operator/setup"
              element={
                <RoleGuard allowedRoles={['tour_operator']}>
                  <TourOperatorSetupPage />
                </RoleGuard>
              }
            />

            {/* Fallback — a real 404, not a silent redirect to home. */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        {/* React Query Devtools - Development Only */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
