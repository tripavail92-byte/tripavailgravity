"""Deterministic publish rules — no Facebook, no Claude. Run: python -m unittest discover tests"""
from __future__ import annotations

import unittest
from datetime import date

from growth.dedupe import collapse_duplicates, diff_scans
from growth.models import Activity, ItineraryDay, PriceVariant, Recurrence, TripFacts, TripListing
from growth.validate import expand_recurrence, normalise_pk_phone, validate_facts, validate_listing

TODAY = date(2026, 11, 24)  # a Tuesday


def facts(**over) -> TripFacts:
    base = dict(
        is_trip=True, trip_kind="scheduled_departure", title_as_posted="3 Days Naran Kaghan Trip",
        destinations=["Naran", "Kaghan"], departure_city="Islamabad", departure_dates=["2026-12-05"],
        recurrence=None, duration_days=3, duration_nights=2, price_amount=18500, price_currency="PKR",
        price_basis="per person", price_variants=[], price_evidence="Rs 18,500 per person",
        price_found_in="caption", inclusions=["Transport", "Hotel"], exclusions=[], itinerary_as_posted=[],
        contact_phone="0300-1234567", status="open", evidence=["3 Days Naran", "Rs 18,500"], confidence=0.9,
    )
    base.update(over)
    return TripFacts(**base)


CAPTION = "3 Days Naran Kaghan Trip departing 5 Dec. Only Rs 18,500 per person. Call 0300-1234567"


def listing(days: int = 3, text: str = "Lakes and meadows.") -> TripListing:
    return TripListing(
        title="Naran & Kaghan: 3 Days in the Valley", short_description="Three days in Naran.",
        description=text, highlights=["Saif-ul-Malook", "Kunhar River", "Kaghan Valley", "Shogran"],
        inclusions=["Transport"], exclusions=[],
        itinerary=[ItineraryDay(day=i, title=f"Day {i}", summary="A day.", overnight="Naran",
                                activities=[Activity(type="sightseeing", title="Lake", time="10:00",
                                                     description="Visit")]) for i in range(1, days + 1)],
        tour_type="Nature", custom_category_label=None, difficulty_level="easy",
        requirements=["req_gear_warm_clothing"], primary_city="Naran", primary_country="Pakistan", destination_cities=["Naran", "Kaghan"],
        physical_requirements=None,
    )


class Phone(unittest.TestCase):
    def test_formats(self):
        self.assertEqual(normalise_pk_phone("0300-1234567"), "+923001234567")
        self.assertEqual(normalise_pk_phone("+92 300 1234567"), "+923001234567")
        self.assertEqual(normalise_pk_phone("923001234567"), "+923001234567")
        self.assertEqual(normalise_pk_phone("051-1234567"), "+92511234567")
        self.assertIsNone(normalise_pk_phone("call us"))


class Recurring(unittest.TestCase):
    def test_every_friday(self):
        fridays = expand_recurrence([4], TODAY, horizon_days=14)
        self.assertEqual([d.isoformat() for d in fridays], ["2026-11-27", "2026-12-04"])

    def test_recurring_trip_gets_departures(self):
        f = facts(trip_kind="recurring_departure", departure_dates=[],
                  recurrence=Recurrence(weekdays=[4], starts_on=None, ends_on=None, description="Every Friday"))
        self.assertEqual(validate_facts(f, CAPTION, 1, TODAY).decision, "publish_ready")


