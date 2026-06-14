// Copyright (c) 2026, saasfarers and contributors
// For license information, please see license.txt
// ─────────────────────────────────────────────────────────────────────────────
// events.js  —  Form controller only
// List view is in events_list.js (auto-loaded by Frappe)
// ─────────────────────────────────────────────────────────────────────────────

frappe.ui.form.on("Events", {

	// ── refresh ───────────────────────────────────────────────────
	refresh: function(frm) {
		_set_field_visibility(frm);
		_add_approval_buttons(frm);
		_set_status_indicator(frm);
		toggle_volunteer_tab(frm);

		// "View Event" button — only on saved docs
		if (!frm.doc.__islocal && frm.doc.name) {
			frm.add_custom_button(__("View Event"), function() {
				if (frappe.events_list_show_summary) {
					frappe.events_list_show_summary(frm.doc.name);
				}
			}).addClass("btn-primary");
		}

		// Make child table read-only (managed only via checkboxes)
		_make_table_readonly(frm);

		// Render component checkboxes
		_render_components_selector(frm);
		toggle_registration_form(frm);

		// ── Volunteer management ────────────────────────────────
		_set_volunteer_link_filter(frm);
		render_volunteer_summary(frm);
		_add_volunteer_attendance_button(frm);

		// Re-render when Components tab clicked (Frappe lazy-renders tabs)
		frm.page.wrapper
			.find('.form-tabs-list [data-fieldname="tab_components"]')
			.off("click.comp")
			.on("click.comp", function() {
				setTimeout(() => {
					_render_components_selector(frm);
				}, 300);
			});

		// Re-render volunteer summary when Volunteers tab clicked
		frm.page.wrapper
			.find('.form-tabs-list [data-fieldname="tab_volunteers"]')
			.off("click.vol")
			.on("click.vol", function() {
				setTimeout(() => {
					render_volunteer_summary(frm);
				}, 200);
			});
	},

	// ── Field triggers ────────────────────────────────────────────
	event_category: function(frm) {
		_set_field_visibility(frm);
		if (frm.doc.event_category) {
			_auto_check_from_category(frm);
		} else {
			_render_components_selector(frm);
		}
	},

	event_type: function(frm) { _set_field_visibility(frm); },

	is_member_sponsored: function(frm) {
		_set_field_visibility(frm);
		if (!frm.doc.is_member_sponsored) frm.set_value("sponsored_by","");
		frm.set_value("created_by_type",
			frm.doc.is_member_sponsored ? "Member" : "Organization");
	},

	is_sub_event: function(frm) {
		_set_field_visibility(frm);
		if (!frm.doc.is_sub_event) frm.set_value("parent_event","");
	},

	is_off_premise: function(frm) {
		frm.toggle_display("off_premise_address", frm.doc.is_off_premise);
	},

	send_reminders: function(frm) {
		frm.toggle_display("reminder_days_before", frm.doc.send_reminders);
		frm.toggle_display("notification_channel",  frm.doc.send_reminders);
	},

	start_date: function(frm) { _validate_dates(frm); },
	end_date:   function(frm) { _validate_dates(frm); _auto_detect_multiday(frm); },

	all_day: function(frm) {
		if (frm.doc.all_day) {
			frm.set_value("start_time","00:00:00");
			frm.set_value("end_time","23:59:59");
		}
		frm.toggle_display("start_time", !frm.doc.all_day);
		frm.toggle_display("end_time",   !frm.doc.all_day);
	},
});


// ═══════════════════════════════════════════════════════════════════════════
// VOLUNTEER MANAGEMENT — child table handlers
// Re-render summary whenever rows are added/removed/edited
// ═══════════════════════════════════════════════════════════════════════════

