// Copyright (c) 2026, saasfarers and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Invitation", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on('Invitation', {
    refresh(frm) {

        frm.add_custom_button(__('Preview'), function () {
            preview_invitation(frm);
        });

    }
});

function preview_invitation(frm) {

    const image_html = frm.doc.invitation_image
        ? `
            <div style="text-align:center; margin-bottom:20px;">
                <img
                    src="${frm.doc.invitation_image}"
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
                    ${frm.doc.title || 'Invitation Title'}
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
                    ${frm.doc.event || 'Event Name'}
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
                ${frm.doc.message || 'Your invitation message will appear here.'}
            </div>

            ${frm.doc.attachment ? `
                <div style="
                    margin-top:25px;
                    text-align:center;
                ">
                    <a
                        href="${frm.doc.attachment}"
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