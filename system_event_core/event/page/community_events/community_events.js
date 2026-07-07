frappe.pages["community-events"].on_page_load = function (wrapper) {
    frappe.ui.make_app_page({
        parent: wrapper,
        title: "Community Events",
        single_column: true,
    });

    $(wrapper)
        .find(".layout-main-section")
        .html(`
            <div class="community-events-container">
                <section class="events-hero">
                    <div class="events-hero-copy">
                        <span class="hero-eyebrow">Community & Spiritual Gatherings</span>
                        <h1>Events</h1>
                        <p>
                            Discover programs, religious gatherings,
                            community services, and volunteer opportunities.
                        </p>
                    </div>

                    <div class="events-hero-search">
                        <label class="search-box" for="event-search">
                            <span class="search-icon material-symbols-outlined">search</span>
                            <input
                                type="text"
                                id="event-search"
                                class="form-control"
                                placeholder="Search events, locations, organizers..."
                            />
                        </label>
                    </div>
                </section>

                <div id="events-list">
                    <div class="events-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading events...</p>
                        <span>Please wait while we prepare the latest programs for you.</span>
                    </div>
                </div>
            </div>
        `);

    frappe.pages["community-events"].on_page_show = function (wrapper) {
        add_page_styles();
        load_events(wrapper);
    };

    $(wrapper).on("keyup", "#event-search", function () {
        filter_events($(this).val());
    });
};

// ── Load Events ───────────────────────────────────────────────────────────────

function load_events(wrapper) {
    frappe.call({
        method: "system_event_core.event_attribute.doctype.registration_response.registration_response.get_events_with_registration",
        callback: function (r) {
            let events = r.message || [];
            let html = "";

            if (!events.length) {
                html = `
                    <div class="no-events">
                        <div class="no-events-icon">
                            <span class="material-symbols-outlined" style="font-size: 32px; color: var(--ce-primary)">event_busy</span>
                        </div>
                        <h3>No events found</h3>
                        <p>There are currently no community programs to display.</p>
                    </div>
                `;
                $("#events-list").html(html);
                return;
            }

            events.forEach((event) => {
                let today = frappe.datetime.get_today();
                let is_finished = false;
                let end_date = event.end_date || event.start_date;
                if (end_date && end_date < today) {
                    is_finished = true;
                }

                let image = event.event_image
                    ? event.event_image
                    : "/assets/system_event_core/images/placeholder.png";

                let desc = (event.description || "")
                    .replace(/<[^>]*>/g, "")
                    .trim()
                    .substring(0, 220);

                let location = event.is_off_premise
                    ? event.off_premise_address
                    : event.venue;

                let reg_badge = "";
                let reg_button = "";
                let capacity_block = "";

                if (event.has_registration) {
                    let count = event.registration_count || 0;
                    let max_reg = event.max_registrations;
                    let closed = event.registration_closed;

                    if (max_reg) {
                        let pct = Math.min(event.registration_percentage || 0, 100);
                        let status_label =
                            pct >= 100 ? "Full" : pct >= 71 ? "Almost Full" : "Open";
                        let status_class =
                            pct >= 100
                                ? "status-full"
                                : pct >= 71
                                    ? "status-almost"
                                    : "status-open";

                        reg_badge = `
                            <div class="registration-summary">
                                <span class="reg-count-badge" id="reg-count-${event.name}">
                                    <span class="reg-badge-dot"></span>
                                    <span>${count} registered</span>
                                </span>
                                <span class="reg-status-chip ${status_class}">${status_label}</span>
                            </div>
                        `;

                        capacity_block = `
                            <div class="capacity-block" id="capacity-block-${event.name}">
                                <div class="capacity-row">
                                    <span>Registered: ${count} / ${max_reg}</span>
                                    <span>Remaining: ${event.remaining_slots}</span>
                                </div>
                                <div class="progress-bar-track">
                                    <div class="progress-bar-fill ${status_class}" style="width:${pct}%;"></div>
                                </div>
                            </div>
                        `;
                    } else {
                        reg_badge = `
                            <div class="registration-summary">
                                <span class="reg-count-badge" id="reg-count-${event.name}">
                                    <span class="reg-badge-dot"></span>
                                    <span>${count} registered</span>
                                </span>
                                <span class="reg-status-chip status-unlimited">Unlimited</span>
                            </div>
                        `;

                        capacity_block = `
                            <div class="capacity-block" id="capacity-block-${event.name}">
                                <div class="capacity-row">
                                    <span>Registered: ${count}</span>
                                </div>
                            </div>
                        `;
                    }

                    if (closed) {
                        reg_button = `
                            <button class="btn btn-disabled btn-register-closed" disabled>
                                <span class="material-symbols-outlined" style="font-size: 16px;">lock</span>
                                <span>Registration Closed</span>
                            </button>
                        `;
                    } else {
                        reg_button = `
                            <button
                                class="btn btn-success btn-register"
                                data-event="${event.name}"
                                data-reg-form="${event.registration_form || ""}"
                                data-event-name="${frappe.utils.escape_html(event.event_name || "")}"
                            >
                                <span class="material-symbols-outlined" style="font-size: 16px;">app_registration</span>
                                <span>Register Now</span>
                            </button>
                        `;
                    }
                }

                // ── Volunteer badge + button ────────────────────────────
                let volunteer_badge = "";
                let volunteer_button = "";

                if (event.has_volunteer_opportunity) {
                    let needed_total = event.volunteer_slots_total || 0;
                    let filled_total = event.volunteer_slots_filled || 0;
                    let remaining = Math.max(needed_total - filled_total, 0);

                    let vol_status_class =
                        needed_total === 0
                            ? "status-unlimited"
                            : remaining === 0
                                ? "status-full"
                                : remaining <= Math.ceil(needed_total * 0.25)
                                    ? "status-almost"
                                    : "status-open";

                    let vol_status_label =
                        needed_total === 0
                            ? "Open"
                            : remaining === 0
                                ? "Full"
                                : remaining + " spot" + (remaining === 1 ? "" : "s") + " left";

                    volunteer_badge = `
                        <div class="registration-summary volunteer-summary">
                            <span class="reg-count-badge volunteer-count-badge">
                                <span class="reg-badge-dot volunteer-dot"></span>
                                <span>Volunteers Needed</span>
                            </span>
                            <span class="reg-status-chip ${vol_status_class}">${vol_status_label}</span>
                        </div>
                    `;

                    if (remaining > 0 || needed_total === 0) {
                        volunteer_button = `
                            <button
                                class="btn btn-volunteer"
                                data-event="${event.name}"
                                data-event-name="${frappe.utils.escape_html(event.event_name || "")}"
                            >
                                <span class="material-symbols-outlined" style="font-size: 16px;">volunteer_activism</span>
                                <span>Volunteer</span>
                            </button>
                        `;
                    } else {
                        volunteer_button = `
                            <button class="btn btn-disabled btn-volunteer-closed" disabled>
                                <span class="material-symbols-outlined" style="font-size: 16px;">block</span>
                                <span>Volunteer Slots Full</span>
                            </button>
                        `;
                    }
                }

                // If finished, override buttons with Concluded state
                if (is_finished) {
                    reg_button = `
                        <button class="btn btn-disabled btn-register-closed" disabled>
                            <span class="material-symbols-outlined" style="font-size: 16px;">celebration</span>
                            <span>Event Concluded</span>
                        </button>
                    `;
                    volunteer_button = "";
                }

                html += `
                    <article class="event-item ${is_finished ? "event-item-concluded" : ""}" data-event-id="${event.name}">
                        <div class="event-image-section">
                            <img
                                src="${image}"
                                alt="${frappe.utils.escape_html(event.event_name || "")}"
                            />
                            ${is_finished ? `
                                <div class="concluded-banner">
                                    <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 4px;">check_circle</span>
                                    Event Concluded
                                </div>
                            ` : ""}
                        </div>

                        <div class="event-details-section">
                            <div class="event-topline">
                                <span class="event-category">
                                    <span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px;">local_offer</span>
                                    ${event.event_category || "Community Event"}
                                </span>
                                ${event.is_off_premise
                        ? `<span class="off-premise">
                                <span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px;">home_work</span>
                                Off Premise
                           </span>`
                        : ""
                    }
                            </div>

                            <h2 class="event-title">${event.event_name || ""}</h2>

                            <div class="event-meta">
                                <span class="meta-pill">
                                    <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 6px; color: var(--ce-primary)">calendar_today</span>
                                    ${frappe.datetime.str_to_user(event.start_date)}
                                </span>
                                <span class="meta-pill">
                                    <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 6px; color: var(--ce-primary)">schedule</span>
                                    ${event.start_time || ""}
                                </span>
                                <span class="meta-pill">
                                    <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 6px; color: var(--ce-primary)">location_on</span>
                                    ${location || "Location Not Specified"}
                                </span>
                            </div>

                            ${reg_badge}
                            ${capacity_block}
                            ${volunteer_badge}

                            <div class="event-description">
                                ${desc || "No description available for this event."}
                            </div>

                            <div class="event-footer">
                                <div class="event-owner">
                                    <span class="owner-label">Organized by</span>
                                    <span class="owner-chip">
                                        <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 6px; color: var(--ce-primary)">groups</span>
                                        ${event.event_owner || "Organization"}
                                    </span>
                                </div>

                                <div class="event-actions">
                                    ${reg_button}
                                    ${volunteer_button}
                                    <button
                                        class="btn btn-primary btn-view-details"
                                        data-event="${event.name}"
                                    >
                                        <span class="material-symbols-outlined" style="font-size: 16px;">info</span>
                                        <span>View Details</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </article>
                `;
            });

            $("#events-list").html(html);

            $("#events-list")
                .off("click.community")
                .on("click.community", ".btn-view-details", function () {
                    frappe.set_route("Form", "Events", $(this).data("event"));
                })
                .on("click.community", ".btn-register", function () {
                    if ($(this).is(":disabled")) return;

                    let event_id = $(this).data("event");
                    let reg_form = $(this).data("reg-form");

                    frappe.set_route("registration-form", reg_form, event_id);
                })
                .on("click.community", ".btn-volunteer", function () {
                    if ($(this).is(":disabled")) return;

                    let event_id = $(this).data("event");
                    let event_name = $(this).data("event-name");

                    show_volunteer_modal(event_id, event_name);
                });
        },
    });
}

