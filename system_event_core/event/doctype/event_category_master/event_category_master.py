# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EVENTCATEGORYMASTER(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		allows_booking: DF.Check
		allows_volunteers: DF.Check
		category_code: DF.Data
		category_name: DF.Data
		description: DF.SmallText
		is_active: DF.Check
		is_financial: DF.Check
		is_religious: DF.Check
	# end: auto-generated types

	pass
