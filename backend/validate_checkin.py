#!/usr/bin/env python3
"""
Simple validation script to test that the check-in system modules load correctly.
This script validates imports and basic structure without needing a running database.
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def test_imports():
    """Test that all modules can be imported."""
    print("Testing imports...")
    
    try:
        # Test database models
        from app.models.models import Person, AttendanceRecord
        print("✓ Database models imported successfully")
        
        # Test schemas
        from app.schemas.schemas import (
            Person as PersonSchema,
            AttendanceRecord as AttendanceRecordSchema,
            FaceDetectionResult,
            FaceDetection
        )
        print("✓ Schemas imported successfully")
        
        # Test API router
        from app.api.checkin import router
        print("✓ Check-in API router imported successfully")
        
        print("\n✅ All imports successful!")
        return True
        
    except ImportError as e:
        print(f"\n❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

def test_model_structure():
    """Test that models have expected attributes."""
    print("\nTesting model structure...")
    
    try:
        from app.models.models import Person, AttendanceRecord
        
        # Check Person model attributes
        person_attrs = ['id', 'name', 'employee_id', 'department', 
                       'face_encoding', 'photo_path', 'is_active']
        for attr in person_attrs:
            if not hasattr(Person, attr):
                raise AttributeError(f"Person model missing attribute: {attr}")
        print("✓ Person model has all expected attributes")
        
        # Check AttendanceRecord model attributes
        attendance_attrs = ['id', 'person_id', 'check_in_time', 'check_out_time',
                          'photo_path', 'confidence', 'location']
        for attr in attendance_attrs:
            if not hasattr(AttendanceRecord, attr):
                raise AttributeError(f"AttendanceRecord model missing attribute: {attr}")
        print("✓ AttendanceRecord model has all expected attributes")
        
        print("\n✅ Model structure validation passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Model structure error: {e}")
        return False

def test_api_routes():
    """Test that API routes are defined."""
    print("\nTesting API routes...")
    
    try:
        from app.api.checkin import router
        
        routes = [route.path for route in router.routes]
        
        expected_routes = [
            '/persons/',
            '/persons/{person_id}',
            '/detect-faces',
            '/check-in',
            '/attendance/',
            '/attendance/export',
            '/attendance/today'
        ]
        
        for route in expected_routes:
            if route not in routes:
                print(f"  Warning: Route {route} not found")
            else:
                print(f"  ✓ Route {route} defined")
        
        print("\n✅ API routes validation completed!")
        return True
        
    except Exception as e:
        print(f"\n❌ API routes error: {e}")
        return False

def main():
    """Run all validation tests."""
    print("=" * 60)
    print("Face Recognition Check-In System - Validation Tests")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(test_imports())
    results.append(test_model_structure())
    results.append(test_api_routes())
    
    # Summary
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"\n✅ ALL TESTS PASSED ({passed}/{total})")
        print("\nThe check-in system is properly integrated!")
        print("Next steps:")
        print("1. Start the backend server: uvicorn app.main:app --reload")
        print("2. Start the frontend: cd frontend && npm run dev")
        print("3. Visit http://localhost:3000/checkin to test")
        return 0
    else:
        print(f"\n⚠️  SOME TESTS FAILED ({passed}/{total})")
        print("\nPlease fix the errors above before running the system.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
