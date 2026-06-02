# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventSchedule(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		category: DF.Literal["Event", "Booking", "Class", "Volunteer", "Donation", "Maintenance", "Other"]
		color: DF.Color | None
		end_datetime: DF.Datetime
		name: DF.Int | None
		notes: DF.SmallText | None
		reference_name: DF.DynamicLink | None
		reference_type: DF.Link | None
		start_datetime: DF.Datetime
		status: DF.Literal["Active", "Completed", "Cancelled"]
		title: DF.Data
	# end: auto-generated types

	pass
