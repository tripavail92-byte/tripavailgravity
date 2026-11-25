"""Shapes Claude must return (structured outputs) and the records the pipeline produces.

Claude-facing models carry no numeric constraints: range checks belong to validate.py, where
they are deterministic and independent of the model's own confidence.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ── Read from a Facebook page ───────────────────────────────────────────────


class FacebookRating(BaseModel):
    recommend_percent: int | None = Field(description="e.g. 92 from '92% recommend'; null if not shown")
    review_count: int | None = Field(description="e.g. 143 from '(143 Reviews)'; null if not shown")
    raw_text: str = Field(description="The rating text exactly as shown on the page")


class PageProfile(BaseModel):
    display_name: str
    category: str | None = Field(description="Page category as shown, e.g. 'Travel Company'")
    bio: str | None = Field(description="Intro / about text as written by the page")
    follower_count: int | None = Field(description="Followers as an integer: '5.2K followers' -> 5200")
    like_count: int | None
    phone: str | None = Field(description="Phone exactly as shown on the page")
    whatsapp: str | None
    email: str | None
    website: str | None
    address: str | None
    city: str | None = Field(description="City the business is based in, if stated")
    facebook_rating: FacebookRating | None
    operator_kind: Literal["tour_operator", "travel_agency", "hotel", "transport", "blogger", "other"]
    confidence: float = Field(description="0-1: how sure you are these fields are right")


# ── Read from one post (caption + images) ───────────────────────────────────


class Recurrence(BaseModel):
    weekdays: list[int] = Field(description="0=Monday … 6=Sunday, e.g. [4] for 'every Friday'")
    starts_on: str | None = Field(description="YYYY-MM-DD if stated")
    ends_on: str | None = Field(description="YYYY-MM-DD if stated")
    description: str = Field(description="The recurrence as the operator phrased it")


class PriceVariant(BaseModel):
    label: str = Field(description="e.g. 'Quad sharing', 'Couple', 'Child 5-10'")
    amount: float


class PostedDay(BaseModel):
    day: int
    title: str
    details: str


class MeetingPoint(BaseModel):
    """Where travellers are picked up or meet — ONLY when the operator names it."""
    place: str = Field(description="The place exactly as named, e.g. 'I-8 Markaz', 'Faizabad Interchange'")
    city: str | None = Field(description="City of that place, if stated or obvious from the place name")
    time: str | None = Field(description="24h 'HH:MM' only if the operator states the meeting/pickup time")
    quote: str = Field(description="The operator's exact words naming the place")


class TripFacts(BaseModel):
    is_trip: bool
    trip_kind: Literal["scheduled_departure", "recurring_departure", "on_request", "not_a_trip"]
    title_as_posted: str | None
    destinations: list[str]
    departure_city: str | None
    departure_dates: list[str] = Field(description="YYYY-MM-DD; only dates the post states")
    recurrence: Recurrence | None
    duration_days: int | None
    duration_nights: int | None
    price_amount: float | None = Field(description="The base price ONLY if the post or poster shows it")
    price_currency: str | None
    price_basis: str | None = Field(description="e.g. 'per person', 'per couple'")
    price_variants: list[PriceVariant]
    price_evidence: str | None = Field(description="The exact text where the price appears")
    price_found_in: Literal["caption", "image", "both", "none"]
    inclusions: list[str]
    exclusions: list[str]
    itinerary_as_posted: list[PostedDay] = Field(description="Only if the operator wrote a day plan")
    meeting_point: MeetingPoint | None = Field(
        default=None,
        description="Only if the operator names a specific pickup or meeting place; a departure city alone is not one")
    contact_phone: str | None
    status: Literal["open", "few_seats_left", "sold_out", "cancelled", "postponed", "unknown"]
    evidence: list[str] = Field(description="Short quotes from the caption or poster backing the key fields")
    confidence: float = Field(description="0-1: how sure you are this is a real, bookable trip read correctly")


# ── Written by Claude for TripAvail ─────────────────────────────────────────


ActivityType = Literal[
    "transport", "departure_arrival", "meal", "tea_break", "sightseeing", "guided_tour", "adventure",
    "photo_stop", "shopping", "cultural", "free_time", "accommodation", "custom",
]


class Activity(BaseModel):
    """Matches the activity shape the TripAvail itinerary editor saves and the trip page renders."""
    type: ActivityType
    title: str
    time: str | None = Field(description="24h 'HH:MM', approximate, in order through the day")
    description: str


class ItineraryDay(BaseModel):
    day: int
    title: str
    summary: str = Field(description="Two or three sentences on the day")
    activities: list[Activity] = Field(description="4-7 activities in time order")
    overnight: str | None = Field(description="Where travellers sleep that night, if it can be stated")


class TripListing(BaseModel):
    title: str = Field(description="Clear listing title, at most 70 characters")
    short_description: str = Field(description="One or two sentences, at most 160 characters")
    description: str = Field(description="Three short paragraphs of professional travel copy")
    highlights: list[str] = Field(description="4-6 highlights")
    inclusions: list[str]
    exclusions: list[str]
    itinerary: list[ItineraryDay]
    tour_type: Literal["Adventure", "Nature", "Cultural", "Family", "Historical", "Custom"]
    custom_category_label: str | None
    difficulty_level: Literal["easy", "moderate", "difficult"]
    requirements: list[str] = Field(description="IDs from the allowed requirement list only")
    primary_city: str = Field(description="Main destination city")
    primary_country: str = Field(description="Country of the main destination, e.g. 'Pakistan', 'Azerbaijan'")
    destination_cities: list[str]
    physical_requirements: str | None


# ── Pipeline records ────────────────────────────────────────────────────────


class MediaAsset(BaseModel):
    source_url: str
    sha256: str
    stored_path: str
    width: int | None
    height: int | None
    # Rights lifecycle: public_post_unconfirmed -> operator_confirmed (on claim) | removed.
    rights_status: Literal["public_post_unconfirmed", "operator_confirmed", "removed"] = "public_post_unconfirmed"
    attribution: str


class RawPost(BaseModel):
    source: str
    post_url: str | None
    posted_text: str | None = Field(default=None, description="Post time as Facebook shows it on hover")
    posted_at: str | None = Field(default=None, description="YYYY-MM-DD parsed from posted_text")
    caption: str
    image_urls: list[str]


class RawPage(BaseModel):
    source: str
    page_url: str
    handle: str
    page_text: str
    profile_image_url: str | None
    cover_image_url: str | None
    posts: list[RawPost]
