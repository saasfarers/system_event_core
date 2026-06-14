# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventVolunteerAssignment(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		assignment_status: DF.Literal["Assigned", "Confirmed", "Declined", "No-show"]
		attendance_status: DF.Literal["Pending", "Present", "Absent"]
		check_in_time: DF.Datetime | None
		check_out_time: DF.Datetime | None
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
		phone_number: DF.Data | None
		role_at_event: DF.Data | None
		volunteer: DF.Link | None
		volunteer_name: DF.Data | None
	# end: auto-generated types

	pass
