import pytest


def register_user(client, email="test@example.com", company="Test Co", password="testpass123"):
    return client.post("/api/auth/register", json={
        "full_name": "Test User",
        "company_name": company,
        "mobile": "9876543210",
        "email": email,
        "password": password,
    })


def get_auth_headers(client, email="test@example.com", password="testpass123"):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    token = resp.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ── Auth Tests ─────────────────────────────────────────────────────────────

def test_register_success(client):
    resp = register_user(client)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["organization"]["name"] == "Test Co"


def test_register_duplicate_email(client):
    register_user(client)
    resp = register_user(client)
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"].lower()


def test_register_weak_password(client):
    resp = client.post("/api/auth/register", json={
        "full_name": "Test",
        "company_name": "Co",
        "mobile": "9876543210",
        "email": "a@b.com",
        "password": "short",
    })
    assert resp.status_code == 422


def test_login_success(client):
    register_user(client)
    resp = client.post("/api/auth/login", json={"email": "test@example.com", "password": "testpass123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()["data"]


def test_login_wrong_password(client):
    register_user(client)
    resp = client.post("/api/auth/login", json={"email": "test@example.com", "password": "wrongpass"})
    assert resp.status_code == 401


def test_get_me(client):
    register_user(client)
    headers = get_auth_headers(client)
    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["user"]["email"] == "test@example.com"


def test_protected_route_without_token(client):
    resp = client.get("/api/projects")
    assert resp.status_code == 403


# ── Tenant Isolation Tests ─────────────────────────────────────────────────

def test_tenant_isolation_projects(client):
    """User A cannot see User B's projects."""
    # User A creates a project
    register_user(client, email="usera@a.com", company="Company A")
    headers_a = get_auth_headers(client, "usera@a.com")

    resp = client.post("/api/projects", json={
        "name": "Project A",
        "contract_value": "500000",
        "status": "active",
    }, headers=headers_a)
    assert resp.status_code == 201

    # User B registers and tries to list projects
    register_user(client, email="userb@b.com", company="Company B")
    headers_b = get_auth_headers(client, "userb@b.com")

    resp_b = client.get("/api/projects", headers=headers_b)
    assert resp_b.status_code == 200
    assert resp_b.json()["total"] == 0  # User B should see no projects


# ── Project Tests ──────────────────────────────────────────────────────────

def test_create_project(client):
    register_user(client)
    headers = get_auth_headers(client)
    resp = client.post("/api/projects", json={
        "name": "House #1",
        "contract_value": "1000000",
        "status": "active",
    }, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["data"]["name"] == "House #1"


def test_list_projects(client):
    register_user(client)
    headers = get_auth_headers(client)
    client.post("/api/projects", json={"name": "P1", "contract_value": "100000"}, headers=headers)
    client.post("/api/projects", json={"name": "P2", "contract_value": "200000", "status": "completed"}, headers=headers)

    resp = client.get("/api/projects", headers=headers)
    assert resp.json()["total"] == 2

    resp_filtered = client.get("/api/projects?status=completed", headers=headers)
    assert resp_filtered.json()["total"] == 1


def test_project_negative_contract_value(client):
    register_user(client)
    headers = get_auth_headers(client)
    resp = client.post("/api/projects", json={"name": "Bad", "contract_value": "-1000"}, headers=headers)
    assert resp.status_code == 422


# ── Worker Tests ───────────────────────────────────────────────────────────

def test_create_and_list_workers(client):
    register_user(client)
    headers = get_auth_headers(client)

    resp = client.post("/api/workers", json={
        "name": "Ramesh",
        "worker_type": "mason",
        "daily_wage": "800",
    }, headers=headers)
    assert resp.status_code == 201

    workers_resp = client.get("/api/workers", headers=headers)
    assert workers_resp.json()["total"] == 1


def test_worker_negative_wage(client):
    register_user(client)
    headers = get_auth_headers(client)
    resp = client.post("/api/workers", json={"name": "Bad", "worker_type": "helper", "daily_wage": "-100"}, headers=headers)
    assert resp.status_code == 422


# ── Attendance & Labour Cost Tests ────────────────────────────────────────

def test_attendance_labour_cost_calculation(client):
    register_user(client)
    headers = get_auth_headers(client)

    # Create project
    proj_resp = client.post("/api/projects", json={"name": "P1", "contract_value": "500000"}, headers=headers)
    project_id = proj_resp.json()["data"]["id"]

    # Create worker with ₹800/day wage
    worker_resp = client.post("/api/workers", json={"name": "Ramesh", "worker_type": "mason", "daily_wage": "800"}, headers=headers)
    worker_id = worker_resp.json()["data"]["id"]

    # Assign worker to project
    client.post(f"/api/projects/{project_id}/workers", json={"worker_id": worker_id}, headers=headers)

    # Mark present
    att_resp = client.post("/api/attendance", json={
        "project_id": project_id,
        "date": "2024-01-15",
        "records": [{"worker_id": worker_id, "status": "present"}],
    }, headers=headers)
    assert att_resp.status_code == 201
    record = att_resp.json()["data"][0]
    assert record["labour_cost"] == "800.00"

    # Mark half day
    att_half = client.post("/api/attendance", json={
        "project_id": project_id,
        "date": "2024-01-16",
        "records": [{"worker_id": worker_id, "status": "half_day"}],
    }, headers=headers)
    half_record = att_half.json()["data"][0]
    assert half_record["labour_cost"] == "400.00"


# ── Expense Tests ──────────────────────────────────────────────────────────

def test_create_expense(client):
    register_user(client)
    headers = get_auth_headers(client)
    proj_resp = client.post("/api/projects", json={"name": "P1", "contract_value": "500000"}, headers=headers)
    project_id = proj_resp.json()["data"]["id"]

    resp = client.post("/api/expenses", json={
        "project_id": project_id,
        "date": "2024-01-15",
        "category": "transport",
        "amount": "2500",
        "payment_method": "cash",
    }, headers=headers)
    assert resp.status_code == 201


def test_expense_zero_amount(client):
    register_user(client)
    headers = get_auth_headers(client)
    proj_resp = client.post("/api/projects", json={"name": "P1", "contract_value": "500000"}, headers=headers)
    project_id = proj_resp.json()["data"]["id"]

    resp = client.post("/api/expenses", json={
        "project_id": project_id,
        "date": "2024-01-15",
        "category": "transport",
        "amount": "0",
    }, headers=headers)
    assert resp.status_code == 422


# ── Material Tests ─────────────────────────────────────────────────────────

def test_create_material_auto_total(client):
    register_user(client)
    headers = get_auth_headers(client)
    proj_resp = client.post("/api/projects", json={"name": "P1", "contract_value": "500000"}, headers=headers)
    project_id = proj_resp.json()["data"]["id"]

    resp = client.post("/api/materials", json={
        "project_id": project_id,
        "material_name": "Cement",
        "category": "cement",
        "quantity": "50",
        "unit": "bags",
        "unit_price": "390",
        "purchase_date": "2024-01-15",
        "payment_status": "paid",
    }, headers=headers)
    assert resp.status_code == 201
    # 50 × 390 = 19500
    assert str(resp.json()["data"]["total_amount"]) == "19500.00"


# ── Project Profit Calculation ─────────────────────────────────────────────

def test_project_profit_calculation(client):
    register_user(client)
    headers = get_auth_headers(client)

    # Create project with ₹10,00,000 contract value
    proj_resp = client.post("/api/projects", json={"name": "P1", "contract_value": "1000000"}, headers=headers)
    project_id = proj_resp.json()["data"]["id"]

    # Add ₹5,000 expense
    client.post("/api/expenses", json={
        "project_id": project_id,
        "date": "2024-01-15",
        "category": "transport",
        "amount": "5000",
    }, headers=headers)

    # Add ₹19,500 material
    client.post("/api/materials", json={
        "project_id": project_id,
        "material_name": "Cement",
        "category": "cement",
        "quantity": "50",
        "unit": "bags",
        "unit_price": "390",
        "purchase_date": "2024-01-15",
        "payment_status": "paid",
    }, headers=headers)

    # Check financials
    fin_resp = client.get(f"/api/projects/{project_id}/financials", headers=headers)
    assert fin_resp.status_code == 200
    data = fin_resp.json()["data"]
    assert float(data["other_expenses"]) == 5000.0
    assert float(data["material_cost"]) == 19500.0
    assert float(data["total_cost"]) == 24500.0
    assert float(data["profit"]) == 975500.0
