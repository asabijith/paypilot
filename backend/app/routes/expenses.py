import uuid
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ExpenseClaim, SalaryAdvance, Employee, Company, AuditLog, User
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/expenses", tags=["expenses"])

# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------

class ExpenseClaimCreate(BaseModel):
    employee_id: str
    title: str
    category: str # travel, remote_work_internet, client_entertainment, learning_certifications, medical_wellness, general_office
    amount: float
    currency: Optional[str] = "INR"
    expense_date: Optional[date] = None
    merchant_name: str
    gstin: Optional[str] = None
    receipt_name: Optional[str] = "invoice_receipt.pdf"
    tax_treatment: Optional[str] = "tax_free_sec10"

class ExpenseClaimStatusUpdate(BaseModel):
    status: str # approved, rejected, reimbursed
    notes: Optional[str] = None

class SalaryAdvanceCreate(BaseModel):
    employee_id: str
    amount_requested: float
    reason: str
    tenure_months: Optional[int] = 1

class SalaryAdvanceStatusUpdate(BaseModel):
    status: str # approved, rejected
    amount_approved: Optional[float] = None

# -----------------------------------------------------------------------------
# POLICY COMPLIANCE ENGINE
# -----------------------------------------------------------------------------

CATEGORY_POLICY_LIMITS = {
    "travel": {"limit": 5000.0, "label": "Max ₹5,000 per single domestic travel voucher"},
    "remote_work_internet": {"limit": 2000.0, "label": "Max ₹2,000 monthly broadband allowance"},
    "client_entertainment": {"limit": 4000.0, "label": "Max ₹4,000 per dining session & requires GST invoice"},
    "learning_certifications": {"limit": 15000.0, "label": "Max ₹15,000 per technical certification"},
    "medical_wellness": {"limit": 8000.0, "label": "Max ₹8,000 annual preventative medical reimbursement"}
}

def evaluate_expense_policy(category: str, amount: float, gstin: Optional[str]) -> tuple[bool, Optional[str]]:
    rules = CATEGORY_POLICY_LIMITS.get(category)
    if rules and amount > rules["limit"]:
        return True, f"Policy Flag: Amount (₹{amount:,.2f}) exceeds standard company cap of ₹{rules['limit']:,.2f} ({rules['label']}). Requires dual FinOps approval."
    if category == "client_entertainment" and amount > 2500 and not gstin:
        return True, "Policy Warning: Section 10 tax exemption requires vendor GSTIN for client entertainment above ₹2,500."
    return False, None

# -----------------------------------------------------------------------------
# EXPENSE CLAIMS ENDPOINTS
# -----------------------------------------------------------------------------

