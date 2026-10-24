import uuid
from datetime import date, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AttendanceRecord, Employee, User
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/attendance", tags=["attendance"])

class MarkAttendanceRequest(BaseModel):
    employee_id: str
    date: date
    status: str  # present, absent, half_day, approved_leave
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    notes: Optional[str] = None

@router.get("")
def get_attendance(
    month: Optional[int] = None,
    year: Optional[int] = None,
    employee_id: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp_id = user.company_id
    query = db.query(AttendanceRecord).filter(AttendanceRecord.company_id == comp_id)

    # Privacy filter: employees only see their own attendance
    if user.role == "employee" and user.employee_id:
        query = query.filter(AttendanceRecord.employee_id == user.employee_id)
    elif employee_id and employee_id != "all":
        query = query.filter(AttendanceRecord.employee_id == employee_id)

    records = query.order_by(AttendanceRecord.date.desc()).all()

    if month is not None and year is not None:
        filtered = [r for r in records if r.date.month == month and r.date.year == year]
        if filtered:
            records = filtered

    results = []
    for r in records:
        emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
        results.append({
            "id": r.id,
            "employee_id": r.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "emp_code": emp.emp_code if emp else "",
            "department": emp.department if emp else "",
            "date": r.date.isoformat(),
            "status": r.status,
            "check_in": r.check_in,
            "check_out": r.check_out,
            "notes": r.notes
        })

    # Summary metrics
    present_cnt = sum(1 for r in records if r.status == "present")
    absent_cnt = sum(1 for r in records if r.status == "absent")
    half_cnt = sum(1 for r in records if r.status == "half_day")
    leave_cnt = sum(1 for r in records if r.status == "approved_leave")

    return {
        "records": results,
        "summary": {
            "total_records": len(results),
            "present_count": present_cnt,
            "absent_count": absent_cnt,
            "half_day_count": half_cnt,
            "approved_leave_count": leave_cnt
        }
    }

@router.post("/mark")
def mark_attendance(
    req: MarkAttendanceRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["admin", "payroll_admin"] and user.employee_id != req.employee_id and user.id != req.employee_id:
        raise HTTPException(status_code=403, detail="Permission denied")

    comp_id = user.company_id
    rec = db.query(AttendanceRecord).filter(
        AttendanceRecord.company_id == comp_id,
        AttendanceRecord.employee_id == req.employee_id,
        AttendanceRecord.date == req.date
    ).first()

    if rec:
        rec.status = req.status
        rec.check_in = req.check_in
        rec.check_out = req.check_out
        rec.notes = req.notes
    else:
        rec = AttendanceRecord(
            id=f"att_{uuid.uuid4().hex[:8]}",
            company_id=comp_id,
            employee_id=req.employee_id,
            date=req.date,
            status=req.status,
            check_in=req.check_in or "09:30 AM",
            check_out=req.check_out or "06:30 PM",
            notes=req.notes
        )
        db.add(rec)

    db.commit()
    return {"status": "success", "message": "Attendance recorded successfully"}
