import { Eye, EyeOff, ExternalLink, Lock, Mail, SendHorizontal } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

const PLATFORM_LINKS = [
  {
    label: 'Supabase Studio',
    href: 'https://supabase.com/dashboard/project/zkhppxjeaizpyinfpecj',
    hint: 'Database · Auth · Storage · Edge Functions',
  },
  {
    label: 'Stripe Dashboard',
    href: 'https://dashboard.stripe.com',
    hint: 'Payments · Payouts · Disputes',
  },
]

export default function AdminSettingsPage() {
  const { user } = useAuth()

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastBody, setBroadcastBody] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [lastBroadcastCount, setLastBroadcastCount] = useState<number | null>(null)

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update password')
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleBroadcast() {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      toast.error('Title and message are required')
      return
    }
    setBroadcasting(true)
    try {
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
      if (fetchError) throw fetchError

      const userIds = (profiles ?? []).map((p: any) => p.id as string)
      if (!userIds.length) {
        toast.error('No users found')
        return
      }

      const notifications = userIds.map((userId) => ({
        user_id: userId,
        type: 'platform_announcement',
        title: broadcastTitle.trim(),
        body: broadcastBody.trim(),
        read: false,
        metadata: { broadcast: true, sent_by_admin: user?.id },
      }))

      const { error: insertError } = await supabase.from('notifications').insert(notifications)
      if (insertError) throw insertError

      setLastBroadcastCount(userIds.length)
      toast.success(`Notification sent to ${userIds.length} users`)
      setBroadcastTitle('')
      setBroadcastBody('')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send broadcast')
    } finally {
      setBroadcasting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform administration and account settings
        </p>
      </div>

      {/* Admin Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Admin Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Signed in as</Label>
            <p className="text-sm font-medium">{user?.email ?? '—'}</p>
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4" /> Change Password
            </p>
            <div className="grid gap-3 max-w-sm">
              <div className="space-y-1">
                <Label htmlFor="new-pw" className="text-xs">
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="new-pw"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm-pw" className="text-xs">
                  Confirm password
                </Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>
              <Button
                size="sm"
                disabled={changingPassword || !newPassword || !confirmPassword}
                onClick={handleChangePassword}
                className="w-fit"
              >
                {changingPassword ? 'Updating…' : 'Update password'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Broadcast Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SendHorizontal className="h-4 w-4" />
            Broadcast Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send an in-app notification to every registered user.
            {lastBroadcastCount !== null && (
              <span className="ml-2 font-medium text-emerald-600">
                Last broadcast reached {lastBroadcastCount} users.
              </span>
            )}
          </p>
          <div className="space-y-3 max-w-lg">
            <div className="space-y-1">
              <Label htmlFor="bc-title" className="text-xs">
                Title
              </Label>
              <Input
                id="bc-title"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Scheduled maintenance on April 5th"
                maxLength={120}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bc-body" className="text-xs">
                Message
              </Label>
              <Textarea
                id="bc-body"
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="Full notification body…"
                rows={3}
                maxLength={500}
              />
            </div>
            <Button
              size="sm"
              disabled={broadcasting || !broadcastTitle.trim() || !broadcastBody.trim()}
              onClick={handleBroadcast}
              className="w-fit gap-2"
            >
              <SendHorizontal className="h-4 w-4" />
              {broadcasting ? 'Sending…' : 'Send to all users'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platform Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ExternalLink className="h-4 w-4" />
            Platform Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {PLATFORM_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.hint}</p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
