"""
Seeding Master Data: Comprehensive Indian Construction Industry Dataset.
Idempotent and safe to run multiple times.
"""
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.master_data import (
    ProjectType, ConstructionStage, WorkerCategory, WorkerType,
    MaterialCategory, Unit, Material, MaterialAlias, EquipmentType,
    WorkCategory, SubcontractorType, MasterExpenseCategory
)


def seed_master_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("🏗️ Seeding Indian Construction Master Data...")

        # ── 1. Units ────────────────────────────────────────────────────────
        units_data = [
            # Quantity
            ("NOS", "Nos", "quantity"), ("PCS", "Piece", "quantity"), ("SET", "Set", "quantity"), ("PAIR", "Pair", "quantity"),
            # Weight
            ("KG", "Kg", "weight"), ("QUINTAL", "Quintal", "weight"), ("TONNE", "Tonne", "weight"),
            # Length
            ("MTR", "Meter", "length"), ("RFT", "Running Feet", "length"), ("FT", "Feet", "length"), ("INCH", "Inch", "length"), ("MM", "mm", "length"),
            # Area
            ("SQFT", "Sq Ft", "area"), ("SQM", "Sq Meter", "area"), ("SQYD", "Sq Yard", "area"),
            # Volume
            ("CFT", "Cubic Ft", "volume"), ("CUM", "Cubic Meter", "volume"), ("LTR", "Litre", "volume"),
            # Packaging
            ("BAG", "Bag", "packaging"), ("BOX", "Box", "packaging"), ("BUNDLE", "Bundle", "packaging"),
            ("ROLL", "Roll", "packaging"), ("PKT", "Packet", "packaging"), ("DRUM", "Drum", "packaging"), ("BUCKET", "Bucket", "packaging"),
        ]

        for code, name, utype in units_data:
            if not db.query(Unit).filter(Unit.code == code).first():
                db.add(Unit(code=code, name=name, unit_type=utype))
        db.flush()

        # ── 2. Project Types ────────────────────────────────────────────────
        project_types_data = [
            # Residential
            ("INDEPENDENT_HOUSE", "Independent House", "residential", "Single family independent bungalow or house"),
            ("VILLA", "Villa", "residential", "Luxury independent villa"),
            ("DUPLEX_HOUSE", "Duplex House", "residential", "Two-floor connected residential house"),
            ("ROW_HOUSE", "Row House", "residential", "Row housing development"),
            ("APARTMENT", "Apartment", "residential", "Multi-unit apartment building"),
            ("RESIDENTIAL_BUILDING", "Residential Building", "residential", "G+3 or higher residential complex"),
            ("FARM_HOUSE", "Farm House", "residential", "Out-of-city farm house or retreat"),
            ("EXTENSION_ADDITION", "Extension / Addition", "residential", "Floor or room extension"),
            ("HOUSE_RENOVATION", "House Renovation", "residential", "Full or partial house remodelling"),
            # Commercial
            ("SHOP", "Shop", "commercial", "Retail shop or showroom outlet"),
            ("OFFICE", "Office", "commercial", "Commercial office space"),
            ("SHOWROOM", "Showroom", "commercial", "Large commercial showroom"),
            ("WAREHOUSE", "Warehouse", "commercial", "Storage warehouse or godown"),
            ("SMALL_COMMERCIAL_BUILDING", "Small Commercial Building", "commercial", "G+2/G+3 commercial complex"),
            ("RESTAURANT", "Restaurant", "commercial", "Food & beverage outlet or cafe"),
            ("CLINIC", "Clinic / Hospital", "commercial", "Medical clinic or small hospital"),
            # Other
            ("BOUNDARY_WALL", "Boundary Wall", "other", "Perimeter boundary wall construction"),
            ("DRAINAGE_WORK", "Drainage Work", "other", "Drainage or storm-water work"),
            ("WATERPROOFING_PROJECT", "Waterproofing Project", "other", "Specialized waterproofing job"),
            ("REPAIR_PROJECT", "Repair Project", "other", "Structural repair or rehabilitation"),
        ]

        for code, name, category, desc in project_types_data:
            if not db.query(ProjectType).filter(ProjectType.code == code).first():
                db.add(ProjectType(code=code, name=name, category=category, description=desc, is_system=True))
        db.flush()

        # ── 3. Construction Stages ──────────────────────────────────────────
        stages_data = [
            ("PRE_SITE_SURVEY", "Site Survey", "Pre-Construction", 1),
            ("PRE_SOIL_INVESTIGATION", "Soil Investigation", "Pre-Construction", 2),
            ("PRE_ARCH_PLANNING", "Architectural Planning", "Pre-Construction", 3),
            ("PRE_STRUCT_PLANNING", "Structural Planning", "Pre-Construction", 4),
            ("PRE_PERMISSIONS", "Approval / Permission", "Pre-Construction", 5),
            ("PRE_SITE_PREP", "Site Preparation", "Pre-Construction", 6),

            ("FOUND_EXCAVATION", "Excavation", "Foundation", 7),
            ("FOUND_PCC", "PCC", "Foundation", 8),
            ("FOUND_REINFORCEMENT", "Footing Reinforcement", "Foundation", 9),
            ("FOUND_CONCRETE", "Footing Concrete", "Foundation", 10),
            ("FOUND_PLINTH_BEAM", "Plinth Beam", "Foundation", 11),
            ("FOUND_BACKFILLING", "Backfilling", "Foundation", 12),
            ("FOUND_ANTI_TERMITE", "Anti-Termite Treatment", "Foundation", 13),

            ("STRUCT_COLUMN_REINFORCE", "Column Reinforcement", "Structural Work", 14),
            ("STRUCT_COLUMN_CONCRETE", "Column Concrete", "Structural Work", 15),
            ("STRUCT_BEAM_REINFORCE", "Beam Reinforcement", "Structural Work", 16),
            ("STRUCT_SLAB_REINFORCE", "Slab Reinforcement", "Structural Work", 17),
            ("STRUCT_SLAB_CONCRETE", "Slab Concrete", "Structural Work", 18),
            ("STRUCT_STAIRCASE", "Staircase Construction", "Structural Work", 19),

            ("MASONRY_BRICKWORK", "Brickwork", "Masonry", 20),
            ("MASONRY_BLOCKWORK", "AAC / Concrete Blockwork", "Masonry", 21),
            ("MASONRY_PARTITION", "Internal Partition Walls", "Masonry", 22),

            ("PLASTER_INTERNAL", "Internal Plaster", "Plastering", 23),
            ("PLASTER_EXTERNAL", "External Plaster", "Plastering", 24),
            ("PLASTER_CEILING", "Ceiling Plaster", "Plastering", 25),

            ("FLOORING_SCREED", "Floor Screed", "Flooring", 26),
            ("FLOORING_TILES", "Tile Flooring", "Flooring", 27),
            ("FLOORING_MARBLE_GRANITE", "Stone / Marble Flooring", "Flooring", 28),

            ("ELEC_CONDUITING", "Electrical Conduiting", "Electrical", 29),
            ("ELEC_WIRING", "Electrical Wiring", "Electrical", 30),
            ("ELEC_SWITCHES", "Switch & MCB Installation", "Electrical", 31),

            ("PLUMB_PIPING", "Water Supply & Drainage Piping", "Plumbing", 32),
            ("PLUMB_FITTINGS", "Sanitary & CP Fittings", "Plumbing", 33),

            ("WATERPROOF_TOILET", "Toilet Waterproofing", "Waterproofing", 34),
            ("WATERPROOF_TERRACE", "Terrace Waterproofing", "Waterproofing", 35),

            ("FINISH_PUTTY", "Wall Putty & Primer", "Finishing", 36),
            ("FINISH_PAINTING", "Interior & Exterior Painting", "Finishing", 37),
            ("FINISH_FALSE_CEILING", "False Ceiling", "Finishing", 38),

            ("COMPLETION_CLEANING", "Final Cleaning", "Completion", 39),
            ("COMPLETION_HANDOVER", "Handover", "Completion", 40),
        ]

        for code, name, group, sorder in stages_data:
            if not db.query(ConstructionStage).filter(ConstructionStage.code == code).first():
                db.add(ConstructionStage(code=code, name=name, stage_group=group, sort_order=sorder))
        db.flush()

        # ── 4. Worker Categories & Worker Types ─────────────────────────────
        categories_data = [
            ("SITE_MGMT", "Site Management"),
            ("GENERAL_LABOUR", "General Labour"),
            ("MASONRY", "Masonry"),
            ("RCC_STEEL", "Reinforcement / RCC"),
            ("CARPENTRY", "Carpentry"),
            ("ELECTRICAL", "Electrical"),
            ("PLUMBING", "Plumbing"),
            ("PAINTING", "Painting"),
            ("FLOORING_FINISH", "Flooring & Finishing"),
            ("FABRICATION", "Welding & Fabrication"),
            ("EQUIPMENT_OPS", "Equipment Operators"),
        ]

        cat_map = {}
        for ccode, cname in categories_data:
            cat = db.query(WorkerCategory).filter(WorkerCategory.code == ccode).first()
            if not cat:
                cat = WorkerCategory(code=ccode, name=cname)
                db.add(cat)
                db.flush()
            cat_map[ccode] = cat.id

        worker_types_data = [
            ("SITE_SUP", "SITE_MGMT", "Site Supervisor", "supervisor"),
            ("SITE_ENG", "SITE_MGMT", "Site Engineer", "supervisor"),
            ("FOREMAN", "SITE_MGMT", "Foreman", "supervisor"),
            ("STORE_KEEPER", "SITE_MGMT", "Store Keeper", "skilled"),

            ("HELPER", "GENERAL_LABOUR", "Construction Helper", "unskilled"),
            ("BELDAR", "GENERAL_LABOUR", "Beldar / Loading Labour", "unskilled"),
            ("SITE_CLEANER", "GENERAL_LABOUR", "Site Cleaner", "unskilled"),

            ("MASON", "MASONRY", "Head Mason / Raj Mistri", "highly_skilled"),
            ("BRICK_MASON", "MASONRY", "Brick Mason", "skilled"),
            ("BLOCK_MASON", "MASONRY", "AAC Block Mason", "skilled"),
            ("PLASTER_MASON", "MASONRY", "Plaster Mason", "skilled"),

            ("BAR_BENDER", "RCC_STEEL", "Bar Bender / Steel Fixer", "skilled"),
            ("RCC_MASON", "RCC_STEEL", "RCC Concrete Mason", "skilled"),
            ("SHUTTERING_CARPENTER", "RCC_STEEL", "Shuttering Carpenter", "skilled"),

            ("CARPENTER", "CARPENTRY", "Wood Carpenter", "skilled"),
            ("DOOR_CARPENTER", "CARPENTRY", "Door / Window Carpenter", "skilled"),

            ("ELECTRICIAN", "ELECTRICAL", "Electrician", "skilled"),
            ("WIREMAN", "ELECTRICAL", "Wireman", "semi_skilled"),

            ("PLUMBER", "PLUMBING", "Plumber", "skilled"),
            ("PIPE_FITTER", "PLUMBING", "Sanitary Pipe Fitter", "skilled"),

            ("PAINTER", "PAINTING", "Painter", "skilled"),
            ("PUTTY_WORKER", "PAINTING", "Putty Applicator", "semi_skilled"),

            ("TILE_FIXER", "FLOORING_FINISH", "Tile Fixer", "skilled"),
            ("MARBLE_MASON", "FLOORING_FINISH", "Marble / Granite Mason", "highly_skilled"),
            ("WATERPROOF_APPLICATOR", "FLOORING_FINISH", "Waterproofing Applicator", "skilled"),

            ("WELDER", "FABRICATION", "Welder / Fabricator", "skilled"),
            ("JCB_OPERATOR", "EQUIPMENT_OPS", "JCB / Excavator Operator", "highly_skilled"),
            ("MIXER_OPERATOR", "EQUIPMENT_OPS", "Concrete Mixer Operator", "semi_skilled"),
        ]

        for code, cat_code, name, skill in worker_types_data:
            if not db.query(WorkerType).filter(WorkerType.code == code).first():
                db.add(WorkerType(
                    code=code,
                    category_id=cat_map[cat_code],
                    name=name,
                    default_skill_level=skill,
                    is_system=True
                ))
        db.flush()

        # ── 5. Material Categories & Materials ──────────────────────────────
        mat_cats = [
            ("CEMENT", "Cement"),
            ("AGGREGATES", "Sand & Aggregates"),
            ("BRICKS_BLOCKS", "Bricks & Blocks"),
            ("STEEL_REINFORCE", "Steel & Reinforcement"),
            ("CONCRETE", "Ready Mix & Concrete Chemicals"),
            ("FORMWORK", "Formwork & Scaffolding"),
            ("WATERPROOFING", "Waterproofing Materials"),
            ("FLOORING_STONE", "Flooring & Tiles"),
            ("PLUMBING_MAT", "Plumbing & Drainage"),
            ("ELECTRICAL_MAT", "Electrical & Wiring"),
            ("PAINT_FINISH", "Paint & Wall Finishing"),
            ("DOORS_WINDOWS", "Doors, Windows & Hardware"),
            ("SAFETY_MAT", "Safety Equipment & PPE"),
        ]

        mcat_map = {}
        for code, name in mat_cats:
            mc = db.query(MaterialCategory).filter(MaterialCategory.code == code).first()
            if not mc:
                mc = MaterialCategory(code=code, name=name)
                db.add(mc)
                db.flush()
            mcat_map[code] = mc.id

        materials_dataset = [
            # Cement
            ("CEMENT_PPC", "CEMENT", "PPC Cement (Portland Pozzolana)", "BAG", "BAG,KG,TONNE", "Fly-ash based PPC cement", "UltraTech, Ambuja, ACC, Shree, JK Lakshmi"),
            ("CEMENT_OPC_53", "CEMENT", "OPC 53 Grade Cement", "BAG", "BAG,KG,TONNE", "53 Grade Ordinary Portland Cement for RCC", "UltraTech, ACC, Dalmia, JSW"),
            ("CEMENT_OPC_43", "CEMENT", "OPC 43 Grade Cement", "BAG", "BAG,KG,TONNE", "43 Grade OPC for plaster and masonry", "UltraTech, ACC"),
            ("CEMENT_WHITE", "CEMENT", "White Cement", "BAG", "BAG,KG", "White Portland Cement for marble flooring & putty", "JK White, Birla White"),

            # Aggregates & Sand
            ("SAND_RIVER", "AGGREGATES", "River Sand (Plaster & Masonry)", "CFT", "CFT,CUM,TONNE", "Clean washed natural river sand", "Local River Quarry"),
            ("SAND_MSAND", "AGGREGATES", "Manufactured Sand (M-Sand)", "CFT", "CFT,CUM,TONNE", "Crushed stone manufactured sand for RCC", "Crusher Unit"),
            ("AGGREGATE_20MM", "AGGREGATES", "20 mm Stone Aggregate", "CFT", "CFT,CUM,TONNE", "20 mm crushed granite/basalt aggregate for RCC", "Local Crusher"),
            ("AGGREGATE_10MM", "AGGREGATES", "10 mm Stone Aggregate", "CFT", "CFT,CUM,TONNE", "10 mm aggregate for RCC slab & columns", "Local Crusher"),
            ("AGGREGATE_40MM", "AGGREGATES", "40 mm Stone Aggregate", "CFT", "CFT,CUM,TONNE", "40 mm aggregate for PCC & footing base", "Local Crusher"),

            # Bricks & Blocks
            ("BRICK_RED_CLAY", "BRICKS_BLOCKS", "Red Clay Bricks (Class 1)", "PCS", "PCS,NOS", "Traditional kiln burnt red clay bricks (1st Class)", "Kiln Quarry"),
            ("BRICK_FLY_ASH", "BRICKS_BLOCKS", "Fly Ash Bricks", "PCS", "PCS,NOS", "Machine pressed fly ash bricks (230x110x75 mm)", "Flyash Plant"),
            ("BLOCK_AAC_4INCH", "BRICKS_BLOCKS", "AAC Block 4 inch (400x200x100mm)", "PCS", "PCS,CUM", "Autoclaved Aerated Concrete block for internal walls", "Magicrete, Biltech, Ecolite"),
            ("BLOCK_AAC_6INCH", "BRICKS_BLOCKS", "AAC Block 6 inch (600x200x150mm)", "PCS", "PCS,CUM", "AAC block for external perimeter walls", "Magicrete, Biltech"),

            # Steel
            ("TMT_8MM", "STEEL_REINFORCE", "TMT Steel Bar 8 mm", "KG", "KG,TONNE,BUNDLE", "Fe 500D TMT Rebar for stirrups & slab temp steel", "Tata Tiscon, JSW Neosteel, SAIL, Jindal Panther"),
            ("TMT_10MM", "STEEL_REINFORCE", "TMT Steel Bar 10 mm", "KG", "KG,TONNE,BUNDLE", "Fe 500D TMT Rebar for slab reinforcement", "Tata Tiscon, JSW, SAIL"),
            ("TMT_12MM", "STEEL_REINFORCE", "TMT Steel Bar 12 mm", "KG", "KG,TONNE,BUNDLE", "Fe 500D TMT Rebar for beams & columns", "Tata Tiscon, JSW, SAIL"),
            ("TMT_16MM", "STEEL_REINFORCE", "TMT Steel Bar 16 mm", "KG", "KG,TONNE,BUNDLE", "Fe 500D TMT Rebar for heavy columns & footing", "Tata Tiscon, JSW, SAIL"),
            ("BINDING_WIRE", "STEEL_REINFORCE", "GI Binding Wire (18 Gauge)", "KG", "KG,ROLL", "Annealed GI wire for rebar tying", "Local Quality"),

            # Flooring
            ("TILE_VITRIFIED_2X2", "FLOORING_STONE", "Vitrified Tiles 2x2 ft (600x600 mm)", "SQFT", "SQFT,BOX,SQM", "Double charged vitrified floor tile", "Kajaria, Somany, Nitco, Asian Granito"),
            ("TILE_WALL_12X18", "FLOORING_STONE", "Ceramic Wall Tiles 12x18 inch", "SQFT", "SQFT,BOX", "Glazed ceramic wall tile for bathrooms & kitchen", "Kajaria, Somany"),
            ("GRANITE_BLACK", "FLOORING_STONE", "Black Granite Slab (18-20 mm)", "SQFT", "SQFT", "Polished Telephone Black granite for kitchen counter & steps", "Rajasthan / South Granite"),
            ("TILE_ADHESIVE", "FLOORING_STONE", "Tile Adhesive Polymer Mortar", "BAG", "BAG,KG", "Polymer modified tile fixing adhesive", "Roff, Laticrete, Weber"),

            # Plumbing
            ("PIPE_CPVC_1INCH", "PLUMBING_MAT", "CPVC Pipe 1 inch (SDR 11)", "RFT", "RFT,PCS,MTR", "Chlorinated PVC pipe for hot & cold water supply", "Astral, Ashirvad, Supreme, Finolex"),
            ("PIPE_PVC_4INCH", "PLUMBING_MAT", "SWR PVC Pipe 4 inch (Drainage)", "RFT", "RFT,PCS,MTR", "Soil & Waste drainage PVC pipe", "Supreme, Finolex, Astral"),
            ("TANK_WATER_1000L", "PLUMBING_MAT", "Overhead Water Tank 1000 Litre", "PCS", "PCS,NOS", "Triple layer HDPE overhead water storage tank", "Sintex, Supreme, Astral"),

            # Electrical
            ("WIRE_COPPER_1.5SQMM", "ELECTRICAL_MAT", "Copper Wire 1.5 sq mm", "BOX", "BOX,ROLL,MTR", "FR PVC insulated single core copper wire for light points", "Havells, Polycab, Finolex, RR Kabel"),
            ("WIRE_COPPER_2.5SQMM", "ELECTRICAL_MAT", "Copper Wire 2.5 sq mm", "BOX", "BOX,ROLL,MTR", "FR PVC copper wire for power sockets & AC", "Havells, Polycab, Finolex"),
            ("CONDUIT_PVC_25MM", "ELECTRICAL_MAT", "PVC Electrical Conduit 25 mm", "RFT", "RFT,PCS,MTR", "Medium duty rigid PVC conduit pipe", "Polycab, Precision, Finolex"),
            ("MCB_16A_SP", "ELECTRICAL_MAT", "MCB 16A Single Pole (C-Curve)", "PCS", "PCS,NOS", "Miniature Circuit Breaker for distribution board", "Legrand, Schneider, Anchor, Havells"),

            # Paints
            ("WALL_PUTTY", "PAINT_FINISH", "Acrylic Wall Putty", "BAG", "BAG,KG", "White cement based wall putty for smooth finish", "Birla White, JK Cement, Asian Paints"),
            ("PRIMER_INTERIOR", "PAINT_FINISH", "Interior Wall Primer", "LTR", "LTR,BUCKET", "Water-based acrylic interior primer", "Asian Paints, Berger, Nerolac, Dulux"),
            ("PAINT_EMULSION_INT", "PAINT_FINISH", "Interior Acrylic Emulsion Paint", "LTR", "LTR,BUCKET", "Premium interior wall paint finish", "Asian Paints Tractor/Apcolite, Berger"),

            # Waterproofing & Formwork
            ("WATERPROOF_DRFIXIT_101", "WATERPROOFING", "Integral Waterproofing Compound (Dr. Fixit LW+)", "LTR", "LTR,DRUM", "Liquid integral waterproofing for concrete & plaster", "Dr. Fixit (Pidilite), Sika, Fosroc"),
            ("PLY_SHUTTERING_12MM", "FORMWORK", "Film Faced Shuttering Plywood 12mm (34kg)", "PCS", "PCS,SQFT", "Boiling water resistant film faced shuttering ply", "Century, Greenply, Kitply"),
        ]

        # Aliases dataset for search optimization (Hindi / Local terms)
        aliases_data = {
            "CEMENT_PPC": [("सीमेंट", "hi"), ("Cement PPC", "en")],
            "CEMENT_OPC_53": [("53 ग्रेड सीमेंट", "hi")],
            "SAND_RIVER": [("रेत", "hi"), ("बालू", "hi"), ("Ret", "en"), ("Plaster Sand", "en")],
            "SAND_MSAND": [("एम सैंड", "hi"), ("Crushed Sand", "en")],
            "BRICK_RED_CLAY": [("ईंट", "hi"), ("लाल ईंट", "hi"), ("Eent", "en"), ("Red Brick", "en")],
            "TMT_8MM": [("सरिया 8mm", "hi"), ("8 mm Sariya", "en")],
            "TMT_10MM": [("सरिया 10mm", "hi"), ("10 mm Sariya", "en")],
            "TMT_12MM": [("सरिया 12mm", "hi"), ("12 mm Sariya", "en")],
            "TMT_16MM": [("सरिया 16mm", "hi"), ("16 mm Sariya", "en")],
            "BINDING_WIRE": [("बाइंडिंग वायर", "hi"), ("तार", "hi")],
            "TILE_VITRIFIED_2X2": [("टाइल", "hi"), ("Floor Tile", "en")],
            "WALL_PUTTY": [("पुट्टी", "hi"), ("Wall Putty", "en")],
        }

        for code, cat_code, name, punit, aunits, spec, brands in materials_dataset:
            mat = db.query(Material).filter(Material.code == code).first()
            if not mat:
                mat = Material(
                    code=code,
                    category_id=mcat_map[cat_code],
                    name=name,
                    primary_unit_code=punit,
                    allowed_unit_codes=aunits,
                    specification=spec,
                    brand_examples=brands,
                    is_system=True
                )
                db.add(mat)
                db.flush()

            # Add aliases
            if code in aliases_data:
                for alias_str, lang in aliases_data[code]:
                    if not db.query(MaterialAlias).filter(MaterialAlias.material_id == mat.id, MaterialAlias.alias_name == alias_str).first():
                        db.add(MaterialAlias(material_id=mat.id, alias_name=alias_str, language=lang))

        db.flush()

        # ── 6. Expense Categories ───────────────────────────────────────────
        exp_categories_data = [
            ("EXP_LABOUR_PAY", "Labour Wages Payment", "labour"),
            ("EXP_LABOUR_ADV", "Labour Advance", "labour"),
            ("EXP_OVERTIME", "Overtime Payment", "labour"),

            ("EXP_MAT_PURCHASE", "Material Purchase", "material"),
            ("EXP_MAT_TRANSPORT", "Material Transport / Freight", "material_transport"),
            ("EXP_LOADING_UNLOADING", "Loading & Unloading Charges", "material_transport"),

            ("EXP_EQUIP_RENTAL", "Equipment Rental (JCB, Crane, Mixer)", "equipment"),
            ("EXP_EQUIP_FUEL", "Equipment Diesel & Fuel", "equipment"),
            ("EXP_EQUIP_REPAIR", "Equipment Maintenance & Repair", "equipment"),

            ("EXP_SITE_ELEC", "Site Electricity Bill", "site"),
            ("EXP_SITE_WATER", "Water Tanker / Water Supply", "site"),
            ("EXP_SITE_SECURITY", "Site Watchman / Security", "site"),
            ("EXP_TOOLS", "Small Tools & Hardware", "site"),

            ("EXP_TEA_SNACKS", "Tea & Refreshments for Workers", "misc"),
            ("EXP_OFFICE", "Site Office & Printing", "admin"),
        ]

        for code, name, group in exp_categories_data:
            if not db.query(MasterExpenseCategory).filter(MasterExpenseCategory.code == code).first():
                db.add(MasterExpenseCategory(code=code, name=name, group_name=group, is_system=True))

        db.commit()
        print("✅ Real-world Indian Construction Master Data seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Master Data seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_master_data()
