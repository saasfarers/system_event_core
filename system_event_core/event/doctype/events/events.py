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
class Events(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF
		from system_event_core.event.doctype.event_component_mapping.event_component_mapping import EventComponentMapping

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
		finance_approved_on: DF.Datetime | None
		finance_approver: DF.Link | None
		finance_manager: DF.Link | None
		is_member_sponsored: DF.Check
		is_multi_day: DF.Check
		is_off_premise: DF.Check
		is_sub_event: DF.Check
		notification_channel: DF.Literal["Email", "SMS", "WhatsApp", "All"]
		off_premise_address: DF.SmallText | None
		parent_event: DF.Link | None
		recurrence_end_date: DF.Date | None
		recurrence_pattern: DF.Literal["Daily", "Weekly", "Monthly", "Custom"]
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
		frappe.msgprint("Before Sync")

		sync_schedule_entry(
			reference_type="Events",
			reference_name=self.name,
			title=self.event_name,
			start_datetime=start_dt,
			end_datetime=end_dt,
			category="Event",
		)
		frappe.msgprint("After Sync")

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


# ── Standalone whitelisted function for recurring instances ────────────────────
# Called from events.js via frappe.call({ method: "...events.generate_recurring_instances" })

@frappe.whitelist()
def generate_recurring_instances(docname: str) -> dict:
	"""
	Generate Event Schedule Instance records for a Recurring event.

	Rules
	-----
	• Daily   → one instance per day from start_date to recurrence_end_date
	           (or total_occurrences days)
	• Weekly  → respects repeat_on_days (comma-separated day names, e.g. "Monday,Friday")
	           If blank, uses the day-of-week of start_date
	• Monthly → same day-of-month each month
	• Custom  → same as Daily (caller can edit instances manually)

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