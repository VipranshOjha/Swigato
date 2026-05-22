# Swigato - Food Delivery & Authentication Flow

Swigato is a modern food delivery platform application. This repository contains both the **FastAPI Backend** and the **Vite-powered Frontend** featuring user authentication, profile settings, and address management flows designed under the **Kinetic Zest** design system.

---

## Project Structure

```
Swigato/
├── backend/                  # FastAPI Backend Application
│   ├── app/                  # Main backend codebase (main.py, api, models, etc.)
│   ├── alembic/              # Database migrations
│   ├── requirements.txt      # Python package dependencies
│   └── venv/                 # Python local virtual environment
│
└── frontend/                 # Vite Frontend Application
    ├── mockups/              # Original design screen mockups
    ├── DESIGN.md             # Kinetic Zest design system specifications
    ├── index.html            # Portal landing/entry page
    ├── login.html            # Sign-in flow template
    ├── register.html         # User registration template
    ├── verify-email.html     # Email verification OTP flow template
    ├── forgot-password.html  # Forgot password request flow template
    ├── reset-password.html   # Reset password new credential flow template
    ├── profile-settings.html # User profile details and settings template
    ├── address-management.html# User saved addresses template
    ├── package.json          # Node dependencies & project scripts
    └── vite.config.js        # Vite multi-page configuration
```

---

## Frontend Setup & Execution

The frontend pages are built using static HTML files styled with Tailwind CSS (loaded via CDN) and Outfit/Inter Google typography. We use **Vite** as a development server to easily serve and route between these pages.

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Run Development Server
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL in your browser (typically `http://localhost:5173`) to access the Swigato Portal.

---

## Backend Setup & Execution

The backend is built with FastAPI, SQLAlchemy, Alembic, and PostgreSQL/Redis integrations.

### Running Backend Locally (Windows PowerShell)

1. Navigate to the `backend/` directory:
   ```powershell
   cd backend
   ```
2. Activate the existing Python virtual environment (`venv`):
   ```powershell
   .\venv\Scripts\activate
   ```
3. Install Python dependencies (if needed):
   ```powershell
   pip install -r requirements.txt
   ```
4. Start the FastAPI backend with uvicorn:
   ```powershell
   uvicorn app.main:app --reload
   ```
5. The API documentation will be available at `http://127.0.0.1:8000/docs`.

---

## Design System (Kinetic Zest)
The frontend templates strictly follow the **Kinetic Zest** design personality:
* **Primary Brand Accent (Orange)**: `#FC8019`
* **Deep Text/Accent (Brown)**: `#984800`
* **Surface Background (Light Purple/Indigo-hued white)**: `#FAF9FF`
* **Surface Dark (Charcoal/Blue)**: `#171A29`
* **Veg / Success (Green)**: `#60B246`
* **Non-Veg / Error (Red)**: `#E13D45`

For more details, see the [Design Guidelines (frontend/DESIGN.md)](frontend/DESIGN.md).
