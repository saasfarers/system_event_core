// Copyright (c) 2026, saasfarers and contributors
// For license information, please see license.txt
// ─────────────────────────────────────────────────────────────────────────────
// events_list.js  —  Separate list-view file (Frappe auto-loads *_list.js)
// Handles:  View Event button (per row + top bar)
//           Status indicator colors
//           Event Summary modal
// ─────────────────────────────────────────────────────────────────────────────

frappe.listview_settings["Events"] = {

	add_fields: [
		"event_name",
		"event_category",
		"event_type",
		"status",
		"start_date",
		"approval_status"
	],

	hide_name_column: false,

	get_indicator: function(doc) {

		const colors = {
			"Draft": "gray",
			"Pending Approval": "orange",
			"Approved": "green",
			"Active": "blue",
			"Completed": "teal",
			"Cancelled": "red"
		};

		return [doc.status, colors[doc.status] || "gray"];
	},

	button: {
		show(doc) {
			return true;
		},

		get_label() {
			return "View";
		},

		get_description(doc) {
			return `View ${doc.event_name}`;
		},

		action(doc) {
			frappe.events_list_show_summary(doc.name);
		}
	},

	onload(listview) {

		listview.page.add_inner_button("View Event", function() {

			let selected = listview.get_checked_items();

			if (!selected.length) {
				frappe.msgprint("Please select an event");
				return;
			}

			frappe.events_list_show_summary(selected[0].name);
		});
	}
};


// ── Event Summary Modal ──────────────────────────────────────────────────────
// Attached to frappe namespace so it's available from both list and form JS

frappe.events_list_show_summary = function(docname) {
	frappe.call({
		method: "frappe.client.get",
		args: { doctype: "Events", name: docname },
		freeze: true,
		freeze_message: __("Loading Event Summary…"),
		callback: function(r) {
			if (!r.message) return;
			frappe.events_list_render_modal(r.message);
		},
	});
};

