# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventExpense(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		amount: DF.Currency
		approved_by: DF.Data | None
		event: DF.Data | None
		expense_category: DF.Data | None
		expense_date: DF.Date | None
		expense_name: DF.Autocomplete | None
		linked_advance: DF.Data | None
		payment_method: DF.Literal[None]
		reference_id: DF.Data | None
		status: DF.Literal[None]
		vendor: DF.Data | None
	# end: auto-generated types

	pass
