# WhatsApp OTP Template Setup (TripAvail)

The Supabase edge function `send-whatsapp-otp` sends a WhatsApp **template** message.

## Required template

- **Template name:** `tripavail_otp`
- **Category:** AUTHENTICATION
- **Language:** `en_US`
- **Variables:** one variable in the body (`{{1}}`) for the OTP code

Example body text (keep it simple):

- `Your TripAvail verification code is {{1}}. It expires in 10 minutes.`

Note: Meta may reject templates where a variable is effectively at the very start/end.
Including a short suffix after `{{1}}` avoids that validator.

## Backend config

These env vars are optional overrides:

- `WHATSAPP_OTP_TEMPLATE_NAME` (default: `tripavail_otp`)
- `WHATSAPP_OTP_TEMPLATE_LANG` (default: `en_US`)

If you see:

- `(#132001) Template name does not exist in the translation`

…it almost always means the template **doesn’t exist** in the same WABA, or it exists but with a **different language code**.

## If WhatsApp Manager says you have no permission to create templates

The error typically means the Meta user/system-user you’re using does not have the right Business/WABA permissions.

Common fixes:

- Ensure you’re a **Business Admin** (not just an employee) in the Business Portfolio that owns the WhatsApp Business Account.
- In Business Settings → **Accounts → WhatsApp accounts**: make sure your user (or System User) is added and has permissions for that WABA.
- If creating templates via API, ensure the access token has the right scopes:
  - Sending messages: `whatsapp_business_messaging`
  - Managing templates/assets: `whatsapp_business_management` (often also `business_management`)

Once the template shows as **APPROVED/Active** in WhatsApp Manager, OTP sending should start delivering.

## Common hard blocker: WABA cannot create AUTHENTICATION templates

In our live diagnostics, any template that looks like an OTP/code flow and is created as `UTILITY` gets immediately rejected with:

- `rejected_reason: INCORRECT_CATEGORY`

And attempts to create an `AUTHENTICATION` template can fail with:

- `Cannot create message template` / `This WhatsApp Business account does not have permission to create message template`

If you hit this combination, it means the WhatsApp Business Account itself likely isn’t eligible for AUTHENTICATION templates yet.
Typical prerequisites are managed on the Meta side (business verification / account status / feature availability).

Practical next steps:

- In WhatsApp Manager, confirm you are creating templates under the *same WhatsApp Business Account that owns the phone number ID used by the API*.
- Ensure the business portfolio and WABA are fully set up/verified as required by Meta for authentication templates.
- After eligibility is enabled, create the `AUTHENTICATION` template and re-test `send-whatsapp-otp`.

## Diagnostics (admin-only)

This repo includes admin-only Supabase edge functions to inspect/create templates using the same WhatsApp token stored in Supabase secrets:

- `wa-list-templates` — lists templates in the configured WABA
- `wa-create-template` — attempts to create templates (useful for quickly validating Meta’s validator/rejection reasons)

Both require a Supabase secret `WA_DIAG_KEY` and the request header `x-wa-diag-key: <value>`.
They are intended for ops/debug only.
