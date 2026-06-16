# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Itinerary(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF
		from system_event_core.event.doctype.itinerary_day_plan.itinerary_day_plan import ItineraryDayPlan

		created_for: DF.Literal[None]
		end_date: DF.Date
		itinerary_day_plan: DF.Table[ItineraryDayPlan]
		itinerary_title: DF.Data
		linked_event: DF.Data
		notes: DF.SmallText | None
		start_date: DF.Date
		status: DF.Literal[None]
		total_days: DF.Int
	# end: auto-generated types

	pass
