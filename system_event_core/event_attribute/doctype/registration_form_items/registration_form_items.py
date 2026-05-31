# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class RegistrationFormItems(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		field_type: DF.Literal["Data", "Small Text", "Int", "Float", "Check", "Select", "Date", "Attach", "Email", "Phone"]
		option: DF.SmallText | None
		order: DF.Int
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
		question: DF.Data | None
		required: DF.Check
	# end: auto-generated types

	pass
