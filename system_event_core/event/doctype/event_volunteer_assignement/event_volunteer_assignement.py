# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventVolunteerAssignement(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		assigned_role: DF.Data | None
		assigned_task: DF.Data | None
		attendance_status: DF.Literal["Present", "Absent"]
		hours_contributed: DF.Float
		shift_timing: DF.Data | None
		volunteer: DF.Data | None
	# end: auto-generated types

	pass
