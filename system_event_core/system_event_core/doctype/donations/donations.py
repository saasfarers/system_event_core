# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Donations(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		amount: DF.Currency
		anonymous_donation: DF.Check
		currency: DF.SmallText
		donation_date: DF.Date
		donation_id: DF.Data
		donation_type: DF.Literal["Zakat", "Sadaqah", "General", "Event-Specific", "Construction Fund", "Orphan Support", "Education Fund", "Ramadan Fund", "Qurbani", "Other"]
		donor_email: DF.Data | None
		donor_name: DF.Data
		donor_phone: DF.Data | None
		event: DF.SmallText | None
		frequency: DF.Literal["Monthly", "Quarterly", "Yearly"]
		member: DF.SmallText | None
		mosque: DF.SmallText
		naming_series: DF.Literal["DON-.YYYY.-"]
		payment_date: DF.Date
		payment_mode: DF.Literal["Cash", "Card", "UPI", "Bank Transfer", "Cheque", "Online"]
		payment_reference: DF.Data | None
		purpose_category: DF.SmallText | None
		receipt_issued: DF.Check
		receipt_number: DF.Data | None
		received_by: DF.SmallText
		recurring_donation: DF.Check
		remarks: DF.Text | None
		tax_exemption_eligible: DF.Check
		verified_by: DF.SmallText | None
	# end: auto-generated types

	pass