// ── Registration Modal ────────────────────────────────────────────────────────

function show_registration_modal(event_id, reg_form_name, event_display_name) {
    if (!reg_form_name) {
        frappe.msgprint({
            title: __("Registration Not Configured"),
            message: __(
                "This event does not have a registration form linked. Please contact the organizer."
            ),
            indicator: "orange",
        });
        return;
    }

    let loading_dialog = new frappe.ui.Dialog({
        title: __("Loading Registration Form…"),
    });

    loading_dialog.show();
    loading_dialog.$wrapper.find(".modal-body").html(`
        <div class="dialog-loading-state">
            <div class="loading-spinner"></div>
            <p>Fetching registration form…</p>
        </div>
    `);

    frappe.call({
        method: "system_event_core.event_attribute.doctype.registration_response.registration_response.get_registration_form",
        args: { registration_form_name: reg_form_name },
        callback: function (r) {
            loading_dialog.hide();

            if (!r.message) {
                frappe.msgprint({
                    title: __("Error"),
                    message: __("Could not load registration form."),
                    indicator: "red",
                });
                return;
            }

            _render_registration_dialog(event_id, event_display_name, r.message);
        },
        error: function () {
            loading_dialog.hide();
            frappe.msgprint({
                title: __("Error"),
                message: __("Failed to load registration form. Please try again."),
                indicator: "red",
            });
        },
    });
}

function _render_registration_dialog(event_id, event_display_name, form_data) {
    let questions = form_data.questions || [];
    let form_title = form_data.form_name || "Registration";
    let fields_html = "";

    if (form_data.description) {
        fields_html += `
            <div class="reg-form-desc">${frappe.utils.escape_html(form_data.description)}</div>
        `;
    }

    if (!questions.length) {
        fields_html += `
            <div class="reg-empty-note">
                No questions defined in this form.
            </div>
        `;
    }

    questions.forEach(function (q, idx) {
        let field_id = "reg_q_" + idx;
        let label_html = `
            <label class="reg-field-label" for="${field_id}">
                ${frappe.utils.escape_html(q.label)}
                ${q.reqd ? '<span class="req-star">*</span>' : ""}
            </label>
        `;

        let input_html = "";
        let ft = (q.fieldtype || "Data").toLowerCase();

        if (ft === "select") {
            let opts = (q.options || "").split("\n").filter(Boolean);
            let options_html = opts
                .map(
                    (o) =>
                        `<option value="${frappe.utils.escape_html(o)}">${frappe.utils.escape_html(o)}</option>`
                )
                .join("");

            input_html = `
                <select
                    id="${field_id}"
                    class="form-control reg-input"
                    data-label="${frappe.utils.escape_html(q.label)}"
                    data-reqd="${q.reqd ? 1 : 0}"
                >
                    <option value="">-- Select --</option>
                    ${options_html}
                </select>
            `;
        } else if (ft === "text" || ft === "small text") {
            input_html = `
                <textarea
                    id="${field_id}"
                    class="form-control reg-input"
                    rows="3"
                    placeholder="${frappe.utils.escape_html(q.label)}"
                    data-label="${frappe.utils.escape_html(q.label)}"
                    data-reqd="${q.reqd ? 1 : 0}"
                ></textarea>
            `;
        } else if (ft === "check") {
            input_html = `
                <div class="reg-check-wrap">
                    <input
                        type="checkbox"
                        id="${field_id}"
                        class="reg-input-check"
                        data-label="${frappe.utils.escape_html(q.label)}"
                        data-reqd="${q.reqd ? 1 : 0}"
                    >
                    <label for="${field_id}" class="reg-check-label">
                        ${frappe.utils.escape_html(q.label)}
                    </label>
                </div>
            `;
            label_html = "";
        } else if (ft === "int") {
            input_html = `
                <input
                    type="number"
                    id="${field_id}"
                    class="form-control reg-input"
                    placeholder="Enter number"
                    data-label="${frappe.utils.escape_html(q.label)}"
                    data-reqd="${q.reqd ? 1 : 0}"
                >
            `;
        } else if (ft === "date") {
            input_html = `
                <input
                    type="date"
                    id="${field_id}"
                    class="form-control reg-input"
                    data-label="${frappe.utils.escape_html(q.label)}"
                    data-reqd="${q.reqd ? 1 : 0}"
                >
            `;
        } else {
            input_html = `
                <input
                    type="text"
                    id="${field_id}"
                    class="form-control reg-input"
                    placeholder="${frappe.utils.escape_html(q.label)}"
                    data-label="${frappe.utils.escape_html(q.label)}"
                    data-reqd="${q.reqd ? 1 : 0}"
                >
            `;
        }

        fields_html += `
            <div class="reg-field-group" data-field-idx="${idx}">
                ${label_html}
                ${input_html}
            </div>
        `;
    });

    let dialog = new frappe.ui.Dialog({
        title: form_title,
        size: "large",
    });

    dialog.$wrapper.find(".modal-body").html(`
        <div class="reg-modal-body">
            <div class="reg-event-banner">
                <span class="reg-event-label">Event</span>
                <span class="reg-event-name">${frappe.utils.escape_html(event_display_name)}</span>
            </div>

            <div id="reg-fields-container">
                ${fields_html}
            </div>

            <div id="reg-error-msg" class="reg-error" style="display:none;"></div>
        </div>
    `);

    dialog.$wrapper.find(".modal-footer").html(`
        <div class="reg-dialog-actions">
            <button class="btn btn-default btn-reg-cancel">Cancel</button>
            <button class="btn btn-success btn-reg-submit">
                <span class="reg-submit-text">Submit Registration</span>
                <span class="reg-submit-spinner" style="display:none;">Submitting…</span>
            </button>
        </div>
    `);

    dialog.show();

    dialog.$wrapper.find(".btn-reg-cancel").on("click", function () {
        dialog.hide();
    });

    dialog.$wrapper.find(".btn-reg-submit").on("click", function () {
        let answers = [];
        let has_error = false;
        let error_msg = "";

        dialog.$wrapper.find(".reg-input").each(function () {
            let $el = $(this);
            let label = $el.data("label");
            let reqd = parseInt($el.data("reqd") || 0);
            let val = $el.val() || "";

            if (reqd && !val.trim()) {
                has_error = true;
                error_msg = `"${label}" is required.`;
                $el.addClass("is-invalid");
                return false;
            }

            $el.removeClass("is-invalid");
            answers.push({ question_label: label, answer: val });
        });

        if (!has_error) {
            dialog.$wrapper.find(".reg-input-check").each(function () {
                let $el = $(this);
                let label = $el.data("label");
                let val = $el.is(":checked") ? "Yes" : "No";
                answers.push({ question_label: label, answer: val });
            });
        }

        if (has_error) {
            dialog.$wrapper.find("#reg-error-msg").text(error_msg).show();
            return;
        }

        dialog.$wrapper.find("#reg-error-msg").hide();

        let $btn = dialog.$wrapper.find(".btn-reg-submit");
        $btn.prop("disabled", true);
        $btn.find(".reg-submit-text").hide();
        $btn.find(".reg-submit-spinner").show();

        frappe.call({
            method: "system_event_core.event_attribute.doctype.registration_response.registration_response.submit_registration",
            args: {
                event: event_id,
                registration_form: form_data.name,
                answers_json: JSON.stringify(answers),
            },
            callback: function (r) {
                dialog.hide();

                if (r.message && r.message.success) {
                    _show_success_message(event_id, event_display_name);
                } else {
                    frappe.msgprint({
                        title: __("Registration Failed"),
                        message: __("Something went wrong. Please try again."),
                        indicator: "red",
                    });
                }
            },
            error: function (err) {
                $btn.prop("disabled", false);
                $btn.find(".reg-submit-text").show();
                $btn.find(".reg-submit-spinner").hide();

                let msg = err && err.message ? err.message : "Submission failed.";
                dialog.$wrapper.find("#reg-error-msg").text(msg).show();
            },
        });
    });
}