frappe.ui.form.on("Event Volunteer Assignment", {
	role_at_event: function(frm) { render_volunteer_summary(frm); },
	volunteer:     function(frm, cdt, cdn) {
		// Optional: auto-pull volunteer's general role as default role_at_event
		let row = locals[cdt][cdn];
		if (row.volunteer && !row.role_at_event) {
			frappe.db.get_value("Volunteer", row.volunteer, "role", function(r) {
				if (r && r.role) {
					frappe.model.set_value(cdt, cdn, "role_at_event", r.role);
					render_volunteer_summary(frm);
				}
			});
		}
		render_volunteer_summary(frm);
	},
	event_volunteers_add:    function(frm) { render_volunteer_summary(frm); },
	event_volunteers_remove: function(frm) { render_volunteer_summary(frm); },
});

frappe.ui.form.on("Event Volunteer Requirement", {
	role_at_event: function(frm) { render_volunteer_summary(frm); },
	slots_needed:  function(frm) { render_volunteer_summary(frm); },
	event_volunteer_requirements_add:    function(frm) { render_volunteer_summary(frm); },
	event_volunteer_requirements_remove: function(frm) { render_volunteer_summary(frm); },
});


// ─────────────────────────────────────────────
// VOLUNTEER LINK FILTER
// Only show Volunteers with availability_status = Available
// in the Event Volunteer Assignment -> volunteer Link field
// ─────────────────────────────────────────────
function _set_volunteer_link_filter(frm) {
	frm.set_query("volunteer", "event_volunteers", function() {
		return {
			filters: {
				availability_status: "Available"
			}
		};
	});
}


// ─────────────────────────────────────────────
// VOLUNTEER SUMMARY WIDGET
// Groups Assignment rows by role_at_event, compares against
// Requirement rows' slots_needed, renders progress bars.
// ─────────────────────────────────────────────
function render_volunteer_summary(frm) {
	var wrapperField = frm.fields_dict.volunteer_summary_html;
	if (!wrapperField || !wrapperField.$wrapper) return;

	var requirements = frm.doc.event_volunteer_requirements || [];
	var assignments  = frm.doc.event_volunteers || [];

	// Count assignments per role
	var filled = {};
	assignments.forEach(function(row) {
		var role = row.role_at_event || "Unassigned";
		filled[role] = (filled[role] || 0) + 1;
	});

	var html = "";

	if (!requirements.length && !assignments.length) {
		html = "<div style='padding:14px;text-align:center;color:#9ca3af;"
			+ "font-size:12px;border:1px dashed #e2e8f0;border-radius:10px;'>"
			+ "No volunteer requirements or assignments added yet."
			+ "</div>";
	} else {
		html += "<div style='display:flex;flex-direction:column;gap:10px;"
			+ "margin-bottom:10px;'>";

		requirements.forEach(function(req) {
			var role   = req.role_at_event || "—";
			var needed = req.slots_needed || 0;
			var have   = filled[role] || 0;
			var pct    = needed ? Math.min((have / needed) * 100, 100) : (have ? 100 : 0);

			var color = "#1d7a43"; // green
			if (needed && have < needed) color = "#a86518"; // orange
			if (needed && have === 0) color = "#b54747";    // red
			if (!needed && have) color = "#0f6a5b";          // unlimited / teal

			html += "<div style='border:1px solid #e2e8f0;border-radius:10px;"
				+ "padding:10px 14px;'>"
				+ "<div style='display:flex;justify-content:space-between;"
				+ "font-size:13px;font-weight:700;color:#374151;margin-bottom:6px;'>"
				+ "<span>" + frappe.utils.escape_html(role) + "</span>"
				+ "<span>" + have + (needed ? (" / " + needed) : " (unlimited)") + "</span>"
				+ "</div>"
				+ "<div style='width:100%;height:8px;border-radius:999px;"
				+ "background:#f1f5f9;overflow:hidden;'>"
				+ "<div style='height:100%;border-radius:999px;width:" + pct + "%;"
				+ "background:" + color + ";transition:width .3s ease;'></div>"
				+ "</div>"
				+ "</div>";
		});

		// Any roles filled but with no matching requirement row
		Object.keys(filled).forEach(function(role) {
			var hasReq = requirements.some(function(r) { return r.role_at_event === role; });
			if (!hasReq) {
				html += "<div style='border:1px dashed #e2e8f0;border-radius:10px;"
					+ "padding:10px 14px;color:#9ca3af;font-size:12px;'>"
					+ frappe.utils.escape_html(role) + ": " + filled[role]
					+ " assigned (no requirement defined)"
					+ "</div>";
			}
		});

		html += "</div>";
	}

	wrapperField.$wrapper.html(
		"<div class='volunteer-summary-wrapper' style='padding:4px 2px 10px;'>"
		+ html + "</div>"
	);
}


