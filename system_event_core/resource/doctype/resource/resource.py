# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Resource(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		acquistion_type: DF.Literal["Purchased", "Donated"]
		assert_category: DF.Literal["Jewellary", "Vehicle", "Chariot", "Equipment", "Electrical", "Kitchen Utilities", "Dress", "Furniture", "Musical Instrument"]
		assert_code: DF.Data | None
		assert_name: DF.Data | None
		certificate_number: DF.Data | None
		chassis_number: DF.Data | None
		description: DF.SmallText | None
		donar_name: DF.Data | None
		engine_number: DF.Data | None
		fuel_type: DF.Data | None
		gross_weight: DF.Data | None
		hallmark_number: DF.Data | None
		insurance_expiry_date: DF.Date | None
		insurance_number: DF.Data | None
		jewellary_name: DF.Data | None
		last_audit_date: DF.Date | None
		last_service: DF.Date | None
		metal_type: DF.Data | None
		name: DF.Int | None
		net_weight: DF.Data | None
		next_service: DF.Date | None
		odometer_reading: DF.Int
		photo: DF.AttachImage | None
		puc_expiry: DF.Date | None
		purchasedonation_date: DF.Date | None
		purity22k24k: DF.Data | None
		rc_number: DF.Data | None
		seat_capacity: DF.Int
		status: DF.Literal["Active", "In use", "Under Maintainence", "Damaged", "Lost", "Retired"]
		stone_type: DF.Data | None
		stone_weight: DF.Data | None
		storage_location: DF.Data | None
		vehicle_name: DF.Data | None
		vehicle_number: DF.Data | None
	# end: auto-generated types

	pass