class Facts(unittest.TestCase):
    def test_good_trip_publishes(self):
        self.assertEqual(validate_facts(facts(), CAPTION, 2, TODAY).decision, "publish_ready")

    def test_not_a_trip_rejected(self):
        r = validate_facts(facts(is_trip=False, trip_kind="not_a_trip"), CAPTION, 1, TODAY)
        self.assertEqual(r.decision, "reject")

    def test_cancelled_rejected(self):
        self.assertEqual(validate_facts(facts(status="cancelled"), CAPTION, 1, TODAY).decision, "reject")

    def test_past_dates_rejected(self):
        r = validate_facts(facts(departure_dates=["2026-10-01"]), CAPTION, 1, TODAY)
        self.assertEqual(r.decision, "reject")

    def test_price_not_in_caption_goes_to_review(self):
        # Claude claims the caption shows 25,000 but it doesn't: never publish an unsupported price.
        r = validate_facts(facts(price_amount=25000, price_evidence="Rs 25,000"), CAPTION, 1, TODAY)
        self.assertEqual(r.decision, "review")
        self.assertTrue(any("price_in_caption" in x for x in r.reasons))

    def test_poster_price_must_be_quoted(self):
        r = validate_facts(facts(price_found_in="image", price_evidence="poster text unclear"),
                           "Naran trip", 1, TODAY)
        self.assertEqual(r.decision, "review")
        ok = validate_facts(facts(price_found_in="image", price_evidence="PKR 18500/- per head"),
                            "Naran trip", 1, TODAY)
        self.assertEqual(ok.decision, "publish_ready")

    def test_no_price_is_allowed(self):
        r = validate_facts(facts(price_amount=None, price_found_in="none", price_evidence=None), CAPTION, 1, TODAY)
        self.assertEqual(r.decision, "publish_ready")

    def test_implausible_price_goes_to_review(self):
        r = validate_facts(facts(price_amount=6, price_evidence="Rs 6"), "Rs 6", 1, TODAY)
        self.assertEqual(r.decision, "review")

    def test_no_image_goes_to_review(self):
        self.assertEqual(validate_facts(facts(), CAPTION, 0, TODAY).decision, "review")

    def test_low_confidence_goes_to_review(self):
        self.assertEqual(validate_facts(facts(confidence=0.6), CAPTION, 1, TODAY).decision, "review")


class Listing(unittest.TestCase):
    def test_itinerary_must_match_duration(self):
        checks = validate_listing(listing(days=2), facts())
        self.assertFalse(next(c for c in checks if c.name == "itinerary_length_matches").ok)

    def test_invented_price_caught(self):
        checks = validate_listing(listing(text="Great value at PKR 45,000 per person."), facts())
        self.assertFalse(next(c for c in checks if c.name == "no_invented_prices").ok)

    def test_currency_word_without_amount_is_not_a_price(self):
        checks = validate_listing(listing(text="Foreign guests can pay in USD, cards or cash."), facts())
        self.assertTrue(next(c for c in checks if c.name == "no_invented_prices").ok)

    def test_real_price_allowed(self):
        checks = validate_listing(listing(text="From Rs 18,500 per person."), facts())
        self.assertTrue(next(c for c in checks if c.name == "no_invented_prices").ok)


def trip(url, hashes, dests, upcoming, price=18500, title="Naran trip"):
    return {"post_url": url, "image_hashes": hashes, "upcoming": upcoming, "listing_title": title,
            "media": [{}] * len(hashes),
            "facts": {"destinations": dests, "duration_days": 3, "title_as_posted": title,
                      "price_amount": price, "departure_dates": upcoming, "status": "open"}}


class Dedupe(unittest.TestCase):
    def test_same_poster_collapses_and_merges_dates(self):
        a = trip("p1", ["h1"], ["Naran"], ["2026-12-05"])
        b = trip("p2", ["h1"], ["Naran"], ["2026-12-12"])
        kept, dropped = collapse_duplicates([a, b])
        self.assertEqual(len(kept), 1)
        self.assertEqual(kept[0]["upcoming"], ["2026-12-05", "2026-12-12"])

    def test_different_routes_stay_separate(self):
        kept, _ = collapse_duplicates([trip("p1", ["h1"], ["Naran"], ["2026-12-05"]),
                                       trip("p2", ["h2"], ["Hunza"], ["2026-12-05"], title="Hunza tour")])
        self.assertEqual(len(kept), 2)

    def test_unreadable_post_is_kept_not_crashed(self):
        unread = {"post_url": "p2", "image_hashes": ["h2"], "upcoming": [], "facts": None, "media": []}
        kept, dropped = collapse_duplicates([trip("p1", ["h1"], ["Naran"], ["2026-12-05"]), unread])
        self.assertEqual(len(kept), 2)
        self.assertEqual(dropped, [])

    def test_changes_between_scans(self):
        old = [trip("p1", ["h1"], ["Naran"], ["2026-12-05"]), trip("p9", ["h9"], ["Swat"], ["2026-12-20"], title="Swat")]
        new = [trip("p1", ["h1"], ["Naran"], ["2026-12-05", "2026-12-19"], price=19500)]
        types = {c["type"] for c in diff_scans(old, new, TODAY)}
        self.assertEqual(types, {"price_changed", "departures_added", "post_disappeared"})