function _show_success_message(event_id, event_display_name) {
    let success_dialog = new frappe.ui.Dialog({
        title: "Registration Successful",
        on_hide: function () {
            _refresh_registration_count(event_id);
        }
    });

    success_dialog.$wrapper.find(".modal-body").html(`
        <div class="success-state">
            <div class="success-state-icon">
                <span class="material-symbols-outlined success-icon" style="font-size: 38px; color: var(--ce-success)">check_circle</span>
            </div>
            <h3>You're Registered!</h3>
            <p>You have successfully registered for</p>
            <strong>${frappe.utils.escape_html(event_display_name)}</strong>
        </div>
    `);

    success_dialog.$wrapper.find(".modal-footer").html(`
        <div class="success-actions">
            <button class="btn btn-success" id="reg-success-close">Done</button>
        </div>
    `);

    success_dialog.show();

    success_dialog.$wrapper.find("#reg-success-close").on("click", function () {
        success_dialog.hide();
    });
}

function _refresh_registration_count(event_id) {
    frappe.call({
        method: "system_event_core.event_attribute.doctype.registration_response.registration_response.get_events_with_registration",
        callback: function (r) {
            let events = r.message || [];
            let ev = events.find((e) => e.name === event_id);
            if (!ev) return;

            let count = ev.registration_count || 0;

            $(`#reg-count-${event_id}`)
                .find("span:last")
                .text(count + " registered");

            if (ev.max_registrations) {
                let pct = Math.min(ev.registration_percentage || 0, 100);

                $(`#capacity-block-${event_id} .progress-bar-fill`).css("width", pct + "%");
                $(`#capacity-block-${event_id} .capacity-row span:first`).text(
                    `Registered: ${count} / ${ev.max_registrations}`
                );
                $(`#capacity-block-${event_id} .capacity-row span:last`).text(
                    `Remaining: ${ev.remaining_slots}`
                );

                if (ev.registration_closed) {
                    $(`.event-item[data-event-id="${event_id}"] .btn-register`).replaceWith(
                        `<button class="btn btn-disabled btn-register-closed" disabled><span>Registration Closed</span></button>`
                    );
                }
            } else {
                $(`#capacity-block-${event_id} .capacity-row span:first`).text(
                    `Registered: ${count}`
                );
            }
        },
    });
}

