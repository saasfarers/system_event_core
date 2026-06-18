# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Pilgrim(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		aadhaar_number: DF.Data | None
		age: DF.Int
		application_date: DF.Date | None
		date_of_birth: DF.Date | None
		email: DF.Data | None
		emergency_contact_name: DF.Data | None
		emergency_contact_number: DF.Data | None
		full_name: DF.Data
		gender: DF.Literal["Male", "Female", "Transgender"]
		guardianmahram: DF.Link | None
		id_proof: DF.Literal["Passport", "Aadhaar", "Others"]
		institution: DF.Link | None
		marital_status: DF.Literal["Married", "Unmarried", "Divorced", "Widowed"]
		medical_clearance: DF.Check
		medical_notes: DF.SmallText | None
		mobile_number: DF.Data
		naming_series: DF.Literal["PLG-.YYYY.-####"]
		nationality: DF.Data | None
		notes: DF.SmallText | None
		package: DF.Link | None
		package_cost: DF.Currency
		passport_expiry: DF.Data | None
		passport_number: DF.Data | None
		payment_status: DF.Literal["Pending", "Partial", "Completed"]
		pilgrim_id: DF.Data | None
		status: DF.Literal["Pending", "Approved", "Rejected", "Cancelled"]
		visa_status: DF.Literal["Not Applied", "Applied", "Approved", "Rejected"]
	# end: auto-generated types

	pass
