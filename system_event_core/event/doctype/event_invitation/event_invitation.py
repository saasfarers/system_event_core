# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventInvitation(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		invitation_channel: DF.Literal[None]
		invitee: DF.Data | None
		reminder_count: DF.Int
		rsvp_status: DF.Literal[None]
		sent_on: DF.Datetime | None
	# end: auto-generated types

	pass
