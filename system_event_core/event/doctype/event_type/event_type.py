# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EVENTTYPE(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		default_workflow: DF.Link | None
		description: DF.SmallText | None
		event_category: DF.Data
		event_code: DF.Data
		event_type_name: DF.Data
		institution_category: DF.Data
		is_active: DF.Check
		requires_approval: DF.Check
		supports_attendance: DF.Check
		supports_booking: DF.Check
		supports_donations: DF.Check
		supports_fees: DF.Check
		supports_inventory: DF.Check
		supports_recurrence: DF.Check
		supports_travel: DF.Check
		supports_volunteers: DF.Check
	# end: auto-generated types

	pass