// ─────────────────────────────────────────────
// BULK ATTENDANCE — Check-in / Check-out / No-show
// Coordinator selects volunteers from a dialog and marks status in bulk
// ─────────────────────────────────────────────
function _add_volunteer_attendance_button(frm) {
	if (frm.doc.__islocal) return; // only on saved docs
	if (!(frm.doc.event_volunteers || []).length) return;

	frm.add_custom_button(__("Mark Volunteer Attendance"), function() {
		_show_attendance_dialog(frm);
	}, __("Volunteers"));
}

function _show_attendance_dialog(frm) {
	var rows = frm.doc.event_volunteers || [];

	var rows_html = rows.map(function(row) {
		var label = frappe.utils.escape_html(row.volunteer_name || row.volunteer || "Unknown");
		var role  = frappe.utils.escape_html(row.role_at_event || "—");
		var status = row.attendance_status || "Pending";

		var status_color =
			status === "Present" ? "#1d7a43" :
			status === "Absent"  ? "#b54747" : "#6b7280";

		return "<label style='display:flex;align-items:center;gap:10px;"
			+ "padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;"
			+ "margin-bottom:6px;cursor:pointer;'>"
			+ "<input type='checkbox' class='attendance-row-check' "
			+ "data-name='" + row.name + "' style='width:16px;height:16px;'>"
			+ "<div style='flex:1;'>"
			+ "<div style='font-weight:600;font-size:13px;'>" + label + "</div>"
			+ "<div style='font-size:11px;color:#6b7280;'>" + role + "</div>"
			+ "</div>"
			+ "<span style='font-size:11px;font-weight:700;color:" + status_color + ";'>"
			+ status + "</span>"
			+ "</label>";
	}).join("");

	var dialog = new frappe.ui.Dialog({
		title: __("Mark Volunteer Attendance"),
		size: "large",
		fields: [
			{
				fieldname: "select_all",
				fieldtype: "Check",
				label: __("Select All")
			},
			{
				fieldname: "rows_html",
				fieldtype: "HTML",
				options: "<div id='attendance-rows-list'>" + rows_html + "</div>"
			}
		],
		primary_action_label: __("Check In Selected"),
		primary_action: function() {
			_run_attendance_action(frm, dialog, "check_in");
		},
		secondary_action_label: __("Check Out Selected"),
		secondary_action: function() {
			_run_attendance_action(frm, dialog, "check_out");
		},
	});

	dialog.show();

	// Select-all toggle
	dialog.fields_dict.select_all.$input.on("change", function() {
		var checked = $(this).is(":checked");
		dialog.$wrapper.find(".attendance-row-check").prop("checked", checked);
	});

	// Extra button: No-show
	dialog.$wrapper.find(".modal-footer").prepend(
		"<button class='btn btn-default btn-sm' id='btn-mark-noshow'>"
		+ __("Mark No-show") + "</button>"
	);
	dialog.$wrapper.find("#btn-mark-noshow").on("click", function() {
		_run_attendance_action(frm, dialog, "no_show");
	});
}

