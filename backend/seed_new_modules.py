"""
Seed demo data for the 3 new ERP modules:
- Clients & Client Directory
- Estimates & BOQ Generator
- Daily Site Work Updates
- Client Milestone Invoices
"""
import sys
import uuid
import json
from datetime import date, timedelta

sys.path.insert(0, '.')

import app.models  # ensures all models are registered
from app.db.session import SessionLocal
from app.models import Organization, Project
from app.models.new_modules import Client, Estimate, SiteUpdate, ClientInvoice

db = SessionLocal()

org = db.query(Organization).first()
ORG_ID = org.id
print(f"🏢 Seeding for org: {org.name} ({ORG_ID})")

projects = db.query(Project).filter(Project.organization_id == ORG_ID).all()
P1, P2, P3 = projects[0].id, projects[1].id, projects[2].id
P1_NAME, P2_NAME, P3_NAME = projects[0].name, projects[1].name, projects[2].name

today = date.today()

# ─── CLIENTS ─────────────────────────────────────────────────────────────────
print("\n👥 Seeding Clients...")

clients_data = [
    {"name": "Rajesh Mehta",       "email": "rajesh.mehta@gmail.com",   "phone": "9876543210", "company_name": "Mehta Properties Pvt Ltd",    "address": "15, Regal Colony, Bhopal MP 462001", "gstin": "23AAACM1234A1Z5"},
    {"name": "Sunil Agarwal",      "email": "sunil.agarwal@agarwal.in", "phone": "9812345678", "company_name": "Agarwal Developers",           "address": "8B, Shivaji Nagar, Indore MP 452001",  "gstin": "23AAACE5678B1Z3"},
    {"name": "Priya Sharma",       "email": "priya.sharma@gmail.com",    "phone": "9988776655", "company_name": "",                             "address": "42, Gandhi Nagar, Bhopal MP 462023",   "gstin": ""},
    {"name": "Vikram Constructions","email": "info@vikramcon.com",       "phone": "7654321098", "company_name": "Vikram Constructions Ltd",     "address": "Plot 7, Industrial Area, Bhopal",      "gstin": "23AAACV9999C1Z1"},
    {"name": "Anita Patel",        "email": "anita.patel@hotmail.com",  "phone": "9090807060", "company_name": "Patel Realtors",               "address": "12, Tulsi Nagar, Bhopal MP 462003",    "gstin": "23AAACP2222D1Z7"},
]

client_ids = []
for cd in clients_data:
    c = Client(
        organization_id=ORG_ID,
        name=cd["name"],
        email=cd["email"],
        phone=cd["phone"],
        company_name=cd["company_name"] or None,
        address=cd["address"],
        gstin=cd["gstin"] or None,
    )
    db.add(c)
    db.flush()
    client_ids.append(c.id)
    print(f"  ✓ Client: {c.name}")

# ─── ESTIMATES & BOQ ─────────────────────────────────────────────────────────
print("\n📐 Seeding Estimates & BOQ...")

