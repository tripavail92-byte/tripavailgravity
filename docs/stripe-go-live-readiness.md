# Stripe go-live readiness (to reduce shutdown risk)

This is a practical checklist for lowering risk of Stripe account restrictions/closures.
It is not legal advice.

## 1) Website disclosures (what Stripe reviewers usually expect)

Make sure these are visible from the website footer and easy to find:

- **Business identity**: legal business name and country.
- **Contact**: a working support email (and ideally phone / address where applicable).
- **Refund & cancellation policy**: clear rules + timing + how to request.
- **Terms of service & privacy policy**: current and consistent with product.
- **Accurate product description**: what the customer is buying, what happens after payment, and expected “delivery” timeframe.

For travel/marketplace products, explicitly disclose:

- Whether you are the **merchant of record** (who charges the card) and who delivers the service.
- Whether the booking is **instant** vs **request/confirmation later**.

## 2) Avoid restricted/prohibited categories

Stripe publishes a prohibited/restricted list. Ensure your platform and all partner listings remain compliant.

- Don’t process payments for prohibited activities.
- If you operate in a restricted category (travel can be higher risk), expect extra diligence.

## 3) Reduce disputes & chargebacks

Disputes are one of the fastest ways to get flagged.

- **Clear statement descriptor**: the customer should recognize the charge name.
- **Support-first flow**: make it easy for customers to contact you before they dispute.
- **Fast refunds when appropriate**: delayed refunds drive chargebacks.
- **Transparent cancellation rules** at checkout and in confirmation emails.
- **Proof of fulfillment**: keep booking confirmation, check-in instructions, provider acknowledgement, and customer communications.

## 4) Fraud prevention controls

- Enable Stripe **Radar** rules appropriate for your risk.
- Consider **3D Secure** for elevated-risk payments (certain countries, high-value bookings, mismatched IP/card country).
- Block obvious card-testing behavior:
  - High rate of failed payments
  - Many attempts on one card/email/IP
  - Micro-amount tests

## 5) Operational hygiene (common shutdown triggers)

- Don’t misrepresent your business model in Stripe onboarding.
- Keep KYC/KYB details up to date in the Stripe dashboard.
- Avoid sudden traffic spikes or sudden changes in average ticket size without preparing support/risk.
- Ensure partners/providers are real and the inventory is legitimate.

## 6) Before switching to live mode

- Use production keys and ensure the publishable key matches the secret key account.
- Confirm webhook handling (if used) and idempotency.
- Do at least 10 end-to-end live-mode $1 tests and refund tests.

## 7) What to do if Stripe asks for information

Be ready to provide:

- Your refund/cancellation policy links
- Evidence of delivery (booking confirmations, customer communications)
- Supplier/provider agreements (if marketplace)
- Updated business description and fulfillment timeline