function _run_attendance_action(frm, dialog, action) {
	var selected = [];
	dialog.$wrapper.find(".attendance-row-check:checked").each(function() {
		selected.push($(this).data("name"));
	});

	if (!selected.length) {
		frappe.msgprint({
			message: __("Please select at least one volunteer."),
			indicator: "orange"
		});
		return;
	}

	frappe.call({
		method: "system_event_core.event.doctype.events.events.mark_volunteer_attendance",
		args: {
			docname: frm.doc.name,
			assignment_names: JSON.stringify(selected),
			action: action
		},
		freeze: true,
		freeze_message: __("Updating attendance..."),
		callback: function(r) {
			if (r.message && r.message.status === "ok") {
				frappe.show_alert({
					message: __("Updated {0} volunteer(s).", [r.message.updated]),
					indicator: "green"
				}, 3);
				dialog.hide();
				frm.reload_doc();
			}
		}
	});
}


// ─────────────────────────────────────────────
// MAKE CHILD TABLE READ-ONLY
// User manages components only via checkboxes
// ─────────────────────────────────────────────
function _make_table_readonly(frm) {
	frm.set_df_property("event_components", "read_only", 1);
	setTimeout(function() {
		var grid = frm.fields_dict["event_components"]
			&& frm.fields_dict["event_components"].grid;
		if (!grid) return;
		var $w = grid.wrapper;
		$w.find(".grid-add-row, .grid-remove-rows, .grid-remove-all-rows").hide();
		if (!$w.find(".comp-hint").length) {
			$w.append(
				"<div class='comp-hint' style='font-size:11px;color:#9ca3af;"
				+ "padding:5px 10px;font-style:italic;'>"
				+ "&#128274; Use the checkboxes above to add or remove components."
				+ "</div>"
			);
		}
	}, 400);
}


// ─────────────────────────────────────────────
// AUTO-CHECK FROM CATEGORY
// ─────────────────────────────────────────────
function _auto_check_from_category(frm) {
	frappe.call({
		method: "frappe.client.get",
		args: { doctype: "Event Category Master", name: frm.doc.event_category },
		callback: function(r) {
			if (!r.message) { _render_components_selector(frm); return; }

			var defaults = (r.message.default_components || []).filter(function(c) {
				return c.is_default;
			});

			frm.doc.event_components = [];

			defaults.forEach(function(dc) {
				var row        = frm.add_child("event_components");
				row.component  = dc.component;
				row.is_enabled = 1;
				row.phase      = dc.phase || "During Event";
			});

			if (frm.fields_dict["event_components"] &&
			    frm.fields_dict["event_components"].grid) {
				frm.fields_dict["event_components"].grid.refresh();
			}

			if (defaults.length) {
				frappe.show_alert({
					message: defaults.length + " component(s) auto-selected from category.",
					indicator: "blue",
				}, 4);
			}

			_render_components_selector(frm);
			toggle_volunteer_tab(frm);
			toggle_registration_form(frm);
		},
	});
}