estimates_data = [
    {
        "title": "3BHK House Construction – Full BOQ Estimate",
        "project_id": P1,
        "client_id": client_ids[0],
        "status": "accepted",
        "date_offset": -45,
        "valid_until_offset": 15,
        "boq": [
            {"description": "Foundation & Earthwork Excavation", "quantity": 1800, "unit": "CFT", "rate": 45},
            {"description": "PCC (M10) for Foundation Bed", "quantity": 320, "unit": "CFT", "rate": 180},
            {"description": "RCC Footing (M20 Grade Concrete)", "quantity": 580, "unit": "CFT", "rate": 420},
            {"description": "Brick Masonry – Foundation to Plinth", "quantity": 1200, "unit": "CFT", "rate": 165},
            {"description": "RCC Plinth Beam", "quantity": 110, "unit": "CFT", "rate": 480},
            {"description": "1st Floor RCC Slab (M20 Concrete)", "quantity": 720, "unit": "SFT", "rate": 250},
            {"description": "First Class Brickwork – Ground Floor Walls", "quantity": 2100, "unit": "CFT", "rate": 155},
            {"description": "Door & Window Frames (Teak Wood)", "quantity": 18, "unit": "NOS", "rate": 4200},
            {"description": "Internal Plaster (1:6 Cement Mortar)", "quantity": 3800, "unit": "SFT", "rate": 28},
            {"description": "External Plaster (1:4 Waterproof Mortar)", "quantity": 2200, "unit": "SFT", "rate": 38},
            {"description": "Flooring – Vitrified Tiles 800x800mm", "quantity": 1600, "unit": "SFT", "rate": 85},
            {"description": "Electrical Wiring – Full Package", "quantity": 1, "unit": "LS", "rate": 145000},
            {"description": "Plumbing – Internal & Sanitary", "quantity": 1, "unit": "LS", "rate": 95000},
            {"description": "Roof Waterproofing (Dr. Fixit)", "quantity": 720, "unit": "SFT", "rate": 55},
            {"description": "Painting – Interior (Asian Tractor Emulsion)", "quantity": 3800, "unit": "SFT", "rate": 18},
        ]
    },
    {
        "title": "Villa #27 – Interiors & Finishing Phase Estimate",
        "project_id": P2,
        "client_id": client_ids[1],
        "status": "sent",
        "date_offset": -10,
        "valid_until_offset": 20,
        "boq": [
            {"description": "False Ceiling – Gypsum Board (Entire Villa)", "quantity": 2800, "unit": "SFT", "rate": 120},
            {"description": "Modular Kitchen – L-Shape with Island", "quantity": 1, "unit": "NOS", "rate": 285000},
            {"description": "Wardrobes – Laminated MDF (4 Bedrooms)", "quantity": 4, "unit": "NOS", "rate": 38000},
            {"description": "Doors – Flush Doors with Polish (12 Nos)", "quantity": 12, "unit": "NOS", "rate": 8500},
            {"description": "Bathroom Accessories – Premium Range", "quantity": 5, "unit": "SET", "rate": 12000},
            {"description": "Painting – Luxury Emulsion (Berger Silk)", "quantity": 5200, "unit": "SFT", "rate": 32},
            {"description": "Landscaping & Garden Development", "quantity": 1, "unit": "LS", "rate": 75000},
            {"description": "CCTV & Security System", "quantity": 1, "unit": "LS", "rate": 45000},
            {"description": "Home Automation – Smart Switches", "quantity": 1, "unit": "LS", "rate": 68000},
        ]
    },
    {
        "title": "Shop Renovation – Civil & Electrical Works BOQ",
        "project_id": P3,
        "client_id": client_ids[2],
        "status": "draft",
        "date_offset": -3,
        "valid_until_offset": 25,
        "boq": [
            {"description": "Demolition & Site Clearance", "quantity": 1, "unit": "LS", "rate": 18000},
            {"description": "Partition Walls – Gypsum Board Stud", "quantity": 480, "unit": "SFT", "rate": 95},
            {"description": "Flooring – Wooden Laminate", "quantity": 650, "unit": "SFT", "rate": 110},
            {"description": "Drop Ceiling – Grid & Tiles", "quantity": 650, "unit": "SFT", "rate": 75},
            {"description": "Electrical Wiring – Commercial Grade", "quantity": 1, "unit": "LS", "rate": 55000},
            {"description": "LED Lighting Fixtures", "quantity": 28, "unit": "NOS", "rate": 1800},
            {"description": "AC Ducting & Installation", "quantity": 1, "unit": "LS", "rate": 42000},
            {"description": "Glass Storefront & Signage", "quantity": 1, "unit": "LS", "rate": 38000},
        ]
    },
]

est_ids = []
for i, ed in enumerate(estimates_data):
    boq_items = []
    total = 0
    for item in ed["boq"]:
        amount = item["quantity"] * item["rate"]
        total += amount
        boq_items.append({**item, "amount": amount})

    tax = round(total * 0.18, 2)
    grand = total + tax
    est_date = today + timedelta(days=ed["date_offset"])
    valid_until = today + timedelta(days=ed["valid_until_offset"])
    est_num = f"EST-{est_date.strftime('%Y%m')}-{str(i+1).zfill(4)}"

    e = Estimate(
        organization_id=ORG_ID,
        project_id=ed["project_id"],
        client_id=ed["client_id"],
        estimate_number=est_num,
        title=ed["title"],
        total_amount=total,
        tax_amount=tax,
        grand_total=grand,
        status=ed["status"],
        date=est_date,
        valid_until=valid_until,
        boq_json=json.dumps(boq_items),
        notes="Rates are inclusive of materials and labour. GST charged at 18% extra."
    )
    db.add(e)
    db.flush()
    est_ids.append(e.id)
    print(f"  ✓ Estimate: {e.estimate_number} | {e.title[:40]}... | ₹{grand:,.0f}")

