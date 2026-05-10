# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EVENTCOMPONENT(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		component_code: DF.Data | None
		component_name: DF.Data | None
		component_type: DF.Literal[None]
		description: DF.SmallText | None
		is_active: DF.Check
		is_financial: DF.Check
		requires_approval: DF.Check
		supports_reminders: DF.Check
		supports_timeline: DF.Check
		supports_variance: DF.Check
	# end: auto-generated types

	pass