function _populate_volunteer_dialog(dialog, event_id, event_display_name, roles) {
    let role_options_html = "";

    if (!roles.length) {
        role_options_html = `
            <div class="reg-empty-note">
                Open volunteer opportunity — no specific roles defined.
                You'll be added to the general volunteer list.
            </div>
        `;
    } else {
        roles.forEach(function (role, idx) {
            let full = role.slots_needed > 0 && role.slots_filled >= role.slots_needed;
            let remaining = role.slots_needed
                ? Math.max(role.slots_needed - role.slots_filled, 0)
                : null;

            role_options_html += `
                <label class="vol-role-option ${full ? "vol-role-full" : ""}">
                    <input
                        type="radio"
                        name="vol_role"
                        value="${frappe.utils.escape_html(role.role_at_event)}"
                        ${full ? "disabled" : ""}
                        ${idx === 0 && !full ? "checked" : ""}
                    >
                    <div class="vol-role-info">
                        <div class="vol-role-name">${frappe.utils.escape_html(role.role_at_event)}</div>
                        <div class="vol-role-meta">
                            ${role.slots_needed
                    ? (full
                        ? "Full"
                        : remaining + " spot" + (remaining === 1 ? "" : "s") + " remaining")
                    : "Open — no limit"
                }
                        </div>
                    </div>
                </label>
            `;
        });
    }

    let fields_html = `
        <div class="vol-form-section">
            <div class="vol-section-label">Select a Role</div>
            <div class="vol-roles-list">
                ${role_options_html}
            </div>
        </div>

        <div class="vol-form-section">
            <div class="vol-section-label">Volunteer Type</div>

            <div class="vol-roles-list">
                <label class="vol-role-option">
                    <input type="radio" name="vol_type" value="internal" checked>
                    <div class="vol-role-info">
                        <div class="vol-role-name">Internal (Existing Member)</div>
                        <div class="vol-role-meta">Select from registered members</div>
                    </div>
                </label>
                <label class="vol-role-option">
                    <input type="radio" name="vol_type" value="external">
                    <div class="vol-role-info">
                        <div class="vol-role-name">External Volunteer</div>
                        <div class="vol-role-meta">Not a registered member — enter details</div>
                    </div>
                </label>
            </div>
        </div>

        <div class="vol-form-section" id="vol-internal-fields">
            <div class="vol-section-label">Select Member</div>

            <div class="reg-field-group">
                <label class="reg-field-label" for="vol_party">
                    Member <span class="req-star">*</span>
                </label>
                <select id="vol_party" class="form-control reg-input">
                    <option value="">-- Loading members… --</option>
                </select>
            </div>
        </div>

        <div class="vol-form-section" id="vol-external-fields" style="display:none;">
            <div class="vol-section-label">Your Details</div>

            <div class="reg-field-group">
                <label class="reg-field-label" for="vol_name">
                    Full Name <span class="req-star">*</span>
                </label>
                <input type="text" id="vol_name" class="form-control reg-input"
                    placeholder="Your full name">
            </div>

            <div class="reg-field-group">
                <label class="reg-field-label" for="vol_phone">
                    Phone Number <span class="req-star">*</span>
                </label>
                <input type="text" id="vol_phone" class="form-control reg-input"
                    placeholder="Your contact number">
            </div>

            <div class="reg-field-group">
                <label class="reg-field-label" for="vol_email">
                    Email
                </label>
                <input type="text" id="vol_email" class="form-control reg-input"
                    placeholder="you@example.com">
            </div>

            <div class="reg-field-group">
                <label class="reg-field-label" for="vol_location">
                    Location / Area
                </label>
                <input type="text" id="vol_location" class="form-control reg-input"
                    placeholder="e.g. Thanjavur Town">
            </div>
        </div>
    `;

    dialog.set_title(__("Volunteer Registration"));

    dialog.$wrapper.find(".modal-body").html(`
        <div class="reg-modal-body vol-modal-body">
            <div class="reg-event-banner vol-event-banner">
                <span class="reg-event-label">Event</span>
                <span class="reg-event-name">${frappe.utils.escape_html(event_display_name)}</span>
            </div>

            ${fields_html}

            <div id="vol-error-msg" class="reg-error" style="display:none;"></div>
        </div>
    `);

    dialog.$wrapper.find(".modal-footer").html(`
        <div class="reg-dialog-actions">
            <button class="btn btn-default btn-vol-cancel">Cancel</button>
            <button class="btn btn-volunteer-submit">
                <span class="vol-submit-text">Submit Volunteer Request</span>
                <span class="vol-submit-spinner" style="display:none;">Submitting…</span>
            </button>
        </div>
    `).removeClass("hide").show();

    // ── Toggle internal/external sections ────────────────────────
    dialog.$wrapper.find('input[name="vol_type"]').on("change", function () {
        let is_internal = $(this).val() === "internal";
        dialog.$wrapper.find("#vol-internal-fields").toggle(is_internal);
        dialog.$wrapper.find("#vol-external-fields").toggle(!is_internal);
    });

    // ── Populate member dropdown ──────────────────────────────────
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Party Master",
            fields: ["name", "party_name"],
            limit: 500,
            order_by: "party_name asc",
        },
        callback: function (r) {
            let members = r.message || [];
            let $select = dialog.$wrapper.find("#vol_party");
            let options = '<option value="">-- Select Member --</option>';
            members.forEach(function (m) {
                options += `<option value="${m.name}">${frappe.utils.escape_html(m.party_name || m.name)}</option>`;
            });
            $select.html(options);
        }
    });

    dialog.$wrapper.find(".btn-vol-cancel").on("click", function () {
        dialog.hide();
    });

    dialog.$wrapper.find(".btn-volunteer-submit").on("click", function () {
        let role = dialog.$wrapper.find('input[name="vol_role"]:checked').val() || "";
        let vol_type = dialog.$wrapper.find('input[name="vol_type"]:checked').val();
        let $errBox = dialog.$wrapper.find("#vol-error-msg");

        if (roles.length && !role) {
            $errBox.text("Please select a volunteer role.").show();
            return;
        }

        let args = {
            event: event_id,
            role_at_event: role,
        };

        if (vol_type === "internal") {
            let party = dialog.$wrapper.find("#vol_party").val();

            if (!party) {
                $errBox.text("Please select a member.").show();
                return;
            }

            args.party_master = party;

        } else {
            let name = dialog.$wrapper.find("#vol_name").val().trim();
            let phone = dialog.$wrapper.find("#vol_phone").val().trim();
            let email = dialog.$wrapper.find("#vol_email").val().trim();
            let location = dialog.$wrapper.find("#vol_location").val().trim();

            if (!name) {
                $errBox.text("Please enter your full name.").show();
                dialog.$wrapper.find("#vol_name").addClass("is-invalid");
                return;
            }
            if (!phone) {
                $errBox.text("Please enter your phone number.").show();
                dialog.$wrapper.find("#vol_phone").addClass("is-invalid");
                return;
            }

            dialog.$wrapper.find("#vol_name, #vol_phone").removeClass("is-invalid");

            args.volunteer_name = name;
            args.phone_number = phone;
            args.email = email;
            args.location = location;
        }

        $errBox.hide();

        let $btn = dialog.$wrapper.find(".btn-volunteer-submit");
        $btn.prop("disabled", true);
        $btn.find(".vol-submit-text").hide();
        $btn.find(".vol-submit-spinner").show();

        frappe.call({
            method: "system_event_core.event_attribute.doctype.registration_response.registration_response.submit_volunteer_registration",
            args: args,
            callback: function (r) {
                dialog.hide();

                if (r.message && r.message.success) {
                    _show_volunteer_success(event_id, event_display_name);
                } else {
                    let msg = (r.message && r.message.message) || "Something went wrong. Please try again.";
                    frappe.msgprint({
                        title: __("Volunteer Registration Failed"),
                        message: __(msg),
                        indicator: "red",
                    });
                }
            },
            error: function (err) {
                $btn.prop("disabled", false);
                $btn.find(".vol-submit-text").show();
                $btn.find(".vol-submit-spinner").hide();

                let msg = err && err.message ? err.message : "Submission failed.";
                dialog.$wrapper.find("#vol-error-msg").text(msg).show();
            },
        });
    });
}

function show_volunteer_modal(event_id, event_display_name) {
    let dialog = new frappe.ui.Dialog({
        title: __("Loading Volunteer Roles…"),
        size: "large",
    });

    dialog.$wrapper.find(".modal-body").html(`
        <div class="dialog-loading-state">
            <div class="loading-spinner"></div>
            <p>Fetching available volunteer roles…</p>
        </div>
    `);

    dialog.show();

    frappe.call({
        method: "system_event_core.event_attribute.doctype.registration_response.registration_response.get_volunteer_requirements",
        args: { event: event_id },
        callback: function (r) {
            let roles = (r.message && r.message.roles) || [];
            _populate_volunteer_dialog(dialog, event_id, event_display_name, roles);
        },
        error: function () {
            _populate_volunteer_dialog(dialog, event_id, event_display_name, []);
        }
    });
}



