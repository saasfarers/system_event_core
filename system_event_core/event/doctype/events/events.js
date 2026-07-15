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
		toggle_donations_tab(frm);

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

		// Render donations tab content
		render_donations_dashboard(frm);

		// Re-render when Donations tab clicked
		frm.page.wrapper
			.find('.form-tabs-list [data-fieldname="tab_donations"]')
			.off("click.don")
			.on("click.don", function () {
				setTimeout(() => {
					render_donations_dashboard(frm);
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

	donation_goal: function (frm) {
		render_donations_dashboard(frm);
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
function get_component_icon(name) {
	name = (name || "").toLowerCase();
	if (name.includes("registration")) return "app_registration";
	if (name.includes("attendance")) return "fact_check";
	if (name.includes("volunteer")) return "groups";
	if (name.includes("invitation")) return "mail";
	if (name.includes("donation")) return "payments";
	if (name.includes("timeline")) return "timeline";
	return "widgets";
}

function get_component_desc(name) {
	name = (name || "").toLowerCase();
	if (name.includes("registration")) return "Manage participant registrations, sign-up forms, and responses.";
	if (name.includes("attendance")) return "Track participant and volunteer attendance, check-ins, and durations.";
	if (name.includes("volunteer")) return "Coordinate volunteer requirements, roles, and assignments.";
	if (name.includes("invitation")) return "Send bulk email invitations and track RSVP status.";
	if (name.includes("donation")) return "Collect fund donations, manage causes, and view real-time progress.";
	if (name.includes("timeline")) return "Organize a schedule timeline and milestones for the event.";
	return "Enable additional features and modules for this event.";
}

function _render_components_selector(frm) {
	if (!$("#event-components-selector-style").length) {
		$("head").append(`
			<style id="event-components-selector-style">
				@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
				
				.evt-comp-wrapper {
					padding: 16px 0;
				}
				.evt-comp-banner {
					display: flex;
					align-items: center;
					gap: 12px;
					background: #f8fafc;
					border: 1px solid #e2e8f0;
					color: #475569;
					padding: 14px 20px;
					border-radius: 12px;
					margin-bottom: 24px;
					font-size: 13px;
					font-weight: 500;
					box-shadow: 0 1px 2px rgba(0,0,0,0.02);
				}
				.evt-comp-banner .material-symbols-outlined {
					font-size: 20px;
					color: #6366f1;
					font-family: 'Material Symbols Outlined' !important;
				}
				.evt-comp-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
					gap: 20px;
				}
				.evt-comp-card {
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					background: #ffffff;
					border: 1px solid #e2e8f0;
					border-radius: 16px;
					padding: 20px;
					transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
					position: relative;
					cursor: pointer;
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
					min-height: 200px;
				}
				.evt-comp-card:hover {
					border-color: #cbd5e1;
					transform: translateY(-4px);
					box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
				}
				.evt-comp-card.active {
					border-color: #6366f1;
					background: rgba(99, 102, 241, 0.02);
					box-shadow: 0 10px 24px rgba(99, 102, 241, 0.08);
				}
				.evt-comp-card.active:hover {
					border-color: #4f46e5;
				}
				.evt-comp-header {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 16px;
				}
				.evt-comp-icon-box {
					width: 44px;
					height: 44px;
					border-radius: 12px;
					background: #f1f5f9;
					color: #64748b;
					display: flex;
					align-items: center;
					justify-content: center;
					transition: all 0.2s ease;
				}
				.evt-comp-icon-box .material-symbols-outlined {
					font-size: 22px;
					font-family: 'Material Symbols Outlined' !important;
				}
				.evt-comp-card.active .evt-comp-icon-box {
					background: #e0e7ff;
					color: #6366f1;
				}
				.evt-comp-status-dot {
					width: 10px;
					height: 10px;
					border-radius: 999px;
					background: #cbd5e1;
					transition: all 0.2s ease;
				}
				.evt-comp-card.active .evt-comp-status-dot {
					background: #10b981;
					box-shadow: 0 0 8px #10b981;
				}
				.evt-comp-body {
					flex: 1;
					margin-bottom: 20px;
				}
				.evt-comp-title {
					font-size: 15px;
					font-weight: 700;
					color: #1e293b;
					margin-bottom: 6px;
					transition: color 0.2s ease;
				}
				.evt-comp-card.active .evt-comp-title {
					color: #6366f1;
				}
				.evt-comp-desc {
					font-size: 12px;
					color: #64748b;
					line-height: 1.6;
				}
				.evt-comp-footer {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 12px;
					padding-top: 14px;
					border-top: 1px solid #f1f5f9;
				}
				.evt-comp-card.active .evt-comp-footer {
					border-top-color: rgba(99, 102, 241, 0.1);
				}
				.evt-comp-badges {
					display: flex;
					flex-wrap: wrap;
					gap: 4px;
				}
				.evt-badge {
					font-size: 9px;
					font-weight: 700;
					text-transform: uppercase;
					letter-spacing: 0.02em;
					padding: 2px 6px;
					border-radius: 4px;
				}
				.evt-badge-financial {
					background: #fffbeb;
					color: #b45309;
				}
				.evt-badge-approval {
					background: #eff6ff;
					color: #1d4ed8;
				}
				.evt-badge-timeline {
					background: #f0fdf4;
					color: #15803d;
				}
				.evt-comp-btn {
					min-height: 30px;
					padding: 0 12px;
					border-radius: 8px;
					font-size: 11px;
					font-weight: 700;
					display: inline-flex;
					align-items: center;
					gap: 4px;
					cursor: pointer;
					background: #f1f5f9;
					color: #475569;
					border: 1px solid transparent;
					transition: all 0.2s ease;
				}
				.evt-comp-card:hover .evt-comp-btn {
					background: #e2e8f0;
				}
				.evt-comp-card.active .evt-comp-btn {
					background: #6366f1;
					color: #ffffff;
				}
				.evt-comp-card.active:hover .evt-comp-btn {
					background: #4f46e5;
				}
			</style>
		`);
	}

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

			var html = "<div class='evt-comp-root'>";

			html += "<div class='evt-comp-banner'>"
				+ "<span class='material-symbols-outlined'>info</span>"
				+ "<span>Toggle event components below to enable or disable specific event features. The details on the side automatically refresh based on your selection.</span>"
				+ "</div>";

			html += "<div class='evt-comp-grid'>";

			if (!all_comps.length) {
				html += "<div style='text-align:center;padding:30px;color:#aaa;font-size:13px;'>"
					+ "No active components found.<br>"
					+ "Please add records in <b>Event Component</b> master."
					+ "</div>";
			}

			all_comps.forEach(function (c) {
				var id = String(c.name);
				var is_chk = selected.includes(id);
				var active_class = is_chk ? " active" : "";

				var icon = get_component_icon(c.component_name);
				var desc = get_component_desc(c.component_name);

				var badges = "";
				if (c.is_financial)
					badges += "<span class='evt-badge evt-badge-financial'>Financial</span>";
				if (c.requires_approval)
					badges += "<span class='evt-badge evt-badge-approval'>Approval</span>";
				if (c.supports_timeline)
					badges += "<span class='evt-badge evt-badge-timeline'>Timeline</span>";

				var btn_label = is_chk ? "Active" : "Activate";

				html += "<div class='evt-comp-card" + active_class + "'"
					+ " data-comp-id='" + id + "'"
					+ " data-comp-name='" + frappe.utils.escape_html(c.component_name) + "'>"
					+ "<div>"
					+ "<div class='evt-comp-header'>"
					+ "<div class='evt-comp-icon-box'>"
					+ "<span class='material-symbols-outlined'>" + icon + "</span>"
					+ "</div>"
					+ "<div class='evt-comp-status-dot'></div>"
					+ "</div>"
					+ "<div class='evt-comp-body'>"
					+ "<div class='evt-comp-title'>" + frappe.utils.escape_html(c.component_name) + "</div>"
					+ "<div class='evt-comp-desc'>" + desc + "</div>"
					+ "</div>"
					+ "</div>"
					+ "<div class='evt-comp-footer'>"
					+ "<div class='evt-comp-badges'>" + badges + "</div>"
					+ "<button class='evt-comp-btn'>" + btn_label + "</button>"
					+ "</div>"
					+ "</div>";
			});

			html += "</div></div>";

			var wrapper = frm.fields_dict.components_ui_html.$wrapper;

			wrapper.html(
				"<div class='evt-comp-wrapper'>"
				+ html +
				"</div>"
			);

			wrapper.off("click.comp-toggle")
				.on("click.comp-toggle", ".evt-comp-card", function () {
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

	if (will_check) {
		$pill.addClass("active");
		$pill.find(".evt-comp-btn").text("Active");
	} else {
		$pill.removeClass("active");
		$pill.find(".evt-comp-btn").text("Activate");
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
	toggle_invitations_tab(frm);
	toggle_donations_tab(frm);

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

// ─────────────────────────────────────────────
// DONATIONS TAB AND DASHBOARD
// ─────────────────────────────────────────────

function toggle_donations_tab(frm) {
	let show = (frm.doc.event_components || []).some(function (r) {
		return String(r.component) === "3"; // Donations component ID is 3
	});

	frm.toggle_display("tab_donations", show);

	frm.page.wrapper
		.find('.form-tabs-list [data-fieldname="tab_donations"]')
		.closest("li")
		.toggle(show);
}

function render_donations_dashboard(frm) {
	let wrapper = frm.fields_dict.donation_summary_html ? frm.fields_dict.donation_summary_html.$wrapper : null;
	if (!wrapper) return;

	if (frm.doc.__islocal || !frm.doc.name) {
		wrapper.html(`
			<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:20px; text-align:center; color:#64748b;">
				<h4>⚠️ Event must be saved first</h4>
				<p style="font-size:12px; margin-top:4px;">Save the event to access the Donations Dashboard.</p>
			</div>
		`);
		return;
	}

	// Fetch all donations linked to this event
	frappe.call({
		method: "frappe.client.get_list",
		args: {
			doctype: "Event Donation",
			filters: { event: frm.doc.name },
			fields: ["name", "donor_name", "amount", "payment_mode", "donation_date", "status"],
			order_by: "donation_date desc"
		},
		callback: function (r) {
			let donations = r.message || [];
			let goal = frm.doc.donation_goal || 0.0;
			if (frm.doc.donation_causes && frm.doc.donation_causes.length) {
				goal = frm.doc.donation_causes.reduce((sum, c) => sum + (c.target_amount || 0.0), 0.0);
			}

			let collected = donations
				.filter(d => d.status === "Received")
				.reduce((sum, d) => sum + (d.amount || 0), 0);
			let pct = goal > 0 ? Math.min(Math.round((collected / goal) * 100), 100) : 0;

			let currency_symbol = frappe.defaults.get_default("currency") || "INR";
			let fmt_money = (val) => {
				return format_currency(val, currency_symbol);
			};

			let causes_html = "";
			if (frm.doc.donation_causes && frm.doc.donation_causes.length) {
				let cause_cards = frm.doc.donation_causes.map(c => {
					let c_goal = c.target_amount || 0.0;
					let c_collected = c.collected_amount || 0.0;
					let c_pct = c_goal > 0 ? Math.min(Math.round((c_collected / c_goal) * 100), 100) : 0;
					return `
						<div style="flex:1; min-width:200px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
							<div style="font-weight:700; color:#334155; font-size:13px; margin-bottom:4px;">${c.cause_name}</div>
							<div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:8px; font-weight:500;">
								<span>Raised: ${fmt_money(c_collected)}</span>
								<span>Goal: ${fmt_money(c_goal)}</span>
							</div>
							<div style="background:#e2e8f0; border-radius:4px; height:6px; position:relative; overflow:hidden;">
								<div style="background:#10b981; height:100%; width:${c_pct}%; border-radius:4px;"></div>
							</div>
							<div style="font-size:11px; text-align:right; font-weight:600; color:#059669; margin-top:4px;">${c_pct}%</div>
						</div>
					`;
				}).join("");
				causes_html = `
					<div style="margin-bottom:24px;">
						<div style="font-weight:700; font-size:13px; color:#475569; margin-bottom:12px; text-transform:uppercase; letter-spacing:0.5px;">🎯 Target Breakdown</div>
						<div style="display:flex; flex-wrap:wrap; gap:16px;">
							${cause_cards}
						</div>
					</div>
				`;
			}

			let rows_html = donations.map((d, index) => `
				<tr style="border-bottom:1px solid #f1f5f9;">
					<td style="padding:10px; font-weight:600; color:#334155;">#${index+1}</td>
					<td style="padding:10px; color:#1e293b; font-weight:500;">
						<a href="/app/event-donation/${d.name}" target="_blank" style="color:#2563eb; text-decoration:underline;">${d.donor_name}</a>
					</td>
					<td style="padding:10px; color:#059669; font-weight:700;">${fmt_money(d.amount)}</td>
					<td style="padding:10px; color:#64748b;"><span class="badge" style="background:#e2e8f0; color:#475569; padding:4px 8px; border-radius:4px; font-size:11px;">${d.payment_mode}</span></td>
					<td style="padding:10px; color:#64748b; font-size:12px;">${frappe.datetime.str_to_user(d.donation_date)}</td>
					<td style="padding:10px;"><span class="badge" style="background:${d.status === 'Received' ? '#dcfce7; color:#15803d' : '#fef3c7; color:#b45309'}; padding:4px 8px; border-radius:4px; font-size:11px;">${d.status}</span></td>
				</tr>
			`).join("");

			if (!donations.length) {
				rows_html = `
					<tr>
						<td colspan="6" style="padding:30px; text-align:center; color:#94a3b8; font-style:italic; font-size:13px;">
							No donations recorded yet for this event.
						</td>
					</tr>
				`;
			}

			wrapper.html(`
				<div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
					<!-- Dashboard Summary Card -->
					<div style="background:linear-gradient(135deg, #10b981, #059669); border-radius:12px; padding:24px; color:white; box-shadow:0 4px 12px rgba(16,185,129,0.15); margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px;">
						<div style="flex:1; min-width:250px;">
							<div style="font-size:13px; text-transform:uppercase; letter-spacing:0.5px; opacity:0.85; font-weight:600;">Fundraising Target</div>
							<div style="display:flex; align-items:baseline; gap:8px; margin:4px 0 12px 0;">
								<span style="font-size:32px; font-weight:800; letter-spacing:-1px;">${fmt_money(collected)}</span>
								<span style="font-size:15px; opacity:0.85;">raised of ${fmt_money(goal)} goal</span>
							</div>
							
							<div style="background:rgba(255,255,255,0.2); border-radius:10px; height:8px; width:100%; position:relative; overflow:hidden; margin-bottom:4px;">
								<div style="background:#ffffff; height:100%; width:${pct}%; border-radius:10px; transition:width 0.4s ease;"></div>
							</div>
							<div style="font-size:12px; text-align:right; font-weight:600; opacity:0.9;">${pct}% Completed</div>
						</div>
						<div style="display:flex; flex-direction:column; gap:10px; align-items:flex-end;">
							<button class="btn btn-record-offline-donation" style="background:white; color:#059669; font-weight:700; border:none; padding:8px 16px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.1); cursor:pointer;">
								➕ Record Offline Donation
							</button>
							<button class="btn btn-refresh-donations" style="background:transparent; color:white; border:1px solid rgba(255,255,255,0.4); padding:6px 12px; border-radius:6px; font-size:11px; cursor:pointer;">
								🔄 Refresh
							</button>
						</div>
					</div>

					${causes_html}

					<!-- Donation List Grid -->
					<div style="background:white; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
						<div style="padding:16px 20px; border-bottom:1px solid #e2e8f0; background:#f8fafc; font-weight:700; color:#334155; font-size:14px;">
							📋 Donation Log
						</div>
						<div style="overflow-x:auto;">
							<table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
								<thead>
									<tr style="border-bottom:2px solid #e2e8f0; background:#f8fafc; color:#64748b; font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:0.5px;">
										<th style="padding:12px 10px;">S.No</th>
										<th style="padding:12px 10px;">Donor Name</th>
										<th style="padding:12px 10px;">Amount</th>
										<th style="padding:12px 10px;">Payment Mode</th>
										<th style="padding:12px 10px;">Date</th>
										<th style="padding:12px 10px;">Status</th>
									</tr>
								</thead>
								<tbody>
									${rows_html}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			`);

			// Bind buttons
			wrapper.find(".btn-refresh-donations").off("click").on("click", function() {
				frm.reload_doc().then(() => {
					render_donations_dashboard(frm);
				});
			});

			wrapper.find(".btn-record-offline-donation").off("click").on("click", function() {
				let d = new frappe.ui.Dialog({
					title: __("Record Offline Donation"),
					fields: [
						{
							fieldname: "is_guest",
							fieldtype: "Check",
							label: __("Guest Donor?"),
							default: 1,
							change: function() {
								let is_guest = this.get_value();
								d.set_df_property("donor", "hidden", is_guest);
								d.set_df_property("donor", "reqd", !is_guest);
								
								d.set_value("donor", "");
								d.set_value("donor_name", "");
								d.set_value("email", "");
								d.set_value("phone", "");
								
								d.set_df_property("donor_name", "read_only", !is_guest);
								d.set_df_property("email", "read_only", !is_guest);
								d.set_df_property("phone", "read_only", !is_guest);
							}
						},
						{
							fieldname: "donor",
							fieldtype: "Link",
							label: __("Registered Member"),
							options: "Party Master",
							hidden: 1,
							reqd: 0,
							change: function() {
								let donor_id = this.get_value();
								if (donor_id) {
									frappe.db.get_value("Party Master", donor_id, ["party_name", "email", "mobile_number"], function(r) {
										if (r) {
											d.set_value("donor_name", r.party_name || donor_id);
											d.set_value("email", r.email || "");
											d.set_value("phone", r.mobile_number || "");
										}
									});
								} else {
									d.set_value("donor_name", "");
									d.set_value("email", "");
									d.set_value("phone", "");
								}
							}
						},
						{
							fieldname: "donor_name",
							fieldtype: "Data",
							label: __("Donor Name"),
							reqd: 1
						},
						{
							fieldname: "email",
							fieldtype: "Data",
							label: __("Email Address")
						},
						{
							fieldname: "phone",
							fieldtype: "Data",
							label: __("Phone Number")
						},
						{
							fieldname: "fund",
							fieldtype: "Link",
							label: __("Fund Program (Optional)"),
							options: "Fund Master"
						},
						{
							fieldname: "donation_type",
							fieldtype: "Select",
							label: __("Donation Type"),
							options: (frm.doc.donation_causes || []).length 
								? frm.doc.donation_causes.map(c => c.cause_name) 
								: ["General Donation", "Building/Infrastructure Fund", "Charity/Alms", "Religious Offering", "Festival/Special Pooja", "Other"],
							default: (frm.doc.donation_causes || []).length 
								? frm.doc.donation_causes[0].cause_name 
								: "General Donation",
							reqd: 1
						},
						{
							fieldname: "amount",
							fieldtype: "Currency",
							label: __("Amount"),
							reqd: 1
						},
						{
							fieldname: "payment_mode",
							fieldtype: "Select",
							label: __("Payment Mode"),
							options: ["Cash", "Cheque", "Bank Transfer", "Other"],
							default: "Cash",
							reqd: 1
						},
						{
							fieldname: "transaction_reference",
							fieldtype: "Data",
							label: __("Transaction / Receipt Ref")
						}
					],
					primary_action_label: __("Record & Save"),
					primary_action: function(values) {
						d.hide();
						frappe.call({
							method: "system_event_core.event.doctype.events.events.record_event_donation",
							args: {
								event_name: frm.doc.name,
								donor_name: values.donor_name,
								amount: values.amount,
								payment_mode: values.payment_mode,
								email: values.email,
								phone: values.phone,
								donation_type: values.donation_type,
								transaction_reference: values.transaction_reference,
								donor: values.donor
							},
							freeze: true,
							freeze_message: __("Recording donation..."),
							callback: function(res) {
								if (res.message && res.message.status === "ok") {
									frappe.show_alert({ message: __("Donation recorded successfully!"), indicator: "green" });
									frm.reload_doc().then(() => {
										render_donations_dashboard(frm);
									});
								}
							}
						});
					}
				});
				d.show();
			});
		}
	});
}