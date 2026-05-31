# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Attendance(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		attendance_date: DF.Date | None
		checkin: DF.Datetime | None
		checkout: DF.Datetime | None
		is_external: DF.Check
		name1: DF.Data | None
		name: DF.Int | None
		people: DF.Link | None
		status: DF.Literal["Present", "Absent"]
		working_hours: DF.Duration | None
	# end: auto-generated types

	pass
