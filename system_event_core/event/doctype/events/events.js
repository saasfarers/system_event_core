// Copyright (c) 2026, saasfarers and contributors
// For license information, please see license.txt
// ─────────────────────────────────────────────────────────────────────────────
// events.js  —  Form controller only
// List view is in events_list.js (auto-loaded by Frappe)
// ─────────────────────────────────────────────────────────────────────────────

frappe.ui.form.on("Events", {

	// ── refresh ───────────────────────────────────────────────────
	refresh: function (frm) {
		_set_field_visibility(frm);
		_add_approval_buttons(frm);
		_set_status_indicator(frm);
		toggle_volunteer_tab(frm);
		toggle_invitations_tab(frm);

		// "View Event" button — only on saved docs
		if (!frm.doc.__islocal && frm.doc.name) {
			frm.add_custom_button(__("View Event"), function () {
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

		// ── Attendance management ──────────────────────────────
		_add_attendance_buttons(frm);

		// Re-render when Components tab clicked (Frappe lazy-renders tabs)
		frm.page.wrapper
			.find('.form-tabs-list [data-fieldname="tab_components"]')
			.off("click.comp")
			.on("click.comp", function () {
				setTimeout(() => {
					_render_components_selector(frm);
				}, 300);
			});

		// Re-render volunteer summary when Volunteers tab clicked
		frm.page.wrapper
			.find('.form-tabs-list [data-fieldname="tab_volunteers"]')
			.off("click.vol")
			.on("click.vol", function () {
				setTimeout(() => {
					render_volunteer_summary(frm);
				}, 200);
			});


		// Render invitation tab content
		render_invitation_tab(frm);

		// Re-render when Invitations tab clicked
		frm.page.wrapper
			.find('.form-tabs-list [data-fieldname="tab_invitations"]')
			.off("click.inv")
			.on("click.inv", function () {
				setTimeout(() => {
					render_invitation_tab(frm);
				}, 200);
			});
	},

	// ── Field triggers ────────────────────────────────────────────
	event_category: function (frm) {
		_set_field_visibility(frm);
		if (frm.doc.event_category) {
			_auto_check_from_category(frm);
		} else {
			_render_components_selector(frm);
		}
	},

	event_type: function (frm) { _set_field_visibility(frm); },

	is_member_sponsored: function (frm) {
		_set_field_visibility(frm);
		if (!frm.doc.is_member_sponsored) frm.set_value("sponsored_by", "");
		frm.set_value("created_by_type",
			frm.doc.is_member_sponsored ? "Member" : "Organization");
	},

	is_sub_event: function (frm) {
		_set_field_visibility(frm);
		if (!frm.doc.is_sub_event) frm.set_value("parent_event", "");
	},

	is_off_premise: function (frm) {
		frm.toggle_display("off_premise_address", frm.doc.is_off_premise);
	},

	send_reminders: function (frm) {
		frm.toggle_display("reminder_days_before", frm.doc.send_reminders);
		frm.toggle_display("notification_channel", frm.doc.send_reminders);
	},

	invitation: function (frm) {
		render_invitation_tab(frm);
	},

	start_date: function (frm) { _validate_dates(frm); },
	end_date: function (frm) { _validate_dates(frm); _auto_detect_multiday(frm); },

	all_day: function (frm) {
		if (frm.doc.all_day) {
			frm.set_value("start_time", "00:00:00");
			frm.set_value("end_time", "23:59:59");
		}
		frm.toggle_display("start_time", !frm.doc.all_day);
		frm.toggle_display("end_time", !frm.doc.all_day);
	},
});


// ═══════════════════════════════════════════════════════════════════════════
// VOLUNTEER MANAGEMENT — child table handlers
// Re-render summary whenever rows are added/removed/edited
// ═══════════════════════════════════════════════════════════════════════════

frappe.ui.form.on("Event Volunteer Assignment", {
	role_at_event: function (frm) { render_volunteer_summary(frm); },
	volunteer: function (frm, cdt, cdn) {
		// Optional: auto-pull volunteer's general role as default role_at_event
		let row = locals[cdt][cdn];
		if (row.volunteer && !row.role_at_event) {
			frappe.db.get_value("Volunteer", row.volunteer, "role", function (r) {
				if (r && r.role) {
					frappe.model.set_value(cdt, cdn, "role_at_event", r.role);
					render_volunteer_summary(frm);
				}
			});
		}
		render_volunteer_summary(frm);
	},
	event_volunteers_add: function (frm) { render_volunteer_summary(frm); },
	event_volunteers_remove: function (frm) { render_volunteer_summary(frm); },
});

frappe.ui.form.on("Event Volunteer Requirement", {
	role_at_event: function (frm) { render_volunteer_summary(frm); },
	slots_needed: function (frm) { render_volunteer_summary(frm); },
	event_volunteer_requirements_add: function (frm) { render_volunteer_summary(frm); },
	event_volunteer_requirements_remove: function (frm) { render_volunteer_summary(frm); },
});


// ─────────────────────────────────────────────
// VOLUNTEER LINK FILTER
// Only show Volunteers with availability_status = Available
// in the Event Volunteer Assignment -> volunteer Link field
// ─────────────────────────────────────────────
function _set_volunteer_link_filter(frm) {
	frm.set_query("volunteer", "event_volunteers", function () {
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
	var assignments = frm.doc.event_volunteers || [];

	// Count assignments per role
	var filled = {};
	assignments.forEach(function (row) {
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

		requirements.forEach(function (req) {
			var role = req.role_at_event || "—";
			var needed = req.slots_needed || 0;
			var have = filled[role] || 0;
			var pct = needed ? Math.min((have / needed) * 100, 100) : (have ? 100 : 0);

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
		Object.keys(filled).forEach(function (role) {
			var hasReq = requirements.some(function (r) { return r.role_at_event === role; });
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

	frm.add_custom_button(__("Mark Volunteer Attendance"), function () {
		_show_attendance_dialog(frm);
	}, __("Volunteers"));
}

function _show_attendance_dialog(frm) {
	var rows = frm.doc.event_volunteers || [];

	var rows_html = rows.map(function (row) {
		var label = frappe.utils.escape_html(row.volunteer_name || row.volunteer || "Unknown");
		var role = frappe.utils.escape_html(row.role_at_event || "—");
		var status = row.attendance_status || "Pending";

		var status_color =
			status === "Present" ? "#1d7a43" :
				status === "Absent" ? "#b54747" : "#6b7280";

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
		primary_action: function () {
			_run_attendance_action(frm, dialog, "check_in");
		},
		secondary_action_label: __("Check Out Selected"),
		secondary_action: function () {
			_run_attendance_action(frm, dialog, "check_out");
		},
	});

	dialog.show();

	// Select-all toggle
	dialog.fields_dict.select_all.$input.on("change", function () {
		var checked = $(this).is(":checked");
		dialog.$wrapper.find(".attendance-row-check").prop("checked", checked);
	});

	// Extra button: No-show
	dialog.$wrapper.find(".modal-footer").prepend(
		"<button class='btn btn-default btn-sm' id='btn-mark-noshow'>"
		+ __("Mark No-show") + "</button>"
	);
	dialog.$wrapper.find("#btn-mark-noshow").on("click", function () {
		_run_attendance_action(frm, dialog, "no_show");
	});
}

function _run_attendance_action(frm, dialog, action) {
	var selected = [];
	dialog.$wrapper.find(".attendance-row-check:checked").each(function () {
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
		callback: function (r) {
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


function _add_attendance_buttons(frm) {
	if (frm.doc.__islocal || !frm.doc.name) return;

	let hasAttendance = (frm.doc.event_components || []).some(row => {
		return String(row.component) === "2";
	});

	let hasVolunteers = (frm.doc.event_components || []).some(row => {
		return String(row.component) === "5";
	});

	if (hasAttendance) {
		frm.add_custom_button(__("Mark Participant Attendance"), function () {
			_show_event_attendance_dialog(frm);
		}, __("Attendance"));

		if (hasVolunteers && (frm.doc.event_volunteers || []).length) {
			frm.add_custom_button(__("Mark Volunteer Attendance"), function () {
				_show_attendance_dialog(frm);
			}, __("Attendance"));
		}

		frm.add_custom_button(__("View Event Attendance"), function () {
			frappe.set_route("List", "Attendance", {"event": frm.doc.name});
		}, __("Attendance"));

		frm.add_custom_button(__("New Attendance Entry"), function () {
			frappe.new_doc("Attendance", {
				"event": frm.doc.name,
				"attendance_date": frm.doc.start_date
			});
		}, __("Attendance"));
	}
}

function _show_event_attendance_dialog(frm) {
	frappe.call({
		method: "system_event_core.event.doctype.events.events.get_event_registrations",
		args: { docname: frm.doc.name },
		freeze: true,
		freeze_message: __("Loading Registrations…"),
		callback: function (r) {
			let registrations = r.message || [];
			if (!registrations.length) {
				frappe.msgprint({
					title: __("No Registrations"),
					message: __("There are no registered participants for this event yet."),
					indicator: "orange"
				});
				return;
			}

			let rows_html = registrations.map(function (row) {
				let label = frappe.utils.escape_html(row.name || "Unknown");
				let email = frappe.utils.escape_html(row.email || "—");
				let status = row.status || "Pending";

				let status_color =
					status === "Present" ? "#1d7a43" :
						status === "Absent" ? "#b54747" : "#6b7280";

				return "<label style='display:flex;align-items:center;gap:10px;"
					+ "padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;"
					+ "margin-bottom:6px;cursor:pointer;'>"
					+ "<input type='checkbox' class='event-attendance-row-check' "
					+ "data-party-master='" + (row.party_master || "") + "' "
					+ "data-name='" + label + "' "
					+ "data-is-external='" + row.is_external + "' "
					+ "data-registration-id='" + (row.registration_id || "") + "' "
					+ "style='width:16px;height:16px;'>"
					+ "<div style='flex:1;'>"
					+ "<div style='font-weight:600;font-size:13px;'>" + label + "</div>"
					+ "<div style='font-size:11px;color:#6b7280;'>" + email + "</div>"
					+ "</div>"
					+ "<span style='font-size:11px;font-weight:700;color:" + status_color + ";'>"
					+ status + "</span>"
					+ "</label>";
			}).join("");

			let dialog = new frappe.ui.Dialog({
				title: __("Mark Event Attendance"),
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
						options: "<div id='event-attendance-rows-list' style='max-height: 400px; overflow-y: auto;'>" + rows_html + "</div>"
					}
				],
				primary_action_label: __("Check In Selected"),
				primary_action: function () {
					_run_event_attendance_action(frm, dialog, "check_in");
				},
				secondary_action_label: __("Check Out Selected"),
				secondary_action: function () {
					_run_event_attendance_action(frm, dialog, "check_out");
				},
			});

			dialog.show();

			// Select-all toggle
			dialog.fields_dict.select_all.$input.on("change", function () {
				let checked = $(this).is(":checked");
				dialog.$wrapper.find(".event-attendance-row-check").prop("checked", checked);
			});

			// Extra button: Mark Absent
			dialog.$wrapper.find(".modal-footer").prepend(
				"<button class='btn btn-default btn-sm' id='btn-event-mark-absent'>"
				+ __("Mark Absent") + "</button>"
			);
			dialog.$wrapper.find("#btn-event-mark-absent").on("click", function () {
				_run_event_attendance_action(frm, dialog, "no_show");
			});
		}
	});
}

function _run_event_attendance_action(frm, dialog, action) {
	let selected = [];
	dialog.$wrapper.find(".event-attendance-row-check:checked").each(function () {
		selected.push({
			party_master: $(this).data("party-master") || null,
			name: $(this).data("name"),
			is_external: parseInt($(this).data("is-external")),
			registration_id: $(this).data("registration-id") || null
		});
	});

	if (!selected.length) {
		frappe.msgprint({
			message: __("Please select at least one participant."),
			indicator: "orange"
		});
		return;
	}

	frappe.call({
		method: "system_event_core.event.doctype.events.events.mark_event_attendance",
		args: {
			docname: frm.doc.name,
			registrations: JSON.stringify(selected),
			action: action
		},
		freeze: true,
		freeze_message: __("Updating attendance..."),
		callback: function (r) {
			if (r.message && r.message.status === "ok") {
				frappe.show_alert({
					message: __("Updated {0} participant(s) attendance.", [r.message.updated]),
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
	setTimeout(function () {
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
		callback: function (r) {
			if (!r.message) { _render_components_selector(frm); return; }

			var defaults = (r.message.default_components || []).filter(function (c) {
				return c.is_default;
			});

			if (!defaults.length) {
				_render_components_selector(frm);
				return;
			}

			// Fetch all component names in one call so we can populate
			// component_name immediately without waiting for save.
			var comp_ids = defaults.map(function (dc) { return dc.component; });
			frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: "Event Component",
					filters: [["name", "in", comp_ids]],
					fields: ["name", "component_name"],
					limit: comp_ids.length + 10,
				},
				callback: function (cr) {
					// Build a lookup: id -> component_name
					var name_map = {};
					(cr.message || []).forEach(function (c) {
						name_map[String(c.name)] = c.component_name || "";
					});

					frm.doc.event_components = [];

					defaults.forEach(function (dc) {
						var row = frm.add_child("event_components");
						frappe.model.set_value(row.doctype, row.name, {
							component: String(dc.component),
							component_name: name_map[String(dc.component)] || "",
							is_enabled: 1,
							phase: dc.phase || "During Event"
						});
					});

					var grid = frm.fields_dict["event_components"] &&
						frm.fields_dict["event_components"].grid;
					if (grid) grid.refresh();

					frappe.show_alert({
						message: defaults.length + " component(s) auto-selected from category.",
						indicator: "blue",
					}, 4);

					_render_components_selector(frm);
					toggle_volunteer_tab(frm);
					toggle_registration_form(frm);
				},
			});
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
			filters: [["is_active", "=", 1]],
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
		callback: function (r) {
			if (!r.message) return;
			var all_comps = r.message;

			var selected = (frm.doc.event_components || []).map(function (c) {
				return String(c.component);
			});

			var groups = {};
			all_comps.forEach(function (c) {
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

			type_keys.forEach(function (type) {
				var comps = groups[type];

				html += "<div style='margin-bottom:16px;'>"
					+ "<div style='font-size:11px;font-weight:700;color:#4a5568;"
					+ "text-transform:uppercase;letter-spacing:.8px;"
					+ "padding-bottom:6px;margin-bottom:10px;"
					+ "border-bottom:2px solid #e2e8f0;'>"
					+ frappe.utils.escape_html(type) + "</div>"
					+ "<div style='display:flex;flex-wrap:wrap;gap:10px;'>";

				comps.forEach(function (c) {
					var id = String(c.name);
					var is_chk = selected.includes(id);
					var bg = is_chk ? "#e8f0fe" : "#f8fafc";
					var bord = is_chk ? "#4a86e8" : "#e2e8f0";
					var tc = is_chk ? "#1a56db" : "#374151";

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
				.on("click.comp-toggle", ".evt-comp-pill", function () {
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

	frm.toggle_display("registration_details", hasRegistration);

	if (!hasRegistration) {
		if (frm.doc.registration_form) {
			frm.set_value("registration_form", "");
		}
		if (frm.doc.max_registrations) {
			frm.set_value("max_registrations", 0);
		}
	}
}

// ─────────────────────────────────────────────
// VOLUNTEER TAB TOGGLE
// Show "Volunteers" tab only when "Volunteer Management"
// component (Event Component id = 5) is selected
// ─────────────────────────────────────────────
function toggle_volunteer_tab(frm) {
	let show = (frm.doc.event_components || []).some(function (r) {
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
	var comp_id = String($pill.attr("data-comp-id"));
	var rows = frm.doc.event_components || [];
	var currently = rows.find(function (r) {
		return String(r.component) === comp_id;
	});
	var will_check = !currently;

	var $box = $pill.find(".evt-chk-box");
	var $label = $pill.find(".evt-comp-label");

	if (will_check) {
		$pill.css({ background: "#e8f0fe", "border-color": "#4a86e8" });
		$box.css({ background: "#4a86e8", "border-color": "#4a86e8" })
			.html("<span style='color:#fff;font-size:11px;font-weight:700;'>&#10003;</span>");
		$label.css("color", "#1a56db");
	} else {
		$pill.css({ background: "#f8fafc", "border-color": "#e2e8f0" });
		$box.css({ background: "#fff", "border-color": "#d1d5db" }).html("");
		$label.css("color", "#374151");
	}

	if (will_check) {
		// Read component_name from the pill's data attribute — available immediately
		// from the initial component list fetch, no server round-trip needed.
		var comp_name = $pill.attr("data-comp-name") || "";

		var exists = (frm.doc.event_components || []).find(function (r) {
			return String(r.component) === comp_id;
		});
		if (!exists) {
			// Direct assignment is the correct Frappe pattern for child tables.
			// frappe.model.set_value fails silently on unsaved (new) documents
			// because the child row isn't yet committed to the locals registry.
			var new_row = frm.add_child("event_components");
			new_row.component = comp_id;
			new_row.component_name = comp_name;
			new_row.is_enabled = 1;
			new_row.phase = "During Event";
		}
	} else {
		var idx = (frm.doc.event_components || []).findIndex(function (r) {
			return String(r.component) === comp_id;
		});
		if (idx > -1) frm.doc.event_components.splice(idx, 1);
	}

	// refresh_field is more reliable than grid.refresh() —
	// it works on both new and saved documents.
	frm.refresh_field("event_components");
	setTimeout(function () { _make_table_readonly(frm); }, 200);
	toggle_registration_form(frm);
	toggle_volunteer_tab(frm);

	// Refresh the "Send Invitations" custom button
	frm.remove_custom_button(__("Send Invitations"), __("Action"));
	let show_invitations_btn = (frm.doc.event_components || []).some(function (r) {
		return String(r.component) === "6";
	});
	if (show_invitations_btn && !frm.doc.__islocal && frm.doc.name) {
		frm.add_custom_button(__("Send Invitations"), function () {
			show_send_invitations_wizard(frm);
		}, __("Action"));
	}
}


// ─────────────────────────────────────────────
// FIELD VISIBILITY
// ─────────────────────────────────────────────
function _set_field_visibility(frm) {
	var rec = frm.doc.event_type === "Recurring";
	frm.toggle_display("sec_recurring", rec);
	frm.toggle_display("recurrence_pattern", rec);
	frm.toggle_display("repeat_on_days", rec);
	frm.toggle_display("col_break_rec1", rec);
	frm.toggle_display("recurrence_end_date", rec);
	frm.toggle_display("total_occurrences", rec);
	frm.toggle_display("is_multi_day", frm.doc.event_type === "Multi-day");
	frm.toggle_display("sponsored_by", !!frm.doc.is_member_sponsored);
	frm.toggle_display("parent_event", !!frm.doc.is_sub_event);
	frm.toggle_display("off_premise_address", !!frm.doc.is_off_premise);
	frm.toggle_display("reminder_days_before", !!frm.doc.send_reminders);
	frm.toggle_display("notification_channel", !!frm.doc.send_reminders);
	frm.toggle_display("rejection_reason", frm.doc.approval_status === "Rejected");
	if (frm.doc.all_day) {
		frm.toggle_display("start_time", false);
		frm.toggle_display("end_time", false);
	}
}


// ─────────────────────────────────────────────
// APPROVAL BUTTONS
// ─────────────────────────────────────────────
function _add_approval_buttons(frm) {
	if (frm.doc.__islocal || frm.is_new() || frm.doc.docstatus === 1) return;
	var s = frm.doc.approval_status;

	if (s === "Pending") {
		frm.add_custom_button(__("Submit for Approval"), function () {
			frappe.confirm(__("Submit this Event for Admin approval?"), function () {
				frm.call("approve_as_member").then(function () { frm.reload_doc(); });
			});
		}, __("Approval"));
	}
	if (s === "Member Approved") {
		frm.add_custom_button(__("Admin Approve"), function () {
			frappe.confirm(__("Approve as Admin?"), function () {
				frm.call("approve_as_admin").then(function () { frm.reload_doc(); });
			});
		}, __("Approval"));
	}
	if (s === "Admin Approved") {
		frm.add_custom_button(__("Finance Approve"), function () {
			frappe.confirm(__("Grant Finance Approval?"), function () {
				frm.call("approve_as_finance").then(function () { frm.reload_doc(); });
			});
		}, __("Approval"));
	}
	if (["Pending", "Member Approved", "Admin Approved"].includes(s)) {
		frm.add_custom_button(__("Reject"), function () {
			frappe.prompt(
				[{
					fieldname: "reason", fieldtype: "Small Text",
					label: "Rejection Reason", reqd: 1
				}],
				function (vals) {
					frm.call("reject_event", { reason: vals.reason })
						.then(function () { frm.reload_doc(); });
				},
				__("Reject Event"), __("Confirm Reject")
			);
		}, __("Approval"));
	}

	setTimeout(function () {
		frm.page.wrapper.find('[data-label="Approval"]')
			.removeClass("btn-default").addClass("btn-warning");
	}, 150);
}


// ─────────────────────────────────────────────
// STATUS INDICATOR
// ─────────────────────────────────────────────
function _set_status_indicator(frm) {
	var map = {
		"Draft": "gray", "Pending Approval": "orange", "Approved": "green",
		"Active": "blue", "Completed": "teal", "Cancelled": "red"
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
			indicator: "red", title: __("Invalid Dates"),
		});
		frm.set_value("end_date", frm.doc.start_date);
	}
}

function _auto_detect_multiday(frm) {
	if (!frm.doc.start_date || !frm.doc.end_date) return;
	if (frm.doc.end_date > frm.doc.start_date) {
		frm.set_value("is_multi_day", 1);
		if (frm.doc.event_type === "Standalone") {
			frm.set_value("event_type", "Multi-day");
			frappe.show_alert({
				message: __("Event type set to Multi-day."), indicator: "blue"
			}, 3);
		}
	} else {
		frm.set_value("is_multi_day", 0);
	}
}


// ─────────────────────────────────────────────
// INVITATION TABS AND WIDGETS
// ─────────────────────────────────────────────

function toggle_invitations_tab(frm) {
	let show = (frm.doc.event_components || []).some(function (r) {
		return String(r.component) === "6"; // Invitations component ID is 6
	});

	frm.toggle_display("tab_invitations", show);

	frm.page.wrapper
		.find('.form-tabs-list [data-fieldname="tab_invitations"]')
		.closest("li")
		.toggle(show);
}

function render_invitation_tab(frm) {
	// Template Preview Rendering
	let preview_wrapper = frm.fields_dict.invitation_preview_html ? frm.fields_dict.invitation_preview_html.$wrapper : null;
	if (preview_wrapper) {
		if (frm.doc.invitation) {
			preview_wrapper.html(`
				<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; display:flex; align-items:center; justify-content:space-between; margin-bottom: 20px;">
					<div>
						<div style="font-weight:700; color:#1e293b; font-size:14px;">Linked Template: <a href="/app/invitation/${frm.doc.invitation}" target="_blank" style="color:#2563eb; text-decoration:underline;">${frm.doc.invitation}</a></div>
						<div style="font-size:12px; color:#64748b; margin-top:4px;">You can preview the card or edit the template directly.</div>
					</div>
					<div style="display:flex; gap:10px;">
						<button class="btn btn-primary btn-sm btn-preview-invitation" style="display:flex; align-items:center; gap:5px;">
							<span>👁️</span> Preview Invitation
						</button>
						<button class="btn btn-default btn-sm btn-edit-invitation">
							✏️ Edit Template
						</button>
					</div>
				</div>
			`);
			
			preview_wrapper.find(".btn-preview-invitation").off("click").on("click", function() {
				frappe.model.with_doc("Invitation", frm.doc.invitation, function() {
					let temp_doc = frappe.get_doc("Invitation", frm.doc.invitation);
					_preview_invitation(temp_doc);
				});
			});
			
			preview_wrapper.find(".btn-edit-invitation").off("click").on("click", function() {
				frappe.set_route("Form", "Invitation", frm.doc.invitation);
			});
		} else {
			preview_wrapper.html(`
				<div style="background:#fffbeb; border:1px solid #fef3c7; border-radius:10px; padding:16px; display:flex; align-items:center; justify-content:space-between; margin-bottom: 20px;">
					<div>
						<div style="font-weight:700; color:#b45309; font-size:14px;">⚠️ No Invitation Template Selected</div>
						<div style="font-size:12px; color:#d97706; margin-top:4px;">Please select an invitation template above to enable template preview.</div>
					</div>
					<button class="btn btn-warning btn-sm btn-create-invitation">
						✨ Create Template
					</button>
				</div>
			`);
			
			preview_wrapper.find(".btn-create-invitation").off("click").on("click", function() {
				frappe.new_doc("Invitation", {
					event: frm.doc.name,
					title: frm.doc.event_name + " Invitation"
				});
			});
		}
	}

	// Actions Toolbar Rendering
	let actions_wrapper = frm.fields_dict.invitation_list_html ? frm.fields_dict.invitation_list_html.$wrapper : null;
	if (actions_wrapper) {
		let hasRegistration = (frm.doc.event_components || []).some(row => {
			return String(row.component) === "1"; // Registration component ID is 1
		});

		let import_btn_html = hasRegistration
			? `<button class="btn btn-default btn-sm btn-import-registrations" style="font-weight:600; margin-right:8px;">📋 Import Registrations</button>`
			: "";

		actions_wrapper.html(`
			<div style="display:flex; justify-content:space-between; align-items:center; margin-top: 15px; padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
				<div style="font-size: 13px; color: #64748b; font-weight: 500;">Use the toolbar actions to fill your recipient list in bulk.</div>
				<div style="display:flex; gap:8px;">
					<button class="btn btn-primary btn-sm btn-select-members" style="font-weight:600;">👥 Select Members</button>
					${import_btn_html}
					<button class="btn btn-success btn-sm btn-send-tab-invitations" style="font-weight:600; background:#22c55e; border-color:#22c55e; color:white;">✉️ Send Invitations Now</button>
				</div>
			</div>
		`);

		// Bind actions
		actions_wrapper.find(".btn-select-members").off("click").on("click", function() {
			let d = new frappe.ui.form.MultiSelectDialog({
				doctype: "Party Master",
				target: frm,
				setters: {
					status: "Active"
				},
				add_filters_group: 1,
				action: function(selections) {
					if (!selections || !selections.length) return;
					
					// Resolve and append to child table
					selections.forEach(function(pm_name) {
						// Avoid duplicates
						let exists = (frm.doc.event_invitations || []).some(row => row.party_member === pm_name);
						if (!exists) {
							frappe.db.get_value("Party Master", pm_name, ["party_name", "email", "mobile_number"], function(r) {
								if (r) {
									let row = frm.add_child("event_invitations");
									row.event = frm.doc.name;
									row.party_member = pm_name;
									row.invitee = r.party_name || pm_name;
									row.email = r.email || "";
									row.phone = r.mobile_number || "";
									row.rsvp_status = "Pending";
									row.invitation_channel = frm.doc.invitation_channel || "Email";
									frm.refresh_field("event_invitations");
								}
							});
						}
					});
					frappe.show_alert({ message: __("Added members to grid."), indicator: "green" });
					d.dialog.hide();
				}
			});
		});

		actions_wrapper.find(".btn-import-registrations").off("click").on("click", function() {
			frappe.call({
				method: "system_event_core.event.doctype.events.events.get_registrations_for_bulk",
				args: { event_name: frm.doc.name },
				freeze: true,
				freeze_message: __("Fetching registration records..."),
				callback: function(r) {
					let list = r.message || [];
					let added_count = 0;
					list.forEach(function(item) {
						let exists = (frm.doc.event_invitations || []).some(row => {
							return row.party_member === item.party_member || (item.email && row.email === item.email);
						});
						if (!exists) {
							let row = frm.add_child("event_invitations");
							row.event = frm.doc.name;
							row.party_member = item.party_member;
							row.invitee = item.invitee;
							row.email = item.email;
							row.phone = item.phone;
							row.rsvp_status = "Pending";
							row.invitation_channel = frm.doc.invitation_channel || "Email";
							added_count++;
						}
					});
					if (added_count > 0) {
						frm.refresh_field("event_invitations");
						frappe.show_alert({ message: __("Imported {0} registrations.", [added_count]), indicator: "green" });
					} else {
						frappe.show_alert({ message: __("All registrants are already in the list."), indicator: "orange" });
					}
				}
			});
		});

		actions_wrapper.find(".btn-send-tab-invitations").off("click").on("click", function() {
			if (!frm.doc.invitation) {
				frappe.throw(__("Please select an Invitation Template first."));
			}
			if (!frm.doc.event_invitations || frm.doc.event_invitations.length === 0) {
				frappe.throw(__("Your Recipient List is empty. Please select or add guests first."));
			}

			// Validate if scheduled date-time is set and in the future, warn if send now
			if (frm.doc.invitation_send_date) {
				let now_dt = frappe.datetime.now_datetime();
				if (frm.doc.invitation_send_date > now_dt) {
					frappe.confirm(__("This invitation is scheduled for {0}. Do you want to send it immediately anyway?", [frm.doc.invitation_send_date]), function() {
						_execute_tab_sending(frm);
					});
					return;
				}
			}

			frappe.confirm(__("Send invitations to all guests in the list?"), function() {
				_execute_tab_sending(frm);
			});
		});
	}
}

function _execute_tab_sending(frm) {
	let perform_call = function() {
		frappe.call({
			method: "system_event_core.event.doctype.events.events.send_tab_invitations",
			args: { event_name: frm.doc.name },
			freeze: true,
			freeze_message: __("Sending invitations..."),
			callback: function (r) {
				if (r.message && r.message.status === "ok") {
					frappe.show_alert({
						message: __("Sent {0} invitations successfully!", [r.message.sent_count]),
						indicator: "green"
					});
					frm.reload_doc();
				}
			}
		});
	};

	if (frm.is_dirty()) {
		frm.save().then(() => {
			perform_call();
		});
	} else {
		perform_call();
	}
}

function _preview_invitation(doc) {
	const image_html = doc.invitation_image
		? `
			<div style="text-align:center; margin-bottom:20px;">
				<img
					src="${doc.invitation_image}"
					style="
						max-width:100%;
						max-height:300px;
						border-radius:12px;
						box-shadow:0 4px 12px rgba(0,0,0,0.15);
					"
				>
			</div>
		`
		: '';

	const html = `
		<div style="
			background: linear-gradient(135deg, #fff8e7, #fffdf7);
			padding: 40px;
			border: 3px solid #d4af37;
			border-radius: 16px;
			font-family: Georgia, serif;
			color: #333;
			max-width: 800px;
			margin: auto;
		">

			<div style="text-align:center;">

				<div style="
					font-size: 14px;
					letter-spacing: 3px;
					color: #b8860b;
					margin-bottom: 10px;
					text-transform: uppercase;
				">
					Invitation
				</div>

				<h1 style="
					color: #8b0000;
					font-size: 36px;
					margin-bottom: 15px;
				">
					${doc.title || 'Invitation Title'}
				</h1>

			</div>

			${image_html}

			<div style="
				text-align:center;
				margin-top:20px;
			">

				<h3 style="
					color:#444;
					margin-bottom:20px;
					font-size:24px;
				">
					${doc.event || 'Event Name'}
				</h3>

			</div>

			<div style="
				background:#ffffff;
				padding:25px;
				border-radius:12px;
				border:1px solid #eee;
				line-height:1.8;
				font-size:16px;
				white-space:pre-wrap;
			">
				${doc.message || 'Your invitation message will appear here.'}
			</div>

			${doc.attachment ? `
				<div style="
					margin-top:25px;
					text-align:center;
				">
					<a
						href="${doc.attachment}"
						target="_blank"
						style="
							display:inline-block;
							padding:10px 20px;
							background:#0d6efd;
							color:white;
							text-decoration:none;
							border-radius:8px;
							font-weight:bold;
						"
					>
						View Attachment
					</a>
				</div>
			` : ''}

			<div style="
				margin-top:30px;
				text-align:center;
				color:#777;
				font-size:14px;
			">
				Thank you for being a part of this special occasion.
			</div>

		</div>
	`;

	let dialog = new frappe.ui.Dialog({
		title: __('Invitation Preview'),
		size: 'extra-large',
		fields: [
			{
				fieldtype: 'HTML',
				fieldname: 'preview_html'
			}
		]
	});

	dialog.show();
	dialog.fields_dict.preview_html.$wrapper.html(html);
}