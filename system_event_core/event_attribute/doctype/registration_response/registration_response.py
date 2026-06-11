# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class RegistrationResponse(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF
		from system_event_core.event_attribute.doctype.registration_response_items.registration_response_items import RegistrationResponseItems

		registration_form_name: DF.Link | None
		response: DF.Table[RegistrationResponseItems]
	# end: auto-generated types

	pass
