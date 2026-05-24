# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventCategoryMaster(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		category_code: DF.Data | None
		description: DF.SmallText | None
		event_category_name: DF.Data | None
		is_active: DF.Check
		is_booking_enabled: DF.Check
		is_financial_event: DF.Check
		is_religious_event: DF.Check
		is_volunteer_enabled: DF.Check
		naming_series: DF.Literal["ECM-.YYYY.-.####", "ECM-.####"]
	# end: auto-generated types

	def before_save(self):
		# Auto-populate category_code with the generated name
		if not self.category_code or self.category_code != self.name:
			self.category_code = self.name