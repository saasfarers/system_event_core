// Copyright (c) 2026, saasfarers and contributors
// For license information, please see license.txt

// ─────────────────────────────────────────────
// LIST VIEW SETTINGS
// ─────────────────────────────────────────────
frappe.listview_settings["Events"] = {
	add_fields: [
		"event_name", "event_category", "event_type", "status",
		"start_date", "end_date", "event_image", "approval_status"
	],

	get_indicator: function(doc) {
		var map = {
			"Draft":            ["gray",   "status,=,Draft"],
			"Pending Approval": ["orange", "status,=,Pending Approval"],
			"Approved":         ["green",  "status,=,Approved"],
			"Active":           ["blue",   "status,=,Active"],
			"Completed":        ["teal",   "status,=,Completed"],
			"Cancelled":        ["red",    "status,=,Cancelled"],
		};
		return map[doc.status] || ["gray", "status,=,Draft"];
	},

	onload: function(listview) {
		listview.page.add_inner_button(__("View Event"), function() {
			var selected = listview.get_checked_items();
			if (!selected.length) {
				frappe.msgprint({
					message: __("Please select an event from the list first."),
					title: __("No Event Selected"),
					indicator: "orange"
				});
				return;
			}
			_show_event_summary(selected[0].name);
		});
		listview.refresh();
	},

	formatters: {
		event_name: function(value, df, doc) {
			if (!value) return value;
			return "<span>" + value + "</span>"
				+ "&nbsp;<button class='btn btn-xs btn-default list-view-event-btn' "
				+ "style='margin-left:6px;font-size:11px;padding:1px 8px;"
				+ "border-radius:10px;border:1px solid #4a86e8;color:#4a86e8;"
				+ "background:#fff;cursor:pointer;'"
				+ " data-name='" + doc.name + "'"
				+ " onclick='event.stopPropagation();"
				+ "window._listview_view_event(\"" + doc.name + "\");'>"
				+ "&#128065; View</button>";
		},
	},
};

// Global handler for inline row button
window._listview_view_event = function(docname) {
	_show_event_summary(docname);
};


// ─────────────────────────────────────────────
// EVENT SUMMARY MODAL (fullscreen dialog)
// ─────────────────────────────────────────────
function _show_event_summary(docname) {
	frappe.call({
		method: "frappe.client.get",
		args: { doctype: "Events", name: docname },
		freeze: true,
		freeze_message: __("Loading Event Summary..."),
		callback: function(r) {
			if (!r.message) return;
			_render_summary_modal(r.message);
		},
	});
}

