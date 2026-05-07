# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Fees(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		amount_paid: DF.Currency
		approved_by: DF.SmallText | None
		balance_amount: DF.Currency
		booking: DF.SmallText | None
		created_by: DF.SmallText
		discount_amount: DF.Currency
		discount_reason: DF.SmallText | None
		due_date: DF.Date
		event: DF.SmallText | None
		event_registration: DF.SmallText | None
		fee_amount: DF.Currency
		fee_date: DF.Date
		fee_id: DF.Data
		fee_type: DF.Literal["Event Registration Fee", "Membership Fee", "Course Fee", "Facility Booking Fee", "Late Fee", "Other"]
		final_amount: DF.Currency
		member: DF.SmallText | None
		mosque: DF.SmallText
		naming_series: DF.Literal["FEE-.YYYY.-"]
		payer_email: DF.Data | None
		payer_name: DF.Data
		payer_phone: DF.Data | None
		payment_date: DF.Date | None
		payment_mode: DF.Literal["Cash", "Card", "UPI", "Bank Transfer", "Cheque", "Online"]
		payment_reference: DF.Data | None
		payment_status: DF.Literal["Unpaid", "Partially Paid", "Paid", "Overdue", "Waived"]
		receipt_number: DF.Data | None
		remarks: DF.Text | None
	# end: auto-generated types

	pass