// ─────────────────────────────────────────────
// COMPONENT CHECKBOX SELECTOR
// ─────────────────────────────────────────────
function _render_components_selector(frm) {
	frappe.call({
		method: "frappe.client.get_list",
		args: {
			doctype: "Event Component",
			filters: [["is_active","=",1]],
			fields: [
				"name",
				"component_name",
				"component_type",
				"is_financial",
				"requires_approval",
				"supports_timeline",
			],
			limit: 200,
			order_by: "component_type asc, component_name asc",
		},
		callback: function(r) {
			if (!r.message) return;
			var all_comps = r.message;

			var selected = (frm.doc.event_components || []).map(function(c) {
				return String(c.component);
			});

			var groups = {};
			all_comps.forEach(function(c) {
				var t = c.component_type || "Other";
				if (!groups[t]) groups[t] = [];
				groups[t].push(c);
			});

			var html = "<div class='evt-comp-root'>";

			html += "<div style='background:#f0f4ff;border-radius:8px;"
				+ "padding:9px 14px;margin-bottom:16px;"
				+ "font-size:12px;color:#4a5568;border:1px solid #c7d4f5;'>"
				+ "<b>&#9745; Check</b> to enable a component &nbsp;|&nbsp; "
				+ "<b>&#9744; Uncheck</b> to remove it &nbsp;|&nbsp; "
				+ "Table below updates automatically."
				+ "</div>";

			html += "<div class='evt-comp-scroll' "
				+ "style='max-height:360px;overflow-y:auto;"
				+ "padding-right:6px;'>";

			var type_keys = Object.keys(groups).sort();

			if (!type_keys.length) {
				html += "<div style='text-align:center;padding:30px;color:#aaa;font-size:13px;'>"
					+ "No active components found.<br>"
					+ "Please add records in <b>Event Component</b> master."
					+ "</div>";
			}

			type_keys.forEach(function(type) {
				var comps = groups[type];

				html += "<div style='margin-bottom:16px;'>"
					+ "<div style='font-size:11px;font-weight:700;color:#4a5568;"
					+ "text-transform:uppercase;letter-spacing:.8px;"
					+ "padding-bottom:6px;margin-bottom:10px;"
					+ "border-bottom:2px solid #e2e8f0;'>"
					+ frappe.utils.escape_html(type) + "</div>"
					+ "<div style='display:flex;flex-wrap:wrap;gap:10px;'>";

				comps.forEach(function(c) {
					var id     = String(c.name);
					var is_chk = selected.includes(id);
					var bg     = is_chk ? "#e8f0fe" : "#f8fafc";
					var bord   = is_chk ? "#4a86e8" : "#e2e8f0";
					var tc     = is_chk ? "#1a56db" : "#374151";

					var badges = "";
					if (c.is_financial)
						badges += "<span style='background:#fef3c7;color:#92400e;"
							+ "border-radius:4px;padding:1px 6px;font-size:10px;"
							+ "margin-right:3px;'>&#8377; Financial</span>";
					if (c.requires_approval)
						badges += "<span style='background:#dbeafe;color:#1e40af;"
							+ "border-radius:4px;padding:1px 6px;font-size:10px;"
							+ "margin-right:3px;'>Approval</span>";
					if (c.supports_timeline)
						badges += "<span style='background:#dcfce7;color:#166534;"
							+ "border-radius:4px;padding:1px 6px;font-size:10px;'>"
							+ "Timeline</span>";

					html += "<div class='evt-comp-pill'"
						+ " data-comp-id='" + id + "'"
						+ " data-comp-name='" + frappe.utils.escape_html(c.component_name) + "'"
						+ " style='display:flex;align-items:flex-start;gap:9px;"
						+ "cursor:pointer;background:" + bg + ";"
						+ "border:1.5px solid " + bord + ";"
						+ "border-radius:10px;padding:10px 14px;"
						+ "min-width:160px;max-width:220px;flex:1;"
						+ "transition:background .12s,border-color .12s;'>"
						+ "<div class='evt-chk-box' style='"
						+ "width:17px;height:17px;border-radius:4px;flex-shrink:0;"
						+ "margin-top:1px;border:2px solid " + (is_chk ? "#4a86e8" : "#d1d5db") + ";"
						+ "background:" + (is_chk ? "#4a86e8" : "#fff") + ";"
						+ "display:flex;align-items:center;justify-content:center;"
						+ "transition:background .12s,border-color .12s;'>"
						+ (is_chk
							? "<span style='color:#fff;font-size:11px;font-weight:700;'>"
							  + "&#10003;</span>"
							: "")
						+ "</div>"
						+ "<div style='min-width:0;'>"
						+ "<div class='evt-comp-label' style='font-size:12px;"
						+ "font-weight:600;color:" + tc + ";line-height:1.4;'>"
						+ frappe.utils.escape_html(c.component_name) + "</div>"
						+ (badges
							? "<div style='margin-top:5px;display:flex;flex-wrap:wrap;gap:3px;'>"
							  + badges + "</div>"
							: "")
						+ "</div>"
						+ "</div>";
				});

				html += "</div></div>";
			});

			html += "</div></div>";

			var wrapper = frm.fields_dict.components_ui_html.$wrapper;

			wrapper.html(
				"<div class='evt-comp-wrapper' style='padding:14px 18px;'>"
				+ html +
				"</div>"
			);

			wrapper.off("click.comp-toggle")
				.on("click.comp-toggle", ".evt-comp-pill", function() {
					_toggle_component(frm, $(this));
				});

			window._events_frm = frm;
		},
	});
}