frappe.events_list_render_modal = function(d) {
	var status = d.status || "Draft";
	var appr   = d.approval_status || "Pending";
	var image  = d.event_image || "";
	var start  = d.start_date ? frappe.datetime.str_to_user(d.start_date) : "";
	var end_d  = d.end_date   ? frappe.datetime.str_to_user(d.end_date)   : "";
	var date_str = start
		? (end_d && end_d !== start ? start + " &rarr; " + end_d : start)
		: "Not set";

	var STATUS_COLOR = {
		"Draft":"#6c757d","Pending Approval":"#fd7e14","Approved":"#198754",
		"Active":"#0d6efd","Completed":"#20c997","Cancelled":"#dc3545",
	};
	var APPR_COLOR = {
		"Pending":"#adb5bd","Member Approved":"#0dcaf0",
		"Admin Approved":"#0d6efd","Finance Approved":"#198754","Rejected":"#dc3545",
	};

	var s_clr = STATUS_COLOR[status] || "#6c757d";
	var a_clr = APPR_COLOR[appr]     || "#adb5bd";

	var bg = image
		? "background:linear-gradient(rgba(0,0,0,0.52),rgba(0,0,0,0.52)) center/cover,"
		  + "url(" + JSON.stringify(image) + ") center/cover no-repeat;"
		: "background:linear-gradient(135deg,#0f3460 0%,#16213e 60%,#1a1a2e 100%);";

	// ── Active components ────────────────────────────────────────
	var comps = (d.event_components || []).filter(function(c){ return c.is_enabled; });
	var comp_html = "";
	if (comps.length) {
		comps.forEach(function(c) {
			comp_html += "<span style='display:inline-flex;align-items:center;gap:5px;"
				+ "background:#e8f0fe;border:1px solid #c7d4f5;border-radius:20px;"
				+ "padding:4px 13px;font-size:12px;color:#1a56db;margin:3px;'>"
				+ "<span style='color:#198754;font-weight:700;'>&#10003;</span> "
				+ frappe.utils.escape_html(c.component) + "</span>";
		});
	} else {
		comp_html = "<span style='color:#aaa;font-size:13px;font-style:italic;'>"
			+ "No components selected</span>";
	}

	// ── Info row helper ──────────────────────────────────────────
	function row(icon, label, val) {
		if (!val && val !== 0) return "";
		return "<tr>"
			+ "<td style='padding:8px 6px;vertical-align:top;font-size:16px;width:28px;'>"
			+ icon + "</td>"
			+ "<td style='padding:8px 6px;vertical-align:top;width:130px;"
			+ "font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;"
			+ "letter-spacing:.5px;white-space:nowrap;'>" + label + "</td>"
			+ "<td style='padding:8px 6px;vertical-align:top;font-size:13px;"
			+ "color:#1f2937;font-weight:500;'>"
			+ frappe.utils.escape_html(String(val)) + "</td>"
			+ "</tr>";
	}

	// ── Approval step ────────────────────────────────────────────
	function step(label, match, current) {
		var order = ["Member Approved","Admin Approved","Finance Approved"];
		var ci = order.indexOf(current), si = order.indexOf(match);
		var done = ci >= si && ci >= 0, act = ci === si - 1;
		var bgc  = done ? "#198754" : (act ? "#f59e0b" : "#e5e7eb");
		var tc   = (done||act) ? "#fff" : "#9ca3af";
		var lc   = done ? "#198754" : (act ? "#f59e0b" : "#9ca3af");
		return "<div style='display:flex;flex-direction:column;align-items:center;gap:6px;'>"
			+ "<div style='width:38px;height:38px;border-radius:50%;"
			+ "background:" + bgc + ";display:flex;align-items:center;"
			+ "justify-content:center;font-size:17px;color:" + tc + ";font-weight:700;"
			+ "box-shadow:0 2px 6px rgba(0,0,0,.12);'>"
			+ (done ? "&#10003;" : (act ? "&#8230;" : "&#9675;")) + "</div>"
			+ "<div style='font-size:10px;color:" + lc + ";font-weight:700;"
			+ "text-transform:uppercase;letter-spacing:.4px;white-space:nowrap;'>"
			+ label + "</div></div>";
	}

	var clean_desc = (d.description || "").replace(/<[^>]*>/g,"").trim();
	if (clean_desc.length > 400) clean_desc = clean_desc.substring(0,400) + "…";

	// ── Build HTML ───────────────────────────────────────────────
	var html = ""

		// Hero banner
		+ "<div style='" + bg + "padding:32px 32px 28px;color:#fff;"
		+ "border-radius:12px 12px 0 0;min-height:160px;"
		+ "display:flex;flex-direction:column;justify-content:flex-end;'>"
		+ "<div style='display:flex;align-items:flex-end;"
		+ "justify-content:space-between;flex-wrap:wrap;gap:12px;'>"
		+ "<div>"
		+ "<div style='display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;'>"
		+ (d.event_category
			? "<span style='background:rgba(255,255,255,0.2);border-radius:20px;"
			  + "padding:3px 12px;font-size:11px;font-weight:700;letter-spacing:.3px;'>"
			  + frappe.utils.escape_html(d.event_category) + "</span>" : "")
		+ (d.event_type
			? "<span style='background:rgba(255,255,255,0.12);border-radius:20px;"
			  + "padding:3px 12px;font-size:11px;'>"
			  + frappe.utils.escape_html(d.event_type) + "</span>" : "")
		+ "</div>"
		+ "<div style='font-size:24px;font-weight:700;line-height:1.2;"
		+ "text-shadow:0 2px 8px rgba(0,0,0,.3);margin-bottom:6px;'>"
		+ frappe.utils.escape_html(d.event_name || "Unnamed Event") + "</div>"
		+ "<div style='font-size:13px;opacity:.8;'>&#128197;&nbsp;" + date_str + "</div>"
		+ "</div>"
		+ "<div style='display:flex;flex-direction:column;gap:7px;align-items:flex-end;'>"
		+ "<span style='background:" + s_clr + ";border-radius:20px;"
		+ "padding:5px 16px;font-size:12px;font-weight:700;"
		+ "box-shadow:0 2px 6px rgba(0,0,0,.2);'>"
		+ frappe.utils.escape_html(status) + "</span>"
		+ "<span style='background:" + a_clr + ";border-radius:20px;"
		+ "padding:4px 13px;font-size:11px;font-weight:600;opacity:.95;'>"
		+ frappe.utils.escape_html(appr) + "</span>"
		+ "</div></div></div>"

		// Body
		+ "<div style='padding:24px 28px;background:#fff;border-radius:0 0 12px 12px;'>"

		// Info grid — 2 column table layout (clean, no CSS grid needed)
		+ "<table style='width:100%;border-collapse:collapse;'>"
		+ "<tr>"
		+ "<td style='width:50%;vertical-align:top;padding-right:20px;'>"
		+ "<table style='width:100%;'>"
		+ row("&#128197;", "Event ID",  d.name)
		+ row("&#128196;", "Event Code", d.event_code)
		+ row("&#128197;", "Dates", date_str)
		+ row("&#128205;", "Venue", d.venue || (d.is_off_premise ? d.off_premise_address : null))
		+ row("&#128101;", "Attendance", d.expected_attendance ? d.expected_attendance + " people" : null)
		+ row("&#128100;", "Event Owner", d.event_owner)
		+ "</table></td>"
		+ "<td style='width:50%;vertical-align:top;padding-left:20px;"
		+ "border-left:1px solid #f3f4f6;'>"
		+ "<table style='width:100%;'>"
		+ row("&#128276;", "Reminders", d.send_reminders
			? (d.reminder_days_before||0) + " days before via " + (d.notification_channel||"—")
			: null)
		+ row("&#128176;", "Finance Mgr", d.finance_manager)
		+ row("&#129309;", "Volunteer Co.", d.volunteer_coordinator)
		+ row("&#129309;", "Sponsored By", d.sponsored_by)
		+ row("&#128203;", "Submitted By", d.submitted_by)
		+ row("&#128203;", "Submitted On", d.submitted_on
			? frappe.datetime.str_to_user(d.submitted_on) : null)
		+ "</table></td>"
		+ "</tr></table>"

		// Description
		+ (clean_desc
			? "<div style='margin-top:18px;background:#f9fafb;"
			  + "border-left:3px solid #4a86e8;border-radius:0 8px 8px 0;"
			  + "padding:12px 16px;'>"
			  + "<div style='font-size:10px;color:#6b7280;font-weight:700;"
			  + "text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;'>"
			  + "Description</div>"
			  + "<div style='font-size:13px;color:#374151;line-height:1.7;'>"
			  + frappe.utils.escape_html(clean_desc) + "</div></div>"
			: "")

		// Active components
		+ "<div style='margin-top:20px;'>"
		+ "<div style='font-size:10px;color:#6b7280;font-weight:700;"
		+ "text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;'>"
		+ "Active Components</div>"
		+ "<div style='display:flex;flex-wrap:wrap;gap:4px;'>"
		+ comp_html + "</div></div>"

		// Approval flow
		+ "<div style='margin-top:22px;padding-top:18px;border-top:1px solid #f3f4f6;'>"
		+ "<div style='font-size:10px;color:#6b7280;font-weight:700;"
		+ "text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;'>"
		+ "Approval Flow</div>"
		+ "<div style='display:flex;align-items:center;max-width:400px;'>"
		+ step("Member",  "Member Approved",  appr)
		+ "<div style='flex:1;height:2px;background:#e5e7eb;margin:0 4px;"
		+ "margin-bottom:22px;'></div>"
		+ step("Admin",   "Admin Approved",   appr)
		+ "<div style='flex:1;height:2px;background:#e5e7eb;margin:0 4px;"
		+ "margin-bottom:22px;'></div>"
		+ step("Finance", "Finance Approved", appr)
		+ "</div></div>"

		+ "</div>"; // end body

	// ── Dialog ───────────────────────────────────────────────────
	var dlg = new frappe.ui.Dialog({
		title: "",
		size: "extra-large",
		fields: [{ fieldtype:"HTML", fieldname:"summary_html" }],
	});

	dlg.fields_dict.summary_html.$wrapper.html(html);

	// Custom footer
	dlg.$wrapper.find(".modal-footer").html(
		"<div style='display:flex;justify-content:space-between;align-items:center;"
		+ "width:100%;padding:0 4px;'>"
		+ "<span style='font-size:12px;color:#9ca3af;'>"
		+ frappe.utils.escape_html(d.name) + "</span>"
		+ "<div>"
		+ "<button class='btn btn-primary btn-sm' id='_evt_edit'>"
		+ "&#9998;&nbsp; Edit Event</button>"
		+ "&nbsp;<button class='btn btn-default btn-sm' id='_evt_close'>"
		+ "Close</button>"
		+ "</div></div>"
	);

	dlg.$wrapper.find("#_evt_close").on("click", function(){ dlg.hide(); });
	dlg.$wrapper.find("#_evt_edit").on("click", function(){
		dlg.hide();
		frappe.set_route("Form","Events",d.name);
	});

	// Fullscreen sizing
	dlg.$wrapper.find(".modal-dialog").css({
		"max-width":"94vw","width":"94vw","margin":"20px auto"
	});
	dlg.$wrapper.find(".modal-body").css({
		"padding":"0","max-height":"84vh","overflow-y":"auto"
	});
	dlg.$wrapper.find(".modal-header").css({
		"display":"none"
	});

	dlg.show();
};