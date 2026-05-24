"""
Patch: Seed 13 canonical Event Components
Inserts the standard components if they don't already exist (idempotent check by component_code).
"""

import frappe


CANONICAL_COMPONENTS = [
	{
		"component_name": "Registration",
		"component_code": "REG",
		"component_type": "Administration",
		"description": "Handles participant registration, sign-ups and confirmation for the event.",
		"is_financial": 0,
		"is_active": 1,
		"supports_timeline": 1,
		"supports_reminders": 1,
		"supports_variance": 0,
		"requires_approval": 0,
	},
	{
		"component_name": "Attendance",
		"component_code": "ATT",
		"component_type": "Attendance",
		"description": "Tracks check-in and check-out of participants during the event.",
		"is_financial": 0,
		"is_active": 1,
		"supports_timeline": 1,
		"supports_reminders": 0,
		"supports_variance": 0,
		"requires_approval": 0,
	},
	{
		"component_name": "Donations",
		"component_code": "DON",
		"component_type": "Donation",
		"description": "Collects and tracks donations from members and non-members for the event.",
		"is_financial": 1,
		"is_active": 1,
		"supports_timeline": 1,
		"supports_reminders": 1,
		"supports_variance": 1,
		"requires_approval": 0,
	},
	{
		"component_name": "Fees",
		"component_code": "FEE",
		"component_type": "Financial",
		"description": "Manages fee collection from members for the event, including membership fees.",
		"is_financial": 1,
		"is_active": 1,
		"supports_timeline": 1,
		"supports_reminders": 1,
		"supports_variance": 1,
		"requires_approval": 1,
	},
	{
		"component_name": "Volunteer Management",
		"component_code": "VOL",
		"component_type": "Volunteer",
		"description": "Assigns and manages volunteers for event tasks and coordination.",
		"is_financial": 0,
		"is_active": 1,
		"supports_timeline": 1,
		"supports_reminders": 1,
		"supports_variance": 0,
		"requires_approval": 0,
	},
	{
		"component_name": "Invitations",
		"component_code": "INVT",
		"component_type": "Administration",
		"description": "Sends and tracks invitations to members and guests for the event.",
		"is_financial": 0,
		"is_active": 1,
		"supports_timeline": 1,
		"supports_reminders": 1,
		"supports_variance": 0,
		"requires_approval": 0,
	},
	{
		"component_name": "Venue Allocation",
		"component_code": "VEN",
		"component_type": "Booking",
		"description": "Manages venue booking, room allocation and setup requirements for the event.",
		"is_financial": 0,
		"is_active": 1,
		"supports_timeline": 1,
		"supports_reminders": 1,
		"supports_variance": 0,
		"requires_approval": 1,
	},
	{
		"component_name": "Travel Plan",
		"component_code": "TRV",
		"component_type": "Travel",
		"description": "Coordinates transportation and travel arrangements for participants.",
		"is_financial": 0,
		"is_active": 1,
		"supports_timeline": 1,
		"supports_reminders": 1,
		"supports_variance": 0,
		"requires_approval": 0,
	},
	{
		"component_name": "Inventory",
		"component_code": "INVY",
		"component_type": "Inventory",
		"description": "Tracks materials, supplies and inventory items used during the event.",
		"is_financial": 0,
		"is_active": 1,
		"supports_timeline": 0,
		"supports_reminders": 0,
		"supports_variance": 1,
		"requires_approval": 0,
	},
	{
		"component_name": "Expense Tracking",
		"component_code": "EXP",
		"component_type": "Financial",
		"description": "Records and monitors all expenses incurred before, during and after the event.",
		"is_financial": 1,
		"is_active": 1,
		"supports_timeline": 1,
		"supports_reminders": 0,
		"supports_variance": 1,
		"requires_approval": 1,
	},
	{
		"component_name": "Task Workflow",
		"component_code": "TSK",
		"component_type": "Administration",
		"description": "Manages checklists and task assignments to ensure all event activities are completed on time.",
		"is_financial": 0,
		"is_active": 1,
		"supports_timeline": 1,
		"supports_reminders": 1,
		"supports_variance": 0,
		"requires_approval": 0,
	},
	{
		"component_name": "Reports",
		"component_code": "RPT",
		"component_type": "Administration",
		"description": "Generates attendance, financial and activity reports after the event.",
		"is_financial": 0,
		"is_active": 1,
		"supports_timeline": 0,
		"supports_reminders": 0,
		"supports_variance": 0,
		"requires_approval": 0,
	},
	{
		"component_name": "Fund Allocation",
		"component_code": "FND",
		"component_type": "Financial",
		"description": "Allocates funds from pools or donations to specific event activities and purposes.",
		"is_financial": 1,
		"is_active": 1,
		"supports_timeline": 1,
		"supports_reminders": 0,
		"supports_variance": 1,
		"requires_approval": 1,
	},
]


def execute():
	"""Insert 13 canonical Event Components if not already present (checks by component_code)."""
	existing_codes = set(
		frappe.get_all("Event Component", pluck="component_code")
	)

	inserted = 0
	for data in CANONICAL_COMPONENTS:
		if data["component_code"] in existing_codes:
			continue
		doc = frappe.new_doc("Event Component")
		doc.update(data)
		doc.insert(ignore_permissions=True)
		inserted += 1

	if inserted:
		frappe.db.commit()
		print(f"  ✓ Seeded {inserted} Event Component(s)")
	else:
		print("  ✓ Event Components already seeded — skipped")
