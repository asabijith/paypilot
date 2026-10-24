import uuid
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Contractor, ContractorInvoice, Company, AuditLog, User
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/contractors", tags=["contractors"])

# -----------------------------------------------------------------------------
# FX RATES (Benchmark Reference to INR)
# -----------------------------------------------------------------------------

FX_RATES_TO_INR = {
    "INR": 1.0,
    "USD": 86.50,
    "EUR": 91.20,
    "GBP": 108.50,
    "AED": 23.55,
    "SGD": 64.20
}

# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------

class ContractorCreate(BaseModel):
    contractor_code: str
    name: str
    email: str
    phone: Optional[str] = "+91 9876543210"
    country: Optional[str] = "India"
    currency: Optional[str] = "INR"
    contractor_type: Optional[str] = "individual" # individual, company
    service_type: Optional[str] = "software_engineering"
    pan_or_tax_id: Optional[str] = "ABCDE1234F"
    gstin: Optional[str] = None
    w8ben_status: Optional[str] = "not_applicable"
    withholding_section: Optional[str] = "194J"
    withholding_rate_pct: Optional[float] = 10.0
    rate_per_hour_or_month: Optional[float] = 50000.0
    rate_type: Optional[str] = "fixed_monthly"
    bank_name: Optional[str] = "HDFC Bank"
    bank_account: Optional[str] = "50100987654321"
    ifsc_or_swift: Optional[str] = "HDFC0001234"

class ContractorInvoiceCreate(BaseModel):
    contractor_id: str
    invoice_number: str
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    subtotal_amount: float
    gst_rate_pct: Optional[float] = 0.0 # 0% for export or non-registered, 18% standard
    description: str

class InvoiceStatusUpdate(BaseModel):
    status: str # approved, paid, cancelled
    payment_reference: Optional[str] = None

# -----------------------------------------------------------------------------
# CONTRACTORS ROSTER ENDPOINTS
# -----------------------------------------------------------------------------

