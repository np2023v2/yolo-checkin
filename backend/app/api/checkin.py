from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.api.auth import get_current_user
from app.models.models import User, Person, AttendanceRecord
from app.schemas.schemas import (
    Person as PersonSchema,
    PersonCreate,
    PersonUpdate,
    AttendanceRecord as AttendanceRecordSchema,
    FaceDetectionResult,
    FaceDetection
)
from app.core.config import settings
import face_recognition
import numpy as np
from PIL import Image
import os
import time
import tempfile
from datetime import datetime, timedelta
import cv2

router = APIRouter()


@router.post("/persons/", response_model=PersonSchema)
async def create_person(
    name: str = Form(...),
    employee_id: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register a new person with their face photo."""
    # Check if employee_id already exists
    if employee_id:
        existing = db.query(Person).filter(Person.employee_id == employee_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Employee ID already exists")
    
    # Save the photo
    photo_dir = os.path.join(settings.UPLOAD_DIR, "faces")
    os.makedirs(photo_dir, exist_ok=True)
    
    # Create unique filename
    timestamp = int(time.time())
    ext = os.path.splitext(file.filename)[1]
    photo_filename = f"person_{timestamp}{ext}"
    photo_path = os.path.join(photo_dir, photo_filename)
    
    # Save file
    with open(photo_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    try:
        # Load image and get face encoding
        image = face_recognition.load_image_file(photo_path)
        face_encodings = face_recognition.face_encodings(image)
        
        if len(face_encodings) == 0:
            os.remove(photo_path)
            raise HTTPException(status_code=400, detail="No face detected in the image")
        
        if len(face_encodings) > 1:
            os.remove(photo_path)
            raise HTTPException(status_code=400, detail="Multiple faces detected. Please upload an image with only one face")
        
        # Store face encoding as JSON
        face_encoding = face_encodings[0].tolist()
        
        # Create person record
        person = Person(
            name=name,
            employee_id=employee_id,
            department=department,
            face_encoding=face_encoding,
            photo_path=photo_path,
            is_active=True
        )
        
        db.add(person)
        db.commit()
        db.refresh(person)
        
        return person
    
    except Exception as e:
        # Clean up if error occurs
        if os.path.exists(photo_path):
            os.remove(photo_path)
        raise HTTPException(status_code=500, detail=f"Error processing face: {str(e)}")


@router.get("/persons/", response_model=List[PersonSchema])
async def list_persons(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all registered persons."""
    query = db.query(Person)
    if active_only:
        query = query.filter(Person.is_active == True)
    persons = query.offset(skip).limit(limit).all()
    return persons


@router.get("/persons/{person_id}", response_model=PersonSchema)
async def get_person(
    person_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific person."""
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@router.put("/persons/{person_id}", response_model=PersonSchema)
async def update_person(
    person_id: int,
    person_update: PersonUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a person's information."""
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Update fields
    if person_update.name is not None:
        person.name = person_update.name
    if person_update.employee_id is not None:
        person.employee_id = person_update.employee_id
    if person_update.department is not None:
        person.department = person_update.department
    if person_update.is_active is not None:
        person.is_active = person_update.is_active
    
    db.commit()
    db.refresh(person)
    return person


@router.delete("/persons/{person_id}")
async def delete_person(
    person_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a person."""
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Delete photo file if exists
    if person.photo_path and os.path.exists(person.photo_path):
        os.remove(person.photo_path)
    
    db.delete(person)
    db.commit()
    return {"message": "Person deleted successfully"}


@router.post("/detect-faces", response_model=FaceDetectionResult)
async def detect_faces(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Detect and recognize faces in an image."""
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
        tmp_file.write(await file.read())
        tmp_path = tmp_file.name
    
    try:
        start_time = time.time()
        
        # Load image
        image = face_recognition.load_image_file(tmp_path)
        
        # Find face locations and encodings
        face_locations = face_recognition.face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        # Load all registered persons
        persons = db.query(Person).filter(Person.is_active == True).all()
        known_encodings = []
        known_persons = []
        
        for person in persons:
            if person.face_encoding:
                known_encodings.append(np.array(person.face_encoding))
                known_persons.append(person)
        
        # Match faces
        detections = []
        for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
            # Compare with known faces
            person_id = None
            person_name = None
            match_confidence = None
            
            if known_encodings:
                face_distances = face_recognition.face_distance(known_encodings, face_encoding)
                best_match_index = np.argmin(face_distances)
                
                # If the best match is below threshold, consider it a match
                if face_distances[best_match_index] < 0.6:  # Threshold for recognition
                    matched_person = known_persons[best_match_index]
                    person_id = matched_person.id
                    person_name = matched_person.name
                    match_confidence = 1.0 - face_distances[best_match_index]
            
            detections.append(FaceDetection(
                x=left,
                y=top,
                width=right - left,
                height=bottom - top,
                confidence=1.0,
                person_id=person_id,
                person_name=person_name,
                match_confidence=match_confidence
            ))
        
        processing_time = time.time() - start_time
        
        return FaceDetectionResult(
            faces=detections,
            processing_time=processing_time
        )
    
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/check-in", response_model=AttendanceRecordSchema)
async def check_in(
    file: UploadFile = File(...),
    location: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check in a person by detecting their face."""
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        # Load image and detect faces
        image = face_recognition.load_image_file(tmp_path)
        face_locations = face_recognition.face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        if len(face_encodings) == 0:
            raise HTTPException(status_code=400, detail="No face detected in the image")
        
        if len(face_encodings) > 1:
            raise HTTPException(status_code=400, detail="Multiple faces detected. Please ensure only one person is in the frame")
        
        # Load all registered persons
        persons = db.query(Person).filter(Person.is_active == True).all()
        known_encodings = []
        known_persons = []
        
        for person in persons:
            if person.face_encoding:
                known_encodings.append(np.array(person.face_encoding))
                known_persons.append(person)
        
        if not known_encodings:
            raise HTTPException(status_code=400, detail="No registered persons found")
        
        # Match face
        face_encoding = face_encodings[0]
        face_distances = face_recognition.face_distance(known_encodings, face_encoding)
        best_match_index = np.argmin(face_distances)
        
        if face_distances[best_match_index] >= 0.6:
            raise HTTPException(status_code=404, detail="Face not recognized. Please register first")
        
        matched_person = known_persons[best_match_index]
        confidence = 1.0 - face_distances[best_match_index]
        
        # Save check-in photo
        checkin_dir = os.path.join(settings.UPLOAD_DIR, "checkin")
        os.makedirs(checkin_dir, exist_ok=True)
        
        timestamp = int(time.time())
        ext = os.path.splitext(file.filename)[1]
        photo_filename = f"checkin_{matched_person.id}_{timestamp}{ext}"
        photo_path = os.path.join(checkin_dir, photo_filename)
        
        # Copy temp file to permanent location
        with open(photo_path, "wb") as f:
            f.write(content)
        
        # Check if already checked in today
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        existing_record = db.query(AttendanceRecord).filter(
            AttendanceRecord.person_id == matched_person.id,
            AttendanceRecord.check_in_time >= today_start,
            AttendanceRecord.check_out_time == None
        ).first()
        
        if existing_record:
            # Update check-out time
            existing_record.check_out_time = datetime.now()
            db.commit()
            db.refresh(existing_record)
            existing_record.person = matched_person
            return existing_record
        
        # Create new attendance record
        record = AttendanceRecord(
            person_id=matched_person.id,
            photo_path=photo_path,
            confidence=confidence,
            location=location
        )
        
        db.add(record)
        db.commit()
        db.refresh(record)
        record.person = matched_person
        
        return record
    
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.get("/attendance/", response_model=List[AttendanceRecordSchema])
async def list_attendance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    person_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List attendance records with optional filters."""
    query = db.query(AttendanceRecord)
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        query = query.filter(AttendanceRecord.check_in_time >= start_dt)
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        query = query.filter(AttendanceRecord.check_in_time <= end_dt)
    
    if person_id:
        query = query.filter(AttendanceRecord.person_id == person_id)
    
    records = query.order_by(AttendanceRecord.check_in_time.desc()).offset(skip).limit(limit).all()
    
    # Load person information
    for record in records:
        record.person = db.query(Person).filter(Person.id == record.person_id).first()
    
    return records


@router.get("/attendance/export")
async def export_attendance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export attendance records as CSV."""
    import csv
    from io import StringIO
    from fastapi.responses import StreamingResponse
    
    query = db.query(AttendanceRecord)
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        query = query.filter(AttendanceRecord.check_in_time >= start_dt)
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        query = query.filter(AttendanceRecord.check_in_time <= end_dt)
    
    records = query.order_by(AttendanceRecord.check_in_time).all()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'ID',
        'Person Name',
        'Employee ID',
        'Department',
        'Check In Time',
        'Check Out Time',
        'Duration (hours)',
        'Confidence',
        'Location'
    ])
    
    # Write data
    for record in records:
        person = db.query(Person).filter(Person.id == record.person_id).first()
        duration = ''
        if record.check_out_time:
            delta = record.check_out_time - record.check_in_time
            duration = f"{delta.total_seconds() / 3600:.2f}"
        
        writer.writerow([
            record.id,
            person.name if person else '',
            person.employee_id if person else '',
            person.department if person else '',
            record.check_in_time.strftime('%Y-%m-%d %H:%M:%S'),
            record.check_out_time.strftime('%Y-%m-%d %H:%M:%S') if record.check_out_time else '',
            duration,
            f"{record.confidence:.2f}" if record.confidence else '',
            record.location or ''
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance.csv"}
    )


@router.get("/attendance/today")
async def today_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's attendance summary."""
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get today's check-ins
    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.check_in_time >= today_start
    ).all()
    
    # Get all active persons
    total_persons = db.query(Person).filter(Person.is_active == True).count()
    
    checked_in = len(set(r.person_id for r in records))
    
    return {
        "date": today_start.strftime('%Y-%m-%d'),
        "total_persons": total_persons,
        "checked_in": checked_in,
        "attendance_rate": f"{(checked_in / total_persons * 100):.1f}%" if total_persons > 0 else "0%",
        "records": len(records)
    }
