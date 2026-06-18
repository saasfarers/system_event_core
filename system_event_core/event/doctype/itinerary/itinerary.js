// Copyright (c) 2026, saasfarers and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Itinerary", {
//     refresh(frm) {
//         render_itinerary_view(frm);
//     },
//     after_save(frm) {
//         render_itinerary_view(frm);
//     }
// });

// function render_itinerary_view(frm) {
//     if (!frm.doc.itinerary_day_plan || frm.doc.itinerary_day_plan.length === 0) return;

//     let days = frm.doc.itinerary_day_plan;
//     let today = frappe.datetime.get_today();

//     let timeline_html = days.map((day, i) => {
//         let status = day.day_date < today ? 'done' : day.day_date === today ? 'active' : 'upcoming';
//         let line = i < days.length - 1 ? `<div class="tl-line ${day.day_date < today ? 'done' : 'upcoming'}"></div>` : '';
//         return `
//             <div class="tl-item">
//                 <div class="tl-circle ${status}">D${day.day_number}</div>
//                 <span class="tl-lbl">${day.day_label || ''}</span>
//                 <span class="tl-date">${frappe.datetime.str_to_user(day.day_date)}</span>
//             </div>${line}`;
//     }).join('');

//     let cards_html = days.map(day => {
//         let status = day.day_date === today ? 'active' : '';
//         return `
//             <div class="day-card ${status}">
//                 <div class="card-head">
//                     <span class="day-num">Day ${day.day_number}</span>
//                     <span class="day-date-badge">${frappe.datetime.str_to_user(day.day_date)}</span>
//                 </div>
//                 <div class="card-label">
//                     <p class="label-text">${day.day_label || ''}</p>
//                 </div>
//                 <div class="card-body">
//                     ${day.location ? `
//                     <div class="field-row">
//                         <span class="field-lbl">📍 Location</span>
//                         <span class="field-val">${day.location}</span>
//                     </div>` : ''}
//                     ${day.activities ? `
//                     <div class="field-row">
//                         <span class="field-lbl">📋 Activities</span>
//                         <span class="field-val">${day.activities}</span>
//                     </div>` : ''}
//                 </div>
//                 ${day.notes ? `
//                 <div class="card-foot">
//                     <p class="notes-text">📝 ${day.notes}</p>
//                 </div>` : ''}
//             </div>`;
//     }).join('');

//     let html = `
//         <style>
//             .itin-wrap *{box-sizing:border-box;margin:0;padding:0}
//             .itin-header{padding:1.25rem 1.5rem;border-bottom:1px solid var(--border-color);margin-bottom:1rem}
//             .itin-title{font-size:18px;font-weight:500;color:var(--text-color);margin-bottom:0.25rem}
//             .itin-event{font-size:12px;color:var(--text-muted);margin-bottom:4px}
//             .meta-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:1rem}
//             .meta-card{background:var(--control-bg);border-radius:6px;padding:0.6rem 0.9rem}
//             .meta-lbl{font-size:10px;color:var(--text-muted);margin-bottom:3px}
//             .meta-val{font-size:13px;font-weight:500;color:var(--text-color)}
//             .sec-title{font-size:10px;color:var(--text-muted);letter-spacing:0.06em;margin-bottom:1rem}
//             .timeline{display:flex;align-items:center;margin-bottom:1.5rem;overflow-x:auto;padding-bottom:4px}
//             .tl-item{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:80px}
//             .tl-circle{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;border:1.5px solid}
//             .tl-circle.done{background:#9FE1CB;color:#085041;border-color:#5DCAA5}
//             .tl-circle.active{background:#534AB7;color:#fff;border-color:#534AB7}
//             .tl-circle.upcoming{background:var(--control-bg);color:var(--text-muted);border-color:var(--border-color)}
//             .tl-lbl{font-size:10px;color:var(--text-muted);text-align:center;max-width:78px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
//             .tl-date{font-size:10px;color:var(--text-muted)}
//             .tl-line{flex:1;height:1.5px;min-width:20px;margin-top:-26px}
//             .tl-line.done{background:#5DCAA5}
//             .tl-line.upcoming{background:var(--border-color)}
//             .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem}
//             .day-card{background:var(--card-bg);border:1px solid var(--border-color);border-radius:8px;overflow:hidden}
//             .day-card.active{border:1.5px solid #534AB7}
//             .card-head{padding:0.75rem 1rem;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border-color)}
//             .day-num{font-size:11px;font-weight:500;color:#534AB7}
//             .day-date-badge{font-size:10px;color:var(--text-muted)}
//             .card-label{padding:0.5rem 1rem;background:var(--control-bg);border-bottom:1px solid var(--border-color)}
//             .label-text{font-size:12px;font-weight:500;color:var(--text-color)}
//             .card-body{padding:0.75rem 1rem;display:flex;flex-direction:column;gap:0.6rem}
//             .field-row{display:flex;flex-direction:column;gap:2px}
//             .field-lbl{font-size:10px;color:var(--text-muted)}
//             .field-val{font-size:12px;color:var(--text-color);line-height:1.5}
//             .card-foot{padding:0.5rem 1rem;border-top:1px solid var(--border-color);background:var(--control-bg)}
//             .notes-text{font-size:11px;color:var(--text-muted);font-style:italic;line-height:1.4}
//             .overall-notes{padding:1rem 0;margin-top:1rem;border-top:1px solid var(--border-color)}
//         </style>

//         <div class="itin-wrap">
//             <div class="itin-header">
//                 <p class="itin-event">🔗 ${frm.doc.linked_event || ''}</p>
//                 <p class="itin-title">${frm.doc.itinerary_title || ''}</p>
//                 <div class="meta-row">
//                     <div class="meta-card">
//                         <p class="meta-lbl">📅 Start Date</p>
//                         <p class="meta-val">${frappe.datetime.str_to_user(frm.doc.start_date)}</p>
//                     </div>
//                     <div class="meta-card">
//                         <p class="meta-lbl">📅 End Date</p>
//                         <p class="meta-val">${frappe.datetime.str_to_user(frm.doc.end_date)}</p>
//                     </div>
//                     <div class="meta-card">
//                         <p class="meta-lbl">🕐 Total Days</p>
//                         <p class="meta-val">${frm.doc.total_days || 0} Days</p>
//                     </div>
//                     <div class="meta-card">
//                         <p class="meta-lbl">👥 Created For</p>
//                         <p class="meta-val">${frm.doc.created_for || '-'}</p>
//                     </div>
//                 </div>
//             </div>

//             <div style="padding:1.25rem 0">
//                 <p class="sec-title">DAY-WISE JOURNEY TIMELINE</p>
//                 <div class="timeline">${timeline_html}</div>
//                 <div class="cards">${cards_html}</div>
//             </div>

//             ${frm.doc.notes ? `
//             <div class="overall-notes">
//                 <p class="sec-title">OVERALL NOTES</p>
//                 <p style="font-size:13px;color:var(--text-muted);line-height:1.6">${frm.doc.notes}</p>
//             </div>` : ''}
//         </div>`;

//     frm.fields_dict.itinerary_view.$wrapper.html(html);
// }