function _render_summary_modal(d) {
	var status  = d.status || "Draft";
	var appr    = d.approval_status || "Pending";
	var image   = d.event_image || "";
	var start   = d.start_date ? frappe.datetime.str_to_user(d.start_date) : "";
	var end_d   = d.end_date   ? frappe.datetime.str_to_user(d.end_date)   : "";
	var date_str = start
		? (end_d && end_d !== start ? start + " → " + end_d : start) : "—";

	var S_CLR = {
		"Draft":"#6c757d", "Pending Approval":"#fd7e14", "Approved":"#198754",
		"Active":"#0d6efd", "Completed":"#20c997", "Cancelled":"#dc3545"
	};
	var A_CLR = {
		"Pending":"#adb5bd", "Member Approved":"#0dcaf0",
		"Admin Approved":"#0d6efd", "Finance Approved":"#198754", "Rejected":"#dc3545"
	};

	var s_clr = S_CLR[status] || "#6c757d";
	var a_clr = A_CLR[appr]   || "#adb5bd";
	var bg    = image
		? "background:linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55)) center/cover,"
		  + "url(" + JSON.stringify(image) + ") center/cover no-repeat;"
		: "background:linear-gradient(135deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%);";

	// Active components
	var comps = (d.event_components || []).filter(function(c) { return c.is_enabled; });
	var comp_tags = "";
	comps.forEach(function(c) {
		var phase_color = {"Pre-Event":"#fff3cd","During Event":"#d1e7dd","Post-Event":"#cff4fc"};
		var p_bg = phase_color[c.phase] || "#e8f0fe";
		comp_tags += "<span style='display:inline-flex;align-items:center;gap:4px;"
			+ "background:" + p_bg + ";border:1px solid #c7d4f5;border-radius:20px;"
			+ "padding:4px 12px;font-size:12px;color:#3b5bdb;margin:3px;'>&#10003; "
			+ frappe.utils.escape_html(c.component || c.component_name || "")
			+ (c.phase ? " <span style='font-size:10px;opacity:.7;'>(" + c.phase + ")</span>" : "")
			+ "</span>";
	});
	if (!comp_tags) {
		comp_tags = "<span style='color:#aaa;font-size:13px;'>No components selected</span>";
	}

	// Info row helper
	function ir(icon, label, val) {
		if (!val && val !== 0) return "";
		return "<div style='display:flex;align-items:flex-start;gap:10px;padding:9px 0;"
			+ "border-bottom:1px solid #f3f3f3;'>"
			+ "<span style='font-size:15px;width:22px;text-align:center;line-height:1.6;'>"
			+ icon + "</span>"
			+ "<div><div style='font-size:10px;color:#999;font-weight:700;"
			+ "text-transform:uppercase;letter-spacing:.5px;'>" + label + "</div>"
			+ "<div style='font-size:13px;color:#333;margin-top:2px;'>"
			+ frappe.utils.escape_html(String(val)) + "</div></div></div>";
	}

	// Approval step
	function appr_step(label, match, current) {
		var order = ["Member Approved", "Admin Approved", "Finance Approved"];
		var ci = order.indexOf(current);
		var si = order.indexOf(match);
		var done = ci >= si && ci >= 0;
		var act  = ci === si - 1;
		var bgc  = done ? "#198754" : (act ? "#fd7e14" : "#dee2e6");
		var tc   = (done || act) ? "#fff" : "#999";
		var lc   = done ? "#198754" : (act ? "#fd7e14" : "#aaa");
		return "<div style='display:flex;flex-direction:column;align-items:center;gap:5px;'>"
			+ "<div style='width:36px;height:36px;border-radius:50%;background:" + bgc + ";"
			+ "display:flex;align-items:center;justify-content:center;"
			+ "font-size:16px;color:" + tc + ";font-weight:700;'>"
			+ (done ? "✓" : (act ? "…" : "○")) + "</div>"
			+ "<div style='font-size:10px;color:" + lc + ";font-weight:700;"
			+ "white-space:nowrap;'>" + label + "</div></div>";
	}

	var clean_desc = (d.description || "").replace(/<[^>]*>/g, "").trim();
	if (clean_desc.length > 500) clean_desc = clean_desc.substring(0, 500) + "…";

	// Recurrence badge
	var rec_badge = "";
	if (d.event_type === "Recurring" && d.recurrence_pattern) {
		rec_badge = "<span style='background:rgba(255,255,255,0.22);border-radius:20px;"
			+ "padding:3px 13px;font-size:12px;font-weight:700;'>🔁 "
			+ frappe.utils.escape_html(d.recurrence_pattern) + "</span>";
	}

	var html = ""
		// Hero
		+ "<div style='" + bg + "border-radius:10px 10px 0 0;padding:36px 32px;"
		+ "color:#fff;min-height:170px;display:flex;flex-direction:column;"
		+ "justify-content:flex-end;'>"
		+ "<div style='display:flex;align-items:flex-end;justify-content:space-between;"
		+ "flex-wrap:wrap;gap:12px;'><div>"
		+ "<div style='display:flex;gap:7px;margin-bottom:9px;flex-wrap:wrap;'>"
		+ (d.event_category
			? "<span style='background:rgba(255,255,255,0.22);border-radius:20px;"
			  + "padding:3px 13px;font-size:12px;font-weight:700;'>"
			  + frappe.utils.escape_html(d.event_category) + "</span>" : "")
		+ (d.event_type
			? "<span style='background:rgba(255,255,255,0.13);border-radius:20px;"
			  + "padding:3px 13px;font-size:12px;'>"
			  + frappe.utils.escape_html(d.event_type) + "</span>" : "")
		+ rec_badge
		+ "</div>"
		+ "<div style='font-size:26px;font-weight:700;line-height:1.2;"
		+ "text-shadow:0 2px 8px rgba(0,0,0,.35);'>"
		+ frappe.utils.escape_html(d.event_name || "Unnamed Event") + "</div>"
		+ "<div style='margin-top:6px;font-size:13px;opacity:.85;'>📅 " + date_str + "</div>"
		+ "</div>"
		+ "<div style='display:flex;flex-direction:column;gap:6px;align-items:flex-end;'>"
		+ "<span style='background:" + s_clr + ";border-radius:20px;padding:5px 16px;"
		+ "font-size:12px;font-weight:700;'>"
		+ frappe.utils.escape_html(status) + "</span>"
		+ "<span style='background:" + a_clr + ";border-radius:20px;padding:4px 14px;"
		+ "font-size:11px;font-weight:600;'>"
		+ frappe.utils.escape_html(appr) + "</span>"
		+ "</div></div></div>"

		// Body
		+ "<div style='padding:24px 28px;background:#fff;border-radius:0 0 10px 10px;'>"
		+ "<div style='display:grid;grid-template-columns:1fr 1fr;gap:0 28px;'>"
		+ "<div>"
		+ ir("📍", "Venue", d.venue || (d.is_off_premise ? d.off_premise_address : null))
		+ ir("👥", "Expected Attendance",
			d.expected_attendance ? d.expected_attendance + " people" : null)
		+ ir("👤", "Event Owner", d.event_owner)
		+ ir("🤝", "Sponsored By", d.sponsored_by)
		+ "</div><div>"
		+ ir("🆔", "Event ID", d.name)
		+ ir("🔖", "Event Code", d.event_code)
		+ ir("🙋", "Volunteer Coordinator", d.volunteer_coordinator)
		+ ir("🔔", "Reminders", d.send_reminders
			? (d.reminder_days_before || 0) + " days before via "
			  + (d.notification_channel || "—") : null)
		+ ir("📋", "Submitted By", d.submitted_by)
		+ "</div></div>"
		+ (clean_desc
			? "<div style='margin-top:16px;background:#f8f9fa;border-left:3px solid #4a86e8;"
			  + "border-radius:8px;padding:12px 16px;'>"
			  + "<div style='font-size:10px;color:#999;font-weight:700;"
			  + "text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;'>"
			  + "Description</div>"
			  + "<div style='font-size:13px;color:#444;line-height:1.6;'>"
			  + frappe.utils.escape_html(clean_desc) + "</div></div>" : "")
		+ "<div style='margin-top:18px;'>"
		+ "<div style='font-size:10px;color:#999;font-weight:700;text-transform:uppercase;"
		+ "letter-spacing:.5px;margin-bottom:8px;'>Active Components (" + comps.length + ")</div>"
		+ "<div style='display:flex;flex-wrap:wrap;gap:4px;'>" + comp_tags + "</div></div>"
		+ "<div style='margin-top:20px;padding-top:16px;border-top:1px solid #f0f0f0;'>"
		+ "<div style='font-size:10px;color:#999;font-weight:700;text-transform:uppercase;"
		+ "letter-spacing:.5px;margin-bottom:12px;'>Approval Flow</div>"
		+ "<div style='display:flex;align-items:center;'>"
		+ appr_step("Member",  "Member Approved",  appr)
		+ "<div style='flex:1;height:2px;background:#e9ecef;'></div>"
		+ appr_step("Admin",   "Admin Approved",   appr)
		+ "<div style='flex:1;height:2px;background:#e9ecef;'></div>"
		+ appr_step("Finance", "Finance Approved", appr)
		+ "</div></div>"
		+ "</div>";

	var dlg = new frappe.ui.Dialog({
		title: "Event Summary",
		size: "extra-large",
		fields: [{ fieldtype: "HTML", fieldname: "summary_html" }],
	});
	dlg.fields_dict.summary_html.$wrapper.html(html);
	dlg.$wrapper.find(".modal-footer").html(
		"<button class='btn btn-primary btn-sm' id='evt-edit-btn'>"
		+ "&#9998;&nbsp; Edit Event</button>"
		+ "&nbsp;&nbsp;"
		+ "<button class='btn btn-default btn-sm' id='evt-close-btn'>Close</button>"
	);
	dlg.$wrapper.find("#evt-close-btn").on("click", function() { dlg.hide(); });
	dlg.$wrapper.find("#evt-edit-btn").on("click", function() {
		dlg.hide();
		frappe.set_route("Form", "Events", d.name);
	});
	dlg.$wrapper.find(".modal-dialog").css({
		"max-width": "92vw", "width": "92vw", "margin": "30px auto"
	});
	dlg.$wrapper.find(".modal-body").css({
		"padding": "0", "max-height": "82vh", "overflow-y": "auto"
	});
	dlg.$wrapper.find(".modal-header .title-text")
		.text((d.event_name || "Event") + " — Summary");
	dlg.show();
}


