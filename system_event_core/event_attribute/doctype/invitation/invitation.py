# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Invitation(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		attachment: DF.Attach | None
		event: DF.Link | None
		invitation_image: DF.AttachImage | None
		message: DF.SmallText | None
		title: DF.Data | None
	# end: auto-generated types

	pass
