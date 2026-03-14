# Booking Messenger Architecture

## Why this exists

TripAvail now has safe contact disclosure for operator bookings, but a real marketplace-grade communications system needs a booking-scoped messenger with durable data, automation, auditability, moderation, and support access. This document captures the public Airbnb behaviors we can verify and translates them into a no-redo foundation for TripAvail.

## Verified Airbnb messaging behaviors

The items below are grounded in publicly accessible Airbnb help and resource pages fetched on 2026-03-14.

### Core thread model

- Every reservation automatically creates a group thread where bookers, co-travelers, hosts, and co-hosts can communicate.
- Hosts, guests, and support messages are unified in one inbox view.
- Experience bookings support both group threads and direct 1:1 guest messaging.
- Old booking threads close after roughly one year and become read-only.
- Very old messages are deleted after a longer retention period.

### Inbox operations

- Threads are searchable by names, words, phrases, and confirmation codes.
- Threads support category filters like hosting, traveling, support, direct messages, unread, starred, listing, and trip stage.
- Threads can be archived and restored.
- Archived threads automatically return to the main list when a new message arrives.
- Starred and unread are participant-specific tools, not global thread state.

### Message operations

- Read receipts exist and are on by default.
- Read receipts can be turned off per user.
- Threaded replies are supported.
- Users can edit a sent message for 15 minutes.
- Users can unsend a message for 24 hours.
- Emoji reactions are supported.
- There are message rate limits.
- Users can report abusive or policy-violating content.

### Media and document handling

- Photos and videos can be sent only after a reservation is confirmed.
- Shared photos and videos are visible in a per-thread gallery.
- Documents are not uploaded directly; Airbnb supports sending shareable document links instead.
- Messaging content must comply with content and community policies.

### Automation and templates

- Quick replies are saved templates.
- Quick replies support placeholders for guest, reservation, and listing data.
- Quick replies can be manually inserted into a thread.
- Scheduled quick replies can trigger off reservation events like booking, check-in, and checkout.
- Scheduled quick replies have a timeline view showing sent, skipped, and future messages.
- Scheduled quick replies can be edited, skipped, or sent early on a per-reservation basis without changing the base template.
- Short stays and last-minute bookings have special scheduling rules.
- Team owners and co-hosts have controlled visibility and shared behavior around templates and scheduled messages.
- Quick replies have a hard character limit.
- Airbnb publicly states that template language affects how placeholders are translated, and that quick replies are auto-translated when the guest views them.

### Recommendation and merchandising layer

- Hosts can send recommendations inside the conversation flow.
- Recommendations can also be automated through quick replies and scheduled quick replies.

### Team and support behaviors

- Teams with guest-management permissions receive the same guest messages.
- Team members keep their own archive, star, and read state.
- Support threads are visible as a distinct inbox category.
- Airbnb may review and analyze messages for legal compliance, trust, safety, and support.

## Public source list

- https://www.airbnb.com/help/article/145
- https://www.airbnb.com/help/article/2897
- https://www.airbnb.com/help/article/2898
- https://www.airbnb.com/help/article/2899
- https://www.airbnb.com/help/article/3398
- https://www.airbnb.com/help/article/3554
- https://www.airbnb.com/help/article/3558
- https://www.airbnb.com/help/article/3759
- https://www.airbnb.com/help/article/3760
- https://www.airbnb.com/help/article/3853
- https://www.airbnb.com/help/article/4101
- https://www.airbnb.com/resources/hosting-homes/a/678

## What TripAvail must support from day one

The first TripAvail messaging foundation should not try to clone every surface in one sprint, but the schema and APIs must be shaped so later work is additive rather than destructive.

### Non-negotiable platform requirements

- One canonical conversation per confirmed booking scope.
- Support for both `tour_booking` and `package_booking` from the beginning.
- Participant-specific state for unread, archive, mute, and read receipts.
- Message-level audit columns for edits, unsends, moderation, and system events.
- Reservation-scoped access control with no direct widening of profile RLS.
- Storage-backed attachments with conversation-scoped access rules.
- Template and scheduled-message primitives so automation is not bolted on later.
- Realtime delivery for inbox and thread updates.
- Notification fanout through the existing notifications + webhook email pipeline.
- Admin/support participation without breaking booking privacy guarantees.

### Product surfaces to build on this foundation

- Unified inbox page.
- Booking thread page.
- Attachment gallery.
- Quick reply manager.
- Scheduled-message timeline.
- Moderation/reporting panel.
- Support escalation console.

## TripAvail architecture decisions

### Conversation scope

- Use one `booking_conversations` row per booking.
- Key it with `booking_scope` + `booking_id` rather than a nullable `tour_booking_id` and `package_booking_id` pair.
- Derive the allowed traveler and partner participants from the booking tables each time the conversation is created.