function toggle_registration_form(frm) {
    let hasRegistration = (frm.doc.event_components || []).some(row => {
        return String(row.component) === "1";
    });

    frm.toggle_display("registration_form", hasRegistration);

    if (!hasRegistration) {
        frm.set_value("registration_form", "");
    }
}

// ─────────────────────────────────────────────
// VOLUNTEER TAB TOGGLE
// Show "Volunteers" tab only when "Volunteer Management"
// component (Event Component id = 5) is selected
// ─────────────────────────────────────────────
function toggle_volunteer_tab(frm) {
    let show = (frm.doc.event_components || []).some(function(r) {
        return String(r.component) === "5";
    });

    frm.toggle_display("tab_volunteers", show);

    frm.page.wrapper
        .find('.form-tabs-list [data-fieldname="tab_volunteers"]')
        .closest("li")
        .toggle(show);
}


// ─────────────────────────────────────────────
// TOGGLE COMPONENT
// ─────────────────────────────────────────────
function _toggle_component(frm, $pill) {
	var comp_id   = String($pill.attr("data-comp-id"));
	var rows      = frm.doc.event_components || [];
	var currently = rows.find(function(r) {
		return String(r.component) === comp_id;
	});
	var will_check = !currently;

	var $box   = $pill.find(".evt-chk-box");
	var $label = $pill.find(".evt-comp-label");

	if (will_check) {
		$pill.css({background:"#e8f0fe","border-color":"#4a86e8"});
		$box.css({background:"#4a86e8","border-color":"#4a86e8"})
			.html("<span style='color:#fff;font-size:11px;font-weight:700;'>&#10003;</span>");
		$label.css("color","#1a56db");
	} else {
		$pill.css({background:"#f8fafc","border-color":"#e2e8f0"});
		$box.css({background:"#fff","border-color":"#d1d5db"}).html("");
		$label.css("color","#374151");
	}

	if (will_check) {
		var exists = rows.find(function(r) {
			return String(r.component) === comp_id;
		});
		if (!exists) {
			var new_row        = frm.add_child("event_components");
			new_row.component  = comp_id;
			new_row.is_enabled = 1;
			new_row.phase      = "During Event";
		}
	} else {
		var idx = rows.findIndex(function(r) {
			return String(r.component) === comp_id;
		});
		if (idx > -1) frm.doc.event_components.splice(idx, 1);
	}

	var grid = frm.fields_dict["event_components"] &&
	           frm.fields_dict["event_components"].grid;
	if (grid) grid.refresh();
	toggle_registration_form(frm);
	toggle_volunteer_tab(frm);

	setTimeout(function() { _make_table_readonly(frm); }, 200);
}


