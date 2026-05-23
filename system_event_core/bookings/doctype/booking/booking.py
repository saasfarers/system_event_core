# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Booking(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		amount: DF.Currency
		approval_remarks: DF.SmallText | None
		beneficiary_party: DF.Link | None
		booking_end: DF.Datetime
		booking_id: DF.Data | None
		booking_start: DF.Datetime
		booking_type: DF.Literal["Venue", "Service", "Rental", "Lease"]
		deposit_amount: DF.Currency
		institution: DF.Link
		is_recurring: DF.Check
		linked_event: DF.Data | None
		naming_series: DF.Literal["BKG-.YYYY.-####"]
		notes: DF.SmallText | None
		payment_status: DF.Literal["Pending", "Partial", "Paid"]
		purpose: DF.SmallText | None
		recurrence_rule: DF.Data | None
		requested_by: DF.Link
		resource: DF.Link
		status: DF.Literal["Draft", "Pending", "Approved", "Rejected", "Cancelled", "Completed"]
	# end: auto-generated types

	pass
