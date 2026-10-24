# PayPilot AI — Commercial-Ready HR & Payroll SaaS for India

> **"Smarter Indian Payroll. Confident Decisions."**  
> *PayPilot AI doesn't just calculate payroll. It audits payroll before payday, eliminates compliance penalties, and explains every number.*

---

## 🌟 Commercial Product Overview

**PayPilot AI** is a production-ready, multi-tenant B2B SaaS platform engineered specifically for Indian startups, scale-ups, and SMEs. It solves the critical compliance, fraud, and trust challenges of Indian payroll management through:

1. **Deterministic AI Payroll Auditor (Core Differentiator):** A multi-rule mathematical engine that audits salary ledgers *before* money leaves your bank account. Detects salary spikes, duplicate PAN/KYC records, unbilled absent days without approved leave, statutory capping violations, and negative net pay.
2. **Indian Statutory Compliance Engine:** Fully automated calculations for EPF (EPF Act 1952 with statutory ₹1,800 cap or actual basic), ESIC (0.75% / 3.25% eligibility), Multi-State Professional Tax (Karnataka, Maharashtra, Telangana, Delhi), and TDS Section 192 under the FY 2026-27 New Tax Regime (Section 115BAC, ₹75k standard deduction, Section 87A rebate).
3. **Multi-Tenant SaaS Subscription Infrastructure:** Configurable Free Trial (14 days), Starter (₹1,999/mo), Growth (₹4,999/mo), and Enterprise (₹14,999/mo) plans with headcount limits, Razorpay payment verification, HMAC-SHA256 webhooks, and automatic tax invoicing.
4. **Public Commercial Marketing Website:** High-converting landing page with live interactive anomaly preview, transparent pricing, interactive demo scheduler, FAQ, and Indian statutory disclosures.
5. **Maker-Checker Dual Approval Workflow:** Dual-control segregation of duties between Payroll Administrators (makers) and CPO/CFO Approvers (checkers) to prevent internal fraud.
6. **Production Export Generation:** Instant downloads for Bank CMS batch payment CSVs (HDFC Enet, ICICI CIB, SBI CMP), EPFO ECR text files (`#~#` delimited), and official Indian payslip PDFs.
7. **Employee Self-Service & Ground-Truth AI Assistant:** Role-restricted employee portal for personal payslips, leave balances, KYC document management, and verifiable compensation explanations.

---

## 🚀 System Architecture & Technology Stack

| Layer | Technologies | Local URL / Port |
| :--- | :--- | :--- |
| **Frontend App & Landing Page** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Canvas Confetti | `http://127.0.0.1:5173/` |
| **Backend REST API** | Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2 | `http://127.0.0.1:8000/` |
| **API Documentation** | Swagger UI / OpenAPI Spec | `http://127.0.0.1:8000/docs` |
| **Database & Persistence** | SQLite WAL mode / PostgreSQL ready | `backend/paypilot.db` |
| **Authentication & Security** | Salted PBKDF2-HMAC-SHA256, RFC 7519 HMAC-SHA256 JWT, Server-Side RBAC | Security Headers & Tenant Isolation |
| **Payment Gateway** | Razorpay India (Test Sandbox & Live Production Keys, HMAC-SHA256 Webhook Verification) | `/api/billing/*` |
| **Automated Test Suite** | Pytest (Unit tests, Multi-tenant isolation tests, Payment signature verification) | 16 tests passing (100%) |

---

## ⚡ Quick Start

### Option A: Windows PowerShell Launcher
```powershell
.\start.ps1
```

### Option B: Windows Batch Launcher
Double-click `start.bat` or run:
```bat
start.bat
```

### Option C: Manual Setup

#### 1. Backend Setup:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

Visit **`http://127.0.0.1:5173/`** in your browser.

---

## 🎭 Role-Based Demo Profiles

PayPilot AI includes seeded demo accounts to test role-based access control (RBAC):

| Profile | Role | Context & Permissions |
| :--- | :--- | :--- |
| **Ananya Sen** | **HR / Admin (CPO)** | Full enterprise administration: directory, leave approvals, attendance records, statutory settings, team invitations. |
| **Rajesh Nair** | **Payroll Administrator** | Salary ledger calculation, AI Auditor execution, discrepancy resolution, bank batch file generation. |
| **Rohan Verma** | **Employee (Backend Eng.)** | Self-Service Portal: personal compensation, leave balances, official printable payslip, AI salary chat. |
| **Sneha Rao** | **Employee (Lead Designer)** | Self-service attendance records, leave applications, and monthly pay breakdown. |

---

## 🔍 Seeded Demo Anomalies

Pre-seeded for pitch and demonstration purposes:

