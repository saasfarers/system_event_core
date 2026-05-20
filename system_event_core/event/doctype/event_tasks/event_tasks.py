# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class EventTasks(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		assigned_to: DF.Data | None
		completion_percentage: DF.Percent
		dependency_task: DF.Data | None
		end_date: DF.Datetime | None
		event: DF.Data | None
		notes: DF.SmallText | None
		start_date: DF.Datetime | None
		status: DF.Literal[None]
		task_name: DF.Data | None
		task_stage: DF.Literal["Pre-Event", "During Event", "Post-Event", "General"]
	# end: auto-generated types

	pass
