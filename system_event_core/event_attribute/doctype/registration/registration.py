# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Registration(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF
		from system_event_core.event_attribute.doctype.registration_form_items.registration_form_items import RegistrationFormItems

		description: DF.SmallText | None
		form_name: DF.Data | None
		name: DF.Int | None
		question: DF.Table[RegistrationFormItems]
	# end: auto-generated types

	pass
