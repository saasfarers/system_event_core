# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventDonation(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		amount: DF.Currency
		donation_date: DF.Datetime | None
		donation_name: DF.Autocomplete | None
		donation_type: DF.Data | None
		donor: DF.Data | None
		event: DF.Data | None
		fund: DF.Data | None
		is_anonymous: DF.Check
		payment_mode: DF.Literal[None]
		receipt_number: DF.Data | None
		status: DF.Literal[None]
		transaction_reference: DF.Data | None
	# end: auto-generated types

	def before_insert(self):
		import frappe
		from frappe.utils import now_datetime
		if not self.donation_date:
			self.donation_date = now_datetime()
		if not self.receipt_number:
			self.receipt_number = self.name or frappe.model.naming.make_autoname("REC-.YYYY.-.#####")

	def on_update(self):
		import frappe
		if self.event:
			from system_event_core.event.doctype.events.events import update_event_donation_collected
			update_event_donation_collected(self.event)

	def on_trash(self):
		import frappe
		if self.event:
			from system_event_core.event.doctype.events.events import update_event_donation_collected
			frappe.db.after_commit.add(lambda: update_event_donation_collected(self.event))