// ─────────────────────────────────────────────
// FORM CONTROLLER
// ─────────────────────────────────────────────
frappe.ui.form.on("Events", {

	refresh: function(frm) {
		_set_field_visibility(frm);
		_add_approval_buttons(frm);
		_set_status_indicator(frm);

		// View Event button — only after first save
		if (!frm.doc.__islocal && frm.doc.name) {
			frm.add_custom_button(__("View Event"), function() {
				_show_event_summary(frm.doc.name);
			}).addClass("btn-primary");
		}

		// ── Recurring: Generate Instances button ──────────────
		if (!frm.doc.__islocal && frm.doc.event_type === "Recurring") {
			frm.add_custom_button(__("Generate Instances"), function() {
				_generate_recurring_instances(frm);
			}, __("Recurring"));
			frm.add_custom_button(__("View Instances"), function() {
				frappe.set_route("List", "Event Schedule Instance",
					{ "event": frm.doc.name });
			}, __("Recurring"));
			// Style the group button
			setTimeout(function() {
				frm.page.wrapper.find('[data-label="Recurring"]')
					.removeClass("btn-default").addClass("btn-info");
			}, 150);
		}

		// ── Multi-day / Sub-event: Create Sub-Event button ────
		if (!frm.doc.__islocal && frm.doc.event_type === "Multi-day") {
			frm.add_custom_button(__("Create Sub-Event"), function() {
				_create_sub_event(frm);
			}, __("Actions"));
		}

		// ── View linked child records for each component ──────
		if (!frm.doc.__islocal) {
			_add_component_goto_buttons(frm);
		}

		// Render components selector
		_render_components_selector(frm);

		// Re-render when Components tab is clicked
		frm.layout.wrapper.find('[data-fieldname="tab_components"]').off("click.comp")
			.on("click.comp", function() {
				setTimeout(function() { _render_components_selector(frm); }, 100);
			});
	},

	event_category: function(frm) {
		_set_field_visibility(frm);
		if (frm.doc.event_category) {
			_auto_check_from_category(frm);
		} else {
			_render_components_selector(frm);
		}
	},

	event_type: function(frm) {
		_set_field_visibility(frm);
		frm.refresh(); // re-draw buttons based on type
	},

	is_member_sponsored: function(frm) {
		_set_field_visibility(frm);
		if (!frm.doc.is_member_sponsored) frm.set_value("sponsored_by", "");
		frm.set_value("created_by_type",
			frm.doc.is_member_sponsored ? "Member" : "Organization");
	},

	is_sub_event: function(frm) {
		_set_field_visibility(frm);
		if (!frm.doc.is_sub_event) frm.set_value("parent_event", "");
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
			frm.set_value("start_time", "00:00:00");
			frm.set_value("end_time",   "23:59:59");
		}
		frm.toggle_display("start_time", !frm.doc.all_day);
		frm.toggle_display("end_time",   !frm.doc.all_day);
	},
});


