# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

from typing import TYPE_CHECKING

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import (
	getdate, nowdate, add_days, add_months,
	get_first_day, get_last_day
)
from frappe.utils.data import now_datetime
from datetime import date, timedelta
from system_event_core.utils.schedule_calendar import (
    sync_schedule_entry,
    cancel_schedule_entry,
)	
from frappe.utils import get_datetime
import json


class Events(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF
		from system_event_core.event.doctype.event_component_mapping.event_component_mapping import EventComponentMapping
		from system_event_core.event_attribute.doctype.event_volunteer_assignment.event_volunteer_assignment import EventVolunteerAssignment
		from system_event_core.event_attribute.doctype.event_volunteer_requirement.event_volunteer_requirement import EventVolunteerRequirement

		admin_approved_on: DF.Datetime | None
		admin_approver: DF.Link | None
		all_day: DF.Check
		amended_from: DF.Link | None
		approval_status: DF.Literal["Pending", "Member Approved", "Admin Approved", "Finance Approved", "Rejected"]
		created_by_type: DF.Literal["Organization", "Member"]
		description: DF.TextEditor | None
		end_date: DF.Date
		end_time: DF.Time | None
		event_approver: DF.Link | None
		event_category: DF.Link
		event_code: DF.Data | None
		event_components: DF.Table[EventComponentMapping]
		event_image: DF.AttachImage | None
		event_name: DF.Data
		event_owner: DF.Link | None
		event_type: DF.Literal["Standalone", "Recurring", "Multi-day"]
		event_volunteer_requirements: DF.Table[EventVolunteerRequirement]
		event_volunteers: DF.Table[EventVolunteerAssignment]
		finance_approved_on: DF.Datetime | None
		finance_approver: DF.Link | None
		finance_manager: DF.Link | None
		is_member_sponsored: DF.Check
		is_multi_day: DF.Check
		is_off_premise: DF.Check
		is_sub_event: DF.Check
		max_registrations: DF.Int
		notification_channel: DF.Literal["Email", "SMS", "WhatsApp", "All"]
		off_premise_address: DF.SmallText | None
		parent_event: DF.Link | None
		recurrence_end_date: DF.Date | None
		recurrence_pattern: DF.Literal["Daily", "Weekly", "Monthly", "Custom"]
		registration_form: DF.Link | None
		rejection_reason: DF.SmallText | None
		remarks: DF.SmallText | None
		reminder_days_before: DF.Int
		repeat_on_days: DF.SmallText | None
		send_reminders: DF.Check
		sponsored_by: DF.Link | None
		start_date: DF.Date
		start_time: DF.Time | None
		status: DF.Literal["Draft", "Pending Approval", "Approved", "Active", "Completed", "Cancelled"]
		submitted_by: DF.Link | None
		submitted_on: DF.Datetime | None
		total_occurrences: DF.Int
		venue: DF.Link | None
		volunteer_coordinator: DF.Link | None
	# end: auto-generated types

	def before_insert(self):
		self._set_created_by_type()


	def before_save(self):
		if self.name and not self.event_code:
			self.event_code = self.name
	

	def validate(self):
		self._set_created_by_type()
		self._validate_dates()
		self._auto_set_multi_day()
		self._validate_sub_event()
		self._validate_recurring()
		self._sync_volunteer_slots_filled()

	# def before_submit(self):
	# 	# self._check_approval_before_submit()


	def on_submit(self):
		
		self._set_status_on_submit()

		start_dt = get_datetime(
			f"{self.start_date} {self.start_time or '00:00:00'}"
		)

		end_dt = get_datetime(
			f"{self.end_date} {self.end_time or '23:59:59'}"
		)

		sync_schedule_entry(
			reference_type="Events",
			reference_name=self.name,
			title=self.event_name,
			start_datetime=start_dt,
			end_datetime=end_dt,
			category="Event",
		)

	def on_cancel(self):
		self.status = "Cancelled"
		self.approval_status = "Pending"
		cancel_schedule_entry(
			reference_type="Events",
			reference_name=self.name
		)

	# ── Internal helpers ──────────────────────────────────────────

	def _set_created_by_type(self):
		self.created_by_type = (
			"Member" if (self.is_member_sponsored and self.sponsored_by) else "Organization"
		)

	def _validate_dates(self):
		if self.start_date and self.end_date:
			if getdate(self.end_date) < getdate(self.start_date):
				frappe.throw(
					_("End Date cannot be before Start Date."),
					title=_("Invalid Dates"),
				)

	def _auto_set_multi_day(self):
		if self.start_date and self.end_date:
			if getdate(self.end_date) > getdate(self.start_date):
				self.is_multi_day = 1
				if self.event_type == "Standalone":
					self.event_type = "Multi-day"
			else:
				self.is_multi_day = 0

	def _validate_sub_event(self):
		if self.is_sub_event:
			if not self.parent_event:
				frappe.throw(
					_("Please select a Parent Event for this Sub-Event."),
					title=_("Parent Event Required"),
				)
			if self.parent_event == self.name:
				frappe.throw(
					_("An Event cannot be its own Parent Event."),
					title=_("Invalid Parent"),
				)

	def _validate_recurring(self):
		if self.event_type == "Recurring":
			if not self.recurrence_pattern:
				frappe.throw(
					_("Please set a Recurrence Pattern for Recurring events."),
					title=_("Recurrence Required"),
				)
			if not self.recurrence_end_date and not self.total_occurrences:
				frappe.throw(
					_("Please set a Recurrence End Date or Total Occurrences."),
					title=_("Recurrence End Required"),
				)

		# def _check_approval_before_submit(self):
		# 	if self.approval_status != "Finance Approved":
		# 		frappe.throw(
		# 			_(
		# 				f"Event must be Finance Approved before submitting. "
		# 				f"Current: <b>{self.approval_status}</b>"
		# 			),
		# 			title=_("Approval Pending"),
		# 		)

	def _set_status_on_submit(self):
		self.status = "Active" if getdate(self.start_date) <= getdate(nowdate()) else "Approved"
		self.db_update()

	# ── Volunteer helpers ───────────────────────────────────────────

	def _sync_volunteer_slots_filled(self):
		"""Keep slots_filled on each Volunteer Requirement row in sync
		with the actual count of Volunteer Assignment rows for that role."""
		counts = {}
		for row in (self.event_volunteers or []):
			role = row.role_at_event
			if role:
				counts[role] = counts.get(role, 0) + 1

		for req in (self.event_volunteer_requirements or []):
			req.slots_filled = counts.get(req.role_at_event, 0)

	# ── Approval workflow ─────────────────────────────────────────

	@frappe.whitelist()
	def approve_as_member(self):
		self._assert_status("Pending")
		self.approval_status = "Member Approved"
		self.submitted_by = frappe.session.user
		self.submitted_on = now_datetime()
		self.status = "Pending Approval"
		self.save()
		frappe.msgprint(_("Submitted for Admin approval."), indicator="blue", alert=True)

	@frappe.whitelist()
	def approve_as_admin(self):
		self._assert_status("Member Approved")
		self.approval_status = "Admin Approved"
		self.admin_approver = frappe.session.user
		self.admin_approved_on = now_datetime()
		self.save()
		frappe.msgprint(_("Admin approved. Pending Finance approval."), indicator="blue", alert=True)

	@frappe.whitelist()
	def approve_as_finance(self):
		self._assert_status("Admin Approved")
		self.approval_status = "Finance Approved"
		self.finance_approver = frappe.session.user
		self.finance_approved_on = now_datetime()
		self.status = "Approved"
		self.save()
		frappe.msgprint(_("Fully approved. You can now Submit."), indicator="green", alert=True)

	@frappe.whitelist()
	def reject_event(self, reason: str = ""):
		self.approval_status = "Rejected"
		self.rejection_reason = reason
		self.status = "Draft"
		self.save()
		frappe.msgprint(_("Event rejected."), indicator="red", alert=True)

	def _assert_status(self, expected: str):
		if self.approval_status != expected:
			frappe.throw(
				_(
					f"Expected approval status: <b>{expected}</b>, "
					f"but current is: <b>{self.approval_status}</b>."
				),
				title=_("Invalid Action"),
			)


# ── Volunteer attendance — bulk check-in / check-out / no-show ─────────────────
# Called from events.js via frappe.call({
#     method: "...events.mark_volunteer_attendance",
#     args: { docname, assignment_names: JSON.stringify([...]), action }
# })

@frappe.whitelist()
def mark_volunteer_attendance(docname: str, assignment_names, action: str) -> dict:
	"""
	action: "check_in" | "check_out" | "no_show"
	assignment_names: JSON-encoded list of child row names (frm row.name values)
	"""
	if isinstance(assignment_names, str):
		assignment_names = json.loads(assignment_names)

	doc = frappe.get_doc("Events", docname)
	now = now_datetime()
	updated = 0

	for row in doc.event_volunteers:
		if row.name in assignment_names:
			if action == "check_in":
				row.check_in_time = now
				row.attendance_status = "Present"
				if row.assignment_status == "Assigned":
					row.assignment_status = "Confirmed"
			elif action == "check_out":
				row.check_out_time = now
			elif action == "no_show":
				row.attendance_status = "Absent"
				row.assignment_status = "No-show"
			else:
				frappe.throw(_("Invalid action: {0}").format(action))
			updated += 1

			# ALSO create/update record in separate Attendance Doctype!
			is_external = 0
			party_master = None
			volunteer_name = row.volunteer_name or row.volunteer

			# Find the Volunteer record to see if it links to Party Master
			if row.volunteer:
				vol_info = frappe.db.get_value("Volunteer", row.volunteer, ["people", "is_external"], as_dict=True)
				if vol_info:
					party_master = vol_info.people
					is_external = int(vol_info.is_external or 0)

			# If they don't have a linked Party Master, treat them as external
			if not party_master:
				is_external = 1

			# Check if Attendance record already exists for this event and volunteer
			filters = {
				"event": docname,
				"attendance_type": "Volunteer"
			}
			if party_master:
				filters["people"] = party_master
				filters["is_external"] = 0
			else:
				filters["name1"] = volunteer_name
				filters["is_external"] = 1

			existing = frappe.get_all("Attendance", filters=filters, limit=1, pluck="name")

			if existing:
				att_doc = frappe.get_doc("Attendance", existing[0])
			else:
				att_doc = frappe.new_doc("Attendance")
				att_doc.event = docname
				att_doc.attendance_type = "Volunteer"
				att_doc.attendance_date = doc.start_date
				if party_master:
					att_doc.people = party_master
					att_doc.is_external = 0
				else:
					att_doc.name1 = volunteer_name
					att_doc.is_external = 1

			if action == "check_in":
				att_doc.checkin = now
				att_doc.status = "Present"
			elif action == "check_out":
				att_doc.checkout = now
				if att_doc.checkin:
					# Calculate working hours in seconds
					from frappe.utils import get_datetime
					start = get_datetime(att_doc.checkin)
					end = get_datetime(att_doc.checkout)
					seconds = (end - start).total_seconds()
					att_doc.working_hours = seconds
			elif action == "no_show":
				att_doc.status = "Absent"

			att_doc.save(ignore_permissions=True)

	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return {"status": "ok", "updated": updated}


# ── Standalone whitelisted function for recurring instances ────────────────────
# Called from events.js via frappe.call({ method: "...events.generate_recurring_instances" })

@frappe.whitelist()
def generate_recurring_instances(docname: str) -> dict:
	"""
	Generate Event Schedule Instance records for a Recurring event.

	Rules
	-----
	- Daily   → one instance per day from start_date to recurrence_end_date
	           (or total_occurrences days)
	- Weekly  → respects repeat_on_days (comma-separated day names, e.g. "Monday,Friday")
	           If blank, uses the day-of-week of start_date
	- Monthly → same day-of-month each month
	- Custom  → same as Daily (caller can edit instances manually)

	Existing instances for the same event + date are skipped (no duplicates).
	Returns {"created": N, "skipped": M}
	"""
	doc = frappe.get_doc("Events", docname)

	if doc.event_type != "Recurring":
		frappe.throw(_("This event is not a Recurring event."), title=_("Invalid Operation"))

	pattern   = doc.recurrence_pattern or "Daily"
	start     = getdate(doc.start_date)
	end_limit = getdate(doc.recurrence_end_date) if doc.recurrence_end_date else None
	max_occ   = int(doc.total_occurrences or 0)

	if not end_limit and not max_occ:
		frappe.throw(
			_("Set a Recurrence End Date or Total Occurrences before generating instances."),
			title=_("Missing Configuration"),
		)

	# Build list of target dates
	target_dates = _build_date_series(
		pattern=pattern,
		start=start,
		end_limit=end_limit,
		max_occ=max_occ,
		repeat_on_days=doc.repeat_on_days or "",
	)

	# Fetch already-existing instances for this event
	existing = set(
		frappe.get_all(
			"Event Schedule Instance",
			filters={"parent_event": docname},
			pluck="instance_date",
		)
	)
	existing_str = {str(d) for d in existing}

	created = 0
	skipped = 0
	for d in target_dates:
		ds = str(d)
		if ds in existing_str:
			skipped += 1
			continue
		inst = frappe.new_doc("Event Schedule Instance")
		inst.parent_event = docname
		inst.instance_date = ds
		inst.start_time    = str(doc.start_time) if doc.start_time else None
		inst.end_time      = str(doc.end_time)   if doc.end_time   else None
		inst.status        = "Scheduled"
		inst.insert(ignore_permissions=True)
		created += 1

	frappe.db.commit()
	return {"created": created, "skipped": skipped}


# ── Date series builder ────────────────────────────────────────────────────────

_DAY_NAMES = {
	"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
	"friday": 4, "saturday": 5, "sunday": 6,
}

def _build_date_series(
	pattern: str,
	start: date,
	end_limit: "date | None",
	max_occ: int,
	repeat_on_days: str,
) -> list:
	"""Return a list of date objects for the given recurrence pattern."""
	result = []
	safety = 3000  # never generate more than 3000 instances per call

	if pattern == "Daily" or pattern == "Custom":
		current = start
		while len(result) < safety:
			if end_limit and current > end_limit:
				break
			if max_occ and len(result) >= max_occ:
				break
			result.append(current)
			current = current + timedelta(days=1)

	elif pattern == "Weekly":
		# Resolve target weekdays
		if repeat_on_days.strip():
			target_days = set()
			for part in repeat_on_days.replace(";", ",").split(","):
				key = part.strip().lower()
				if key in _DAY_NAMES:
					target_days.add(_DAY_NAMES[key])
		else:
			# Default: same weekday as start
			target_days = {start.weekday()}

		# Walk day by day but only collect matching weekdays
		current = start
		# Adjust to start from the very start date (inclusive)
		while len(result) < safety:
			if end_limit and current > end_limit:
				break
			if max_occ and len(result) >= max_occ:
				break
			if current.weekday() in target_days:
				result.append(current)
			current = current + timedelta(days=1)

	elif pattern == "Monthly":
		day_of_month = start.day
		current_month_start = date(start.year, start.month, 1)
		while len(result) < safety:
			# Clamp to last day of month if necessary
			import calendar
			last_day = calendar.monthrange(current_month_start.year, current_month_start.month)[1]
			target_day = min(day_of_month, last_day)
			candidate = date(current_month_start.year, current_month_start.month, target_day)
			if candidate >= start:
				if end_limit and candidate > end_limit:
					break
				if max_occ and len(result) >= max_occ:
					break
				result.append(candidate)
			# Advance one month
			if current_month_start.month == 12:
				current_month_start = date(current_month_start.year + 1, 1, 1)
			else:
				current_month_start = date(
					current_month_start.year, current_month_start.month + 1, 1
				)

	return result


@frappe.whitelist()
def get_event_registrations(docname: str) -> list:
	"""
	Fetch all registered participants for the event (from Registration Response),
	resolving their names, emails, is_external status, and existing Attendance status.
	"""
	responses = frappe.get_all(
		"Registration Response",
		filters={"event": docname},
		fields=["name", "party_master", "owner"]
	)

	registrations = []
	for r in responses:
		name = ""
		email = ""
		is_external = 1
		party_master = r.party_master
		owner_user = r.owner

		# Try to resolve party_master from owner user if not set
		if not party_master and owner_user and owner_user != "Guest":
			# Check if Party Master exists for this user
			party_master = frappe.db.get_value("Party Master", {"user": owner_user}, "name")
			if not party_master:
				# Automatically create Party Master for this system user
				try:
					user_doc = frappe.get_doc("User", owner_user)
					pm_doc = frappe.new_doc("Party Master")
					pm_doc.party_name = user_doc.full_name or user_doc.name
					pm_doc.party_type = "Individual"
					pm_doc.status = "Active"
					pm_doc.naming_series = "PM-"
					pm_doc.user = owner_user
					pm_doc.email = user_doc.email
					pm_doc.insert(ignore_permissions=True)
					party_master = pm_doc.name
					
					# Update the Registration Response to link it
					frappe.db.set_value("Registration Response", r.name, "party_master", party_master)
				except Exception as e:
					frappe.log_error(f"Failed to auto-create Party Master for {owner_user}: {str(e)}")

		if party_master:
			# Internal member
			party_info = frappe.db.get_value("Party Master", party_master, ["party_name", "email"], as_dict=True)
			if party_info:
				name = party_info.party_name or party_master
				email = party_info.email or ""
			else:
				name = party_master
			is_external = 0
		else:
			# External/guest, extract name and email from Registration Response Items
			items = frappe.get_all(
				"Registration Response Items",
				filters={"parent": r.name},
				fields=["question", "answer"]
			)
			for item in items:
				q = (item.question or "").lower()
				if "name" in q and not name:
					name = item.answer
				if "email" in q and not email:
					email = item.answer
			if not name:
				if email:
					name = email.split("@")[0].title()
				else:
					name = f"Guest ({r.name})"

		# Check if there is an existing Attendance record for this person and event
		filters = {
			"event": docname,
			"is_external": is_external
		}
		if party_master:
			filters["people"] = party_master
		else:
			filters["name1"] = name

		existing_att = frappe.get_all(
			"Attendance",
			filters=filters,
			fields=["name", "status", "checkin", "checkout"]
		)

		status = "Pending"
		att_name = None
		if existing_att:
			status = existing_att[0].status or "Pending"
			att_name = existing_att[0].name

		registrations.append({
			"registration_id": r.name,
			"party_master": party_master,
			"name": name,
			"email": email,
			"is_external": is_external,
			"status": status,
			"attendance_name": att_name
		})

	return registrations


@frappe.whitelist()
def mark_event_attendance(docname: str, registrations, action: str) -> dict:
	"""
	action: "check_in" | "check_out" | "no_show"
	registrations: JSON-encoded list of registrations:
	  [{"party_master": "...", "name": "...", "is_external": 0/1, "registration_id": "..."}]
	"""
	if isinstance(registrations, str):
		registrations = json.loads(registrations)

	event_doc = frappe.get_doc("Events", docname)
	event_date = event_doc.start_date
	now = now_datetime()
	updated = 0

	for reg in registrations:
		party_master = reg.get("party_master")
		name = reg.get("name")
		is_external = int(reg.get("is_external") or 0)
		registration_id = reg.get("registration_id")

		# Check if party_master can be auto-resolved from registration_id/owner
		if not party_master and registration_id:
			owner_user = frappe.db.get_value("Registration Response", registration_id, "owner")
			if owner_user and owner_user != "Guest":
				party_master = frappe.db.get_value("Party Master", {"user": owner_user}, "name")
				if not party_master:
					try:
						user_doc = frappe.get_doc("User", owner_user)
						pm_doc = frappe.new_doc("Party Master")
						pm_doc.party_name = user_doc.full_name or user_doc.name
						pm_doc.party_type = "Individual"
						pm_doc.status = "Active"
						pm_doc.naming_series = "PM-"
						pm_doc.user = owner_user
						pm_doc.email = user_doc.email
						pm_doc.insert(ignore_permissions=True)
						party_master = pm_doc.name
						frappe.db.set_value("Registration Response", registration_id, "party_master", party_master)
						is_external = 0
					except Exception as e:
						frappe.log_error(f"Failed to auto-create Party Master for {owner_user}: {str(e)}")
				else:
					is_external = 0

		# Build filters to find existing Attendance record
		filters = {"event": docname}
		if party_master:
			filters["people"] = party_master
			filters["is_external"] = 0
		else:
			filters["name1"] = name
			filters["is_external"] = 1

		existing = frappe.get_all("Attendance", filters=filters, limit=1, pluck="name")

		if existing:
			att_doc = frappe.get_doc("Attendance", existing[0])
		else:
			att_doc = frappe.new_doc("Attendance")
			att_doc.event = docname
			att_doc.attendance_date = event_date
			if party_master:
				att_doc.people = party_master
				att_doc.is_external = 0
			else:
				att_doc.name1 = name
				att_doc.is_external = 1

		if action == "check_in":
			att_doc.checkin = now
			att_doc.status = "Present"
		elif action == "check_out":
			att_doc.checkout = now
			if att_doc.checkin:
				# Calculate working hours in seconds
				start = get_datetime(att_doc.checkin)
				end = get_datetime(att_doc.checkout)
				seconds = (end - start).total_seconds()
				att_doc.working_hours = seconds
		elif action == "no_show":
			att_doc.status = "Absent"
		else:
			frappe.throw(_("Invalid action: {0}").format(action))

		att_doc.save(ignore_permissions=True)
		updated += 1

	frappe.db.commit()
	return {"status": "ok", "updated": updated}


@frappe.whitelist()
def send_tab_invitations(event_name: str) -> dict:
	"""
	Sends invitations to all entries in the child table.
	"""
	event_doc = frappe.get_doc("Events", event_name)
	if not event_doc.invitation:
		frappe.throw(_("Please select an Invitation Template first."))

	inv_template = frappe.get_doc("Invitation", event_doc.invitation)
	
	# Prepare email attachment
	attachments = []
	if inv_template.attachment:
		file_name = frappe.db.get_value("File", {"file_url": inv_template.attachment}, "name")
		if file_name:
			try:
				file_doc = frappe.get_doc("File", file_name)
				attachments.append({
					"fname": file_doc.file_name,
					"fcontent": file_doc.get_content()
				})
			except Exception as e:
				frappe.log_error(f"Failed to load attachment: {str(e)}")

	# Construct Event Details block
	event_date_str = frappe.utils.format_date(event_doc.start_date)
	if event_doc.start_time:
		event_date_str += f" at {event_doc.start_time}"
	else:
		event_date_str += " (All Day)"

	event_details_html = f"""
	<div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin: 20px 0; font-family: Arial, sans-serif;">
		<h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">📅 Event Details</h4>
		<table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
			<tr>
				<td style="padding: 6px 0; font-weight: bold; width: 120px; color: #64748b;">Event Name:</td>
				<td style="padding: 6px 0; font-weight: 600; color: #0f172a;">{event_doc.event_name or ""}</td>
			</tr>
			<tr>
				<td style="padding: 6px 0; font-weight: bold; color: #64748b;">Date & Time:</td>
				<td style="padding: 6px 0; color: #0f172a;">{event_date_str}</td>
			</tr>
	"""
	if event_doc.venue:
		event_details_html += f"""
			<tr>
				<td style="padding: 6px 0; font-weight: bold; color: #64748b;">Venue:</td>
				<td style="padding: 6px 0; color: #0f172a;">{event_doc.venue}</td>
			</tr>
		"""
	if event_doc.description:
		event_details_html += f"""
			<tr>
				<td style="padding: 6px 0; font-weight: bold; color: #64748b; vertical-align: top;">Description:</td>
				<td style="padding: 6px 0; color: #0f172a;">{event_doc.description}</td>
			</tr>
		"""
	event_details_html += """
		</table>
	</div>
	"""

	# Prepare rich HTML message
	message_body = inv_template.message or ""
	message_body += event_details_html
	
	if inv_template.invitation_image:
		message_body += f'<br><br><div style="text-align:center;"><img embed="{inv_template.invitation_image}" style="max-width:100%; border-radius:8px;"></div>'

	sent_count = 0
	now = now_datetime()
	default_channel = event_doc.invitation_channel or "Email"

	for row in event_doc.event_invitations:
		# Send email
		row_channel = row.invitation_channel or default_channel
		if row.email and row_channel in ["Email", "All"]:
			try:
				frappe.sendmail(
					recipients=[row.email],
					subject=inv_template.title or f"Invitation: {event_doc.event_name}",
					message=message_body,
					attachments=attachments,
					reference_doctype="Events",
					reference_name=event_doc.name
				)
				row.sent_on = now
				row.reminder_count = (row.reminder_count or 0) + 1
				sent_count += 1
			except Exception as e:
				frappe.log_error(f"Failed to send email to {row.email}: {str(e)}")
				continue
		
		# Simulate SMS/WhatsApp
		elif row.phone and row_channel in ["SMS", "WhatsApp", "All"]:
			row.sent_on = now
			row.reminder_count = (row.reminder_count or 0) + 1
			sent_count += 1

	event_doc.save(ignore_permissions=True)
	frappe.db.commit()
	return {"status": "ok", "sent_count": sent_count}


@frappe.whitelist()
def send_scheduled_invitations():
	"""
	Cron background job running every few minutes to send out scheduled event invitations.
	"""
	now = now_datetime()
	
	# Query all Events where invitation_send_date is past/present
	events = frappe.get_all(
		"Events",
		filters=[
			["invitation_send_date", "<=", now],
			["docstatus", "<", 2]
		],
		fields=["name"]
	)
	
	for ev in events:
		# Check if any invitation is pending
		pending_exists = frappe.db.exists("Event Invitation", {
			"parent": ev.name,
			"parenttype": "Events",
			"sent_on": ["is", "not set"]
		})
		if pending_exists:
			try:
				send_tab_invitations(ev.name)
			except Exception as e:
				frappe.log_error(f"Failed to send scheduled invitations for {ev.name}: {str(e)}")


@frappe.whitelist()
def get_registrations_for_bulk(event_name: str) -> list:
	"""
	Returns resolved registrations for the event to be added to the child table in bulk.
	"""
	regs = get_event_registrations(event_name)
	resolved = []
	for r in regs:
		party_master = r.get("party_master")
		email = r.get("email") or ""
		name = r.get("name") or ""
		phone = r.get("phone") or ""
		
		# Resolve phone number if guest
		if not party_master and r.get("registration_id"):
			phone_items = frappe.get_all(
				"Registration Response Items",
				filters={"parent": r.get("registration_id")},
				fields=["question", "answer"]
			)
			for item in phone_items:
				q = (item.question or "").lower()
				if "phone" in q or "mobile" in q or "contact" in q:
					phone = item.answer
					break
		elif party_master and not phone:
			phone = frappe.db.get_value("Party Master", party_master, "mobile_number") or ""
			
		resolved.append({
			"party_member": party_master,
			"invitee": name,
			"email": email,
			"phone": phone
		})
	return resolved