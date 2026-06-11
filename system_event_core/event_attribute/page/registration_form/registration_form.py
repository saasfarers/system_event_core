import frappe
import json


@frappe.whitelist()
def save_registration_response(registration_form, responses):

    if isinstance(responses, str):
        responses = json.loads(responses)

    doc = frappe.new_doc("Registration Response")

    doc.registration_form = registration_form

    for row in responses:

        doc.append("response", {
            "question": row.get("question"),
            "answer": row.get("answer")
        })

    doc.insert(ignore_permissions=True)

    frappe.db.commit()

    return doc.name