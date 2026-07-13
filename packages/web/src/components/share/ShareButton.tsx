import { Check, Copy, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
  /** Relative ("/tours/xyz") or absolute URL of the listing to share. */
  url: string
  /** Listing name — used as the share title/text. */
  title: string
  /** Optional longer share text; defaults to the title. */
  text?: string
  /** 'button' = labelled pill (detail pages); 'icon' = compact icon (cards). */
  variant?: 'button' | 'icon'
  className?: string
}

/* Brand glyphs (inline so we don't depend on removed lucide brand icons). */
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#25D366" aria-hidden="true">
      <path d="M17.47 14.38c-.29-.15-1.7-.84-1.96-.93-.26-.1-.45-.15-.64.15-.19.29-.74.93-.9 1.12-.17.19-.33.22-.62.07-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.33.44-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36s-1 .98-1 2.38 1.03 2.76 1.17 2.95c.15.19 2.03 3.1 4.92 4.35.69.3 1.22.48 1.64.61.69.22 1.32.19 1.81.12.55-.08 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.44 9.44 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.46-9.44 2.53 0 4.9.99 6.68 2.78a9.38 9.38 0 0 1 2.77 6.67c0 5.2-4.24 9.45-9.45 9.45zM20.36 3.61A11.36 11.36 0 0 0 12.05.25C5.79.25.7 5.34.69 11.6c0 2 .53 3.95 1.53 5.67L.6 23.25l6.12-1.6a11.34 11.34 0 0 0 5.32 1.35h.01c6.26 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.02z"/>
    </svg>
  )
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/>
    </svg>
  )
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#E4405F" aria-hidden="true">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.12 1.38C1.36 2.67.95 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.72 1.47 1.38 2.13.66.66 1.33 1.07 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.8-.31 1.47-.72 2.13-1.38.66-.66 1.07-1.33 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.12A5.88 5.88 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.4-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"/>
    </svg>
  )
}

/**
 * Share a listing. On phones the main button uses the native share sheet (WhatsApp / Instagram /
 * Facebook / Messages all appear); on desktop (or as explicit choices everywhere) the menu offers
 * WhatsApp, Facebook, Instagram (copies the link — Instagram has no web-share URL) and Copy link.
 */
export function ShareButton({ url, title, text, variant = 'button', className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tripavail.com'
  const shareUrl = /^https?:\/\//.test(url) ? url : `${origin}${url.startsWith('/') ? '' : '/'}${url}`
  const shareText = text || title
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedMsg = encodeURIComponent(`${shareText} ${shareUrl}`)
  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const openPopup = (href: string) =>
    window.open(href, '_blank', 'noopener,noreferrer,width=600,height=640')

  const copyLink = async (instagram = false) => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      toast.success(
        instagram ? 'Link copied — paste it in your Instagram story or bio' : 'Link copied',
      )
    } catch {
      toast.error('Could not copy link')
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: shareText, url: shareUrl })
    } catch {
      /* user dismissed the sheet — no-op */
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <button
            type="button"
            aria-label={`Share ${title}`}
            onClick={(e) => {
              // Cards wrap the whole thing in a link — don't navigate when opening the menu.
              e.preventDefault()
              e.stopPropagation()
            }}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-white dark:bg-black/40 dark:text-white dark:hover:bg-black/60',
              className,
            )}
          >
            <Share2 className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <Button variant="outline" className={cn('gap-2 rounded-full', className)}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Share this</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2.5" onClick={() => openPopup(`https://wa.me/?text=${encodedMsg}`)}>
          <WhatsAppIcon />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2.5"
          onClick={() => openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
        >
          <FacebookIcon />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2.5" onClick={() => copyLink(true)}>
          <InstagramIcon />
          Instagram
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2.5" onClick={() => copyLink(false)}>
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          Copy link
        </DropdownMenuItem>
        {hasNativeShare && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2.5" onClick={nativeShare}>
              <Share2 className="h-4 w-4" />
              More options…
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
