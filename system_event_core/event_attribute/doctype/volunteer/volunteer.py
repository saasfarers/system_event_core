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

		availability_status: DF.Literal["Available", "Not Available", "Tentative"]
		available_from: DF.Datetime | None
		available_to: DF.Datetime | None
		email: DF.Data | None
		is_external: DF.Check
		location: DF.Data | None
		name1: DF.Data | None
		name: DF.Int | None
		people: DF.Link | None
		phone_number: DF.Data | None
		role: DF.Data | None
	# end: auto-generated types

	pass