function _render_volunteer_dialog(event_id, event_display_name, roles) {
    let role_options_html = "";

    if (!roles.length) {
        role_options_html = `
            <div class="reg-empty-note">
                Open volunteer opportunity — no specific roles defined.
                You'll be added to the general volunteer list.
            </div>
        `;
    } else {
        roles.forEach(function (role, idx) {
            let full = role.slots_needed > 0 && role.slots_filled >= role.slots_needed;
            let remaining = role.slots_needed
                ? Math.max(role.slots_needed - role.slots_filled, 0)
                : null;

            role_options_html += `
                <label class="vol-role-option ${full ? "vol-role-full" : ""}">
                    <input
                        type="radio"
                        name="vol_role"
                        value="${frappe.utils.escape_html(role.role_at_event)}"
                        ${full ? "disabled" : ""}
                        ${idx === 0 && !full ? "checked" : ""}
                    >
                    <div class="vol-role-info">
                        <div class="vol-role-name">${frappe.utils.escape_html(role.role_at_event)}</div>
                        <div class="vol-role-meta">
                            ${role.slots_needed
                    ? (full
                        ? "Full"
                        : remaining + " spot" + (remaining === 1 ? "" : "s") + " remaining")
                    : "Open — no limit"
                }
                        </div>
                    </div>
                </label>
            `;
        });
    }

    let fields_html = `
        <div class="vol-form-section">
            <div class="vol-section-label">Select a Role</div>
            <div class="vol-roles-list">
                ${role_options_html}
            </div>
        </div>

        <div class="vol-form-section">
            <div class="vol-section-label">Volunteer Type</div>

            <div class="vol-roles-list">
                <label class="vol-role-option">
                    <input type="radio" name="vol_type" value="internal" checked>
                    <div class="vol-role-info">
                        <div class="vol-role-name">Internal (Existing Member)</div>
                        <div class="vol-role-meta">Select from registered members</div>
                    </div>
                </label>
                <label class="vol-role-option">
                    <input type="radio" name="vol_type" value="external">
                    <div class="vol-role-info">
                        <div class="vol-role-name">External Volunteer</div>
                        <div class="vol-role-meta">Not a registered member — enter details</div>
                    </div>
                </label>
            </div>
        </div>

        <div class="vol-form-section" id="vol-internal-fields">
            <div class="vol-section-label">Select Member</div>

            <div class="reg-field-group">
                <label class="reg-field-label" for="vol_party">
                    Member <span class="req-star">*</span>
                </label>
                <select id="vol_party" class="form-control reg-input">
                    <option value="">-- Loading members… --</option>
                </select>
            </div>
        </div>

        <div class="vol-form-section" id="vol-external-fields" style="display:none;">
            <div class="vol-section-label">Your Details</div>

            <div class="reg-field-group">
                <label class="reg-field-label" for="vol_name">
                    Full Name <span class="req-star">*</span>
                </label>
                <input type="text" id="vol_name" class="form-control reg-input"
                    placeholder="Your full name">
            </div>

            <div class="reg-field-group">
                <label class="reg-field-label" for="vol_phone">
                    Phone Number <span class="req-star">*</span>
                </label>
                <input type="text" id="vol_phone" class="form-control reg-input"
                    placeholder="Your contact number">
            </div>

            <div class="reg-field-group">
                <label class="reg-field-label" for="vol_email">
                    Email
                </label>
                <input type="text" id="vol_email" class="form-control reg-input"
                    placeholder="you@example.com">
            </div>

            <div class="reg-field-group">
                <label class="reg-field-label" for="vol_location">
                    Location / Area
                </label>
                <input type="text" id="vol_location" class="form-control reg-input"
                    placeholder="e.g. Thanjavur Town">
            </div>
        </div>
    `;

    let dialog = new frappe.ui.Dialog({
        title: __("Volunteer Registration"),
        size: "large",
    });

    dialog.$wrapper.find(".modal-body").html(`
        <div class="reg-modal-body vol-modal-body">
            <div class="reg-event-banner vol-event-banner">
                <span class="reg-event-label">Event</span>
                <span class="reg-event-name">${frappe.utils.escape_html(event_display_name)}</span>
            </div>

            ${fields_html}

            <div id="vol-error-msg" class="reg-error" style="display:none;"></div>
        </div>
    `);

    dialog.$wrapper.find(".modal-footer").html(`
        <div class="reg-dialog-actions">
            <button class="btn btn-default btn-vol-cancel">Cancel</button>
            <button class="btn btn-volunteer-submit">
                <span class="vol-submit-text">Submit Volunteer Request</span>
                <span class="vol-submit-spinner" style="display:none;">Submitting…</span>
            </button>
        </div>
    `);
    dialog.$wrapper.find(".modal-footer")
        .removeClass("hide")
        .show();

    dialog.show();

    // ── Toggle internal/external sections ────────────────────────
    dialog.$wrapper.find('input[name="vol_type"]').on("change", function () {
        let is_internal = $(this).val() === "internal";
        dialog.$wrapper.find("#vol-internal-fields").toggle(is_internal);
        dialog.$wrapper.find("#vol-external-fields").toggle(!is_internal);
    });

    // ── Populate member dropdown ──────────────────────────────────
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Party Master",
            fields: ["name", "party_name"],
            limit: 500,
            order_by: "party_name asc",
        },
        callback: function (r) {
            let members = r.message || [];
            let $select = dialog.$wrapper.find("#vol_party");
            let options = '<option value="">-- Select Member --</option>';
            members.forEach(function (m) {
                options += `<option value="${m.name}">${frappe.utils.escape_html(m.party_name || m.name)}</option>`;
            });
            $select.html(options);
        }
    });

    dialog.$wrapper.find(".btn-vol-cancel").on("click", function () {
        dialog.hide();
    });

    dialog.$wrapper.find(".btn-volunteer-submit").on("click", function () {
        let role = dialog.$wrapper.find('input[name="vol_role"]:checked').val() || "";
        let vol_type = dialog.$wrapper.find('input[name="vol_type"]:checked').val();
        let $errBox = dialog.$wrapper.find("#vol-error-msg");

        if (roles.length && !role) {
            $errBox.text("Please select a volunteer role.").show();
            return;
        }

        let args = {
            event: event_id,
            role_at_event: role,
        };

        if (vol_type === "internal") {
            let party = dialog.$wrapper.find("#vol_party").val();

            if (!party) {
                $errBox.text("Please select a member.").show();
                return;
            }

            args.party_master = party;

        } else {
            let name = dialog.$wrapper.find("#vol_name").val().trim();
            let phone = dialog.$wrapper.find("#vol_phone").val().trim();
            let email = dialog.$wrapper.find("#vol_email").val().trim();
            let location = dialog.$wrapper.find("#vol_location").val().trim();

            if (!name) {
                $errBox.text("Please enter your full name.").show();
                dialog.$wrapper.find("#vol_name").addClass("is-invalid");
                return;
            }
            if (!phone) {
                $errBox.text("Please enter your phone number.").show();
                dialog.$wrapper.find("#vol_phone").addClass("is-invalid");
                return;
            }

            dialog.$wrapper.find("#vol_name, #vol_phone").removeClass("is-invalid");

            args.volunteer_name = name;
            args.phone_number = phone;
            args.email = email;
            args.location = location;
        }

        $errBox.hide();

        let $btn = dialog.$wrapper.find(".btn-volunteer-submit");
        $btn.prop("disabled", true);
        $btn.find(".vol-submit-text").hide();
        $btn.find(".vol-submit-spinner").show();

        frappe.call({
            method: "system_event_core.event_attribute.doctype.registration_response.registration_response.submit_volunteer_registration",
            args: args,
            callback: function (r) {
                dialog.hide();

                if (r.message && r.message.success) {
                    _show_volunteer_success(event_id, event_display_name);
                } else {
                    let msg = (r.message && r.message.message) || "Something went wrong. Please try again.";
                    frappe.msgprint({
                        title: __("Volunteer Registration Failed"),
                        message: __(msg),
                        indicator: "red",
                    });
                }
            },
            error: function (err) {
                $btn.prop("disabled", false);
                $btn.find(".vol-submit-text").show();
                $btn.find(".vol-submit-spinner").hide();

                let msg = err && err.message ? err.message : "Submission failed.";
                dialog.$wrapper.find("#vol-error-msg").text(msg).show();
            },
        });
    });
}

function _show_volunteer_success(event_id, event_display_name) {
    let success_dialog = new frappe.ui.Dialog({
        title: "Volunteer Request Received",
        on_hide: function () {
            _refresh_volunteer_count(event_id);
        }
    });

    success_dialog.$wrapper.find(".modal-body").html(`
        <div class="success-state">
            <div class="success-state-icon">
                <span class="material-symbols-outlined success-icon" style="font-size: 38px; color: var(--ce-volunteer)">volunteer_activism</span>
            </div>
            <h3>Thank You!</h3>
            <p>Your volunteer request has been recorded for</p>
            <strong>${frappe.utils.escape_html(event_display_name)}</strong>
        </div>
    `);

    success_dialog.$wrapper.find(".modal-footer").html(`
        <div class="success-actions">
            <button class="btn btn-success" id="vol-success-close">Done</button>
        </div>
    `);

    success_dialog.show();

    success_dialog.$wrapper.find("#vol-success-close").on("click", function () {
        success_dialog.hide();
    });
}

