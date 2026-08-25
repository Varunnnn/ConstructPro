"""
Seed Subscription Plans & Features for ConstructPro SaaS.
Idempotent script — safe to run multiple times.
"""
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.subscription_models import SubscriptionPlan, Feature, PlanFeature


def seed_subscription_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("💳 Seeding ConstructPro Subscription Plans & Features...")

        # ── 1. Features ──────────────────────────────────────────────────────
        features_data = [
            ("ATTENDANCE", "Attendance Tracking", "Core Attendance & Wages", "core"),
            ("EXPENSES", "Expense Recording", "Record Site & Transport Expenses", "core"),
            ("MATERIALS", "Material Purchases", "Track Material Purchases & Quantities", "core"),
            ("PROJECT_PROFITABILITY", "Basic Profitability", "Contract Value vs Cost Calculations", "core"),
            ("MOBILE_WEB", "Mobile Web Access", "Mobile Responsive Site Access", "core"),
            ("BASIC_REPORTS", "Basic Reports", "Standard Project & Labour Summaries", "reports"),

            ("SUPPLIERS", "Supplier Directory", "Supplier Contact & Category Tracking", "suppliers"),
            ("CSV_EXPORT", "CSV Data Export", "Export Reports & Transactions to CSV", "reports"),
            ("EMAIL_WHATSAPP_SUPPORT", "Email & WhatsApp Support", "Standard Customer Support", "support"),

            ("ADVANCED_PROFITABILITY", "Advanced Profitability", "Detailed Cost Breakdown & Margins", "analytics"),
            ("MATERIAL_HISTORY", "Material History & Price Memory", "Last Purchase Price & Supplier Memory", "materials"),
            ("LABOUR_ADVANCES", "Labour Advances", "Track Worker Advance Payments", "labour"),
            ("PAYMENT_TRACKING", "Payment Tracking", "Supplier & Labour Payment Status", "finance"),
            ("EQUIPMENT_TRACKING", "Equipment Rental & Fuel", "Track Equipment Usage & Fuel Costs", "equipment"),
            ("ADVANCED_REPORTS", "Advanced Financial Reports", "Multi-Project Analytical Reports", "reports"),
            ("PDF_REPORTS", "PDF Export", "Generate Professional PDF Summaries", "reports"),
            ("PROJECT_DASHBOARDS", "Project-wise Dashboards", "Dedicated Financial View per Project", "analytics"),

            ("MULTIPLE_LOCATIONS", "Multiple Site Locations", "Manage Projects Across Cities", "operations"),
            ("ADVANCED_PERMISSIONS", "Advanced Roles & Permissions", "Custom Supervisor & Manager Roles", "management"),
            ("SUBCONTRACTORS", "Subcontractor Management", "Track Subcontractor Contracts & Payments", "operations"),
            ("PURCHASE_ORDERS", "Purchase Orders", "Issue POs to Suppliers", "procurement"),
            ("INVENTORY", "Stock & Material Inventory", "Site Material Balance & Usage", "procurement"),
            ("CUSTOMER_PAYMENTS", "Customer Billing & Receivables", "Track Payments Received from Clients", "finance"),
            ("SUPPLIER_OUTSTANDING", "Supplier Dues & Payables", "Manage Outstanding Supplier Balances", "finance"),
            ("WHATSAPP_NOTIFICATIONS", "Automated WhatsApp Alerts", "Attendance & Expense Alerts on WhatsApp", "automation"),
            ("DATA_IMPORT", "Data Bulk Import", "Import Excel/CSV Workers & Materials", "tools"),
        ]

        feature_map = {}
        for code, name, desc, cat in features_data:
            feat = db.query(Feature).filter(Feature.code == code).first()
            if not feat:
                feat = Feature(code=code, name=name, description=desc, category=cat, is_active=True)
                db.add(feat)
                db.flush()
            feature_map[code] = feat.id

        # ── 2. Plans ─────────────────────────────────────────────────────────
        plans_dataset = [
            {
                "code": "FREE_TRIAL",
                "name": "Free Trial",
                "description": "30-day full access trial for new contractor organizations.",
                "monthly_price": 0,
                "annual_price": 0,
                "trial_days": 30,
                "max_projects": 1,
                "max_workers": 10,
                "max_users": 1,
                "is_unlimited_projects": False,
                "is_unlimited_workers": False,
                "display_order": 1,
                "features": ["ATTENDANCE", "EXPENSES", "MATERIALS", "PROJECT_PROFITABILITY", "MOBILE_WEB", "BASIC_REPORTS"]
            },
            {
                "code": "STARTER",
                "name": "Starter",
                "description": "Essential control for small contractors running up to 3 projects.",
                "monthly_price": 999,
                "annual_price": 9990,
                "trial_days": 0,
                "max_projects": 3,
                "max_workers": 50,
                "max_users": 2,
                "is_unlimited_projects": False,
                "is_unlimited_workers": False,
                "display_order": 2,
                "features": ["ATTENDANCE", "EXPENSES", "MATERIALS", "PROJECT_PROFITABILITY", "MOBILE_WEB", "BASIC_REPORTS", "SUPPLIERS", "CSV_EXPORT", "EMAIL_WHATSAPP_SUPPORT"]
            },
            {
                "code": "PROFESSIONAL",
                "name": "Professional",
                "description": "Our most popular plan for growing contractors with unlimited workers.",
                "monthly_price": 1999,
                "annual_price": 19990,
                "trial_days": 0,
                "max_projects": 10,
                "max_workers": 99999,
                "max_users": 5,
                "is_unlimited_projects": False,
                "is_unlimited_workers": True,
                "display_order": 3,
                "features": ["ATTENDANCE", "EXPENSES", "MATERIALS", "PROJECT_PROFITABILITY", "MOBILE_WEB", "BASIC_REPORTS", "SUPPLIERS", "CSV_EXPORT", "EMAIL_WHATSAPP_SUPPORT", "ADVANCED_PROFITABILITY", "MATERIAL_HISTORY", "LABOUR_ADVANCES", "PAYMENT_TRACKING", "EQUIPMENT_TRACKING", "ADVANCED_REPORTS", "PDF_REPORTS", "PROJECT_DASHBOARDS"]
            },
            {
                "code": "BUSINESS",
                "name": "Business",
                "description": "Complete power suite for established multi-site contractors.",
                "monthly_price": 3999,
                "annual_price": 39990,
                "trial_days": 0,
                "max_projects": 99999,
                "max_workers": 99999,
                "max_users": 15,
                "is_unlimited_projects": True,
                "is_unlimited_workers": True,
                "display_order": 4,
                "features": ["ATTENDANCE", "EXPENSES", "MATERIALS", "PROJECT_PROFITABILITY", "MOBILE_WEB", "BASIC_REPORTS", "SUPPLIERS", "CSV_EXPORT", "EMAIL_WHATSAPP_SUPPORT", "ADVANCED_PROFITABILITY", "MATERIAL_HISTORY", "LABOUR_ADVANCES", "PAYMENT_TRACKING", "EQUIPMENT_TRACKING", "ADVANCED_REPORTS", "PDF_REPORTS", "PROJECT_DASHBOARDS", "MULTIPLE_LOCATIONS", "ADVANCED_PERMISSIONS", "SUBCONTRACTORS", "PURCHASE_ORDERS", "INVENTORY", "CUSTOMER_PAYMENTS", "SUPPLIER_OUTSTANDING", "WHATSAPP_NOTIFICATIONS", "DATA_IMPORT"]
            },
            {
                "code": "ENTERPRISE",
                "name": "Enterprise",
                "description": "Custom workflows, ERP integrations, and dedicated support for large builders.",
                "monthly_price": 7500,
                "annual_price": 75000,
                "trial_days": 0,
                "max_projects": 99999,
                "max_workers": 99999,
                "max_users": 50,
                "is_unlimited_projects": True,
                "is_unlimited_workers": True,
                "display_order": 5,
                "features": list(feature_map.keys())
            },
        ]

        for pdata in plans_dataset:
            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == pdata["code"]).first()
            if not plan:
                plan = SubscriptionPlan(
                    code=pdata["code"],
                    name=pdata["name"],
                    description=pdata["description"],
                    monthly_price=pdata["monthly_price"],
                    annual_price=pdata["annual_price"],
                    trial_days=pdata["trial_days"],
                    max_projects=pdata["max_projects"],
                    max_workers=pdata["max_workers"],
                    max_users=pdata["max_users"],
                    is_unlimited_projects=pdata["is_unlimited_projects"],
                    is_unlimited_workers=pdata["is_unlimited_workers"],
                    display_order=pdata["display_order"],
                    is_active=True,
                    is_public=True
                )
                db.add(plan)
                db.flush()

            # Map features
            for fcode in pdata["features"]:
                fid = feature_map[fcode]
                pf = db.query(PlanFeature).filter(PlanFeature.plan_id == plan.id, PlanFeature.feature_id == fid).first()
                if not pf:
                    db.add(PlanFeature(plan_id=plan.id, feature_id=fid))

        db.commit()
        print("✅ Subscription Plans & Feature Mapping seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed subscription data failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_subscription_data()
