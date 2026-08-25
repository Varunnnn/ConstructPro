"""
Seed script: Creates demo data for "Sharma Construction" organization.
Run with: python -m app.db.seed
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import date, timedelta, datetime, timezone
from decimal import Decimal
import uuid

from app.db.session import SessionLocal
from app.models.organization import Organization, OrganizationMember
from app.models.user import User
from app.models.project import Project
from app.models.worker import Worker, ProjectWorker
from app.models.attendance import Attendance
from app.models.expense import Expense
from app.models.material import MaterialPurchase
from app.models.payment import ActivityLog
from app.core.security import hash_password


def seed():
    from app.db.base import Base
    from app.db.session import engine
    from app.models import (
        Organization, OrganizationMember, User, Project,
        Worker, ProjectWorker, Attendance, Expense,
        MaterialPurchase, Supplier, Payment, ActivityLog
    )
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if Super Admin exists
        admin_user = db.query(User).filter(User.email == "admin@constructpro.in").first()
        if not admin_user:
            admin_user = User(
                full_name="ConstructPro Super Admin",
                email="admin@constructpro.in",
                mobile="9999999999",
                hashed_password=hash_password("admin1234"),
                role="super_admin"
            )
            db.add(admin_user)
            db.flush()
            print("  Created Super Admin account: admin@constructpro.in / admin1234")

        print("🌱 Seeding demo data for Sharma Construction...")

        # ── Organization ──────────────────────────────────────────────────────
        org = Organization(
            name="Sharma Construction",
            slug="sharma-construction",
            plan="free",
            subscription_status="trial",
        )
        db.add(org)
        db.flush()

        # ── User ──────────────────────────────────────────────────────────────
        user = User(
            full_name="Rajesh Sharma",
            email="demo@sharma.com",
            mobile="9876543210",
            hashed_password=hash_password("demo1234"),
            organization_id=org.id,
        )
        db.add(user)
        db.flush()

        member = OrganizationMember(organization_id=org.id, user_id=user.id, role="owner")
        db.add(member)
        db.flush()

        # ── Subscription ─────────────────────────────────────────────────────
        existing_sub = None
        try:
            from app.models.subscription_models import Subscription, SubscriptionPlan
            existing_sub = db.query(Subscription).filter(Subscription.organization_id == org.id).first()
        except Exception:
            pass

        if not existing_sub:
            try:
                from app.models.subscription_models import Subscription, SubscriptionPlan
                from datetime import datetime, timedelta, timezone as tz
                trial_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "FREE_TRIAL").first()
                if trial_plan:
                    now = datetime.now(tz.utc)
                    sub = Subscription(
                        organization_id=org.id,
                        plan_id=trial_plan.id,
                        billing_cycle="MONTHLY",
                        status="TRIALING",
                        started_at=now,
                        trial_started_at=now,
                        trial_ends_at=now + timedelta(days=30),
                        current_period_start=now,
                        current_period_end=now + timedelta(days=30),
                        provider="manual"
                    )
                    db.add(sub)
                    db.flush()
                    print("  Created FREE_TRIAL subscription for demo org.")
            except Exception as sub_err:
                print(f"  Note: Could not create subscription: {sub_err}")

        # ── Projects ──────────────────────────────────────────────────────────
        today = date.today()

        p1 = Project(
            organization_id=org.id,
            name="House #124",
            customer_name="Sunil Mehta",
            customer_phone="9812345678",
            site_address="Plot 124, Sector 45, Gurugram, Haryana",
            contract_value=Decimal("2800000"),
            start_date=today - timedelta(days=45),
            expected_end_date=today + timedelta(days=90),
            status="active",
            notes="3BHK house construction. RCC frame structure.",
        )
        p2 = Project(
            organization_id=org.id,
            name="Villa #27",
            customer_name="Priya Kapoor",
            customer_phone="9898765432",
            site_address="Villa 27, Green Acres Colony, Faridabad",
            contract_value=Decimal("4500000"),
            start_date=today - timedelta(days=20),
            expected_end_date=today + timedelta(days=150),
            status="active",
            notes="Luxury 4BHK villa with basement parking.",
        )
        p3 = Project(
            organization_id=org.id,
            name="Shop Renovation",
            customer_name="Anil Gupta",
            customer_phone="9988776655",
            site_address="Shop 12, Main Market, Lajpat Nagar, Delhi",
            contract_value=Decimal("850000"),
            start_date=today - timedelta(days=60),
            expected_end_date=today - timedelta(days=5),
            status="completed",
            notes="Full shop renovation with new flooring and ceiling.",
        )
        db.add_all([p1, p2, p3])
        db.flush()

        # ── Workers ───────────────────────────────────────────────────────────
        workers_data = [
            {"name": "Ramesh Kumar", "mobile": "9711234567", "worker_type": "mason", "daily_wage": Decimal("900")},
            {"name": "Suresh Yadav", "mobile": "9822345678", "worker_type": "helper", "daily_wage": Decimal("600")},
            {"name": "Mahesh Singh", "mobile": "9933456789", "worker_type": "carpenter", "daily_wage": Decimal("850")},
            {"name": "Ravi Prasad", "mobile": "9044567890", "worker_type": "helper", "daily_wage": Decimal("600")},
            {"name": "Dinesh Sharma", "mobile": "9155678901", "worker_type": "electrician", "daily_wage": Decimal("1000")},
            {"name": "Pappu Lal", "mobile": "9266789012", "worker_type": "plumber", "daily_wage": Decimal("950")},
        ]

        workers = []
        for wd in workers_data:
            w = Worker(
                organization_id=org.id,
                joining_date=today - timedelta(days=90),
                status="active",
                **wd,
            )
            db.add(w)
            workers.append(w)
        db.flush()

        # ── Project-Worker Assignments ─────────────────────────────────────
        # House #124: Ramesh, Suresh, Mahesh, Ravi
        for w in workers[:4]:
            pw = ProjectWorker(project_id=p1.id, worker_id=w.id, assigned_date=p1.start_date)
            db.add(pw)

        # Villa #27: Ramesh, Dinesh, Pappu
        for w in [workers[0], workers[4], workers[5]]:
            pw = ProjectWorker(project_id=p2.id, worker_id=w.id, assigned_date=p2.start_date)
            db.add(pw)

        # Shop: Mahesh, Suresh (completed)
        for w in [workers[2], workers[1]]:
            pw = ProjectWorker(project_id=p3.id, worker_id=w.id, assigned_date=p3.start_date, is_active=False)
            db.add(pw)

        db.flush()

        # ── Attendance (last 14 days for active projects) ──────────────────
        def add_attendance(project, worker, att_date, status):
            wage = worker.daily_wage
            if status == "present":
                cost = wage
            elif status == "half_day":
                cost = wage / 2
            else:
                cost = Decimal("0")
            att = Attendance(
                organization_id=org.id,
                project_id=project.id,
                worker_id=worker.id,
                date=att_date,
                status=status,
                labour_cost=cost,
            )
            db.add(att)

        # House #124 attendance (14 days)
        h124_workers = workers[:4]
        for day_offset in range(14):
            att_date = today - timedelta(days=day_offset + 1)
            statuses = ["present", "present", "present", "present", "present", "half_day", "absent"]
            import random
            random.seed(day_offset * 42)
            for w in h124_workers:
                add_attendance(p1, w, att_date, random.choice(["present", "present", "present", "half_day"]))

        # Villa #27 attendance (14 days)
        v27_workers = [workers[0], workers[4], workers[5]]
        for day_offset in range(14):
            att_date = today - timedelta(days=day_offset + 1)
            import random
            random.seed(day_offset * 77)
            for w in v27_workers:
                add_attendance(p2, w, att_date, random.choice(["present", "present", "half_day"]))

        # Shop (completed) historical attendance
        shop_workers = [workers[2], workers[1]]
        for day_offset in range(55):
            att_date = p3.start_date + timedelta(days=day_offset)
            if att_date > (today - timedelta(days=5)):
                break
            for w in shop_workers:
                add_attendance(p3, w, att_date, "present")

        db.flush()

        # ── Expenses ──────────────────────────────────────────────────────────
        expenses_data = [
            # House #124
            (p1, today - timedelta(days=10), "transport", Decimal("2500"), "Materials transport to site", "cash"),
            (p1, today - timedelta(days=8), "fuel", Decimal("1800"), "Diesel for generator", "cash"),
            (p1, today - timedelta(days=6), "food", Decimal("3200"), "Workers lunch for week", "cash"),
            (p1, today - timedelta(days=4), "tools", Decimal("4500"), "Drill and other tools", "upi"),
            (p1, today - timedelta(days=2), "electricity", Decimal("2800"), "Site electricity bill", "bank_transfer"),
            (p1, today - timedelta(days=1), "transport", Decimal("1500"), "Sand delivery charges", "cash"),
            # Villa #27
            (p2, today - timedelta(days=12), "equipment", Decimal("8000"), "Scaffolding rental", "upi"),
            (p2, today - timedelta(days=9), "transport", Decimal("3500"), "Steel delivery", "cash"),
            (p2, today - timedelta(days=5), "fuel", Decimal("2200"), "Generator diesel", "cash"),
            # Shop Renovation
            (p3, today - timedelta(days=50), "transport", Decimal("1200"), "Old material removal", "cash"),
            (p3, today - timedelta(days=40), "tools", Decimal("2500"), "Cutting tools", "upi"),
        ]

        for proj, exp_date, cat, amount, desc, pay_method in expenses_data:
            e = Expense(
                organization_id=org.id,
                project_id=proj.id,
                date=exp_date,
                category=cat,
                amount=amount,
                description=desc,
                payment_method=pay_method,
            )
            db.add(e)

        db.flush()

        # ── Materials ─────────────────────────────────────────────────────────
        materials_data = [
            # House #124
            (p1, "Cement (OPC 53)", "cement", Decimal("120"), "bags", Decimal("390"), "Ramesh Traders", today - timedelta(days=14), "paid"),
            (p1, "Steel TMT Bar 12mm", "steel", Decimal("500"), "kg", Decimal("85"), "Sharma Steel", today - timedelta(days=12), "paid"),
            (p1, "River Sand", "sand", Decimal("5"), "tonnes", Decimal("2800"), "Local Supplier", today - timedelta(days=10), "paid"),
            (p1, "Red Bricks", "bricks", Decimal("3000"), "pieces", Decimal("8"), "Brick Kiln #4", today - timedelta(days=8), "paid"),
            (p1, "Cement (OPC 53)", "cement", Decimal("80"), "bags", Decimal("395"), "Ramesh Traders", today - timedelta(days=3), "paid"),
            # Villa #27
            (p2, "Cement (PPC)", "cement", Decimal("200"), "bags", Decimal("380"), "Kapoor Cement Store", today - timedelta(days=18), "paid"),
            (p2, "Steel TMT Bar 16mm", "steel", Decimal("800"), "kg", Decimal("88"), "Sharma Steel", today - timedelta(days=15), "partial"),
            (p2, "Stone Chips 20mm", "stone", Decimal("8"), "tonnes", Decimal("3200"), "Stone Quarry", today - timedelta(days=10), "paid"),
            (p2, "Plumbing Pipes PVC", "plumbing", Decimal("150"), "pieces", Decimal("120"), "Hardware Store", today - timedelta(days=5), "paid"),
            # Shop Renovation
            (p3, "Floor Tiles 2x2", "other", Decimal("800"), "sq_ft", Decimal("65"), "Tile World", today - timedelta(days=55), "paid"),
            (p3, "Paint (Exterior)", "paint", Decimal("20"), "litres", Decimal("850"), "Asian Paints Dealer", today - timedelta(days=45), "paid"),
            (p3, "Electrical Wire", "electrical", Decimal("500"), "metres", Decimal("25"), "Electrical Shop", today - timedelta(days=42), "paid"),
        ]

        for proj, mat_name, cat, qty, unit, unit_price, supplier, pur_date, pay_status in materials_data:
            m = MaterialPurchase(
                organization_id=org.id,
                project_id=proj.id,
                material_name=mat_name,
                category=cat,
                quantity=qty,
                unit=unit,
                unit_price=unit_price,
                total_amount=qty * unit_price,
                supplier=supplier,
                purchase_date=pur_date,
                payment_status=pay_status,
            )
            db.add(m)

        db.flush()

        # ── Activity Log ──────────────────────────────────────────────────────
        activities = [
            ("created", "project", "Project 'House #124' created", p1.id, None),
            ("created", "project", "Project 'Villa #27' created", p2.id, None),
            ("created", "project", "Project 'Shop Renovation' created", p3.id, None),
            ("created", "worker", "Worker 'Ramesh Kumar' added", None, None),
            ("created", "attendance", "6 workers marked present at House #124", None, p1.id),
            ("created", "material", "₹46,800 Cement (OPC 53) purchase added", None, p1.id),
            ("created", "expense", "₹2,500 transport expense added", None, p1.id),
            ("created", "attendance", "3 workers marked present at Villa #27", None, p2.id),
            ("created", "material", "₹76,000 Steel TMT Bar 16mm purchase added", None, p2.id),
            ("updated", "project", "Project 'Shop Renovation' marked as completed", p3.id, None),
        ]

        for i, (action, entity_type, desc, entity_id, proj_id) in enumerate(activities):
            log = ActivityLog(
                organization_id=org.id,
                user_id=user.id,
                action=action,
                entity_type=entity_type,
                description=desc,
                entity_id=entity_id,
                project_id=proj_id,
                created_at=datetime.now(timezone.utc) - timedelta(hours=len(activities) - i),
            )
            db.add(log)

        db.commit()
        print("✅ Seed data created successfully!")
        print(f"   Org: Sharma Construction")
        print(f"   Login: demo@sharma.com / demo1234")
        print(f"   Projects: 3 (House #124, Villa #27, Shop Renovation)")
        print(f"   Workers: {len(workers)}")
        print(f"   Expenses, materials, attendance records included.")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
