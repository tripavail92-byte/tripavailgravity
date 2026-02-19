// Thin typed wrapper around the Resend REST API.
// No SDK — keeps the Edge Function dependency-free.

export interface ResendEmail {
  from: string
  to: string
  subject: string
  html: string
  reply_to?: string
}

export interface ResendResponse {
  id: string
}

export async function sendEmail(
  apiKey: string,
  email: ResendEmail,
): Promise<ResendResponse> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(email),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<ResendResponse>
}