// ─────────────────────────────────────────────
// RECURRING: Generate Instances
// ─────────────────────────────────────────────
function _generate_recurring_instances(frm) {
	frappe.confirm(
		__("Generate schedule instances for this recurring event? Existing instances for future dates will be skipped."),
		function() {
			frappe.call({
				method: "system_event_core.event.doctype.events.events.generate_recurring_instances",
				args: { docname: frm.doc.name },
				freeze: true,
				freeze_message: __("Generating instances…"),
				callback: function(r) {
					if (r.message) {
						frappe.show_alert({
							message: r.message.created + " instance(s) created.",
							indicator: "green"
						}, 5);
					}
					frm.reload_doc();
				}
			});
		}
	);
}


// ─────────────────────────────────────────────
// SUB-EVENT: Create child event
// ─────────────────────────────────────────────
function _create_sub_event(frm) {
	frappe.new_doc("Events", {
		is_sub_event: 1,
		parent_event: frm.doc.name,
		event_category: frm.doc.event_category,
		event_type: "Standalone",
		start_date: frm.doc.start_date,
		end_date: frm.doc.start_date,
		venue: frm.doc.venue,
	});
}


// ─────────────────────────────────────────────
// COMPONENT QUICK-LAUNCH BUTTONS
// ─────────────────────────────────────────────
var _COMP_ROUTE_MAP = {
	"Registration":       null,                    // no standalone doctype yet
	"Attendance":         "Event Attendance",
	"Donations":          "Event Donation",
	"Fees":               null,
	"Volunteer Management": "Event Volunteer Assignement",
	"Invitations":        "Event Invitation",
	"Venue Allocation":   null,
	"Travel Plan":        "Event Travel Plan",
	"Inventory":          "Event Inventory Usage",
	"Expense Tracking":   "Event Expense",
	"Task Workflow":      "Event Tasks",
	"Reports":            null,
	"Fund Allocation":    "Event Fund Allocation",
};