class FacebookDates(unittest.TestCase):
    def test_tooltip_formats(self):
        from growth.sources.facebook import parse_fb_date
        self.assertEqual(parse_fb_date("Thursday, July 14, 2022 at 11:41 PM"), date(2022, 7, 14))
        self.assertEqual(parse_fb_date("Tuesday 18 November 2026 at 14:32"), date(2026, 11, 18))
        self.assertEqual(parse_fb_date("Sep 3, 2026"), date(2026, 9, 3))
        self.assertIsNone(parse_fb_date("Hamrah Tours"))

    def test_fancy_text_is_normalised(self):
        from growth.sources.facebook import clean_text
        self.assertIn("5 Days Hunza", clean_text("Facebook\no͏\n𝟓 𝐃𝐚𝐲𝐬 𝐇𝐮𝐧𝐳𝐚\nComment as Someone"))
        self.assertNotIn("Comment as", clean_text("Trip to Swat\nComment as Someone"))


class DatesAreRealDepartures(unittest.TestCase):
    def test_a_date_range_read_day_by_day_is_one_departure(self):
        from growth.validate import clean_stated_dates
        oct_ = [date(2027, 10, d) for d in range(4, 20)]  # "Oct 4 – Oct 19", 16 days
        self.assertEqual(clean_stated_dates(oct_, 16), [date(2027, 10, 4)])

    def test_return_dates_are_not_departures(self):
        from growth.validate import clean_stated_dates
        table = [date(2027, 6, 1), date(2027, 6, 12), date(2027, 6, 15), date(2027, 6, 26)]  # 12-day trek
        self.assertEqual(clean_stated_dates(table, 12), [date(2027, 6, 1), date(2027, 6, 15)])

    def test_daily_is_any_date_not_fixed_departures(self):
        from growth.validate import upcoming_departures
        daily = facts(departure_dates=[], recurrence=Recurrence(weekdays=list(range(7)), starts_on=None,
                                                                ends_on=None, description="Daily"))
        self.assertEqual(upcoming_departures(daily, TODAY), [])


