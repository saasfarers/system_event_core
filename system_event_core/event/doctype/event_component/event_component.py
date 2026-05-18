# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventComponent(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		component_code: DF.Data
		component_name: DF.Data
		component_type: DF.Literal["Religious", "Prayer", "Educational", "Community", "Volunteer", "Financial", "Donation", "Booking", "Attendance", "Inventory", "Travel", "Media", "Food", "Security", "Administration", "Fundraising", "Ceremony", "Youth Program", "Women Program", "Children Program", "Health Camp", "Funeral Service", "Nikah Service", "Ramadan Activity", "Hajj Support", "Other"]
		description: DF.SmallText | None
		is_active: DF.Check
		is_financial: DF.Check
		name: DF.Int | None
		requires_approval: DF.Check
		supports_reminders: DF.Check
		supports_timeline: DF.Check
		supports_variance: DF.Check
	# end: auto-generated types

	pass
