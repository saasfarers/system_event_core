# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventTravelPlan(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		arrival_time: DF.Datetime | None
		departure_location: DF.Data | None
		departure_time: DF.Datetime | None
		destination: DF.Data | None
		emergency_contact: DF.Data | None
		transport_mode: DF.Literal[None]
		travel_group_name: DF.Data | None
	# end: auto-generated types

	pass