function _refresh_volunteer_count(event_id) {
    frappe.call({
        method: "system_event_core.event_attribute.doctype.registration_response.registration_response.get_events_with_registration",
        callback: function (r) {
            let events = r.message || [];
            let ev = events.find((e) => e.name === event_id);
            if (!ev) return;

            if (ev.has_volunteer_opportunity) {
                let needed_total = ev.volunteer_slots_total || 0;
                let filled_total = ev.volunteer_slots_filled || 0;
                let remaining = Math.max(needed_total - filled_total, 0);

                let vol_status_class =
                    needed_total === 0
                        ? "status-unlimited"
                        : remaining === 0
                            ? "status-full"
                            : remaining <= Math.ceil(needed_total * 0.25)
                                ? "status-almost"
                                : "status-open";

                let vol_status_label =
                    needed_total === 0
                        ? "Open"
                        : remaining === 0
                            ? "Full"
                            : remaining + " spot" + (remaining === 1 ? "" : "s") + " left";

                let $card = $(`.event-item[data-event-id="${event_id}"]`);
                let $badge = $card.find(".volunteer-summary .reg-status-chip");

                $badge.removeClass("status-open status-almost status-full status-unlimited")
                    .addClass(vol_status_class)
                    .text(vol_status_label);

                let $btn = $card.find(".btn-volunteer, .btn-volunteer-closed");
                if (remaining > 0 || needed_total === 0) {
                    if ($btn.hasClass("btn-volunteer-closed")) {
                        $btn.replaceWith(`
                            <button
                                class="btn btn-volunteer"
                                data-event="${event_id}"
                                data-event-name="${frappe.utils.escape_html(ev.event_name || "")}"
                            >
                                <span class="material-symbols-outlined" style="font-size: 16px;">volunteer_activism</span>
                                <span>Volunteer</span>
                            </button>
                        `);
                    }
                } else {
                    if ($btn.hasClass("btn-volunteer")) {
                        $btn.replaceWith(`
                            <button class="btn btn-disabled btn-volunteer-closed" disabled>
                                <span class="material-symbols-outlined" style="font-size: 16px;">block</span>
                                <span>Volunteer Slots Full</span>
                            </button>
                        `);
                    }
                }
            }
        }
    });
}

// ── Search Filter ─────────────────────────────────────────────────────────────

function filter_events(search_text) {
    search_text = (search_text || "").toLowerCase();
    $(".event-item").each(function () {
        let text = $(this).text().toLowerCase();
        $(this).toggle(text.includes(search_text));
    });
}

// ── Styles ────────────────────────────────────────────────────────────────────