1. **Salary Spike (+53.6% Jump) — Rohan Verma (BTI-003):** Gross salary jumped from ₹1,40,000 to ₹2,15,000 due to an accidental duplicate festival bonus. Flagged as **HIGH** severity.
2. **Attendance Mismatch — Priya Sharma (BTI-002):** Attendance logs reflect 4 unapproved absent days, but 0 Loss of Pay (LOP) was deducted. Flagged as **HIGH** severity.
3. **Negative Net Salary (-₹7,000) — Amit Patel (BTI-005):** Company loan recovery (₹45,000) exceeded gross earnings (₹40,000), violating the Payment of Wages Act 50% deduction ceiling. Flagged as **CRITICAL** severity.
4. **Missing Bank IFSC Code — Vikram Singh (BTI-004):** DevOps Architect missing disbursement account details required for automated NACH/NEFT upload. Flagged as **MEDIUM** severity.

*Tip: Click the **"Reset Demo"** button in the header anytime to restore these anomalies for live replay!*

---

## 🧪 Automated Testing Suite

Execute the full automated test suite verifying payroll mathematics, anomaly detection, tenant isolation, and security:

```bash
cd backend
python -m pytest tests -v
```

### Verified Test Results (16 Passed):
```
tests/test_auditor_engine.py::test_auditor_detects_negative_net_pay PASSED [  6%]
tests/test_auditor_engine.py::test_auditor_detects_salary_spike PASSED   [ 12%]
tests/test_auth_rbac.py::test_password_hashing_security PASSED           [ 18%]
tests/test_auth_rbac.py::test_jwt_tamper_detection PASSED                [ 25%]
tests/test_auth_rbac.py::test_rbac_role_enforcement PASSED               [ 31%]
tests/test_billing_webhooks.py::test_saas_pricing_matrix PASSED          [ 37%]
tests/test_billing_webhooks.py::test_razorpay_signature_rejection_on_invalid_hmac PASSED [ 43%]
tests/test_payroll_engine.py::test_round_curr PASSED                     [ 50%]
tests/test_payroll_engine.py::test_professional_tax_karnataka PASSED     [ 56%]
tests/test_payroll_engine.py::test_professional_tax_maharashtra PASSED   [ 62%]
tests/test_payroll_engine.py::test_esi_applicability PASSED              [ 68%]
tests/test_payroll_engine.py::test_pf_statutory_cap PASSED               [ 75%]
tests/test_payroll_engine.py::test_unpaid_leave_lop_deduction PASSED     [ 81%]
tests/test_payroll_engine.py::test_net_salary_equation PASSED            [ 87%]
tests/test_tenant_isolation.py::test_tenant_isolation_employee_directory PASSED [ 93%]
tests/test_tenant_isolation.py::test_tenant_isolation_payroll_period PASSED [100%]

============================= 16 passed in 1.53s ==============================
```

---

## 🔒 DevSecOps & Security Controls

- **Tenant Isolation:** Every query enforces `company_id` partitioning so Tenant A cannot access Tenant B's data under any condition.
- **Salted Password Hashing:** PBKDF2-HMAC-SHA256 with 100,000 rounds and unique 16-byte cryptographic salt.
- **RFC 7519 JWT Authentication:** HMAC-SHA256 signed access tokens with tamper rejection and expiration checks.
- **Security Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Liveness & Readiness Probes:** Dedicated `/health` and `/ready` endpoints verifying database connectivity.
- **Audit Trails:** Immutable logging of all sensitive changes, salary adjustments, payroll approvals, and login sessions in `audit_logs`.
- **Payment Signature Verification:** Cryptographic HMAC-SHA256 signature validation on Razorpay payment verification and server webhooks.

---

## 📋 Commercial Launch Readiness Checklist

- [x] Multi-tenant organization registration with 14-day Free Trial onboarding.
- [x] Team member invitations and role-based access control (Owner, HR Admin, Payroll Admin, Manager, Employee).
- [x] Employee management with directory, 360-degree drawer, and KYC document uploads.
- [x] Attendance and leave application, approval, and Loss of Pay (LOP) integration.
- [x] Indian statutory payroll engine (EPF, ESIC, Multi-State PT, TDS Section 192).
- [x] Deterministic AI Payroll Auditor detecting anomalies before payday.
- [x] Maker-Checker dual approvals and payroll locking mechanism.
- [x] Bank CMS CSV exports (HDFC, ICICI, SBI) and EPFO ECR `#~#` file downloads.
- [x] Conversational AI Assistant explaining take-home calculations.
- [x] SaaS subscription tiers (Free Trial, Starter, Growth, Enterprise) with Razorpay integration.
- [x] Verified payment webhook handler with idempotency.
- [x] Commercial public-facing marketing website with pricing, features, demo booking, and FAQ.
- [x] Multi-stage production `Dockerfile` and `docker-compose.yml`.
- [x] Zero-warning production frontend build (`tsc -b && vite build`).
- [x] 100% automated test suite passing (16/16 tests).

---

&copy; 2026 PayPilot AI Technologies. All rights reserved.
"# paypilot" 
# paypilot