class PricesArePerPerson(unittest.TestCase):
    """The site shows every price per person; operators often quote a total for 2 or 5 people."""

    def test_group_totals_are_divided(self):
        from growth.pipeline import per_person
        self.assertEqual(per_person(237000, "For 2 Persons"), 118500)
        self.assertEqual(per_person(254000, "for 02 Persons"), 127000)
        self.assertEqual(per_person(358000, "Explorer Package - For 05 Persons"), 71600)
        self.assertEqual(per_person(107000, "for two adults"), 53500)
        self.assertEqual(per_person(104000, "Double Sharing (Price for 2 adults)"), 52000)
        self.assertEqual(per_person(80000, "Couple (total for two adults)"), 40000)
        self.assertEqual(per_person(90000, None, "PKR 90,000 per couple"), 45000)

    def test_per_person_prices_are_untouched(self):
        from growth.pipeline import per_person
        self.assertEqual(per_person(44000, "per person"), 44000)
        self.assertEqual(per_person(1450, "per person (twin sharing)"), 1450)
        self.assertEqual(per_person(23000, None), 23000)
        self.assertIsNone(per_person(None, "For 2 Persons"))

    def test_stated_per_person_wins_over_other_prices_quoted(self):
        from growth.pipeline import per_person
        self.assertEqual(per_person(28500, "per person", "Rs 28,500 per person · Couple Rs 57,000"), 28500)

    def test_no_stated_currency_means_price_on_request(self):
        from growth.pipeline import price_currency
        self.assertIsNone(price_currency(facts(price_currency=None,
                                               price_evidence="International Tourists 5+ Persons 1180")))

    def test_currency_follows_the_symbol_shown(self):
        from growth.pipeline import price_currency
        self.assertEqual(price_currency(facts(price_currency="USD",
                                              price_evidence="Pakistan and Iran Tour - 21 Days €2,730")), "EUR")
        self.assertEqual(price_currency(facts(price_currency="PKR", price_evidence="From US$1,600")), "USD")
        self.assertEqual(price_currency(facts(price_currency="Rs", price_evidence="Rs. 44,000")), "PKR")
        both = facts(price_amount=2290, price_currency="USD",
                     price_evidence="Snow Lake Trek (17 days) – TREK ONLY US$2,290 €2,020")
        self.assertEqual(price_currency(both), "USD")


class PickupNeverGuessed(unittest.TestCase):
    """A pickup point appears only when the operator states one."""

    def test_unstated_pickup_in_copy_is_flagged(self):
        from growth.validate import invented_pickups
        self.assertEqual(invented_pickups("Pickup in Islamabad and trip briefing", CAPTION), ["Pickup"])
        self.assertEqual(invented_pickups("Return with drop-off at the original meeting point", CAPTION),
                         ["drop-off", "meeting point"])

    def test_stated_pickup_and_shopping_are_fine(self):
        from growth.validate import invented_pickups
        stated = CAPTION + " Our driver will pick you up early in the morning in Islamabad."
        self.assertEqual(invented_pickups("Pickup in Islamabad", stated), [])
        self.assertEqual(invented_pickups("Pick up souvenirs in the bazaar", CAPTION), [])

    def test_pickup_row_only_for_a_place_the_operator_names_and_the_map_finds(self):
        from unittest import mock
        from growth import geocode
        from growth.models import MeetingPoint
        named = facts(meeting_point=MeetingPoint(place="I-8 Markaz", city="Islamabad", time="23:00",
                                                 quote="We gather at I-8 Markaz"))
        cap = CAPTION + " We gather at I-8 Markaz, Islamabad at 11 PM."
        with mock.patch.object(geocode, "geocode", return_value={"lat": 33.668, "lng": 73.075, "name": "x"}):
            rows = geocode.pickup_locations(named, cap, "Pakistan")
            self.assertEqual((rows[0]["title"], rows[0]["pickup_time"]), ("I-8 Markaz, Islamabad", "23:00"))
            self.assertEqual(geocode.pickup_locations(named, CAPTION, "Pakistan"), [])  # not in their text
            self.assertEqual(geocode.pickup_locations(facts(), cap, "Pakistan"), [])  # none stated
        with mock.patch.object(geocode, "geocode", return_value=None):
            self.assertEqual(geocode.pickup_locations(named, cap, "Pakistan"), [])  # map can't find it

    def test_a_city_alone_is_not_a_pickup_point(self):
        from unittest import mock
        from growth import geocode
        from growth.models import MeetingPoint
        city = facts(departure_city="Lahore", meeting_point=MeetingPoint(
            place="Lahore", city="Lahore", time="22:00", quote="Pickups: Lahore (10:00pm)"))
        with mock.patch.object(geocode, "geocode", return_value={"lat": 31.5, "lng": 74.3, "name": "x"}):
            self.assertEqual(geocode.pickup_locations(city, "Pickups: Lahore (10:00pm)", "Pakistan"), [])


if __name__ == "__main__":
    unittest.main()
