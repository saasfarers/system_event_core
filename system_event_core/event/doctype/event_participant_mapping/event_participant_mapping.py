# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventParticipantMapping(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		attendance_status: DF.Literal[None]
		check_in_time: DF.Datetime | None
		check_out_time: DF.Datetime | None
		family: DF.Data | None
		participant: DF.Data | None
		participant_type: DF.Literal[None]
		registration_status: DF.Literal[None]
		remarks: DF.SmallText | None
		rsvp_status: DF.Literal[None]
	# end: auto-generated types

	pass
