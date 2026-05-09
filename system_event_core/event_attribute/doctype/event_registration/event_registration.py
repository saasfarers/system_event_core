# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventRegistration(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		address: DF.SmallText | None
		age: DF.Int
		approval_date: DF.Date | None
		approved_by: DF.SmallText | None
		date_of_birth: DF.Date | None
		email: DF.Data
		emergency_contact_name: DF.Data | None
		emergency_contact_phone: DF.Data | None
		event: DF.SmallText
		fee_amount: DF.Currency
		full_name: DF.Data
		gender: DF.Literal["Male", "Female"]
		member: DF.SmallText | None
		naming_series: DF.Literal["REG-.YYYY.-"]
		number_of_attendees: DF.Int
		payment_reference: DF.SmallText | None
		payment_status: DF.Literal["Unpaid", "Partially Paid", "Paid", "Waived"]
		phone: DF.Data
		registered_by: DF.SmallText
		registration_date: DF.Date
		registration_id: DF.Data | None
		registration_status: DF.Literal["Pending", "Confirmed", "Cancelled", "Wait listed", "Attended"]
		registration_type: DF.Literal["Individual", "Family", "Group"]
		remarks: DF.Text | None
		special_requirements: DF.SmallText | None
	# end: auto-generated types

	pass
