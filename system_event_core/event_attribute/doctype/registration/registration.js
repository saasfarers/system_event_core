// Copyright (c) 2026, saasfarers and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Registration", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Registration", {
    refresh(frm) {

        frm.add_custom_button("Preview Form", function() {

            frappe.set_route(
                "registration-form",
                frm.doc.name
            );

        });

    }
});