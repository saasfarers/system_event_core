app_name = "system_event_core"
app_title = "System Event Core"
app_publisher = "saasfarers"
app_description = "This is event details"
app_email = "saasfarers@gmail.com"
app_license = "mit"

# Fixtures
# --------
# Seed data that is packaged with the app and loaded on bench migrate / restore
fixtures = [
	{
		"dt": "Event Category Master",
		"filters": [["is_active", "=", 1]],
	},
]
doctype_calendar_js = {
    "Event Schedules": "public/js/event_schedule_calendar.js"
}
# Apps
# ------------------
	
# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "system_event_core",
# 		"logo": "/assets/system_event_core/logo.png",
# 		"title": "System Event Core",
# 		"route": "/system_event_core",
# 		"has_permission": "system_event_core.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/system_event_core/css/system_event_core.css"
# app_include_js = "/assets/system_event_core/js/system_event_core.js"

# include js, css files in header of web template
# web_include_css = "/assets/system_event_core/css/system_event_core.css"
# web_include_js = "/assets/system_event_core/js/system_event_core.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "system_event_core/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "system_event_core/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# automatically load and sync documents of this doctype from downstream apps
# importable_doctypes = [doctype_1]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "system_event_core.utils.jinja_methods",
# 	"filters": "system_event_core.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "system_event_core.install.before_install"
# after_install = "system_event_core.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "system_event_core.uninstall.before_uninstall"
# after_uninstall = "system_event_core.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "system_event_core.utils.before_app_install"
# after_app_install = "system_event_core.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "system_event_core.utils.before_app_uninstall"
# after_app_uninstall = "system_event_core.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "system_event_core.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"system_event_core.tasks.all"
# 	],
# 	"daily": [
# 		"system_event_core.tasks.daily"
# 	],
# 	"hourly": [
# 		"system_event_core.tasks.hourly"
# 	],
# 	"weekly": [
# 		"system_event_core.tasks.weekly"
# 	],
# 	"monthly": [
# 		"system_event_core.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "system_event_core.install.before_tests"

# Extend DocType Class
# ------------------------------
#
# Specify custom mixins to extend the standard doctype controller.
# extend_doctype_class = {
# 	"Task": "system_event_core.custom.task.CustomTaskMixin"
# }

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "system_event_core.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "system_event_core.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["system_event_core.utils.before_request"]
# after_request = ["system_event_core.utils.after_request"]

# Job Events
# ----------
# before_job = ["system_event_core.utils.before_job"]
# after_job = ["system_event_core.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"system_event_core.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
export_python_type_annotations = True

# Require all whitelisted methods to have type annotations
require_type_annotated_api_methods = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []

