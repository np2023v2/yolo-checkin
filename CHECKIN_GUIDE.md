# Face Recognition Check-In System - User Guide

## System Overview

The Face Recognition Check-In System is a modern attendance tracking solution that uses AI-powered face detection and recognition to automatically record employee attendance.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface (Web)                     │
├─────────────────────────────────────────────────────────────┤
│  Check-In Page  │  Manage Persons  │  Attendance Records   │
│  (Webcam)       │  (Registration)  │  (Reports & Export)   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (FastAPI)                     │
├─────────────────────────────────────────────────────────────┤
│  Face Detection │ Face Recognition │ Attendance Tracking    │
│  (face_recognition library + dlib)                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                       │
├─────────────────────────────────────────────────────────────┤
│  • Persons (with face encodings)                            │
│  • Attendance Records (check-in/out times)                  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start Guide

### 1. Register Persons

Before using the check-in system, you need to register persons with their face photos.

**Steps:**
1. Navigate to **Check-In** → **Manage Persons**
2. Click **"Register New Person"**
3. Fill in the form:
   - Name (required)
   - Employee ID (optional)
   - Department (optional)
4. Upload a clear frontal face photo
5. Click **"Register"**

**Requirements for face photo:**
- Clear, well-lit photo
- Frontal view of the face
- Only ONE person in the photo
- Recommended: 640x480 pixels or higher

### 2. Use Face Check-In

Once persons are registered, they can check in using the webcam.

**Steps:**
1. Navigate to **Check-In** page
2. Click **"Start Camera"** to enable webcam
3. Position yourself in front of the camera
4. Click **"Detect Faces"** to test recognition (optional)
5. Click **"Check In"** to record attendance

**System Response:**
- ✅ **Green box**: Face recognized, shows name and confidence
- ❌ **Red box**: Face not recognized, needs registration
- Success message displays person name and check-in time

### 3. View Attendance Records

Monitor attendance and generate reports.

**Steps:**
1. Navigate to **Check-In** → **Attendance** (via the main check-in page)
2. Use date filters to select a time period
3. Click **"Apply Filters"** to view records
4. Click **"Export CSV"** to download data

**Available Data:**
- Person name and employee ID
- Department
- Check-in time
- Check-out time
- Duration (calculated)
- Recognition confidence
- Location

## Features in Detail

### Real-time Face Detection
- Detects multiple faces in webcam feed
- Shows bounding boxes around detected faces
- Color-coded: Green for recognized, Red for unknown

### Face Recognition
- Uses state-of-the-art face_recognition library
- 128-dimensional face encoding
- Recognition threshold: 60% confidence
- Handles varying lighting and angles

### Automatic Check-In/Out
- First detection: Records check-in time
- Second detection (same day): Records check-out time
- Calculates work duration automatically

### Attendance Statistics
- Today's attendance rate
- Number of persons checked in
- Total attendance records
- Visual dashboard with metrics

### Data Export
- Export to CSV format
- Filter by date range
- Includes all attendance details
- Easy import to Excel/Google Sheets

## API Endpoints

### Person Management
```
POST   /api/v1/checkin/persons/           - Register new person
GET    /api/v1/checkin/persons/           - List all persons
GET    /api/v1/checkin/persons/{id}       - Get person details
PUT    /api/v1/checkin/persons/{id}       - Update person
DELETE /api/v1/checkin/persons/{id}       - Delete person
```

### Face Recognition
```
POST   /api/v1/checkin/detect-faces       - Detect & recognize faces
POST   /api/v1/checkin/check-in           - Check in with face
```

### Attendance
```
GET    /api/v1/checkin/attendance/        - List attendance records
GET    /api/v1/checkin/attendance/export  - Export to CSV
GET    /api/v1/checkin/attendance/today   - Today's statistics
```

## Troubleshooting

### Camera Not Working
- **Issue**: "Failed to access webcam"
- **Solution**: 
  - Grant camera permissions in browser
  - Close other apps using the camera
  - Try a different browser (Chrome recommended)

### Face Not Detected
- **Issue**: "No face detected in the image"
- **Solution**:
  - Ensure good lighting
  - Face the camera directly
  - Move closer to the camera
  - Remove glasses/masks if possible

### Face Not Recognized
- **Issue**: Face detected but not recognized
- **Solution**:
  - Check if person is registered
  - Re-register with better quality photo
  - Ensure similar lighting conditions

### Multiple Faces Detected
- **Issue**: "Multiple faces detected"
- **Solution**:
  - Ensure only one person in frame
  - Others should step back
  - Use person management for individual registration

## Best Practices

### For Registration
1. Use high-quality, recent photos
2. Ensure proper lighting
3. Capture frontal view
4. Update photos if appearance changes significantly

### For Check-In
1. Look directly at camera
2. Remove obstructions (sunglasses, hats)
3. Use consistent lighting
4. Allow 1-2 seconds for recognition

### For Administrators
1. Regularly export attendance data
2. Review unrecognized faces
3. Update person information as needed
4. Monitor attendance statistics

## Security & Privacy

- Face encodings are stored securely in database
- Photos are stored locally with access control
- JWT authentication required for all API access
- Face data can be deleted at any time
- Complies with data privacy regulations

## Technical Requirements

### Backend
- Python 3.11+
- PostgreSQL database
- face_recognition library
- dlib (face detection)
- FastAPI framework

### Frontend
- Modern web browser with webcam support
- JavaScript enabled
- Camera permissions granted
- Stable internet connection

### Recommended Hardware
- Webcam: 720p or higher
- CPU: Multi-core processor
- RAM: 8GB minimum
- Storage: 10GB for photos and database

## Support

For issues or questions:
1. Check the troubleshooting guide
2. Review API documentation
3. Contact system administrator
4. Report bugs on GitHub

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**System Status:** Production Ready ✅