# ─── DAILY SITE UPDATES ──────────────────────────────────────────────────────
print("\n📸 Seeding Daily Site Work Updates...")

site_updates_data = [
    # House #124 – active project updates
    {"project_id": P1, "project_name": P1_NAME, "days_ago": 14, "progress": 35, "title": "Foundation Work Completed – Plinth Level Reached",
     "work_completed": "Earthwork excavation completed for all column footings. PCC laid and RCC footing casting done for 12 columns. Plinth beam shuttering started on east side.",
     "issues": "Mild rain delay in afternoon – 2 hours lost. Cement delivery was late by 1.5 hours.", "weather": "Rainy"},
    {"project_id": P1, "project_name": P1_NAME, "days_ago": 10, "progress": 45, "title": "Ground Floor Brickwork Progressing – 60% Done",
     "work_completed": "Ground floor brickwork completed on 3 sides. Door/window lintel casting done for all openings. Plumbing conduits placed inside walls on west side.",
     "issues": "No major issues. One mason took unplanned leave – slight slowdown.", "weather": "Sunny"},
    {"project_id": P1, "project_name": P1_NAME, "days_ago": 7, "progress": 52, "title": "Ground Floor Walls Completed – Slab Shuttering Started",
     "work_completed": "Full brickwork done on all 4 sides up to lintel level. Window frames placed and fixed. Slab shuttering started – 40% complete.",
     "issues": "Steel delivery pending from supplier. 2 days delay expected.", "weather": "Cloudy"},
    {"project_id": P1, "project_name": P1_NAME, "days_ago": 4, "progress": 60, "title": "Slab Shuttering Complete – Steel Binding Started",
     "work_completed": "Slab shuttering completed for entire ground floor (1200 SFT). Steel bar binding started – 50% done. Electric conduit pipes placed in slab.",
     "issues": "None.", "weather": "Sunny"},
    {"project_id": P1, "project_name": P1_NAME, "days_ago": 1, "progress": 65, "title": "1st Floor Slab Concrete Casting Day – M20 Grade",
     "work_completed": "Slab casting completed successfully with ready-mix M20 concrete. Transit mixer made 8 trips. 14 workers deployed. Vibration curing done.",
     "issues": "Transit mixer #3 had engine trouble – 90 min delay in last pour.", "weather": "Sunny"},

    # Villa #27 – active project updates
    {"project_id": P2, "project_name": P2_NAME, "days_ago": 20, "progress": 55, "title": "2nd Floor Structure Completed – Terrace Slab Cast",
     "work_completed": "Terrace slab shuttering and steel binding done. M25 concrete poured for terrace. Total 320 cubic feet concrete used. Staircase treads cast.",
     "issues": "Waterproofing material not yet delivered – Dr Fixit order placed.", "weather": "Sunny"},
    {"project_id": P2, "project_name": P2_NAME, "days_ago": 12, "progress": 68, "title": "Exterior Plaster Work – 75% Complete",
     "work_completed": "Exterior plastering done on 3 elevations. Scaffolding shifted to 4th (north) side. Internal plaster completed in all 4 bedrooms and hall.",
     "issues": "One scaffolding pipe cracked – replaced immediately. No injury.", "weather": "Cloudy"},
    {"project_id": P2, "project_name": P2_NAME, "days_ago": 6, "progress": 75, "title": "Flooring Work Started – Marble in Hall & Dining",
     "work_completed": "Marble flooring laid in ground floor hall and dining area (680 SFT). Vitrified tiles started in master bedroom. Kitchen tiles grouting done.",
     "issues": "2 marble slabs cracked during cutting – reordered.", "weather": "Sunny"},
    {"project_id": P2, "project_name": P2_NAME, "days_ago": 2, "progress": 82, "title": "Electrical Wiring 90% Complete – Switchboard Fixing",
     "work_completed": "All electrical conduit laying done. Wiring pulled in all rooms. Switchboard boxes fixed on all walls. Main distribution board installed.",
     "issues": "Electrician subcontractor delayed by 1 day on final room.", "weather": "Sunny"},

    # Shop Renovation – completed project
    {"project_id": P3, "project_name": P3_NAME, "days_ago": 30, "progress": 100, "title": "Shop Renovation Fully Completed – Handover Done",
     "work_completed": "All civil, electrical, painting, and fitout work completed. LED lighting tested. AC installation done. Final cleaning completed. Keys handed to client.",
     "issues": "None – project completed 2 days ahead of schedule!", "weather": "Sunny"},
]

