frappe.ui.form.on('Attendance', {
    refresh(frm) {
        if (!frm.doc.__islocal) {
            // Add custom checkin, checkout, and absent buttons for better UI/UX
            if (!frm.doc.checkin && frm.doc.status !== "Absent") {
                frm.add_custom_button(__('Check In Now'), function() {
                    frm.set_value('checkin', frappe.datetime.now_datetime());
                    frm.set_value('status', 'Present');
                    frm.save();
                }).addClass('btn-success');
            }

            if (frm.doc.checkin && !frm.doc.checkout) {
                frm.add_custom_button(__('Check Out Now'), function() {
                    frm.set_value('checkout', frappe.datetime.now_datetime());
                    frm.save();
                }).addClass('btn-danger');
            }

            if (frm.doc.status !== "Absent") {
                frm.add_custom_button(__('Mark Absent'), function() {
                    frm.set_value('status', 'Absent');
                    frm.set_value('checkin', '');
                    frm.set_value('checkout', '');
                    frm.set_value('working_hours', 0);
                    frm.save();
                }).addClass('btn-warning');
            }
        }
    },

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

        if (end.isBefore(start)) {
            frappe.msgprint({
                title: __('Invalid Times'),
                message: __('Check-Out Time cannot be before Check-In Time.'),
                indicator: 'red'
            });
            frm.set_value('checkout', '');
            frm.set_value('working_hours', 0);
            return;
        }

        const seconds = end.diff(start, 'seconds');
        frm.set_value('working_hours', seconds);
    }
}