# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventScheduleInstance(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		end_time: DF.Time | None
		instance_date: DF.Date | None
		parent_event: DF.Data | None
		start_time: DF.Time | None
		status: DF.Literal[None]
	# end: auto-generated types

	pass
