# # Copyright (c) 2026, saasfarers and contributors
# # For license information, please see license.txt

# # import frappe
# from frappe.model.document import Document


# class Booking(Document):
# 	# begin: auto-generated types
# 	# This code is auto-generated. Do not modify anything in this block.

# 	from typing import TYPE_CHECKING

# 	if TYPE_CHECKING:
# 		from frappe.types import DF

# 		amount: DF.Currency
# 		approval_remarks: DF.SmallText | None
# 		beneficiary_party: DF.Link | None
# 		booking_end: DF.Datetime
# 		booking_id: DF.Data | None
# 		booking_start: DF.Datetime
# 		booking_type: DF.Literal["Venue", "Service", "Rental", "Lease"]
# 		deposit_amount: DF.Currency
# 		frequency: DF.Literal["Daily", "Weekly", "Monthly"]
# 		institution: DF.Link
# 		is_recurring: DF.Check
# 		linked_event: DF.Data | None
# 		naming_series: DF.Literal["BKG-.YYYY.-####"]
# 		notes: DF.SmallText | None
# 		payment_status: DF.Literal["Pending", "Partial", "Paid"]
# 		purpose: DF.SmallText | None
# 		recurrence_end_date: DF.Date | None
# 		repeat_every_days: DF.Int
# 		repeat_on_date: DF.Int
# 		repeat_on_day: DF.Literal["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
# 		requested_by: DF.Link
# 		resource: DF.Link
# 		status: DF.Literal["Draft", "Pending", "Approved", "Rejected", "Cancelled", "Completed"]
# 	# end: auto-generated types

# 	pass



# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Booking(Document):
    # begin: auto-generated types
    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        amount: DF.Currency
        approval_remarks: DF.SmallText | None
        beneficiary_party: DF.Link | None
        booking_end: DF.Datetime
        booking_id: DF.Data | None
        booking_start: DF.Datetime
        booking_type: DF.Literal["Venue", "Service", "Rental", "Lease"]
        deposit_amount: DF.Currency
        frequency: DF.Literal["Daily", "Weekly", "Monthly"]
        institution: DF.Link
        is_recurring: DF.Check
        linked_event: DF.Data | None
        naming_series: DF.Literal["BKG-.YYYY.-####"]
        notes: DF.SmallText | None
        payment_status: DF.Literal["Pending", "Partial", "Paid"]
        purpose: DF.SmallText | None
        recurrence_end_date: DF.Date | None
        repeat_every_days: DF.Int
        repeat_on_date: DF.Int
        repeat_on_day: DF.Literal["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        requested_by: DF.Link
        resource: DF.Link
        status: DF.Literal["Draft", "Pending", "Approved", "Rejected", "Cancelled", "Completed"]
    # end: auto-generated types

    def after_insert(self):
        """Called once when booking is first created"""
        self._create_calendar_entry()

    def on_update(self):
        """Called on every save after creation — syncs title/time changes"""
        self._sync_calendar_entry()

    def on_trash(self):
        """Called when booking is deleted — removes from calendar"""
        self._cancel_calendar_entry()

    # ─── Calendar Helpers ────────────────────────────────────────────

    def _create_calendar_entry(self):
        from system_event_core.utils.schedule_calendar import create_schedule_entry

        create_schedule_entry(
            title=self._calendar_title(),
            start_datetime=self.booking_start,
            end_datetime=self.booking_end,
            category="Booking",
            reference_type="Booking",
            reference_name=self.name,
            notes=self.notes,
        )

    def _sync_calendar_entry(self):
        """Update existing calendar entry, or cancel it if booking is rejected/cancelled"""
        from system_event_core.utils.schedule_calendar import sync_schedule_entry, cancel_schedule_entry

        if self.status in ("Cancelled", "Rejected"):
            cancel_schedule_entry(
                reference_type="Booking",
                reference_name=self.name,
            )
        else:
            sync_schedule_entry(
                reference_type="Booking",
                reference_name=self.name,
                title=self._calendar_title(),
                start_datetime=self.booking_start,
                end_datetime=self.booking_end,
                category="Booking",
            )

    def _cancel_calendar_entry(self):
        from system_event_core.utils.schedule_calendar import cancel_schedule_entry

        cancel_schedule_entry(
            reference_type="Booking",
            reference_name=self.name,
        )

    def _calendar_title(self):
        return f"{self.booking_type} — {self.resource or ''} ({self.name})"