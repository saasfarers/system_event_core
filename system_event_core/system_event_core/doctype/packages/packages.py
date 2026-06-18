# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Packages(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		accommodation_details: DF.SmallText | None
		accommodation_type: DF.Literal["5-Star", "4-Star", "3-Star", "Budget", "Dormitory", "Others"]
		cancellation_terms: DF.SmallText | None
		current_enrollments: DF.Int
		duration_days: DF.Int
		faith_type: DF.Link
		guide_details: DF.SmallText | None
		guide_type: DF.Literal["Experienced", "Group", "Basic", "None"]
		institution: DF.Link
		is_active: DF.Check
		max_capacity: DF.Int
		meals_included: DF.Literal["All Meals", "Breakfast only", "Breakfast & Dinner", "None"]
		naming_series: DF.Literal["TPK-.YYYY.-####"]
		package_features: DF.SmallText | None
		package_id: DF.Data | None
		package_name: DF.Data
		package_type: DF.Literal["Premium", "Standard", "Economy", "Custom"]
		price: DF.Currency
		seasonyear: DF.Data | None
		transport: DF.SmallText | None
	# end: auto-generated types

	pass