@router.get("/")
def list_contractors(
    country: Optional[str] = None,
    currency: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Contractor).filter(Contractor.company_id == current_user.company_id)
    if country:
        query = query.filter(Contractor.country == country)
    if currency:
        query = query.filter(Contractor.currency == currency)
    if status:
        query = query.filter(Contractor.status == status)
        
    contractors = query.order_by(Contractor.name.asc()).all()
    return [
        {
            "id": c.id,
            "contractor_code": c.contractor_code,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "country": c.country,
            "currency": c.currency,
            "contractor_type": c.contractor_type,
            "service_type": c.service_type,
            "pan_or_tax_id": c.pan_or_tax_id,
            "gstin": c.gstin,
            "w8ben_status": c.w8ben_status,
            "withholding_section": c.withholding_section,
            "withholding_rate_pct": c.withholding_rate_pct,
            "rate_per_hour_or_month": c.rate_per_hour_or_month,
            "rate_type": c.rate_type,
            "bank_name": c.bank_name,
            "bank_account": c.bank_account,
            "ifsc_or_swift": c.ifsc_or_swift,
            "status": c.status,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in contractors
    ]

@router.post("/")
def create_contractor(
    payload: ContractorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["owner", "admin", "hr_admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    existing = db.query(Contractor).filter(
        Contractor.company_id == current_user.company_id,
        Contractor.contractor_code == payload.contractor_code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Contractor code already exists")
        
    contractor = Contractor(
        id=f"cnt_{uuid.uuid4().hex[:10]}",
        company_id=current_user.company_id,
        contractor_code=payload.contractor_code,
        name=payload.name,
        email=payload.email,
        phone=payload.phone or "+91 9876543210",
        country=payload.country or "India",
        currency=payload.currency or "INR",
        contractor_type=payload.contractor_type or "individual",
        service_type=payload.service_type or "software_engineering",
        pan_or_tax_id=payload.pan_or_tax_id or "ABCDE1234F",
        gstin=payload.gstin,
        w8ben_status=payload.w8ben_status or ("not_applicable" if payload.country == "India" else "verified"),
        withholding_section=payload.withholding_section or ("194J" if payload.country == "India" else "non_resident_wire"),
        withholding_rate_pct=payload.withholding_rate_pct if payload.withholding_rate_pct is not None else 10.0,
        rate_per_hour_or_month=payload.rate_per_hour_or_month or 50000.0,
        rate_type=payload.rate_type or "fixed_monthly",
        bank_name=payload.bank_name or "HDFC Bank",
        bank_account=payload.bank_account or "50100987654321",
        ifsc_or_swift=payload.ifsc_or_swift or "HDFC0001234",
        status="active"
    )
    db.add(contractor)
    db.commit()
    return {"message": "Contractor profile created successfully", "id": contractor.id}

# -----------------------------------------------------------------------------
# CONTRACTOR INVOICES & STATUTORY WITHHOLDING
# -----------------------------------------------------------------------------

@router.get("/invoices")
def list_contractor_invoices(
    contractor_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ContractorInvoice).filter(ContractorInvoice.company_id == current_user.company_id)
    if contractor_id:
        query = query.filter(ContractorInvoice.contractor_id == contractor_id)
    if status:
        query = query.filter(ContractorInvoice.status == status)
        
    invoices = query.order_by(ContractorInvoice.invoice_date.desc()).all()
    results = []
    for inv in invoices:
        c = db.query(Contractor).filter(Contractor.id == inv.contractor_id).first()
        results.append({
            "id": inv.id,
            "contractor_id": inv.contractor_id,
            "contractor_name": c.name if c else "Unknown Contractor",
            "contractor_code": c.contractor_code if c else "",
            "country": c.country if c else "India",
            "invoice_number": inv.invoice_number,
            "invoice_date": inv.invoice_date.isoformat() if inv.invoice_date else None,
            "due_date": inv.due_date.isoformat() if inv.due_date else None,
            "currency": inv.currency,
            "subtotal_amount": inv.subtotal_amount,
            "gst_amount": inv.gst_amount,
            "tds_withheld_amount": inv.tds_withheld_amount,
            "net_payable_amount": inv.net_payable_amount,
            "fx_rate_to_inr": inv.fx_rate_to_inr,
            "net_inr_equivalent": inv.net_inr_equivalent,
            "description": inv.description,
            "status": inv.status,
            "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
            "payment_reference": inv.payment_reference
        })
    return results

@router.post("/invoices")
def create_contractor_invoice(
    payload: ContractorInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contractor = db.query(Contractor).filter(
        Contractor.id == payload.contractor_id,
        Contractor.company_id == current_user.company_id
    ).first()
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
        
    # Compute statutory withholding (TDS under 194J/194C or 0% for international with W-8BEN)
    tds_rate = contractor.withholding_rate_pct if contractor.country == "India" else 0.0
    tds_amount = round((payload.subtotal_amount * tds_rate) / 100.0, 2)
    
    # Compute GST if applicable
    gst_rate = payload.gst_rate_pct or 0.0
    gst_amount = round((payload.subtotal_amount * gst_rate) / 100.0, 2)
    
    net_payable = round(payload.subtotal_amount + gst_amount - tds_amount, 2)
    fx_rate = FX_RATES_TO_INR.get(contractor.currency, 1.0)
    net_inr = round(net_payable * fx_rate, 2)
    
    invoice = ContractorInvoice(
        id=f"cinv_{uuid.uuid4().hex[:10]}",
        company_id=current_user.company_id,
        contractor_id=contractor.id,
        invoice_number=payload.invoice_number,
        invoice_date=payload.invoice_date or date.today(),
        due_date=payload.due_date or date.today(),
        currency=contractor.currency,
        subtotal_amount=payload.subtotal_amount,
        gst_amount=gst_amount,
        tds_withheld_amount=tds_amount,
        net_payable_amount=net_payable,
        fx_rate_to_inr=fx_rate,
        net_inr_equivalent=net_inr,
        description=payload.description,
        status="pending_approval"
    )
    db.add(invoice)
    db.commit()
    return {"message": "Contractor invoice recorded", "id": invoice.id, "net_payable": net_payable, "net_inr": net_inr}

@router.put("/invoices/{invoice_id}/status")
def update_contractor_invoice_status(
    invoice_id: str,
    payload: InvoiceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["owner", "admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    inv = db.query(ContractorInvoice).filter(
        ContractorInvoice.id == invoice_id,
        ContractorInvoice.company_id == current_user.company_id
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    inv.status = payload.status
    if payload.status == "paid":
        inv.paid_at = datetime.utcnow()
        inv.payment_reference = payload.payment_reference or f"WIRE-{uuid.uuid4().hex[:8].upper()}"
        
    db.commit()
    return {"message": f"Invoice marked {payload.status}", "id": inv.id}

@router.get("/batch-wire")
def export_contractor_batch_wire(
    currency: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exports SWIFT / Bank Wire Batch CSV for cross-border and domestic contractor disbursements."""
    if current_user.role not in ["owner", "admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    query = db.query(ContractorInvoice).filter(
        ContractorInvoice.company_id == current_user.company_id,
        ContractorInvoice.status == "approved"
    )
    if currency:
        query = query.filter(ContractorInvoice.currency == currency)
        
    invoices = query.all()
    
    csv_rows = [
        "Payment Method,Beneficiary Name,Currency,Amount,SWIFT/IFSC Code,Account/IBAN,Country,Invoice Ref,Purpose Code"
    ]
    
    for inv in invoices:
        c = db.query(Contractor).filter(Contractor.id == inv.contractor_id).first()
        method = "DOMESTIC_NEFT" if (c and c.country == "India") else "SWIFT_WIRE"
        purpose = "P0802_SOFTWARE_SERVICES"
        name = c.name if c else "Contractor"
        swift = c.ifsc_or_swift if c else "HDFC0001234"
        acc = c.bank_account if c else "12345678"
        country = c.country if c else "India"
        csv_rows.append(f"{method},{name},{inv.currency},{inv.net_payable_amount:.2f},{swift},{acc},{country},{inv.invoice_number},{purpose}")
        
    content = "\n".join(csv_rows)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Contractor_Wire_Batch_{date.today().isoformat()}.csv"}
    )
