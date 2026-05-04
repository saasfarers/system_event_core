# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class VolunteerManagement(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		assignment_status: DF.Literal["Assigned", "Confirmed", "Completed", "Cancelled", "No-Show"]
		event: DF.Data
		member: DF.Data | None
		naming_series: DF.Literal["VOL-.YYYY.-"]
		volunteer_assignment_date: DF.Date
		volunteer_id: DF.Data
		volunteer_name: DF.Data
	# end: auto-generated types

	pass
