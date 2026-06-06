# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Volunteer(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		assigned_task: DF.SmallText | None
		attendance_status: DF.Literal["Present", "Absent"]
		availability_status: DF.Literal["Available", "Not Available", "Tentative"]
		email: DF.Data | None
		location: DF.Data | None
		name1: DF.Data | None
		name: DF.Int | None
		phone_number: DF.Data | None
		remarks: DF.SmallText | None
		role: DF.Data | None
		shift: DF.Literal["Morning", "EVening", "Afternoon", "Full day"]
	# end: auto-generated types

	pass
