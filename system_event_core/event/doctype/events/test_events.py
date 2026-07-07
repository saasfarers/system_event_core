# Copyright (c) 2026, saasfarers and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase
from system_event_core.event.doctype.events.events import get_event_registrations, mark_event_attendance
from frappe.utils import nowdate, get_datetime


class IntegrationTestEvents(IntegrationTestCase):
	"""
	Integration tests for Events and Event Attendance.
	"""
	def test_event_attendance_flow(self):
		# Fetch or create category
		cat = frappe.db.get_value("Event Category Master", {}, "name")
		if not cat:
			cat_doc = frappe.new_doc("Event Category Master")
			cat_doc.event_category_name = "Test Category"
			cat_doc.insert()
			cat = cat_doc.name

		# 1. Create an Event
		event = frappe.new_doc("Events")
		event.event_name = "Test Attendance Event"
		event.event_category = cat
		event.start_date = nowdate()
		event.end_date = nowdate()
		event.insert()

		# Fetch or create Party Master
		party = frappe.db.get_value("Party Master", {}, "name")
		if not party:
			party_doc = frappe.new_doc("Party Master")
			party_doc.party_name = "Attendee One"
			party_doc.party_type = "Individual"
			party_doc.status = "Active"
			party_doc.naming_series = "PM-"
			party_doc.insert()
			party = party_doc.name

		party_name, party_email = frappe.db.get_value("Party Master", party, ["party_name", "email"])

		# 2. Create a Registration Response
		reg = frappe.new_doc("Registration Response")
		reg.event = event.name
		reg.party_master = party
		reg.insert()

		# 3. Test get_event_registrations
		registrations = get_event_registrations(event.name)
		self.assertEqual(len(registrations), 1)
		self.assertEqual(registrations[0]["party_master"], party)
		self.assertEqual(registrations[0]["name"], party_name or party)
		self.assertEqual(registrations[0]["status"], "Pending")

		# 4. Test mark_event_attendance (Check In)
		res = mark_event_attendance(
			docname=event.name,
			registrations=[{"party_master": party, "name": party_name or party, "is_external": 0}],
			action="check_in"
		)
		self.assertEqual(res["status"], "ok")
		self.assertEqual(res["updated"], 1)

		# Verify Attendance record was created
		attendance = frappe.get_all(
			"Attendance",
			filters={"event": event.name, "people": party},
			fields=["status", "checkin"]
		)
		self.assertEqual(len(attendance), 1)
		self.assertEqual(attendance[0].status, "Present")
		self.assertIsNotNone(attendance[0].checkin)

		# Test get_event_registrations status updated
		registrations = get_event_registrations(event.name)
		self.assertEqual(registrations[0]["status"], "Present")

		# 5. Test mark_event_attendance (Check Out)
		res = mark_event_attendance(
			docname=event.name,
			registrations=[{"party_master": party, "name": party_name or party, "is_external": 0}],
			action="check_out"
		)
		self.assertEqual(res["status"], "ok")
		self.assertEqual(res["updated"], 1)

		# Verify checkout time is updated
		attendance = frappe.get_all(
			"Attendance",
			filters={"event": event.name, "people": party},
			fields=["status", "checkout", "working_hours"]
		)
		self.assertIsNotNone(attendance[0].checkout)
		self.assertIsNotNone(attendance[0].working_hours)

		# Cleanup
		frappe.db.rollback()

	def test_volunteer_attendance_flow(self):
		from system_event_core.event.doctype.events.events import mark_volunteer_attendance

		# Fetch or create category
		cat = frappe.db.get_value("Event Category Master", {}, "name")
		if not cat:
			cat_doc = frappe.new_doc("Event Category Master")
			cat_doc.event_category_name = "Test Category"
			cat_doc.insert()
			cat = cat_doc.name

		# Create Event
		event = frappe.new_doc("Events")
		event.event_name = "Test Volunteer Event"
		event.event_category = cat
		event.start_date = nowdate()
		event.end_date = nowdate()
		
		# Create Volunteer
		party = frappe.db.get_value("Party Master", {}, "name")
		if not party:
			party_doc = frappe.new_doc("Party Master")
			party_doc.party_name = "Volunteer One"
			party_doc.party_type = "Individual"
			party_doc.status = "Active"
			party_doc.naming_series = "PM-"
			party_doc.insert()
			party = party_doc.name

		vol = frappe.db.get_value("Volunteer", {"people": party}, "name")
		if not vol:
			vol_doc = frappe.new_doc("Volunteer")
			vol_doc.people = party
			vol_doc.role = "Security"
			vol_doc.availability_status = "Available"
			vol_doc.insert()
			vol = vol_doc.name

		# Add volunteer assignment to Event
		event.append("event_volunteers", {
			"volunteer": vol,
			"role_at_event": "Security",
			"assignment_status": "Assigned",
			"attendance_status": "Pending"
		})
		event.insert()

		row_name = event.event_volunteers[0].name

		# Test mark_volunteer_attendance (Check In)
		res = mark_volunteer_attendance(
			docname=event.name,
			assignment_names=[row_name],
			action="check_in"
		)
		self.assertEqual(res["status"], "ok")
		self.assertEqual(res["updated"], 1)

		# Verify Attendance record was synchronized in separate Attendance Doctype
		attendance = frappe.get_all(
			"Attendance",
			filters={
				"event": event.name,
				"people": party,
				"attendance_type": "Volunteer"
			},
			fields=["status", "checkin"]
		)
		self.assertEqual(len(attendance), 1)
		self.assertEqual(attendance[0].status, "Present")
		self.assertIsNotNone(attendance[0].checkin)

		# Cleanup
		frappe.db.rollback()