function _add_component_goto_buttons(frm) {
	var enabled = (frm.doc.event_components || []).filter(function(c) { return c.is_enabled; });
	enabled.forEach(function(c) {
		var dt = _COMP_ROUTE_MAP[c.component];
		if (!dt) return;
		frm.add_custom_button(__(c.component), function() {
			frappe.set_route("List", dt, { "event": frm.doc.name });
		}, __("Go to Component"));
	});
}


// ─────────────────────────────────────────────
// AUTO-CHECK COMPONENTS FROM CATEGORY
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

			// Clear and re-add
			frm.doc.event_components = [];
			frm.refresh_field("event_components");

			defaults.forEach(function(dc) {
				var row        = frm.add_child("event_components");
				row.component  = dc.component;
				row.is_enabled = 1;
				row.phase      = dc.phase || "During Event";
			});
			frm.refresh_field("event_components");

			if (defaults.length) {
				frappe.show_alert({
					message: defaults.length + " component(s) auto-selected from category.",
					indicator: "blue",
				}, 4);
			}
			_render_components_selector(frm, true);
		},
	});
}


// ─────────────────────────────────────────────
// COMPONENTS CHECKBOX SELECTOR (ENHANCED)
// Grouped by type | Select All / Clear All per group
// Phase picker inline | Component-level reminder
// NOTE: Event Component uses autoincrement naming
//       c.name = number (1,2,3...) → stored in row.component
//       c.component_name = display label
// ─────────────────────────────────────────────
function _render_components_selector(frm, force) {
	var $section = frm.layout.wrapper
		.find(".section-head:contains('Select Event Components')")
		.closest(".form-section");
	var already_rendered = $section.find(".evt-comp-wrapper").length > 0;

	if (already_rendered && !force) {
		// Just sync checkbox checked states with current child table
		var selected = (frm.doc.event_components || []).map(function(c) {
			return String(c.component);
		});
		$section.find("input[type='checkbox'][data-comp-id]").each(function() {
			var cb      = this;
			var comp_id = String(cb.getAttribute("data-comp-id"));
			var is_chk  = selected.includes(comp_id);
			cb.checked  = is_chk;
			_update_card_style(cb.closest("label"), is_chk);
			// Show/hide phase row
			var card = cb.closest(".evt-comp-card");
			if (card) {
				card.querySelector(".evt-phase-row") &&
					(card.querySelector(".evt-phase-row").style.display = is_chk ? "" : "none");
			}
		});
		$section.removeClass("empty-section");
		return;
	}

	frappe.call({
		method: "frappe.client.get_list",
		args: {
			doctype: "Event Component",
			filters: [["is_active", "=", 1]],
			fields: ["name", "component_name", "component_type",
			         "is_financial", "requires_approval",
			         "supports_timeline", "supports_reminders"],
			limit: 200,
			order_by: "component_type asc, component_name asc",
		},
		callback: function(r) {
			if (!r.message) return;
			var all_comps = r.message;

			var selected = (frm.doc.event_components || []).map(function(c) {
				return String(c.component);
			});

			// Group by type
			var groups = {};
			all_comps.forEach(function(c) {
				if (!groups[c.component_type]) groups[c.component_type] = [];
				groups[c.component_type].push(c);
			});

			var total = all_comps.length;
			var chk_count = selected.length;

			// ── Global header ───────────────────────────────────
			var html = "<div class='evt-comp-wrapper' style='padding:12px 16px;'>"
				+ "<div style='display:flex;align-items:center;justify-content:space-between;"
				+ "margin-bottom:14px;flex-wrap:wrap;gap:8px;'>"
				+ "<p style='font-size:12px;color:#888;margin:0;'>"
				+ "&#9745; Check components to enable for this event. "
				+ "Selecting a category auto-checks its defaults.</p>"
				+ "<div style='display:flex;gap:6px;'>"
				+ "<button class='btn btn-xs btn-default' id='evt-select-all-btn' "
				+ "onclick='window._evt_select_all(true)' "
				+ "style='font-size:11px;border-radius:6px;'>&#10003; Select All</button>"
				+ "<button class='btn btn-xs btn-default' id='evt-clear-all-btn' "
				+ "onclick='window._evt_select_all(false)' "
				+ "style='font-size:11px;border-radius:6px;'>&#10007; Clear All</button>"
				+ "</div>"
				+ "</div>";

			var type_keys = Object.keys(groups).sort();

			if (!type_keys.length) {
				html += "<div style='padding:20px;text-align:center;color:#aaa;font-size:13px;'>"
					+ "No active components found. Add them in <a href='/app/event-component'>Event Component</a> master.</div>";
			}

			type_keys.forEach(function(type) {
				var comps = groups[type];
				var group_id = "evt-grp-" + type.replace(/\s+/g, "_");
				html += "<div style='margin-bottom:22px;'>"
					// Group header row
					+ "<div style='display:flex;align-items:center;justify-content:space-between;"
					+ "margin-bottom:10px;padding-bottom:6px;"
					+ "border-bottom:2px solid #e2e8f0;'>"
					+ "<div style='font-size:11px;font-weight:700;color:#4a5568;"
					+ "text-transform:uppercase;letter-spacing:.7px;'>"
					+ frappe.utils.escape_html(type) + "</div>"
					+ "<div style='display:flex;gap:4px;'>"
					+ "<button class='btn btn-xs' "
					+ "style='font-size:10px;padding:1px 8px;border-radius:5px;"
					+ "border:1px solid #4a86e8;color:#4a86e8;background:#fff;cursor:pointer;'"
					+ " onclick='window._evt_group_select(\"" + group_id + "\",true)'>All</button>"
					+ "<button class='btn btn-xs' "
					+ "style='font-size:10px;padding:1px 8px;border-radius:5px;"
					+ "border:1px solid #aaa;color:#666;background:#fff;cursor:pointer;'"
					+ " onclick='window._evt_group_select(\"" + group_id + "\",false)'>None</button>"
					+ "</div>"
					+ "</div>"
					// Cards grid
					+ "<div id='" + group_id + "' style='display:flex;flex-wrap:wrap;gap:8px;'>";

				comps.forEach(function(c) {
					var is_chk = selected.includes(String(c.name));
					var bg     = is_chk ? "#e8f0fe" : "#f7fafc";
					var bord   = is_chk ? "#4a86e8" : "#e2e8f0";
					var tc     = is_chk ? "#1a56db" : "#4a5568";

					// Get current phase from child table
					var cur_row = (frm.doc.event_components || []).find(function(r) {
						return String(r.component) === String(c.name);
					});
					var cur_phase = cur_row ? (cur_row.phase || "During Event") : "During Event";

					var badges = "";
					if (c.is_financial)
						badges += "<span style='background:#fef3c7;color:#92400e;"
							+ "border-radius:4px;padding:1px 6px;font-size:10px;"
							+ "margin-right:2px;'>&#8377; Financial</span>";
					if (c.requires_approval)
						badges += "<span style='background:#dbeafe;color:#1e40af;"
							+ "border-radius:4px;padding:1px 6px;font-size:10px;"
							+ "margin-right:2px;'>Approval</span>";
					if (c.supports_timeline)
						badges += "<span style='background:#dcfce7;color:#166534;"
							+ "border-radius:4px;padding:1px 6px;font-size:10px;'>"
							+ "Timeline</span>";

					// Phase selector (shown only when checked)
					var phase_html = "<div class='evt-phase-row' "
						+ "style='margin-top:7px;padding-top:6px;"
						+ "border-top:1px solid #e2e8f0;"
						+ "display:" + (is_chk ? "block" : "none") + ";'>"
						+ "<label style='font-size:10px;color:#888;font-weight:700;"
						+ "text-transform:uppercase;letter-spacing:.4px;"
						+ "display:block;margin-bottom:3px;'>Phase</label>"
						+ "<select class='evt-phase-sel' data-comp-id='" + c.name + "' "
						+ "style='width:100%;font-size:11px;border:1px solid #ddd;"
						+ "border-radius:4px;padding:2px 4px;background:#fff;cursor:pointer;'"
						+ " onchange='window._evt_phase_change(this)'>"
						+ "<option value='Pre-Event'" + (cur_phase === "Pre-Event" ? " selected" : "") + ">Pre-Event</option>"
						+ "<option value='During Event'" + (cur_phase === "During Event" ? " selected" : "") + ">During Event</option>"
						+ "<option value='Post-Event'" + (cur_phase === "Post-Event" ? " selected" : "") + ">Post-Event</option>"
						+ "</select></div>";

					html += "<div class='evt-comp-card' style='min-width:160px;max-width:220px;flex:1;'>"
						+ "<label style='display:flex;flex-direction:column;"
						+ "cursor:pointer;background:" + bg + ";"
						+ "border:1.5px solid " + bord + ";"
						+ "border-radius:10px;padding:10px 13px;"
						+ "transition:background .12s,border-color .12s;"
						+ "height:100%;box-sizing:border-box;'>"
						+ "<div style='display:flex;align-items:flex-start;gap:8px;'>"
						+ "<input type='checkbox' " + (is_chk ? "checked" : "")
						+ " data-comp-id='" + c.name + "'"
						+ " data-comp-label='"
						+ frappe.utils.escape_html(c.component_name) + "'"
						+ " style='width:15px;height:15px;margin-top:2px;"
						+ "cursor:pointer;accent-color:#4a86e8;flex-shrink:0;'"
						+ " onchange='window._evt_comp_toggle(this)'>"
						+ "<div style='min-width:0;flex:1;'>"
						+ "<div style='font-size:12px;font-weight:600;color:" + tc + ";'>"
						+ frappe.utils.escape_html(c.component_name) + "</div>"
						+ (badges
							? "<div style='margin-top:4px;display:flex;"
							  + "flex-wrap:wrap;gap:2px;'>" + badges + "</div>"
							: "")
						+ "</div></div>"
						+ phase_html
						+ "</label></div>";
				});

				html += "</div></div>";
			});

			html += "</div>"; // .evt-comp-wrapper

			// Inject into "Select Event Components" section
			var $sec = frm.layout.wrapper
				.find(".section-head:contains('Select Event Components')")
				.closest(".form-section");

			if ($sec.length) {
				$sec.find(".evt-comp-wrapper").remove();
				$sec.find(".section-body").prepend(html);
				$sec.removeClass("empty-section");
				$sec.find(".section-head").show();
				$sec.find(".section-body").show();
			}
			window._events_frm = frm;
		},
	});
}


