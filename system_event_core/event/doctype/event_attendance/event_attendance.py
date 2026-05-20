# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventAttendance(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		attendance_status: DF.Literal["Present", "Absent"]
		attendance_type: DF.Data | None
		capture_mode: DF.Literal["Manual", "QR", "RFID", "Biometric", "Mobile App"]
		captured_by: DF.Data | None
		check_in_time: DF.Datetime | None
		check_out_time: DF.Datetime | None
		event: DF.Data | None
		participant: DF.Data | None
	# end: auto-generated types

	pass