for sud in site_updates_data:
    su = SiteUpdate(
        organization_id=ORG_ID,
        project_id=sud["project_id"],
        date=today - timedelta(days=sud["days_ago"]),
        progress_percentage=sud["progress"],
        title=sud["title"],
        work_completed=sud["work_completed"],
        issues_blockers=sud["issues"],
        weather_condition=sud["weather"]
    )
    db.add(su)
    print(f"  ✓ Site Log [{sud['project_name']}]: {sud['title'][:50]}... ({sud['progress']}%)")

# ─── CLIENT MILESTONE INVOICES ────────────────────────────────────────────────
print("\n🧾 Seeding Client Milestone Invoices...")

invoices_data = [
    # House #124 – Project milestone billing
    {"project_id": P1, "client_id": client_ids[0], "milestone": "Foundation & Plinth Level Completion (25% Milestone)",
     "amount": 350000, "status": "paid", "issue_offset": -40, "due_offset": -30, "paid_offset": -28, "inv_num": "INV-202607-0001"},
    {"project_id": P1, "client_id": client_ids[0], "milestone": "Ground Floor Structure & Slab Completion (50% Milestone)",
     "amount": 450000, "status": "paid", "issue_offset": -8, "due_offset": 0, "paid_offset": -3, "inv_num": "INV-202608-0002"},
    {"project_id": P1, "client_id": client_ids[0], "milestone": "1st Floor Structure & Roof Slab (75% Milestone)",
     "amount": 400000, "status": "pending", "issue_offset": 0, "due_offset": 15, "paid_offset": None, "inv_num": "INV-202608-0003"},

    # Villa #27 – Project milestone billing
    {"project_id": P2, "client_id": client_ids[1], "milestone": "Structural Work Completion – Terrace Slab Done (50% Milestone)",
     "amount": 750000, "status": "paid", "issue_offset": -18, "due_offset": -8, "paid_offset": -10, "inv_num": "INV-202608-0004"},
    {"project_id": P2, "client_id": client_ids[1], "milestone": "Plastering & Flooring Phase Completion (75% Milestone)",
     "amount": 580000, "status": "pending", "issue_offset": -5, "due_offset": 10, "paid_offset": None, "inv_num": "INV-202608-0005"},

    # Shop Renovation – Completed
    {"project_id": P3, "client_id": client_ids[2], "milestone": "Mobilisation & Initial Civil Works (40% Milestone)",
     "amount": 85000, "status": "paid", "issue_offset": -55, "due_offset": -45, "paid_offset": -44, "inv_num": "INV-202606-0006"},
    {"project_id": P3, "client_id": client_ids[2], "milestone": "Final Fitout & Project Handover – Balance (100% Milestone)",
     "amount": 110000, "status": "paid", "issue_offset": -28, "due_offset": -20, "paid_offset": -22, "inv_num": "INV-202607-0007"},
]

for invd in invoices_data:
    tax = round(invd["amount"] * 0.18, 2)
    total = invd["amount"] + tax
    inv = ClientInvoice(
        organization_id=ORG_ID,
        project_id=invd["project_id"],
        client_id=invd["client_id"],
        invoice_number=invd["inv_num"],
        milestone_name=invd["milestone"],
        amount=invd["amount"],
        tax_amount=tax,
        total_amount=total,
        status=invd["status"],
        issue_date=today + timedelta(days=invd["issue_offset"]),
        due_date=today + timedelta(days=invd["due_offset"]),
        paid_date=(today + timedelta(days=invd["paid_offset"])) if invd["paid_offset"] is not None else None,
    )
    db.add(inv)
    status_icon = "✅" if invd["status"] == "paid" else "⏳"
    print(f"  {status_icon} Invoice: {invd['inv_num']} | ₹{total:,.0f} | {invd['milestone'][:45]}...")

# ─── COMMIT ──────────────────────────────────────────────────────────────────
db.commit()
db.close()

print("\n" + "="*60)
print("✅ ALL DEMO DATA SEEDED SUCCESSFULLY!")
print("="*60)
print(f"  👥  {len(clients_data)} Clients added to directory")
print(f"  📐  {len(estimates_data)} BOQ Estimates created")
print(f"  📸  {len(site_updates_data)} Daily Site Work Updates logged")
print(f"  🧾  {len(invoices_data)} Client Milestone Invoices generated")
print("="*60)