// ─────────────────────────────────────────────
// COMPONENT CARD STYLE HELPER
// ─────────────────────────────────────────────
function _update_card_style(label, checked) {
	if (!label) return;
	label.style.background  = checked ? "#e8f0fe" : "#f7fafc";
	label.style.borderColor = checked ? "#4a86e8" : "#e2e8f0";
	var title_div = label.querySelector("div > div > div:first-child");
	if (title_div) title_div.style.color = checked ? "#1a56db" : "#4a5568";
}


// ─────────────────────────────────────────────
// COMPONENT TOGGLE HANDLER
// Updates child table + phase row visibility
// ─────────────────────────────────────────────
window._evt_comp_toggle = function(checkbox) {
	var frm      = window._events_frm;
	if (!frm) return;
	var comp_id  = String(checkbox.getAttribute("data-comp-id"));
	var checked  = checkbox.checked;
	var label    = checkbox.closest("label");
	var card     = checkbox.closest(".evt-comp-card");

	// Update card visual immediately
	_update_card_style(label, checked);

	// Show/hide phase picker
	if (card) {
		var phase_row = card.querySelector(".evt-phase-row");
		if (phase_row) phase_row.style.display = checked ? "" : "none";
	}

	var rows = frm.doc.event_components || [];

	if (checked) {
		var exists = rows.find(function(r) { return String(r.component) === comp_id; });
		if (!exists) {
			// Read phase from the selector if already visible
			var phase_val = "During Event";
			if (card) {
				var sel = card.querySelector("select.evt-phase-sel");
				if (sel) phase_val = sel.value;
			}
			var row        = frm.add_child("event_components");
			row.component  = comp_id;
			row.is_enabled = 1;
			row.phase      = phase_val;
			frm.refresh_field("event_components");
		}
	} else {
		var idx = rows.findIndex(function(r) { return String(r.component) === comp_id; });
		if (idx > -1) {
			frm.doc.event_components.splice(idx, 1);
			frm.refresh_field("event_components");
		}
	}
};


