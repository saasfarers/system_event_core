# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


def get_color(category):
    colors = {
        "Event": "#3498db",
        "Booking": "#2ecc71",
        "Class": "#f39c12",
        "Volunteer": "#9b59b6",
        "Donation": "#e74c3c",
        "Maintenance": "#34495e",
        "Other": "#95a5a6",
    }

    return colors.get(category, "#95a5a6")


class ScheduleCalendar(Document):
    def validate(self):

        # Auto Color
        if self.category:
            self.color = get_color(self.category)

        # Date Validation
        if self.start_datetime and self.end_datetime:
            if self.end_datetime <= self.start_datetime:
                frappe.throw("End Datetime must be greater than Start Datetime.")

        # Auto Status
        if not self.status:
            self.status = "Active"

        # Conflict Check
        self.validate_conflicts()

    def validate_conflicts(self):

        conflicts = frappe.get_all(
            "Event Schedule",
            filters={
                "name": ["!=", self.name],
                "status": "Active",
                "start_datetime": ["<", self.end_datetime],
                "end_datetime": [">", self.start_datetime],
            },
            fields=[
                "name",
                "title",
                "start_datetime",
                "end_datetime",
            ],
            limit=1,
        )

        if conflicts:
            conflict = conflicts[0]

            frappe.throw(
                f"""
                Schedule conflict detected.

                Existing Schedule:
                {conflict.title}

                {conflict.start_datetime}
                to
                {conflict.end_datetime}
                """
            )


@frappe.whitelist()
def get_schedule_conflicts(start_datetime, end_datetime, ignore_name=None):

    filters = {
        "status": "Active",
        "start_datetime": ["<", end_datetime],
        "end_datetime": [">", start_datetime],
    }

    if ignore_name:
        filters["name"] = ["!=", ignore_name]

    return frappe.get_all(
        "Event Schedule",
        filters=filters,
        fields=[
            "name",
            "title",
            "category",
            "status",
            "start_datetime",
            "end_datetime",
        ],
        order_by="start_datetime asc",
    )


@frappe.whitelist()
def create_schedule_entry(
    title,
    start_datetime,
    end_datetime,
    category="Other",
    reference_type=None,
    reference_name=None,
    notes=None,
):

    doc = frappe.new_doc("Event Schedule")

    doc.title = title
    doc.start_datetime = start_datetime
    doc.end_datetime = end_datetime
    doc.category = category
    doc.reference_type = reference_type
    doc.reference_name = reference_name
    doc.notes = notes
    doc.status = "Active"
    doc.color = get_color(category)

    doc.insert(ignore_permissions=True)

    return doc.name


@frappe.whitelist()
def cancel_schedule_entry(reference_type, reference_name):

    schedule = frappe.db.exists(
        "Event Schedule",
        {
            "reference_type": reference_type,
            "reference_name": reference_name,
        },
    )

    if not schedule:
        return  

    frappe.db.set_value(
        "Event Schedule",
        schedule,
        "status",
        "Cancelled",
    )


@frappe.whitelist()
def complete_schedule_entry(schedule_name):

    if not frappe.db.exists("Event Schedule", schedule_name):
        return

    frappe.db.set_value(
        "Event Schedule",
        schedule_name,
        "status",
        "Completed",
    )


def update_completed_schedules():

    schedules = frappe.get_all(
        "Event Schedule",
        filters={
            "status": "Active",
        },
        fields=[
            "name",
            "end_datetime",
        ],
    )

    current_time = now_datetime()

    for row in schedules:

        if row.end_datetime and row.end_datetime < current_time:

            frappe.db.set_value(
                "Event Schedule",
                row.name,
                "status",
                "Completed",
            )


def sync_schedule_entry(
    reference_type,
    reference_name,
    title,
    start_datetime,
    end_datetime,
    category="Other",
):

    existing = frappe.db.exists(
        "Event Schedule",
        {
            "reference_type": reference_type,
            "reference_name": reference_name,
        },
    )

    if existing:
        doc = frappe.get_doc("Event Schedule", existing)
    else:
        doc = frappe.new_doc("Event Schedule")

    doc.title = title
    doc.reference_type = reference_type
    doc.reference_name = reference_name
    doc.start_datetime = start_datetime
    doc.end_datetime = end_datetime
    doc.category = category
    doc.status = "Active"
    doc.color = get_color(category)

    doc.save(ignore_permissions=True)

    return doc.name