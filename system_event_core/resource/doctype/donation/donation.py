# Copyright (c) 2026, saasfarers and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Donation(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		address: DF.SmallText | None
		amount: DF.Data | None
		area: DF.Data | None
		bank_name: DF.Data | None
		capacity: DF.Data | None
		certification_number: DF.Data | None
		chariot_name: DF.Data | None
		chariot_type: DF.Data | None
		chasis_number: DF.Data | None
		cloth_material: DF.Data | None
		colour: DF.Data | None
		currency: DF.Currency
		district: DF.Data | None
		document_number: DF.Data | None
		donar_name: DF.Data | None
		donation_date: DF.Date | None
		donation_type: DF.Literal["Jewellary", "Cash", "Land", "Vehicle", "Chariot", "Equipment", "Electrical", "Kitchen Utilities", "Dress", "Furniture", "Musical Instrument"]
		email: DF.Data | None
		engine_number: DF.Data | None
		equipment_name: DF.Data | None
		fuel_type: DF.Data | None
		gross_weight: DF.Data | None
		hallmark_number: DF.Data | None
		height: DF.Int
		identifier_number: DF.Data | None
		insurance_expiry_date: DF.Date | None
		insurance_number: DF.Data | None
		jewellary_name: DF.Data | None
		last_audit_date: DF.Date | None
		manufacturer: DF.Data | None
		market_value: DF.Data | None
		material: DF.Data | None
		metal_type: DF.Data | None
		mobile_number: DF.Phone | None
		mode_of_donation: DF.Literal["Cash", "UPI", "Credit Card", "Debit Card", "Bank Transfer", "Cheque", "Online POrtal"]
		model_number: DF.Data | None
		name1: DF.Data | None
		name: DF.Int | None
		net_weight: DF.Data | None
		number_of_wheels: DF.Int
		odometer_reading: DF.Int
		pan_aadhar_number: DF.Data | None
		power_rating: DF.Data | None
		proof: DF.Attach | None
		puc_expiry: DF.Date | None
		purity22k24k: DF.Data | None
		quantity: DF.Int
		rc_number: DF.Data | None
		receipt_date: DF.Date | None
		receipt_number: DF.Data | None
		registration_number: DF.Data | None
		seat_capacity: DF.Int
		size: DF.Data | None
		stone_type: DF.Data | None
		stone_weight: DF.Data | None
		survey_number: DF.Data | None
		taluk: DF.Data | None
		transaction_date: DF.Date | None
		transaction_reference_number: DF.Data | None
		unit: DF.Literal["Kg", "Liter"]
		vehicle_name: DF.Data | None
		vehicle_number: DF.Data | None
		village: DF.Data | None
		voltage: DF.Data | None
		warranty_end_date: DF.Date | None
		warranty_start_date: DF.Date | None
		weight: DF.Int
		width: DF.Int
	# end: auto-generated types

	pass
