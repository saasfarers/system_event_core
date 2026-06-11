frappe.ui.form.on('Attendance', {
    checkin(frm) {
        calculate_hours(frm);
    },

    checkout(frm) {
        calculate_hours(frm);
    }
});

function calculate_hours(frm) {
    if (frm.doc.checkin && frm.doc.checkout) {

        const start = moment(frm.doc.checkin);
        const end = moment(frm.doc.checkout);

        const seconds = end.diff(start, 'seconds');

        frm.set_value('working_hours', seconds);
    }
}