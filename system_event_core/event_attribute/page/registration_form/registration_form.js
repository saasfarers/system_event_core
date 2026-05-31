frappe.pages['registration-form'].on_page_load = function(wrapper) {

    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Registration Form',
        single_column: true
    });

    let registration_name = frappe.get_route()[1];

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

.progress-wrapper{
    margin-top:25px;
}

.progress{
    height:10px;
    border-radius:20px;
}

.question-card{
    background:#fff;
    border:1px solid #e5e7eb;
    border-radius:14px;
    padding:20px;
    margin-bottom:20px;
    box-shadow:0 1px 4px rgba(0,0,0,0.06);
}

.question-header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:15px;
}

.question-title{
    font-size:16px;
    font-weight:600;
}

.question-number{
    color:#6c757d;
    margin-right:8px;
}

.required{
    color:red;
}

.form-control{
    min-height:44px;
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
    z-index:100;
}

.save-btn{
    min-width:200px;
}

.submit-btn{
    min-width:300px;
    background:#10b58f;
    color:white;
    border:none;
}

.submit-btn:hover{
    background:#10b58f;
    color:white;
    color:white;
}

.status-circle{
    width:20px;
    height:20px;
    border-radius:50%;
    border:3px solid #dc3545;
}

.status-circle.completed{
    border-color:#28a745;
    background:#28a745;
}

</style>

<div class="registration-wrapper">

    <div class="form-header">

        <div class="form-title">
            ${doc.form_name || ""}
        </div>

        <div class="form-description">
            ${doc.description || ""}
        </div>

        <div class="progress-wrapper">

            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">

                <span>Progress</span>

                <span id="progress-text">
                    0 / ${questions.length} completed
                </span>

            </div>

            <div class="progress">
                <div
                    id="progress-bar"
                    class="progress-bar bg-success"
                    style="width:0%">
                </div>
            </div>

        </div>

    </div>

    <form id="dynamic-registration-form">
`;

            questions.forEach((row, index) => {

                html += `

<div class="question-card">

    <div class="question-header">

        <div class="question-title">

            <span class="question-number">
                ${index + 1}.
            </span>

            ${row.question}

            ${row.required
                ? '<span class="required">*</span>'
                : ''
            }

        </div>

        <div class="status-circle"></div>

    </div>

`;

                if (row.field_type === "Small Text") {

                    html += `
                        <textarea
                            class="form-control dynamic-field"
                            rows="4"
                            data-required="${row.required}">
                        </textarea>
                    `;

                }

                else if (row.field_type === "Select") {

                    html += `
                        <select
                            class="form-control dynamic-field"
                            data-required="${row.required}">
                    `;

                    let options = (row.option || "").split("\n");

                    html += `<option value="">Select</option>`;

                    options.forEach(opt => {

                        if(opt.trim()) {
                            html += `
                                <option value="${opt}">
                                    ${opt}
                                </option>
                            `;
                        }

                    });

                    html += `</select>`;
                }

                else if (row.field_type === "Check") {

                    html += `
                        <input
                            type="checkbox"
                            class="dynamic-field"
                            data-required="${row.required}">
                    `;
                }

                else if (row.field_type === "Date") {

                    html += `
                        <input
                            type="date"
                            class="form-control dynamic-field"
                            data-required="${row.required}">
                    `;
                }

                else if (row.field_type === "Email") {

                    html += `
                        <input
                            type="email"
                            class="form-control dynamic-field"
                            placeholder="Enter email"
                            data-required="${row.required}">
                    `;
                }

                else if (row.field_type === "Phone") {

                    html += `
                        <input
                            type="tel"
                            class="form-control dynamic-field"
                            placeholder="Enter phone number"
                            data-required="${row.required}">
                    `;
                }

                else {

                    html += `
                        <input
                            type="text"
                            class="form-control dynamic-field"
                            placeholder="Enter value"
                            data-required="${row.required}">
                    `;
                }

                html += `
</div>
`;
            });

            html += `

</form>

<div class="footer-bar">

    <button
        type="button"
        class="btn btn-light save-btn">

        Save Draft

    </button>

    <button
        type="button"
        id="submit-form"
        class="btn submit-btn">

        Submit Registration

    </button>

</div>

</div>
`;

            page.main.html(html);

            setTimeout(() => {

                function updateProgress() {

                    let total = $('.dynamic-field').length;
                    let completed = 0;

                    $('.dynamic-field').each(function(index) {

                        let value = $(this).val();

                        if ($(this).attr('type') === 'checkbox') {

                            if ($(this).is(':checked')) {
                                completed++;

                                $('.status-circle')
                                    .eq(index)
                                    .addClass('completed');
                            } else {

                                $('.status-circle')
                                    .eq(index)
                                    .removeClass('completed');
                            }

                        } else {

                            if (value && value.trim() !== "") {

                                completed++;

                                $('.status-circle')
                                    .eq(index)
                                    .addClass('completed');

                            } else {

                                $('.status-circle')
                                    .eq(index)
                                    .removeClass('completed');
                            }
                        }

                    });

                    let percent =
                        total > 0
                            ? (completed / total) * 100
                            : 0;

                    $('#progress-bar')
                        .css('width', percent + '%');

                    $('#progress-text')
                        .text(
                            completed +
                            ' / ' +
                            total +
                            ' completed'
                        );
                }

                $('.dynamic-field').on(
                    'keyup change',
                    updateProgress
                );

                updateProgress();

            }, 300);
        }
    });
};