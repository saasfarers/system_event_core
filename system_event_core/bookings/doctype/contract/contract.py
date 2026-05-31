# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Contract(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		agreement_attachment: DF.Attach | None
		auto_renewal: DF.Check
		billing_frequency: DF.Literal["Monthly", "Quarterly", "Half Yearly", "Yearly"]
		contract_id: DF.Data | None
		contract_type: DF.Literal[None]
		deposit_amount: DF.Currency
		end_date: DF.Date
		grace_days: DF.Int
		institution: DF.Link | None
		naming_series: DF.Literal["CON-.YYYY.-####"]
		notes: DF.SmallText | None
		rental_amount: DF.Currency
		resource: DF.Link | None
		start_date: DF.Date
		status: DF.Literal["Active", "Expired", "Terminated"]
		tenant: DF.Link | None
	# end: auto-generated types

	pass
