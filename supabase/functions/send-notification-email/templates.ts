// Email HTML templates for every notification type.
// All templates share a single base layout for consistency.
// Keep plain, readable HTML — avoids spam filter issues with complex CSS.

interface EmailTemplate {
  subject: string
  html: string
}

// ─── Base layout ────────────────────────────────────────────────────────────

function base(title: string, preheader: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <!-- Preheader (hidden preview text in inbox) -->
  <div style="display:none;max-height:0;overflow:hidden;color:#f4f4f5;">${escape(preheader)}&nbsp;&zwnj;&nbsp;</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">TripAvail</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              © ${new Date().getFullYear()} TripAvail &middot; This email was sent because your account status changed.<br/>
              If you believe this was a mistake, please contact <a href="mailto:support@tripavail.com" style="color:#6366f1;">support@tripavail.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function escape(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ─── Shared UI primitives ────────────────────────────────────────────────────

function badge(color: string, text: string): string {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${color};font-size:12px;font-weight:600;letter-spacing:0.5px;">${text}</span>`
}

function heading(text: string): string {
  return `<h1 style="margin:16px 0 8px;font-size:24px;font-weight:700;color:#111827;">${escape(text)}</h1>`
}

function bodyText(text: string): string {
  return `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">${escape(text)}</p>`
}

function ctaButton(href: string, label: string, color = '#6366f1'): string {
  return `<a href="${href}" style="display:inline-block;padding:12px 28px;background:${color};color:#ffffff;font-weight:600;font-size:15px;border-radius:8px;text-decoration:none;">${escape(label)}</a>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>`
}

// ─── Templates ──────────────────────────────────────────────────────────────

export function renderAccountSuspended(title: string, body: string): EmailTemplate {
  return {
    subject: `⚠️ Your TripAvail account has been suspended`,
    html: base(title, 'Your partner account has been temporarily suspended.', `
      <div style="text-align:center;margin-bottom:24px;">
        ${badge('#fef3c7', '⚠️ Account Suspended')}
        ${heading('Your account has been suspended')}
      </div>
      ${bodyText(body)}
      ${divider()}
      <p style="font-size:14px;color:#6b7280;margin:0 0 16px;">
        While suspended, your listings are hidden from travellers and you cannot create new content.
        If you believe this is an error, please appeal below.
      </p>
      <div style="text-align:center;">
        ${ctaButton('https://tripavail.com/partner/appeal', 'Appeal This Decision', '#dc2626')}
      </div>
    `),
  }
}

export function renderAccountReinstated(title: string, body: string): EmailTemplate {
  return {
    subject: `✅ Your TripAvail account has been reinstated`,
    html: base(title, 'Your partner account is active again.', `
      <div style="text-align:center;margin-bottom:24px;">
        ${badge('#d1fae5', '✅ Account Active')}
        ${heading('Your account has been reinstated')}
      </div>
      ${bodyText(body)}
      ${divider()}
      <p style="font-size:14px;color:#6b7280;margin:0 0 16px;">
        You can now log in and re-publish your listings. Previously suspended listings require manual re-publication.
      </p>
      <div style="text-align:center;">
        ${ctaButton('https://tripavail.com/partner/dashboard', 'Go to Dashboard', '#10b981')}
      </div>
    `),
  }
}

export function renderVerificationApproved(title: string, body: string): EmailTemplate {
  return {
    subject: `🎉 Your TripAvail partner verification is approved`,
    html: base(title, 'Welcome to TripAvail Partners!', `
      <div style="text-align:center;margin-bottom:24px;">
        ${badge('#d1fae5', '🎉 Verified Partner')}
        ${heading('Verification approved!')}
      </div>
      ${bodyText(body || 'Your partner application has been reviewed and approved. You can now create and publish listings.')}
      ${divider()}
      <div style="text-align:center;">
        ${ctaButton('https://tripavail.com/partner/dashboard', 'Start Creating Listings', '#6366f1')}
      </div>
    `),
  }
}

export function renderVerificationRejected(title: string, body: string): EmailTemplate {
  return {
    subject: `❌ Your TripAvail partner verification was not approved`,
    html: base(title, 'Your partner application decision is ready.', `
      <div style="text-align:center;margin-bottom:24px;">
        ${badge('#fee2e2', '❌ Not Approved')}
        ${heading('Verification not approved')}
      </div>
      ${bodyText(body || 'Your partner application was reviewed but could not be approved at this time.')}
      ${divider()}
      <p style="font-size:14px;color:#6b7280;margin:0 0 16px;">
        You may reapply after addressing the feedback above. Our team is happy to help if you have questions.
      </p>
      <div style="text-align:center;">
        ${ctaButton('mailto:support@tripavail.com', 'Contact Support', '#6b7280')}
      </div>
    `),
  }
}

export function renderVerificationInfoRequested(title: string, body: string): EmailTemplate {
  return {
    subject: `📋 Action required: TripAvail needs more information`,
    html: base(title, 'Please provide additional information to complete your verification.', `
      <div style="text-align:center;margin-bottom:24px;">
        ${badge('#e0e7ff', '📋 Action Required')}
        ${heading('We need a bit more information')}
      </div>
      ${bodyText(body || 'Our team needs additional information to complete your verification. Please log in and submit the requested documents.')}
      ${divider()}
      <div style="text-align:center;">
        ${ctaButton('https://tripavail.com/partner/verification', 'Submit Information', '#6366f1')}
      </div>
    `),
  }
}

export function renderAccountStatusChanged(title: string, body: string): EmailTemplate {
  return {
    subject: `📢 TripAvail account update`,
    html: base(title, 'Your account status has been updated.', `
      <div style="text-align:center;margin-bottom:24px;">
        ${badge('#f3f4f6', '📢 Account Update')}
        ${heading(title)}
      </div>
      ${bodyText(body || 'Your account status has been updated. Please log in to view the details.')}
      ${divider()}
      <div style="text-align:center;">
        ${ctaButton('https://tripavail.com/partner/dashboard', 'View Dashboard', '#6366f1')}
      </div>
    `),
  }
}
