# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventFundAllocation(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		allocated_amount: DF.Currency
		event: DF.Data | None
		fund: DF.Data | None
		remaining_balance: DF.Currency
		restriction_type: DF.Literal[None]
		utilized_amount: DF.Currency
	# end: auto-generated types

	pass