// ─────────────────────────────────────────────
// FIELD VISIBILITY
// ─────────────────────────────────────────────
function _set_field_visibility(frm) {
	var rec = frm.doc.event_type === "Recurring";
	frm.toggle_display("sec_recurring",       rec);
	frm.toggle_display("recurrence_pattern",  rec);
	frm.toggle_display("repeat_on_days",      rec);
	frm.toggle_display("col_break_rec1",      rec);
	frm.toggle_display("recurrence_end_date", rec);
	frm.toggle_display("total_occurrences",   rec);
	frm.toggle_display("is_multi_day",        frm.doc.event_type === "Multi-day");
	frm.toggle_display("sponsored_by",        !!frm.doc.is_member_sponsored);
	frm.toggle_display("parent_event",        !!frm.doc.is_sub_event);
	frm.toggle_display("off_premise_address", !!frm.doc.is_off_premise);
	frm.toggle_display("reminder_days_before",!!frm.doc.send_reminders);
	frm.toggle_display("notification_channel",!!frm.doc.send_reminders);
	frm.toggle_display("rejection_reason",    frm.doc.approval_status === "Rejected");
	if (frm.doc.all_day) {
		frm.toggle_display("start_time", false);
		frm.toggle_display("end_time",   false);
	}
}


// ─────────────────────────────────────────────
// APPROVAL BUTTONS
// ─────────────────────────────────────────────
function _add_approval_buttons(frm) {
	if (frm.doc.docstatus === 1) return;
	var s = frm.doc.approval_status;

	if (s === "Pending") {
		frm.add_custom_button(__("Submit for Approval"), function() {
			frappe.confirm(__("Submit this Event for Admin approval?"), function() {
				frm.call("approve_as_member").then(function() { frm.reload_doc(); });
			});
		}, __("Approval"));
	}
	if (s === "Member Approved") {
		frm.add_custom_button(__("Admin Approve"), function() {
			frappe.confirm(__("Approve as Admin?"), function() {
				frm.call("approve_as_admin").then(function() { frm.reload_doc(); });
			});
		}, __("Approval"));
	}
	if (s === "Admin Approved") {
		frm.add_custom_button(__("Finance Approve"), function() {
			frappe.confirm(__("Grant Finance Approval?"), function() {
				frm.call("approve_as_finance").then(function() { frm.reload_doc(); });
			});
		}, __("Approval"));
	}
	if (["Pending","Member Approved","Admin Approved"].includes(s)) {
		frm.add_custom_button(__("Reject"), function() {
			frappe.prompt(
				[{fieldname:"reason",fieldtype:"Small Text",
				  label:"Rejection Reason",reqd:1}],
				function(vals) {
					frm.call("reject_event",{reason:vals.reason})
						.then(function() { frm.reload_doc(); });
				},
				__("Reject Event"), __("Confirm Reject")
			);
		}, __("Approval"));
	}

	setTimeout(function() {
		frm.page.wrapper.find('[data-label="Approval"]')
			.removeClass("btn-default").addClass("btn-warning");
	}, 150);
}


// ─────────────────────────────────────────────
// STATUS INDICATOR
// ─────────────────────────────────────────────
function _set_status_indicator(frm) {
	var map = {
		"Draft":"gray","Pending Approval":"orange","Approved":"green",
		"Active":"blue","Completed":"teal","Cancelled":"red"
	};
	frm.page.set_indicator(frm.doc.status, map[frm.doc.status] || "gray");
}


// ─────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────
function _validate_dates(frm) {
	if (frm.doc.start_date && frm.doc.end_date
	    && frm.doc.end_date < frm.doc.start_date) {
		frappe.msgprint({
			message: __("End Date cannot be before Start Date."),
			indicator:"red", title:__("Invalid Dates"),
		});
		frm.set_value("end_date", frm.doc.start_date);
	}
}

function _auto_detect_multiday(frm) {
	if (!frm.doc.start_date || !frm.doc.end_date) return;
	if (frm.doc.end_date > frm.doc.start_date) {
		frm.set_value("is_multi_day", 1);
		if (frm.doc.event_type === "Standalone") {
			frm.set_value("event_type","Multi-day");
			frappe.show_alert({
				message:__("Event type set to Multi-day."),indicator:"blue"
			},3);
		}
	} else {
		frm.set_value("is_multi_day", 0);
	}
}