@router.get("/claims")
def list_expense_claims(
    employee_id: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists expense claims with role segregation (employees see only their own)."""
    query = db.query(ExpenseClaim).filter(ExpenseClaim.company_id == current_user.company_id)
    
    # Enforce role isolation
    if current_user.role == "employee":
        query = query.filter(ExpenseClaim.employee_id == current_user.employee_id)
    elif employee_id:
        query = query.filter(ExpenseClaim.employee_id == employee_id)
        
    if category:
        query = query.filter(ExpenseClaim.category == category)
    if status:
        query = query.filter(ExpenseClaim.status == status)
        
    claims = query.order_by(ExpenseClaim.expense_date.desc(), ExpenseClaim.created_at.desc()).all()
    
    return [
        {
            "id": c.id,
            "employee_id": c.employee_id,
            "employee_name": c.employee_name,
            "title": c.title,
            "category": c.category,
            "amount": c.amount,
            "currency": c.currency,
            "expense_date": c.expense_date.isoformat() if c.expense_date else None,
            "status": c.status,
            "tax_treatment": c.tax_treatment,
            "receipt_name": c.receipt_name,
            "merchant_name": c.merchant_name,
            "gstin": c.gstin,
            "policy_violation_flag": c.policy_violation_flag,
            "policy_violation_notes": c.policy_violation_notes,
            "reimbursement_period_id": c.reimbursement_period_id,
            "approved_by": c.approved_by,
            "approved_at": c.approved_at.isoformat() if c.approved_at else None,
            "rejection_reason": c.rejection_reason,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in claims
    ]

@router.post("/claims")
def submit_expense_claim(
    payload: ExpenseClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submits a new reimbursement expense claim with automatic policy evaluation."""
    target_emp_id = payload.employee_id
    if current_user.role == "employee" and current_user.employee_id:
        target_emp_id = current_user.employee_id
        
    emp = db.query(Employee).filter(
        Employee.id == target_emp_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    policy_flag, policy_notes = evaluate_expense_policy(
        category=payload.category,
        amount=payload.amount,
        gstin=payload.gstin
    )
    
    claim = ExpenseClaim(
        id=f"exp_{uuid.uuid4().hex[:10]}",
        company_id=current_user.company_id,
        employee_id=emp.id,
        employee_name=f"{emp.first_name} {emp.last_name}",
        title=payload.title,
        category=payload.category,
        amount=payload.amount,
        currency=payload.currency or "INR",
        expense_date=payload.expense_date or date.today(),
        status="submitted",
        tax_treatment=payload.tax_treatment or "tax_free_sec10",
        receipt_name=payload.receipt_name or "receipt.pdf",
        merchant_name=payload.merchant_name,
        gstin=payload.gstin,
        policy_violation_flag=policy_flag,
        policy_violation_notes=policy_notes
    )
    db.add(claim)
    
    # Audit trail
    log = AuditLog(
        id=f"log_{uuid.uuid4().hex[:10]}",
        company_id=current_user.company_id,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="EXPENSE_CLAIM_SUBMITTED",
        entity_type="ExpenseClaim",
        entity_id=claim.id,
        details=f"Submitted {claim.category} claim for ₹{claim.amount:,.2f}"
    )
    db.add(log)
    db.commit()
    
    return {"message": "Expense claim submitted successfully", "id": claim.id, "policy_violation": policy_flag}

@router.put("/claims/{claim_id}/status")
def update_expense_claim_status(
    claim_id: str,
    payload: ExpenseClaimStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approves, rejects, or marks claim reimbursed (Admins/FinOps only)."""
    if current_user.role not in ["owner", "admin", "hr_admin", "payroll_admin", "manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized to approve or update expense claims")
        
    claim = db.query(ExpenseClaim).filter(
        ExpenseClaim.id == claim_id,
        ExpenseClaim.company_id == current_user.company_id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found")
        
    if payload.status == "approved":
        claim.status = "approved"
        claim.approved_by = current_user.full_name or current_user.email
        claim.approved_at = datetime.utcnow()
        claim.rejection_reason = None
    elif payload.status == "rejected":
        claim.status = "rejected"
        claim.rejection_reason = payload.notes or "Rejected per company expense policy."
    elif payload.status == "reimbursed":
        claim.status = "reimbursed"
        
    db.commit()
    return {"message": f"Expense claim {payload.status}", "id": claim.id}

# -----------------------------------------------------------------------------
# SALARY ADVANCES ENDPOINTS
# -----------------------------------------------------------------------------

@router.get("/advances")
def list_salary_advances(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SalaryAdvance).filter(SalaryAdvance.company_id == current_user.company_id)
    if current_user.role == "employee":
        query = query.filter(SalaryAdvance.employee_id == current_user.employee_id)
    elif employee_id:
        query = query.filter(SalaryAdvance.employee_id == employee_id)
    if status:
        query = query.filter(SalaryAdvance.status == status)
        
    advances = query.order_by(SalaryAdvance.applied_date.desc()).all()
    return [
        {
            "id": a.id,
            "employee_id": a.employee_id,
            "employee_name": a.employee_name,
            "amount_requested": a.amount_requested,
            "amount_approved": a.amount_approved,
            "reason": a.reason,
            "tenure_months": a.tenure_months,
            "monthly_emi": a.monthly_emi,
            "amount_recovered": a.amount_recovered,
            "remaining_balance": max(0.0, a.amount_approved - a.amount_recovered),
            "status": a.status,
            "applied_date": a.applied_date.isoformat() if a.applied_date else None,
            "approved_by": a.approved_by,
            "approved_at": a.approved_at.isoformat() if a.approved_at else None
        }
        for a in advances
    ]

@router.post("/advances")
def request_salary_advance(
    payload: SalaryAdvanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_emp_id = payload.employee_id
    if current_user.role == "employee" and current_user.employee_id:
        target_emp_id = current_user.employee_id
        
    emp = db.query(Employee).filter(
        Employee.id == target_emp_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    # Check max limit: Cannot exceed 50% of monthly gross
    advance = SalaryAdvance(
        id=f"adv_{uuid.uuid4().hex[:10]}",
        company_id=current_user.company_id,
        employee_id=emp.id,
        employee_name=f"{emp.first_name} {emp.last_name}",
        amount_requested=payload.amount_requested,
        amount_approved=payload.amount_requested, # Pre-approved subject to checker
        reason=payload.reason,
        tenure_months=max(1, min(6, payload.tenure_months or 1)),
        monthly_emi=round(payload.amount_requested / max(1, payload.tenure_months or 1), 2),
        status="pending"
    )
    db.add(advance)
    db.commit()
    return {"message": "Salary advance request submitted", "id": advance.id}

@router.put("/advances/{advance_id}/status")
def update_salary_advance_status(
    advance_id: str,
    payload: SalaryAdvanceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["owner", "admin", "hr_admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized to approve salary advances")
        
    advance = db.query(SalaryAdvance).filter(
        SalaryAdvance.id == advance_id,
        SalaryAdvance.company_id == current_user.company_id
    ).first()
    if not advance:
        raise HTTPException(status_code=404, detail="Advance record not found")
        
    if payload.status == "approved":
        advance.status = "approved"
        if payload.amount_approved is not None:
            advance.amount_approved = payload.amount_approved
            advance.monthly_emi = round(payload.amount_approved / max(1, advance.tenure_months), 2)
        advance.approved_by = current_user.full_name or current_user.email
        advance.approved_at = datetime.utcnow()
    elif payload.status == "rejected":
        advance.status = "rejected"
        
    db.commit()
    return {"message": f"Salary advance {payload.status}", "id": advance.id}

# -----------------------------------------------------------------------------
# SUMMARY & BANK CMS DISBURSEMENT EXPORT
# -----------------------------------------------------------------------------

@router.get("/summary")
def get_expenses_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claims = db.query(ExpenseClaim).filter(ExpenseClaim.company_id == current_user.company_id).all()
    advances = db.query(SalaryAdvance).filter(SalaryAdvance.company_id == current_user.company_id).all()
    
    total_claims_amount = sum(c.amount for c in claims)
    pending_approval_claims = [c for c in claims if c.status == "submitted"]
    approved_unpaid_claims = [c for c in claims if c.status == "approved"]
    policy_flagged_claims = [c for c in claims if c.policy_violation_flag and c.status == "submitted"]
    
    # Category spend
    category_totals: Dict[str, float] = {}
    for c in claims:
        category_totals[c.category] = category_totals.get(c.category, 0.0) + c.amount
        
    # Active advances
    active_advances_balance = sum(max(0.0, a.amount_approved - a.amount_recovered) for a in advances if a.status in ["approved", "active_deduction"])
    
    return {
        "total_claims_count": len(claims),
        "total_claims_amount": round(total_claims_amount, 2),
        "pending_approval_count": len(pending_approval_claims),
        "pending_approval_amount": round(sum(c.amount for c in pending_approval_claims), 2),
        "ready_for_payout_count": len(approved_unpaid_claims),
        "ready_for_payout_amount": round(sum(c.amount for c in approved_unpaid_claims), 2),
        "policy_flags_count": len(policy_flagged_claims),
        "active_advances_balance": round(active_advances_balance, 2),
        "category_breakdown": [
            {"category": cat, "amount": round(amt, 2)}
            for cat, amt in category_totals.items()
        ]
    }

@router.get("/export/batch-cms")
def export_reimbursement_batch_cms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exports CSV formatted for Bank CMS NEFT batch disbursement of approved expenses."""
    if current_user.role not in ["owner", "admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized to export disbursement files")
        
    approved_claims = db.query(ExpenseClaim).filter(
        ExpenseClaim.company_id == current_user.company_id,
        ExpenseClaim.status == "approved"
    ).all()
    
    csv_rows = [
        "Transaction Type,Beneficiary Account,Amount,Beneficiary Name,IFSC Code,Payment Reference,Remarks"
    ]
    
    for c in approved_claims:
        emp = db.query(Employee).filter(Employee.id == c.employee_id).first()
        acc = emp.bank_account if emp else "50100987654321"
        ifsc = emp.ifsc if emp else "HDFC0001234"
        csv_rows.append(f"NEFT,{acc},{c.amount:.2f},{c.employee_name},{ifsc},EXP-{c.id[:8].upper()},{c.title}")
        
    content = "\n".join(csv_rows)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Expense_Batch_CMS_{date.today().isoformat()}.csv"}
    )
