# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventDonation(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		amount: DF.Currency
		donation_date: DF.Datetime | None
		donation_name: DF.Autocomplete | None
		donation_type: DF.Data | None
		donor: DF.Data | None
		event: DF.Data | None
		fund: DF.Data | None
		is_anonymous: DF.Check
		payment_mode: DF.Literal[None]
		receipt_number: DF.Data | None
		status: DF.Literal[None]
		transaction_reference: DF.Data | None
	# end: auto-generated types

	pass
