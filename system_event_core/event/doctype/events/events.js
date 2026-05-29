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

		// "View Event" button — only on saved docs
		if (!frm.doc.__islocal && frm.doc.name) {
			frm.add_custom_button(__("View Event"), function() {
				// Use the shared function from events_list.js
				if (frappe.events_list_show_summary) {
					frappe.events_list_show_summary(frm.doc.name);
				}
			}).addClass("btn-primary");
		}

		// Make child table read-only (managed only via checkboxes)
		_make_table_readonly(frm);

		// Render component checkboxes
		_render_components_selector(frm);

		// Re-render when Components tab clicked (Frappe lazy-renders tabs)
		frm.page.wrapper
	.find('.form-tabs-list [data-fieldname="tab_components"]')
	.off("click.comp")
	.on("click.comp", function() {
		setTimeout(() => {
			_render_components_selector(frm);
		}, 300);
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
// Fetch default_components from Event Category Master
// Clear all → add defaults → re-render checkboxes
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

			// Clear child table
			frm.doc.event_components = [];

			// Add default rows
			defaults.forEach(function(dc) {
				var row        = frm.add_child("event_components");
				row.component  = dc.component; // numeric autoincrement name
				row.is_enabled = 1;
				row.phase      = dc.phase || "During Event";
			});

			// Refresh grid silently
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

			// Force full re-render of checkboxes
			_render_components_selector(frm);
		},
	});
}


// ─────────────────────────────────────────────
// COMPONENT CHECKBOX SELECTOR
//
// ✅ CORRECT FLOW:
//   • Load ALL active Event Components from master
//   • Show as checkboxes grouped by type
//   • ALWAYS visible — never hidden
//   • Checked  = component is in event_components child table
//   • Uncheck  = remove from child table
//   • Check    = add to child table
//   • Child table refreshed via grid.refresh() NOT frm.refresh_field()
//     (frm.refresh_field triggers the full refresh hook → re-renders → breaks)
//
// ⚠️  Event Component uses autoincrement naming:
//   c.name          = number (1, 2, 3…)  → stored in row.component
//   c.component_name = display label
// ─────────────────────────────────────────────
function _render_components_selector(frm) {
	frappe.call({
		method: "frappe.client.get_list",
		args: {
			doctype: "Event Component",
			filters: [["is_active","=",1]],
			fields: [
				"name",            // autoincrement number
				"component_name",  // display label
				"component_type",  // group by
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

			// Build selected ID list from child table
			// NOTE: component field stores the autoincrement number as string
			var selected = (frm.doc.event_components || []).map(function(c) {
				return String(c.component);
			});

			// Group by type
			var groups = {};
			all_comps.forEach(function(c) {
				var t = c.component_type || "Other";
				if (!groups[t]) groups[t] = [];
				groups[t].push(c);
			});

			// ── Build HTML ─────────────────────────────────────
			var html = "<div class='evt-comp-root'>";

			// Sticky header hint
			html += "<div style='background:#f0f4ff;border-radius:8px;"
				+ "padding:9px 14px;margin-bottom:16px;"
				+ "font-size:12px;color:#4a5568;border:1px solid #c7d4f5;'>"
				+ "<b>&#9745; Check</b> to enable a component &nbsp;|&nbsp; "
				+ "<b>&#9744; Uncheck</b> to remove it &nbsp;|&nbsp; "
				+ "Table below updates automatically."
				+ "</div>";

			// Scrollable grid area
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

				// Group heading
				html += "<div style='margin-bottom:16px;'>"
					+ "<div style='font-size:11px;font-weight:700;color:#4a5568;"
					+ "text-transform:uppercase;letter-spacing:.8px;"
					+ "padding-bottom:6px;margin-bottom:10px;"
					+ "border-bottom:2px solid #e2e8f0;'>"
					+ frappe.utils.escape_html(type) + "</div>"
					+ "<div style='display:flex;flex-wrap:wrap;gap:10px;'>";

				comps.forEach(function(c) {
					var id     = String(c.name); // numeric autoincrement
					var is_chk = selected.includes(id);
					var bg     = is_chk ? "#e8f0fe" : "#f8fafc";
					var bord   = is_chk ? "#4a86e8" : "#e2e8f0";
					var tc     = is_chk ? "#1a56db" : "#374151";

					// Badges
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

					// Pill — uses data attributes, NO inline onclick
					// click handled via event delegation below
					html += "<div class='evt-comp-pill'"
						+ " data-comp-id='" + id + "'"
						+ " data-comp-name='" + frappe.utils.escape_html(c.component_name) + "'"
						+ " style='display:flex;align-items:flex-start;gap:9px;"
						+ "cursor:pointer;background:" + bg + ";"
						+ "border:1.5px solid " + bord + ";"
						+ "border-radius:10px;padding:10px 14px;"
						+ "min-width:160px;max-width:220px;flex:1;"
						+ "transition:background .12s,border-color .12s;'>"
						// Visual checkbox (div-based, always visible)
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
						// Label
						+ "<div style='min-width:0;'>"
						+ "<div class='evt-comp-label' style='font-size:12px;"
						+ "font-weight:600;color:" + tc + ";line-height:1.4;'>"
						+ frappe.utils.escape_html(c.component_name) + "</div>"
						+ (badges
							? "<div style='margin-top:5px;display:flex;flex-wrap:wrap;gap:3px;'>"
							  + badges + "</div>"
							: "")
						+ "</div>"
						+ "</div>"; // end pill
				});

				html += "</div></div>"; // end flex + group
			});

			html += "</div></div>"; // end scroll + root

			// ── Inject into section ────────────────────────────
			// var $section = frm.layout.wrapper
			// 	.find(".section-head:contains('Select Event Components')")
			// 	.closest(".form-section");

			// if (!$section.length) return;

			// $section.find(".evt-comp-wrapper").remove();
			// $section.find(".section-body").prepend(
			// 	"<div class='evt-comp-wrapper' style='padding:14px 18px;'>"
			// 	+ html + "</div>"
			// );

			// // Force Frappe to show the section (it marks empty sections hidden)
			// $section.removeClass("empty-section");
			// $section.find(".section-head, .section-body").show();
			var wrapper = frm.fields_dict.components_ui_html.$wrapper;

			wrapper.html(
				"<div class='evt-comp-wrapper' style='padding:14px 18px;'>"
				+ html +
				"</div>"
			);

			// ── Event delegation for pill clicks ───────────────
			// Remove old handler first to avoid duplicates
			wrapper.off("click.comp-toggle")
	.on("click.comp-toggle", ".evt-comp-pill", function() {
		_toggle_component(frm, $(this));
	});

			window._events_frm = frm;
		},
	});
}


// ─────────────────────────────────────────────
// TOGGLE COMPONENT
// Called when user clicks a component pill
// Updates visual + child table WITHOUT re-rendering the selector
// ─────────────────────────────────────────────
function _toggle_component(frm, $pill) {
	var comp_id   = String($pill.attr("data-comp-id"));
	var rows      = frm.doc.event_components || [];
	var currently = rows.find(function(r) {
		return String(r.component) === comp_id;
	});
	var will_check = !currently; // toggle

	// ── Update visual immediately ──────────────────────────────
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

	// ── Update child table ─────────────────────────────────────
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

	// ── Refresh grid ONLY (not frm.refresh_field — that triggers hooks) ──
	var grid = frm.fields_dict["event_components"] &&
	           frm.fields_dict["event_components"].grid;
	if (grid) grid.refresh();

	// Re-apply readonly after grid refresh
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