### Participant state

- Store archive, mute, unread, and read state per participant.
- Do not store archive globally on the conversation, because Airbnb-style archive is user-specific.
- Keep support and admin participants explicit in the participant table, rather than bypassing the table with elevated direct reads.

### Message model

- Use a single message table with `message_kind` for text, system, quick reply, scheduled quick reply, recommendation, attachment wrapper, and support notes.
- Keep `reply_to_message_id` for threaded replies.
- Keep `edited_at` and `unsent_at` columns from the start.
- Keep `translations` and `body_rich` JSONB columns from the start so translation and richer composers do not require schema churn.

### Read receipts

- Read receipts are per-message, not just per-thread.
- Delivery receipts and read receipts should be recorded even if a user hides them from others.
- Visibility is a presentation rule controlled by account settings, not a reason to skip recording reads.

### Templates and scheduling

- Quick replies and scheduled quick replies need separate persistence from live messages.
- Scheduled-message timeline requires a delivery table that tracks scheduled, sent, skipped, and cancelled states.
- Scheduling must support last-minute and short-stay override rules.

### Attachment policy

- Conversation attachments should use a private bucket with the conversation ID as the first path segment.
- Photos and videos are first-class attachment records.
- Documents should be modeled as attachment metadata or external links, but direct file uploads can still be supported when policy allows.
- Malware scanning and moderation state should exist as attachment metadata from the start.

### Support and trust layer

- Keep a support participant role inside the same conversation model.
- Keep message reports, audit history, and event streams separate from user-facing content.
- Preserve edited and unsent history in metadata for legal/support review even when hidden in the user UI.

## Schema blueprint

### Core tables

- `booking_conversations`
- `booking_conversation_participants`
- `booking_conversation_messages`
- `booking_conversation_message_attachments`
- `booking_conversation_message_reads`
- `booking_conversation_message_reactions`

### Automation tables

- `booking_message_templates`
- `booking_message_template_deliveries`

### Existing tables reused

- `notifications`
- `account_settings`
- `tour_bookings`
- `package_bookings`
- `tours`
- `packages`
- `profiles`
- `users`

## API blueprint

### Foundation RPCs

- `messaging_get_or_create_booking_conversation`
- `messaging_list_conversations`
- `messaging_get_conversation_messages`
- `messaging_send_message`
- `messaging_mark_conversation_read`

### Next RPCs

- `messaging_update_conversation_preferences`
- `messaging_edit_message`
- `messaging_unsend_message`
- `messaging_toggle_reaction`
- `messaging_report_message`
- `messaging_schedule_template_delivery`
- `messaging_skip_scheduled_delivery`
- `messaging_send_scheduled_delivery_now`

## Delivery and notification model

- New messages should create in-app notifications through the existing `notifications` table.
- The current email webhook trigger on `notifications` can be reused for message notifications.
- SMS and push can be layered by consuming the same event stream.
- Realtime updates should use `postgres_changes` subscriptions on conversations, messages, and participant state.

## Rollout sequence

### Phase 1

- Schema, RLS, storage bucket, core RPCs, and client service.
- Text messages, unread counts, archive/mute state, read receipts, and attachments metadata.

### Phase 2

- Inbox UI, thread UI, realtime thread updates, and notification badges.
- Attachment uploads and gallery.
- Per-thread recommendation cards.

### Phase 3

- Quick replies, scheduled quick replies, timeline review, and last-minute booking rules.
- Team-owned vs co-host-owned template visibility.

### Phase 4

- Edit, unsend, reactions, reporting, moderation workflows, and support participant tooling.
- Translation pipeline and translated message projections.

## Current TripAvail insertion points

- Existing realtime helper: [packages/web/src/hooks/useRealtimeSubscription.ts](packages/web/src/hooks/useRealtimeSubscription.ts)
- Existing notification fanout: [supabase/migrations/20260220000005_notification_email_webhook_trigger.sql](supabase/migrations/20260220000005_notification_email_webhook_trigger.sql)
- Existing notification bell: [packages/web/src/queries/adminQueries.ts](packages/web/src/queries/adminQueries.ts#L488)
- Existing booking-safe contact layer: [supabase/migrations/20260314000007_operator_booking_console.sql](supabase/migrations/20260314000007_operator_booking_console.sql)

## Open items

- Decide whether message translations are stored eagerly or generated on read.
- Decide whether support joins the booking conversation directly or through linked support threads.
- Decide whether package-owner role should be normalized to `partner` in the UI while keeping `owner` in the schema.
- Decide whether to permit direct document uploads or stay closer to Airbnb’s document-link approach.