function add_page_styles() {
    if ($("#community-events-style").length) return;

    $("head").append(`
        <style id="community-events-style">
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');

            :root {
                --ce-bg: #f8fafc;
                --ce-bg-glow: radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.05) 0%, rgba(248, 250, 252, 0) 65%),
                              radial-gradient(circle at 10% 80%, rgba(16, 185, 129, 0.03) 0%, rgba(248, 250, 252, 0) 50%);
                --ce-surface: rgba(255, 255, 255, 0.8);
                --ce-surface-hover: rgba(255, 255, 255, 0.95);
                --ce-surface-soft: rgba(241, 245, 249, 0.6);
                --ce-surface-muted: rgba(15, 23, 42, 0.03);
                --ce-border: rgba(15, 23, 42, 0.08);
                --ce-border-strong: rgba(15, 23, 42, 0.15);
                --ce-text: #0f172a;
                --ce-text-muted: #475569;
                --ce-text-soft: #94a3b8;
                --ce-primary: #059669;
                --ce-primary-glow: rgba(5, 150, 105, 0.1);
                --ce-primary-dark: #047857;
                --ce-success: #10b981;
                --ce-warning: #f59e0b;
                --ce-danger: #ef4444;
                --ce-volunteer: #7c3aed;
                --ce-volunteer-dark: #6d28d9;
                --ce-shadow-sm: 0 4px 12px rgba(15, 23, 42, 0.03);
                --ce-shadow-md: 0 12px 36px rgba(15, 23, 42, 0.08);
                --ce-shadow-lg: 0 24px 60px rgba(15, 23, 42, 0.12);
                --ce-radius-sm: 10px;
                --ce-radius-md: 16px;
                --ce-radius-lg: 24px;
                --ce-radius-xl: 32px;
            }

            .community-events-container * {
                font-family: 'Outfit', sans-serif;
                box-sizing: border-box;
            }

            .material-symbols-outlined {
                font-family: 'Material Symbols Outlined' !important;
                font-size: 20px;
                line-height: 1;
                display: inline-block;
                vertical-align: middle;
            }

            .community-events-container {
                background: var(--ce-bg);
                background-image: var(--ce-bg-glow);
                min-height: 100vh;
                padding: 40px 32px;
                color: var(--ce-text);
            }

            .events-hero {
                display: grid;
                grid-template-columns: 1.4fr 0.9fr;
                gap: 32px;
                align-items: center;
                margin-bottom: 40px;
                padding: 40px;
                background: rgba(255, 255, 255, 0.65);
                border: 1px solid var(--ce-border);
                border-radius: var(--ce-radius-xl);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                box-shadow: var(--ce-shadow-md);
            }

            .events-hero-copy h1 {
                margin: 12px 0 12px;
                font-size: 46px;
                line-height: 1.1;
                font-weight: 800;
                letter-spacing: -0.04em;
                background: linear-gradient(135deg, #0f172a 20%, #1e1b4b 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .events-hero-copy p {
                margin: 0;
                max-width: 56ch;
                font-size: 16px;
                line-height: 1.7;
                color: var(--ce-text-muted);
            }

            .hero-eyebrow {
                display: inline-flex;
                align-items: center;
                min-height: 30px;
                padding: 0 16px;
                border-radius: 999px;
                background: rgba(5, 150, 105, 0.08);
                border: 1px solid rgba(5, 150, 105, 0.2);
                color: var(--ce-primary);
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.1em;
                text-transform: uppercase;
            }

            .events-hero-search {
                display: flex;
                align-items: center;
                justify-content: stretch;
            }

            .search-box {
                display: flex;
                align-items: center;
                gap: 16px;
                width: 100%;
                min-height: 60px;
                padding: 0 20px;
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid var(--ce-border);
                border-radius: 20px;
                box-shadow: inset 0 2px 4px rgba(15, 23, 42, 0.02), 0 4px 12px rgba(15, 23, 42, 0.03);
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }

            .search-box:focus-within {
                border-color: rgba(99, 102, 241, 0.5);
                box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15), inset 0 2px 4px rgba(15, 23, 42, 0.02);
            }

            .search-icon {
                color: var(--ce-text-muted);
                font-size: 22px;
                flex-shrink: 0;
            }

            .search-box .form-control {
                border: none !important;
                background: transparent !important;
                box-shadow: none !important;
                height: 58px;
                padding: 0 !important;
                font-size: 16px;
                color: var(--ce-text);
            }

            .search-box .form-control::placeholder {
                color: var(--ce-text-soft);
            }

            .events-loading,
            .no-events {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 16px;
                min-height: 320px;
                text-align: center;
                padding: 40px;
                background: var(--ce-surface);
                border: 1px solid var(--ce-border);
                border-radius: var(--ce-radius-lg);
                backdrop-filter: blur(12px);
                box-shadow: var(--ce-shadow-md);
            }

            .events-loading p,
            .no-events h3 {
                margin: 0;
                color: var(--ce-text);
                font-size: 20px;
                font-weight: 700;
            }

            .events-loading span,
            .no-events p {
                color: var(--ce-text-muted);
                font-size: 15px;
                margin: 0;
            }

            .no-events-icon {
                width: 72px;
                height: 72px;
                display: grid;
                place-items: center;
                border-radius: 24px;
                background: var(--ce-surface-soft);
                border: 1px solid var(--ce-border);
                margin-bottom: 8px;
            }

            .loading-spinner {
                width: 44px;
                height: 44px;
                border-radius: 999px;
                border: 4px solid rgba(5, 150, 105, 0.1);
                border-top-color: var(--ce-primary);
                animation: ce-spin 0.8s linear infinite;
            }

            @keyframes ce-spin {
                to { transform: rotate(360deg); }
            }

            .event-item {
                display: grid;
                grid-template-columns: 340px minmax(0, 1fr);
                gap: 0;
                overflow: hidden;
                background: var(--ce-surface);
                border: 1px solid var(--ce-border);
                border-radius: var(--ce-radius-xl);
                box-shadow: var(--ce-shadow-sm);
                margin-bottom: 28px;
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), 
                            box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), 
                            border-color 0.22s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .event-item:hover {
                transform: translateY(-4px) scale(1.005);
                box-shadow: var(--ce-shadow-lg);
                border-color: rgba(99, 102, 241, 0.2);
            }

            .event-item-concluded {
                opacity: 0.75;
                filter: grayscale(15%);
            }

            .concluded-banner {
                position: absolute;
                top: 16px;
                left: 16px;
                background: rgba(15, 23, 42, 0.85);
                backdrop-filter: blur(8px);
                color: #ffffff;
                padding: 8px 16px;
                border-radius: var(--ce-radius-sm);
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                display: flex;
                align-items: center;
                border: 1px solid rgba(255, 255, 255, 0.15);
                z-index: 10;
                box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
            }

            .event-image-section {
                background: #f1f5f9;
                position: relative;
                overflow: hidden;
            }

            .event-image-section::after {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: linear-gradient(to right, rgba(255,255,255,0) 60%, rgba(255, 255, 255, 0.15) 100%);
            }

            .event-image-section img {
                width: 100%;
                height: 100%;
                min-height: 300px;
                object-fit: cover;
                display: block;
                transition: transform 0.5s ease;
            }

            .event-item:hover .event-image-section img {
                transform: scale(1.04);
            }

            .event-details-section {
                padding: 32px;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .event-topline {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                flex-wrap: wrap;
            }

            .event-category,
            .off-premise,
            .meta-pill,
            .owner-chip,
            .reg-count-badge,
            .reg-status-chip {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 700;
            }

            .event-category {
                min-height: 32px;
                padding: 0 14px;
                background: rgba(5, 150, 105, 0.08);
                border: 1px solid rgba(5, 150, 105, 0.2);
                color: var(--ce-primary);
            }

            .off-premise {
                min-height: 32px;
                padding: 0 14px;
                background: rgba(239, 68, 68, 0.08);
                border: 1px solid rgba(239, 68, 68, 0.2);
                color: var(--ce-danger);
            }

            .event-title {
                margin: 0;
                font-size: 28px;
                line-height: 1.2;
                font-weight: 800;
                letter-spacing: -0.03em;
                color: var(--ce-text);
            }

            .event-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
            }

            .meta-pill {
                min-height: 36px;
                padding: 0 16px;
                background: var(--ce-surface-soft);
                color: var(--ce-text-muted);
                border: 1px solid var(--ce-border);
                font-weight: 600;
            }

            .registration-summary {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                align-items: center;
            }

            .reg-count-badge {
                min-height: 36px;
                gap: 8px;
                padding: 0 16px;
                background: rgba(15, 23, 42, 0.02);
                color: var(--ce-text-muted);
                border: 1px solid var(--ce-border);
            }

            .reg-badge-dot {
                width: 8px;
                height: 8px;
                border-radius: 999px;
                background: var(--ce-success);
                flex-shrink: 0;
                box-shadow: 0 0 6px var(--ce-success);
            }

            .volunteer-dot {
                background: var(--ce-volunteer);
                box-shadow: 0 0 6px var(--ce-volunteer);
            }

            .reg-status-chip {
                min-height: 36px;
                padding: 0 16px;
                border: 1px solid transparent;
            }

            .status-open {
                background: rgba(16, 185, 129, 0.08);
                border-color: rgba(16, 185, 129, 0.15);
                color: var(--ce-success);
            }

            .status-almost {
                background: rgba(245, 158, 11, 0.08);
                border-color: rgba(245, 158, 11, 0.15);
                color: var(--ce-warning);
            }

            .status-full {
                background: rgba(239, 68, 68, 0.08);
                border-color: rgba(239, 68, 68, 0.15);
                color: var(--ce-danger);
            }

            .status-unlimited {
                background: rgba(5, 150, 105, 0.08);
                border-color: rgba(5, 150, 105, 0.15);
                color: var(--ce-primary);
            }

            .capacity-block {
                padding: 16px 20px;
                background: rgba(15, 23, 42, 0.015);
                border: 1px solid var(--ce-border);
                border-radius: var(--ce-radius-md);
            }

            .capacity-row {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                flex-wrap: wrap;
                margin-bottom: 12px;
                font-size: 13px;
                font-weight: 700;
                color: var(--ce-text-muted);
            }

            .progress-bar-track {
                width: 100%;
                height: 6px;
                overflow: hidden;
                border-radius: 999px;
                background: rgba(15, 23, 42, 0.06);
            }

            .progress-bar-fill {
                height: 100%;
                border-radius: 999px;
                transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .progress-bar-fill.status-open { background: var(--ce-success); }
            .progress-bar-fill.status-almost { background: var(--ce-warning); }
            .progress-bar-fill.status-full { background: var(--ce-danger); }

            .event-description {
                color: var(--ce-text-muted);
                font-size: 15px;
                line-height: 1.8;
                max-width: 72ch;
            }

            .event-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                flex-wrap: wrap;
                padding-top: 12px;
                border-top: 1px solid var(--ce-border);
            }

            .event-owner {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .owner-label {
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--ce-text-soft);
            }

            .owner-chip {
                min-height: 38px;
                padding: 0 16px;
                background: rgba(15, 23, 42, 0.02);
                color: var(--ce-text);
                border: 1px solid var(--ce-border);
                font-weight: 600;
            }

            .event-actions,
            .reg-dialog-actions,
            .success-actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                align-items: center;
            }

            .reg-dialog-actions {
                justify-content: flex-end;
                padding: 20px 24px;
                border-top: 1px solid var(--ce-border);
            }

            .success-actions {
                justify-content: center;
                padding: 16px;
            }

            .btn,
            .event-actions .btn,
            .btn-reg-cancel,
            .btn-reg-submit,
            .btn-volunteer,
            .btn-volunteer-submit,
            .btn-vol-cancel,
            #reg-success-close,
            #vol-success-close {
                min-height: 46px;
                padding: 0 20px !important;
                border-radius: 14px !important;
                font-size: 14px !important;
                font-weight: 700 !important;
                letter-spacing: 0.01em;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }

            .btn-register,
            .btn-reg-submit,
            #reg-success-close {
                background: var(--ce-primary) !important;
                color: #fff !important;
                border: 1px solid var(--ce-primary) !important;
                box-shadow: 0 4px 14px rgba(5, 150, 105, 0.15) !important;
            }

            .btn-register:hover,
            .btn-reg-submit:hover,
            #reg-success-close:hover {
                background: var(--ce-primary-dark) !important;
                border-color: var(--ce-primary-dark) !important;
                box-shadow: 0 6px 20px rgba(5, 150, 105, 0.25) !important;
                transform: translateY(-2px) !important;
            }

            .btn-volunteer,
            .btn-volunteer-submit,
            #vol-success-close {
                background: var(--ce-volunteer) !important;
                color: #fff !important;
                border: 1px solid var(--ce-volunteer) !important;
                box-shadow: 0 4px 14px rgba(124, 58, 237, 0.15) !important;
            }

            .btn-volunteer:hover,
            .btn-volunteer-submit:hover,
            #vol-success-close:hover {
                background: var(--ce-volunteer-dark) !important;
                border-color: var(--ce-volunteer-dark) !important;
                box-shadow: 0 6px 20px rgba(124, 58, 237, 0.25) !important;
                transform: translateY(-2px) !important;
            }

            .btn-view-details,
            .event-actions .btn-primary {
                background: rgba(15, 23, 42, 0.03) !important;
                color: var(--ce-text) !important;
                border: 1px solid var(--ce-border-strong) !important;
                box-shadow: none !important;
            }

            .btn-view-details:hover,
            .event-actions .btn-primary:hover,
            .btn-reg-cancel:hover,
            .btn-vol-cancel:hover,
            .btn-default:hover {
                background: rgba(15, 23, 42, 0.07) !important;
                border-color: var(--ce-text-muted) !important;
                transform: translateY(-2px) !important;
            }

            .btn-reg-cancel,
            .btn-vol-cancel,
            .btn-default {
                background: rgba(15, 23, 42, 0.02) !important;
                color: var(--ce-text-muted) !important;
                border: 1px solid var(--ce-border) !important;
                box-shadow: none !important;
            }

            .btn-register-closed,
            .btn-volunteer-closed,
            .btn-disabled {
                background: rgba(15, 23, 42, 0.04) !important;
                color: var(--ce-text-soft) !important;
                border: 1px solid var(--ce-border) !important;
                box-shadow: none !important;
                cursor: not-allowed !important;
            }

            .btn-register-closed:hover,
            .btn-volunteer-closed:hover {
                transform: none !important;
                background: rgba(15, 23, 42, 0.04) !important;
            }

            .dialog-loading-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
                padding: 40px 10px;
                text-align: center;
            }

            .dialog-loading-state p {
                margin: 0;
                color: var(--ce-text-muted);
                font-size: 16px;
            }

            .reg-modal-body {
                display: flex;
                flex-direction: column;
                gap: 24px;
                padding: 10px 4px 4px;
                background: #ffffff;
                color: var(--ce-text);
            }

            .reg-event-banner {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 20px;
                background: rgba(15, 23, 42, 0.015);
                border: 1px solid var(--ce-border);
                border-radius: 16px;
            }

            .vol-event-banner {
                border-left: 4px solid var(--ce-volunteer);
            }

            .reg-event-label {
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--ce-text-soft);
            }

            .reg-event-name {
                color: var(--ce-text);
                font-size: 20px;
                font-weight: 800;
            }

            .reg-form-desc {
                padding: 16px 20px;
                background: rgba(15, 23, 42, 0.015);
                border: 1px solid var(--ce-border);
                border-radius: 16px;
                color: var(--ce-text-muted);
                line-height: 1.7;
                font-size: 14px;
            }

            #reg-fields-container {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .reg-field-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .reg-field-label {
                color: var(--ce-text);
                font-size: 14px;
                font-weight: 700;
            }

            .req-star {
                color: var(--ce-danger);
                margin-left: 4px;
            }

            .reg-input,
            .reg-modal-body .form-control,
            .reg-modal-body textarea,
            .reg-modal-body select,
            .reg-modal-body input[type="text"],
            .reg-modal-body input[type="number"],
            .reg-modal-body input[type="date"] {
                min-height: 48px;
                border-radius: 14px !important;
                border: 1px solid var(--ce-border) !important;
                background: #ffffff !important;
                box-shadow: none !important;
                color: var(--ce-text) !important;
                padding: 12px 16px !important;
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            .reg-modal-body textarea.reg-input {
                min-height: 120px;
                resize: vertical;
            }

            .reg-input:focus,
            .reg-modal-body .form-control:focus {
                border-color: rgba(99, 102, 241, 0.5) !important;
                box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
            }

            .reg-check-wrap {
                display: flex;
                align-items: center;
                gap: 12px;
                min-height: 48px;
                padding: 0 4px;
            }

            .reg-check-label {
                margin: 0;
                font-weight: 600;
                color: var(--ce-text-muted);
            }

            .reg-error {
                padding: 14px 16px;
                border-radius: 14px;
                background: rgba(239, 68, 68, 0.08);
                border: 1px solid rgba(239, 68, 68, 0.15);
                color: var(--ce-danger);
                font-size: 14px;
                font-weight: 700;
            }

            .reg-empty-note {
                padding: 20px;
                text-align: center;
                border: 1px dashed var(--ce-border-strong);
                border-radius: 16px;
                color: var(--ce-text-soft);
                font-size: 14px;
            }

            .is-invalid {
                border-color: rgba(239, 68, 68, 0.5) !important;
                box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
            }

            .success-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                gap: 16px;
                padding: 40px 24px;
            }

            .success-state-icon {
                width: 80px;
                height: 80px;
                display: grid;
                place-items: center;
                border-radius: 28px;
                background: rgba(16, 185, 129, 0.1);
                color: var(--ce-success);
                font-size: 38px;
                font-weight: 800;
                box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
            }

            .success-state h3 {
                margin: 0;
                color: var(--ce-text);
                font-size: 26px;
                font-weight: 800;
            }

            .success-state p {
                margin: 0;
                color: var(--ce-text-muted);
                font-size: 15px;
            }

            .success-state strong {
                color: var(--ce-text);
                font-size: 18px;
            }

            /* ── Volunteer modal specific ─────────────────────────────── */

            .vol-form-section {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .vol-section-label {
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--ce-text-soft);
                border-bottom: 2px solid var(--ce-border);
                padding-bottom: 8px;
            }

            .vol-roles-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .vol-role-option {
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 16px;
                border: 1.5px solid var(--ce-border);
                border-radius: 16px;
                cursor: pointer;
                background: rgba(15, 23, 42, 0.005);
                transition: border-color .15s, background .15s;
            }

            .vol-role-option:hover {
                border-color: var(--ce-volunteer);
                background: rgba(124, 58, 237, 0.05);
            }

            .vol-role-option input[type="radio"] {
                width: 20px;
                height: 20px;
                accent-color: var(--ce-volunteer);
                flex-shrink: 0;
            }

            .vol-role-info {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .vol-role-name {
                font-size: 15px;
                font-weight: 700;
                color: var(--ce-text);
            }

            .vol-role-meta {
                font-size: 13px;
                color: var(--ce-text-muted);
            }

            .vol-role-full {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .vol-role-full:hover {
                border-color: var(--ce-border);
                background: transparent;
            }

            .vol-member-card {
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 16px;
                border: 1.5px solid rgba(16, 185, 129, 0.2);
                background: rgba(16, 185, 129, 0.04);
                border-radius: 16px;
                margin-bottom: 12px;
            }

            .vol-member-icon {
                width: 36px;
                height: 36px;
                border-radius: 999px;
                background: var(--ce-success);
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                flex-shrink: 0;
            }

            .vol-member-name {
                font-size: 15px;
                font-weight: 700;
                color: var(--ce-text);
            }

            .vol-member-meta {
                font-size: 13px;
                color: var(--ce-text-muted);
            }

            .vol-guest-link {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 13px;
                color: var(--ce-text-muted);
                cursor: pointer;
            }

            .vol-guest-link input {
                width: 18px;
                height: 18px;
                accent-color: var(--ce-volunteer);
            }

            /* Dialog Wrapper Overrides for Glassmorphic light styling */
            .modal-content {
                background: #ffffff !important;
                border: 1px solid var(--ce-border-strong) !important;
                border-radius: 20px !important;
                box-shadow: var(--ce-shadow-lg) !important;
                color: var(--ce-text) !important;
            }

            .modal-header {
                border-bottom: 1px solid var(--ce-border) !important;
                padding: 20px 24px !important;
            }

            .modal-title {
                font-weight: 800 !important;
                font-size: 20px !important;
                color: var(--ce-text) !important;
            }

            .close {
                color: var(--ce-text) !important;
                opacity: 0.6;
            }

            .close:hover {
                opacity: 1;
            }

            @media (max-width: 1100px) {
                .event-item {
                    grid-template-columns: 280px minmax(0, 1fr);
                }
            }

            @media (max-width: 900px) {
                .events-hero {
                    grid-template-columns: 1fr;
                    padding: 32px;
                }

                .event-item {
                    grid-template-columns: 1fr;
                }

                .event-image-section img {
                    min-height: 240px;
                }
            }

            @media (max-width: 640px) {
                .community-events-container {
                    padding: 20px 16px;
                }

                .events-hero {
                    padding: 24px;
                    gap: 20px;
                    border-radius: var(--ce-radius-lg);
                }

                .events-hero-copy h1 {
                    font-size: 34px;
                }

                .event-details-section {
                    padding: 24px;
                }

                .event-title {
                    font-size: 24px;
                }

                .event-footer {
                    align-items: stretch;
                    flex-direction: column;
                }

                .event-actions,
                .reg-dialog-actions {
                    width: 100%;
                }

                .event-actions .btn,
                .reg-dialog-actions .btn {
                    width: 100%;
                }

                .capacity-row {
                    flex-direction: column;
                    gap: 6px;
                }
            }
        </style>
    `);
}
frappe.router.on("change", function () {
    if (frappe.get_route()[0] !== "community-events") {
        $("#community-events-style").remove();
    }
});