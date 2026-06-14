import json
import frappe
from frappe import _
from frappe.model.document import Document


class RegistrationResponse(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF
        from system_event_core.event_attribute.doctype.registration_response_items.registration_response_items import (
            RegistrationResponseItems,
        )

        event: DF.Link | None
        party_master: DF.Link | None
        registration_form_name: DF.Link | None
        response: DF.Table[RegistrationResponseItems]
    # end: auto-generated types

    def validate(self):
        email = None

        for row in self.response:
            if row.question and "email" in row.question.lower():
                email = row.answer
                break

        if not email:
            return

        existing_docs = frappe.get_all(
            "Registration Response",
            filters={
                "event": self.event,
                "name": ["!=", self.name or ""],
            },
            pluck="name",
        )

        for docname in existing_docs:
            existing_doc = frappe.get_doc("Registration Response", docname)

            for row in existing_doc.response:
                if (
                    row.question
                    and "email" in row.question.lower()
                    and row.answer
                    and row.answer.strip().lower() == email.strip().lower()
                ):
                    frappe.throw(
                        _(
                            "You have already registered for this event with email <b>{0}</b>."
                        ).format(email),
                        title=_("Duplicate Registration"),
                    )


@frappe.whitelist()
def get_events_with_registration():
    events = frappe.get_all(
        "Events",
        fields=[
            "name", "event_name", "event_category", "description",
            "event_image", "start_date", "start_time", "venue",
            "off_premise_address", "is_off_premise", "event_owner",
            "registration_form", "max_registrations"
        ],
        filters={"status": ["in", ["Approved", "Active"]]}
    )

    VOLUNTEER_COMPONENT_ID = "5"  # "Volunteer Management" Event Component id

    for ev in events:
        ev["has_registration"] = bool(ev.get("registration_form"))

        count = frappe.db.count("Registration Response", {"event": ev["name"]})
        ev["registration_count"] = count

        max_reg = ev.get("max_registrations")
        if max_reg:
            remaining = max_reg - count
            ev["remaining_slots"] = remaining if remaining > 0 else 0
            ev["registration_closed"] = count >= max_reg
            ev["registration_percentage"] = round((count / max_reg) * 100, 1)
        else:
            ev["max_registrations"] = None
            ev["remaining_slots"] = None
            ev["registration_closed"] = False
            ev["registration_percentage"] = None

        # ── Volunteer info ────────────────────────────────────────
        event_doc = frappe.get_doc("Events", ev["name"])

        has_vol = any(
            str(c.component) == VOLUNTEER_COMPONENT_ID
            for c in (event_doc.event_components or [])
        )

        vol_reqs = event_doc.event_volunteer_requirements or []
        vol_assignments = event_doc.event_volunteers or []

        ev["has_volunteer_opportunity"] = has_vol
        ev["volunteer_slots_total"] = sum((r.slots_needed or 0) for r in vol_reqs)
        ev["volunteer_slots_filled"] = len(vol_assignments)

    return events

@frappe.whitelist(allow_guest=True)
def get_registration_form(registration_form_name):
    if not registration_form_name:
        frappe.throw(_("Registration Form is required."))

    doc = frappe.get_doc("Registration", registration_form_name)

    questions = []

    for q in doc.question:
        questions.append(
            {
                "label": q.get("label") or q.get("question") or "",
                "fieldtype": q.get("fieldtype") or q.get("field_type") or "Data",
                "reqd": q.get("reqd") or q.get("mandatory") or 0,
                "options": q.get("options") or "",
            }
        )

    return {
        "name": doc.name,
        "form_name": doc.form_name,
        "description": doc.description,
        "questions": questions,
    }


@frappe.whitelist(allow_guest=True)
def submit_registration(event, registration_form, answers_json):
    if not event:
        frappe.throw(_("Event is required."))

    if not registration_form:
        frappe.throw(_("Registration Form is required."))

    # Maximum registration validation
    event_doc = frappe.get_doc("Events", event)

    if event_doc.max_registrations:
        current_count = frappe.db.count(
            "Registration Response",
            {"event": event}
        )

        if current_count >= event_doc.max_registrations:
            frappe.throw(
                _("Registration Closed. Maximum registrations reached.")
            )

    answers = (
        json.loads(answers_json)
        if isinstance(answers_json, str)
        else answers_json
    )

    doc = frappe.new_doc("Registration Response")
    doc.event = event
    doc.registration_form_name = registration_form

    # Store logged-in user / party
    current_user = frappe.session.user

    if current_user and current_user != "Guest":
        party = frappe.db.get_value(
            "Party Master",
            {"user": current_user},
            "name",
        )

        if party:
            doc.party_master = party

    for a in answers:
        doc.append(
            "response",
            {
                "question": a.get("question_label", ""),
                "answer": a.get("answer", ""),
            },
        )

    doc.insert(ignore_permissions=True)

    send_registration_email(doc)

    frappe.db.commit()

    return {
        "success": True,
        "name": doc.name,
    }
def send_registration_email(doc):

    frappe.log_error(
        title="Email Debug",
        message=f"send_registration_email called | Party Master: {doc.party_master}"
    )

    email = None

    # ----------------------------------------------------
    # 1. Party Master -> User -> User Email
    # ----------------------------------------------------
    if doc.party_master:

        party_doc = frappe.get_doc(
            "Party Master",
            doc.party_master
        )

        frappe.log_error(
            title="Email Debug",
            message=f"""
Party Master: {party_doc.name}
Linked User: {party_doc.user}
Party Email: {party_doc.email}
"""
        )

        if party_doc.user:

            email = frappe.db.get_value(
                "User",
                party_doc.user,
                "email"
            )

            frappe.log_error(
                title="Email Debug",
                message=f"Email from User: {email}"
            )

        # ----------------------------------------------------
        # 2. Fallback to Party Master Email
        # ----------------------------------------------------
        if not email and party_doc.email:

            email = party_doc.email

            frappe.log_error(
                title="Email Debug",
                message=f"Email from Party Master: {email}"
            )

    # ----------------------------------------------------
    # 3. Fallback to Registration Form Email Field
    # ----------------------------------------------------
    if not email:

        for row in doc.response:

            if (
                row.question
                and "email" in row.question.lower()
            ):
                email = row.answer
                break

        frappe.log_error(
            title="Email Debug",
            message=f"Email from Form: {email}"
        )

    # ----------------------------------------------------
    # Final Validation
    # ----------------------------------------------------
    frappe.log_error(
        title="Email Debug",
        message=f"Final Recipient Email: {email}"
    )

    if not email:

        frappe.log_error(
            title="Email Debug",
            message="No email found"
        )
        return

    event_doc = frappe.get_doc(
        "Events",
        doc.event
    )

    response_rows = ""

    for row in doc.response:

        response_rows += f"""
        <tr>
            <td>{row.question}</td>
            <td>{row.answer}</td>
        </tr>
        """

    try:

        frappe.sendmail(
            recipients=[email],
            subject=f"Registration Confirmed - {event_doc.event_name}",
            message=f"""
            <h2>Registration Successful</h2>

            <p>
                Thank you for registering for the event.
            </p>

            <table border="1" cellpadding="8" cellspacing="0">
                <tr>
                    <td><b>Registration ID</b></td>
                    <td>{doc.name}</td>
                </tr>

                <tr>
                    <td><b>Event</b></td>
                    <td>{event_doc.event_name}</td>
                </tr>

                <tr>
                    <td><b>Date</b></td>
                    <td>{event_doc.start_date}</td>
                </tr>

                <tr>
                    <td><b>Venue</b></td>
                    <td>{event_doc.venue or "TBA"}</td>
                </tr>
            </table>

            <br>

            <h3>Your Submitted Responses</h3>

            <table border="1" cellpadding="8" cellspacing="0">
                <tr>
                    <th>Question</th>
                    <th>Answer</th>
                </tr>
                {response_rows}
            </table>

            <br>

            <p>Please keep this email for future reference.</p>
            """,
            delayed=False
        )

        frappe.log_error(
            title="Email Debug",
            message=f"Mail Sent Successfully To {email}"
        )

    except Exception:

        frappe.log_error(
            frappe.get_traceback(),
            "Registration Email Failed"
        )


# ─────────────────────────────────────────────────────────────────────────────
# VOLUNTEER MANAGEMENT — additions for community-events page
# ─────────────────────────────────────────────────────────────────────────────

# NOTE: Update get_events_with_registration (existing function) to ALSO
# include these 3 keys per event in the returned list:
#
#   has_volunteer_opportunity : bool
#   volunteer_slots_total     : int   (0 = unlimited)
#   volunteer_slots_filled    : int
#
# Inside the loop where you build each event dict, add:
#
#   vol_component_id = "5"  # "Volunteer Management" Event Component id
#   has_vol = any(
#       str(c.component) == vol_component_id
#       for c in (event_doc.event_components or [])
#   )
#   vol_reqs = event_doc.event_volunteer_requirements or []
#   vol_assignments = event_doc.event_volunteers or []
#
#   event_dict["has_volunteer_opportunity"] = has_vol
#   event_dict["volunteer_slots_total"] = sum(
#       (r.slots_needed or 0) for r in vol_reqs
#   )
#   event_dict["volunteer_slots_filled"] = len(vol_assignments)
#
# (Adjust variable names to match your existing loop structure —
#  event_doc is whatever frappe.get_doc("Events", ...) / dict you're using.)


@frappe.whitelist(allow_guest=True)
def get_volunteer_requirements(event: str) -> dict:
	"""
	Return the list of volunteer roles/tasks defined for this event,
	along with how many slots are needed vs already filled.
	Used by the community-events page to populate the role picker.
	"""
	doc = frappe.get_doc("Events", event)

	requirements = doc.event_volunteer_requirements or []
	assignments  = doc.event_volunteers or []

	# Count current fills per role
	filled_counts = {}
	for row in assignments:
		role = row.role_at_event
		if role:
			filled_counts[role] = filled_counts.get(role, 0) + 1

	roles = []
	for req in requirements:
		roles.append({
			"role_at_event": req.role_at_event,
			"slots_needed": req.slots_needed or 0,
			"slots_filled": filled_counts.get(req.role_at_event, 0),
		})

	return {"roles": roles}


@frappe.whitelist()
def get_current_party_master():
    """Return the logged-in user's Party Master record, if any."""
    user = frappe.session.user
    if not user or user == "Guest":
        return {"is_member": False}

    party = frappe.db.get_value(
        "Party Master", {"user": user},
        ["name", "party_name", "email", "mobile_number"],
        as_dict=True,
    )
    if not party:
        return {"is_member": False}

    return {
        "is_member": True,
        "party_master": party.name,
        "party_name": party.party_name,
        "email": party.email,
        "phone": party.phone,
        "location": "",
    }



@frappe.whitelist(allow_guest=True)
def submit_volunteer_registration(
	event: str,
	role_at_event: str = "",
	volunteer_name: str = "",
	phone_number: str = "",
	email: str = "",
	location: str = "",
	party_master: str = "",
) -> dict:
	role_at_event = (role_at_event or "").strip()
	doc = frappe.get_doc("Events", event)

	# capacity check (unchanged)
	if role_at_event:
		requirements = doc.event_volunteer_requirements or []
		req_row = next((r for r in requirements if r.role_at_event == role_at_event), None)
		if req_row and req_row.slots_needed:
			current_filled = sum(1 for a in (doc.event_volunteers or []) if a.role_at_event == role_at_event)
			if current_filled >= req_row.slots_needed:
				return {"success": False, "message": _("This role has just been filled. Please choose another role.")}

	if party_master:
		# ── Member flow: find/create internal Volunteer linked to Party Master
		existing = frappe.get_all("Volunteer", filters={"people": party_master}, limit=1, pluck="name")
		if existing:
			volunteer_id = existing[0]
		else:
			vol_doc = frappe.new_doc("Volunteer")
			vol_doc.is_external = 0
			vol_doc.people = party_master
			vol_doc.role = role_at_event or "General Volunteer"
			vol_doc.availability_status = "Available"
			vol_doc.insert(ignore_permissions=True)
			volunteer_id = vol_doc.name

		party_name = frappe.db.get_value("Party Master", party_master, "party_name") or ""
		row = doc.append("event_volunteers", {})
		row.volunteer = volunteer_id
		row.volunteer_name = party_name
		row.role_at_event = role_at_event or "General"
		row.assignment_status = "Assigned"
		row.attendance_status = "Pending"

	else:
		# ── External/guest flow (unchanged) ──────────────────────────
		volunteer_name = (volunteer_name or "").strip()
		phone_number   = (phone_number or "").strip()
		email          = (email or "").strip()
		location       = (location or "").strip()

		if not volunteer_name or not phone_number:
			return {"success": False, "message": _("Name and phone number are required.")}

		existing = frappe.get_all("Volunteer", filters={"is_external": 1, "phone_number": phone_number}, limit=1, pluck="name")
		if existing:
			volunteer_id = existing[0]
			vol_doc = frappe.get_doc("Volunteer", volunteer_id)
			vol_doc.name1 = volunteer_name
			vol_doc.email = email
			vol_doc.location = location
			if role_at_event:
				vol_doc.role = role_at_event
			vol_doc.availability_status = "Available"
			vol_doc.save(ignore_permissions=True)
		else:
			vol_doc = frappe.new_doc("Volunteer")
			vol_doc.is_external = 1
			vol_doc.name1 = volunteer_name
			vol_doc.email = email
			vol_doc.phone_number = phone_number
			vol_doc.location = location
			vol_doc.role = role_at_event or "General Volunteer"
			vol_doc.availability_status = "Available"
			vol_doc.insert(ignore_permissions=True)
			volunteer_id = vol_doc.name

		row = doc.append("event_volunteers", {})
		row.volunteer = volunteer_id
		row.volunteer_name = volunteer_name
		row.phone_number = phone_number
		row.role_at_event = role_at_event or "General"
		row.assignment_status = "Assigned"
		row.attendance_status = "Pending"

	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return {"success": True}