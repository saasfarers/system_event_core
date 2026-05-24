# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventComponentMapping(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		component: DF.Link | None
		end_timeline: DF.Datetime | None
		is_enabled: DF.Check
		is_mandatory: DF.Check
		notes: DF.SmallText | None
		phase: DF.Literal["Pre-Event", "During Event", "Post-Event"]
		reminder_date: DF.Date | None
		requires_approval: DF.Check
		start_timeline: DF.Datetime | None
	# end: auto-generated types

	pass