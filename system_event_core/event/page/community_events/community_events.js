frappe.pages['community-events'].on_page_load = function(wrapper) {

	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Community Events',
		single_column: true
	});

	$(wrapper).find('.layout-main-section').html(`
		<div class="community-events-container">

			<div class="events-header">

				<div class="header-content">
					<div class="header-icon">🕌</div>

					<div>
						<h1>Community Events</h1>
						<p>
							Discover mosque programs, religious gatherings,
							community services and volunteer opportunities.
						</p>
					</div>
				</div>

				<div class="search-section">
					<input
						type="text"
						id="event-search"
						class="form-control"
						placeholder="Search events..."
					/>
				</div>

			</div>

			<div id="events-list"></div>

		</div>
	`);

	add_page_styles();
	load_events();

	$(wrapper).on("keyup", "#event-search", function() {
		filter_events($(this).val());
	});
};

function load_events() {

	frappe.call({
		method: "frappe.client.get_list",
		args: {
			doctype: "Events",
			fields: [
				"name",
				"event_name",
				"event_category",
				"event_type",
				"event_image",
				"description",
				"start_date",
				"start_time",
				"end_date",
				"end_time",
				"venue",
				"is_off_premise",
				"off_premise_address",
				"event_owner",
				"status"
			],
			order_by: "start_date asc",
			limit_page_length: 100
		},
		callback: function(r) {

			let html = "";

			(r.message || []).forEach(event => {

				let image = event.event_image
					? event.event_image
					: "/assets/frappe/images/ui-placeholder.svg";

				let desc = (event.description || "")
					.replace(/<[^>]*>/g, "")
					.substring(0, 200);

				let location = event.is_off_premise
					? event.off_premise_address
					: event.venue;

				html += `
					<div class="event-item">

						<div class="event-image-section">
							<img src="${image}">
						</div>

						<div class="event-details-section">

							<div class="event-category">
								${event.event_category || ""}
							</div>

							<h2 class="event-title">
								${event.event_name || ""}
							</h2>

							<div class="event-meta">
								<span>📅 ${frappe.datetime.str_to_user(event.start_date)}</span>
								<span>⏰ ${event.start_time || ""}</span>
							</div>

							<div class="event-location">
								📍 ${location || "Location Not Specified"}
							</div>

							${
								event.is_off_premise
								? `
									<div class="off-premise">
										🚗 Off Premise Event
									</div>
								`
								: ""
							}

							<div class="event-description">
								${desc}
							</div>

							<div class="event-footer">

								<div class="event-owner">
									👤 ${event.event_owner || ""}
								</div>

								<div class="event-actions">

									<button
										class="btn btn-primary"
										onclick="
											frappe.set_route(
												'Form',
												'Events',
												'${event.name}'
											)
										"
									>
										View Details
									</button>

								</div>

							</div>

						</div>

					</div>
				`;
			});

			$("#events-list").html(html);
		}
	});
}

function filter_events(search_text) {

	search_text = search_text.toLowerCase();

	$(".event-item").each(function() {

		let text = $(this)
			.text()
			.toLowerCase();

		$(this).toggle(
			text.includes(search_text)
		);
	});
}

function add_page_styles() {

	if ($("#community-events-style").length) {
		return;
	}

	$("head").append(`

	<style id="community-events-style">

	.community-events-container{
		background:#f5f7fb;
		padding:25px;
		min-height:100vh;
	}

	.events-header{
		background:white;
		border-radius:20px;
		padding:25px;
		margin-bottom:25px;
		box-shadow:0 4px 16px rgba(0,0,0,.06);
	}

	.header-content{
		display:flex;
		gap:20px;
		align-items:center;
		margin-bottom:20px;
	}

	.header-icon{
		font-size:50px;
	}

	.header-content h1{
		font-weight:700;
		margin:0;
	}

	.header-content p{
		color:#6b7280;
		margin-top:8px;
	}

	.event-item{
		background:white;
		border-radius:20px;
		overflow:hidden;
		display:flex;
		margin-bottom:24px;
		box-shadow:0 5px 20px rgba(0,0,0,.07);
		transition:.3s;
	}

	.event-item:hover{
		transform:translateY(-4px);
		box-shadow:0 10px 30px rgba(0,0,0,.12);
	}

	.event-image-section{
		width:340px;
		flex-shrink:0;
	}

	.event-image-section img{
		width:100%;
		height:100%;
		object-fit:cover;
		min-height:280px;
	}

	.event-details-section{
		padding:24px;
		flex:1;
	}

	.event-category{
		display:inline-block;
		padding:5px 12px;
		border-radius:20px;
		background:#e7f5ec;
		color:#198754;
		font-size:12px;
		font-weight:600;
	}

	.event-title{
		margin-top:14px;
		font-size:28px;
		font-weight:700;
	}

	.event-meta{
		display:flex;
		gap:20px;
		margin-top:15px;
		color:#6b7280;
		font-size:14px;
	}

	.event-location{
		margin-top:15px;
		font-size:15px;
		font-weight:600;
		color:#374151;
	}

	.off-premise{
		margin-top:12px;
		color:#dc3545;
		font-weight:600;
	}

	.event-description{
		margin-top:18px;
		line-height:1.7;
		color:#4b5563;
	}

	.event-footer{
		margin-top:25px;
		display:flex;
		justify-content:space-between;
		align-items:center;
	}

	.event-owner{
		color:#6b7280;
		font-size:14px;
	}

	@media(max-width:900px){

		.event-item{
			flex-direction:column;
		}

		.event-image-section{
			width:100%;
		}

		.event-image-section img{
			height:240px;
		}
	}

	</style>

	`);
}	