# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class VenueAllocation(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		allocation_date: DF.Date
		allocation_id: DF.Data
		allocation_status: DF.Literal["Requested", "Approved", "Confirmed", "In Use", "Completed", "Cancelled"]
		approval_date: DF.Date | None
		approved_by: DF.SmallText
		capacity: DF.Int
		caretaker_in_charge: DF.SmallText | None
		cleanup_time_required: DF.Float
		duration: DF.Float
		end_date_time: DF.Datetime
		equipment_required: DF.SmallText | None
		event: DF.SmallText
		floor_location: DF.Data | None
		furniture_required: DF.SmallText | None
		mosque: DF.SmallText
		naming_series: DF.Literal["VEN-.YYYY.-"]
		remarks: DF.SmallText | None
		requested_by: DF.SmallText
		setup_time_required: DF.Float
		special_arrangements: DF.SmallText | None
		start_date_time: DF.Datetime
		venue_name: DF.Literal["Main Prayer Hall", "Women's Section", "Conference Room", "Classroom", "Library", "Courtyard", "Parking", "Kitchen", "Wudu Area", "Multipurpose Hall", "Other"]
	# end: auto-generated types

	pass
