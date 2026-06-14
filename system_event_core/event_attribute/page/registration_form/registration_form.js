frappe.pages['registration-form'].on_page_load = function(wrapper) {

    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Registration Form',
        single_column: true
    });

    const route = frappe.get_route();

let registration_name = route[1];
let event_name = route[2];
console.log("Registration:", registration_name);
console.log("Event:", event_name);

    if (!registration_name) {
        page.main.html(`
            <div class="alert alert-warning">
                Registration document not found
            </div>
        `);
        return;
    }

    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Registration",
            name: registration_name
        },
        callback: function(r) {

            let doc = r.message;
            let questions = doc.question || [];

            let html = `
<style>

.registration-wrapper{
    max-width:900px;
    margin:auto;
    padding:20px;
}

.form-header{
    margin-bottom:30px;
}

.form-title{
    font-size:28px;
    font-weight:600;
}

.form-description{
    color:#6c757d;
    margin-top:5px;
}

.question-card{
    background:#fff;
    border:1px solid #e5e7eb;
    border-radius:14px;
    padding:20px;
    margin-bottom:20px;
}

.question-header{
    display:flex;
    justify-content:space-between;
    margin-bottom:10px;
}

.question-title{
    font-size:16px;
    font-weight:600;
}

.question-number{
    margin-right:8px;
    color:#666;
}

.required{
    color:red;
}

.form-control{
    min-height:42px;
    border-radius:8px;
}

.footer-bar{
    position:sticky;
    bottom:0;
    background:white;
    padding:15px;
    border-top:1px solid #ddd;
    display:flex;
    justify-content:center;
    gap:15px;
}

.submit-btn{
    min-width:250px;
    background:#10b58f;
    color:white;
    border:none;
}

.submit-btn:hover{
    background:#0ea07c;
    color:white;
}

.status-circle{
    width:18px;
    height:18px;
    border-radius:50%;
    border:3px solid #ccc;
}

.status-circle.completed{
    border-color:#28a745;
    background:#28a745;
}

</style>

<div class="registration-wrapper">

    <div class="form-header">
        <div class="form-title">${doc.form_name || ""}</div>
        <div class="form-description">${doc.description || ""}</div>
    </div>

    <form id="dynamic-registration-form">
`;

            questions.forEach((row, index) => {

                html += `
<div class="question-card">

    <div class="question-header">

        <div class="question-title">
            <span class="question-number">${index + 1}.</span>
            ${row.question}
            ${row.required ? '<span class="required">*</span>' : ''}
        </div>

        <div class="status-circle"></div>

    </div>
`;

                if (row.field_type === "Small Text") {

                    html += `
<textarea class="form-control dynamic-field"
    data-question="${row.question}"
    rows="3"></textarea>
`;

                } else if (row.field_type === "Select") {

                    let options = (row.option || "").split("\n");

                    html += `
<select class="form-control dynamic-field"
    data-question="${row.question}">
<option value="">Select</option>
`;

                    options.forEach(opt => {
                        if (opt.trim()) {
                            html += `<option value="${opt}">${opt}</option>`;
                        }
                    });

                    html += `</select>`;

                } else if (row.field_type === "Check") {

                    html += `
<input type="checkbox"
    class="dynamic-field"
    data-question="${row.question}">
`;

                } else if (row.field_type === "Date") {

                    html += `
<input type="date"
    class="form-control dynamic-field"
    data-question="${row.question}">
`;

                } else if (row.field_type === "Email") {

                    html += `
<input type="email"
    class="form-control dynamic-field"
    data-question="${row.question}">
`;

                } else if (row.field_type === "Phone") {

                    html += `
<input type="tel"
    class="form-control dynamic-field"
    data-question="${row.question}">
`;

                } else {

                    html += `
<input type="text"
    class="form-control dynamic-field"
    data-question="${row.question}">
`;
                }

                html += `</div>`;
            });

            html += `
</form>

<div class="footer-bar">
    <button type="button" class="btn submit-btn" id="submit-form">
        Submit Registration
    </button>
</div>

</div>
`;

            page.main.html(html);

            setTimeout(function () {

                function updateProgress() {

                    let total = $('.dynamic-field').length;
                    let completed = 0;

                    $('.dynamic-field').each(function () {

                        let val = $(this).val();

                        if ($(this).attr('type') === 'checkbox') {
                            if ($(this).is(':checked')) completed++;
                        } else {
                            if (val && val.trim() !== "") completed++;
                        }

                    });

                    let percent = total ? (completed / total) * 100 : 0;

                }

                $('.dynamic-field').on('keyup change', updateProgress);

                updateProgress();

                $('#submit-form').on('click', function () {

                    let responses = [];

                    $('.dynamic-field').each(function () {

                        let question = $(this).data('question');
                        let answer = "";

                        if ($(this).attr('type') === 'checkbox') {
                            answer = $(this).is(':checked') ? "Yes" : "No";
                        } else {
                            answer = $(this).val();
                        }

                        responses.push({
                            question: question,
                            answer: answer
                        });

                    });

frappe.call({
    method: "system_event_core.event_attribute.doctype.registration_response.registration_response.submit_registration",
    args: {
        event: event_name,
        registration_form: registration_name,
        answers_json: JSON.stringify(
            responses.map(r => ({
                question_label: r.question,
                answer: r.answer
            }))
        )
    },
    freeze: true,
    freeze_message: "Submitting...",
    callback: function(r) {

        if (r.message?.success) {

            frappe.msgprint({
                title: __("Success"),
                message: __("Registration Submitted Successfully"),
                indicator: "green"
            });

            frappe.set_route(
                "community-events"
            );
        }
    }
});

                });

            }, 300);

        }
    });
};