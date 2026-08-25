# ConstructPro — Construction Contractor Management SaaS

ConstructPro is a mobile-first, responsive SaaS application designed for small and medium-sized construction contractors in India. It gives contractors simple control over projects, workers, attendance, daily wages, materials, site expenses, and project profitability.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS with custom Indian construction design system
- **State & Data Fetching**: TanStack Query v5 + Axios with automatic JWT refresh
- **Icons**: Lucide React

### Backend
- **Framework**: Python FastAPI
- **Database**: PostgreSQL 15 + SQLAlchemy ORM 2.0
- **Migrations**: Alembic
- **Auth**: JWT (Access & Refresh tokens) + bcrypt password hashing
- **Architecture**: Multi-tenant organization isolation

---

## 🚀 Quick Start (Local Development)

### Option 1: Docker Compose (Recommended)

1. Clone/navigate to the project root:
   ```bash
   cd ConstructPro
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start services with Docker:
   ```bash
   docker-compose up --build
   ```

4. The apps will be available at:
   - **Frontend**: `http://localhost:5173`
   - **Backend API Docs**: `http://localhost:8000/docs`
   - **Database Admin (Adminer)**: `http://localhost:8080`

---

### Option 2: Running Locally Without Docker

#### Prerequisites
- PostgreSQL running on `localhost:5432` with database `constructpro_db`, user `constructpro`, password `constructpro_pass`
- Node.js 18+ and Python 3.10+

#### 1. Setup Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed demo data ("Sharma Construction")
python -m app.db.seed

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

#### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Demo Account

The seed script creates a complete demo organization:

- **Email**: `demo@sharma.com`
- **Password**: `demo1234`
- **Company**: Sharma Construction
- **Pre-loaded Data**: 3 Projects (House #124, Villa #27, Shop Renovation), 6 Workers, 14 days of attendance, site expenses, and material purchases.

---

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

---

## 📱 Features

- **Mobile-First UX**: Floating `+ Add` quick action menu, swipe/tap attendance cards per worker, INR currency formatting (`₹28,00,000`), sticky bottom navigation.
- **Attendance & Wages**: Instant attendance marking with auto-calculated daily/weekly/monthly labour costs based on daily wages (Present = Full, Half Day = 50%, Absent = 0).
- **Material Purchases**: Auto calculation of `Quantity × Unit Price = Total Amount`.
- **Real-time Profitability**: Automatically calculates `Profit = Contract Value - (Labour + Materials + Expenses)` and profit margins per project.
- **Reports & Export**: Project Profitability, Labour, Expense, and Material reports with 1-click CSV download.
- **Multi-Tenant Security**: Data strictly isolated per contractor organization at the service and repository level.