// ─────────────────────────────────────────────
// PHASE CHANGE HANDLER
// ─────────────────────────────────────────────
window._evt_phase_change = function(select) {
	var frm     = window._events_frm;
	if (!frm) return;
	var comp_id = String(select.getAttribute("data-comp-id"));
	var phase   = select.value;
	var rows    = frm.doc.event_components || [];
	var row     = rows.find(function(r) { return String(r.component) === comp_id; });
	if (row) {
		row.phase = phase;
		frm.refresh_field("event_components");
	}
};


// ─────────────────────────────────────────────
// SELECT ALL / CLEAR ALL (global)
// ─────────────────────────────────────────────
window._evt_select_all = function(check) {
	var frm = window._events_frm;
	if (!frm) return;
	document.querySelectorAll("input[type='checkbox'][data-comp-id]").forEach(function(cb) {
		if (cb.checked !== check) {
			cb.checked = check;
			window._evt_comp_toggle(cb);
		}
	});
};


// ─────────────────────────────────────────────
// GROUP SELECT ALL / NONE
// ─────────────────────────────────────────────
window._evt_group_select = function(group_id, check) {
	var frm = window._events_frm;
	if (!frm) return;
	var group = document.getElementById(group_id);
	if (!group) return;
	group.querySelectorAll("input[type='checkbox'][data-comp-id]").forEach(function(cb) {
		if (cb.checked !== check) {
			cb.checked = check;
			window._evt_comp_toggle(cb);
		}
	});
};


// ─────────────────────────────────────────────
// FIELD VISIBILITY
// ─────────────────────────────────────────────
function _set_field_visibility(frm) {
	var recurring = frm.doc.event_type === "Recurring";
	frm.toggle_display("sec_recurring",       recurring);
	frm.toggle_display("recurrence_pattern",  recurring);
	frm.toggle_display("repeat_on_days",      recurring);
	frm.toggle_display("col_break_rec1",      recurring);
	frm.toggle_display("recurrence_end_date", recurring);
	frm.toggle_display("total_occurrences",   recurring);
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
	if (["Pending", "Member Approved", "Admin Approved"].includes(s)) {
		frm.add_custom_button(__("Reject"), function() {
			frappe.prompt(
				[{ fieldname: "reason", fieldtype: "Small Text",
				   label: "Rejection Reason", reqd: 1 }],
				function(vals) {
					frm.call("reject_event", { reason: vals.reason })
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