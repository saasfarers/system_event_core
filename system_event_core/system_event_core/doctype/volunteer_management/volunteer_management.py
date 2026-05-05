# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class VolunteerManagement(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		age: DF.Int
		assigned_by: DF.SmallText
		assignment_status: DF.Literal["Assigned", "Confirmed", "Completed", "Cancelled", "No-Show"]
		attendance_marked: DF.Check
		availability: DF.Literal["Full Day", "Morning", "Evening", "Weekend Only"]
		email: DF.Data
		event: DF.SmallText
		gender: DF.Literal["Male", "Female"]
		member: DF.Data | None
		mosque: DF.SmallText
		naming_series: DF.Literal["VOL-.YYYY.-"]
		performance_rating: DF.Literal["Excellent", "Good", "Average", "Needs Improvement"]
		phone: DF.Data
		previous_volunteer_experience: DF.Check
		remarks: DF.Text | None
		role_responsibility: DF.Literal["Event Coordinator", "Prayer Leader", "Security", "Parking", "Registration Desk", "Food Service", "Cleaning", "Technical Support", "First Aid", "Children Care", "Other"]
		shift_end_time: DF.Datetime
		shift_start_time: DF.Datetime
		skills: DF.SmallText | None
		task_description: DF.SmallText | None
		total_hours: DF.Float
		volunteer_assignment_date: DF.Date
		volunteer_id: DF.Data
		volunteer_name: DF.Data
	# end: auto-generated types

	pass
