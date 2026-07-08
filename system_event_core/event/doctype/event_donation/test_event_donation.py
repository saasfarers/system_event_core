# Copyright (c) 2026, saasfarers and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import nowdate
from system_event_core.event.doctype.events.events import record_event_donation, update_event_donation_collected


class IntegrationTestEventDonation(IntegrationTestCase):
	"""
	Integration tests for EventDonation.
	"""

	def test_donation_recalculation_and_receipt(self):
		# Fetch or create category
		cat = frappe.db.get_value("Event Category Master", {}, "name")
		if not cat:
			cat_doc = frappe.new_doc("Event Category Master")
			cat_doc.event_category_name = "Test Category"
			cat_doc.insert()
			cat = cat_doc.name

		# 1. Create an Event with a goal
		event = frappe.new_doc("Events")
		event.event_name = "Test Donation Event"
		event.event_category = cat
		event.start_date = nowdate()
		event.end_date = nowdate()
		event.donation_goal = 1000.0
		event.insert()

		# 2. Record a donation via API
		res = record_event_donation(
			event_name=event.name,
			donor_name="Test Donor",
			amount=250.0,
			payment_mode="Cash",
			email="test_donor@example.com",
			phone="1234567890",
			donation_type="General Donation",
			transaction_reference="TXN-12345",
			is_anonymous=0
		)
		self.assertEqual(res["status"], "ok")
		self.assertIsNotNone(res["donation"])

		# 3. Verify total is recalculated on Event save
		event.reload()
		self.assertEqual(event.donation_collected, 250.0)

		# 4. Record a second donation
		donation2 = frappe.new_doc("Event Donation")
		donation2.event = event.name
		donation2.donor_name = "Test Donor 2"
		donation2.amount = 350.0
		donation2.payment_mode = "Online/Card"
		donation2.status = "Received"
		donation2.insert()

		# Recalculate
		update_event_donation_collected(event.name)
		event.reload()
		self.assertEqual(event.donation_collected, 600.0)

		# 5. Cancel one donation and verify recalculation
		donation2.status = "Cancelled"
		donation2.save()

		event.reload()
		self.assertEqual(event.donation_collected, 250.0)

		# Cleanup
		frappe.db.rollback()

	def test_multiple_donation_causes(self):
		cat = frappe.db.get_value("Event Category Master", {}, "name")
		if not cat:
			cat_doc = frappe.new_doc("Event Category Master")
			cat_doc.event_category_name = "Test Category"
			cat_doc.insert()
			cat = cat_doc.name

		# 1. Create an Event with multiple causes
		event = frappe.new_doc("Events")
		event.event_name = "Test Causes Event"
		event.event_category = cat
		event.start_date = nowdate()
		event.end_date = nowdate()
		
		event.append("donation_causes", {
			"cause_name": "Annadanam",
			"target_amount": 1000.0
		})
		event.append("donation_causes", {
			"cause_name": "Renovation",
			"target_amount": 5000.0
		})
		event.insert()

		# 2. Record donation for cause 1 (Annadanam)
		res1 = record_event_donation(
			event_name=event.name,
			donor_name="Donor A",
			amount=400.0,
			payment_mode="Cash",
			donation_type="Annadanam"
		)
		self.assertEqual(res1["status"], "ok")

		# 3. Record donation for cause 2 (Renovation)
		res2 = record_event_donation(
			event_name=event.name,
			donor_name="Donor B",
			amount=1500.0,
			payment_mode="Online/Card",
			donation_type="Renovation"
		)
		self.assertEqual(res2["status"], "ok")

		# 4. Verify sum calculations
		update_event_donation_collected(event.name)
		event.reload()

		self.assertEqual(event.donation_collected, 1900.0)

		c1 = next(c for c in event.donation_causes if c.cause_name == "Annadanam")
		c2 = next(c for c in event.donation_causes if c.cause_name == "Renovation")
		self.assertEqual(c1.collected_amount, 400.0)
		self.assertEqual(c2.collected_amount, 1500.0)

		# Cleanup
		frappe.db.rollback()
