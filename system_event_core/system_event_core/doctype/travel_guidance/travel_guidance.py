# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class TravelGuidance(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		emergency_contacts: DF.TextEditor | None
		guidance_id: DF.Data | None
		naming_series: DF.Literal["TGD-.YYYY.-####"]
		text_editor_dcrp: DF.TextEditor | None
		text_editor_oxqv: DF.TextEditor | None
		title: DF.Data | None
		travel_essentials: DF.TextEditor | None
	# end: auto-generated types

	pass
