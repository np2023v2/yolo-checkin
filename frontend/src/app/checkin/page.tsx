'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { checkinApi } from '@/lib/api';
import { Person, AttendanceRecord, FaceDetection } from '@/types';
import { Camera, UserPlus, Users, Clock, Download, CheckCircle } from 'lucide-react';

export default function CheckInPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [detectedFaces, setDetectedFaces] = useState<FaceDetection[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<AttendanceRecord | null>(null);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadPersons();
      loadTodayStats();
    }
  }, [user]);

  const loadPersons = async () => {
    try {
      const data = await checkinApi.listPersons(true);
      setPersons(data);
    } catch (error) {
      console.error('Failed to load persons:', error);
    }
  };

  const loadTodayStats = async () => {
    try {
      const stats = await checkinApi.todayAttendance();
      setTodayStats(stats);
    } catch (error) {
      console.error('Failed to load today stats:', error);
    }
  };

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      setError('Failed to access webcam. Please grant camera permissions.');
      console.error('Webcam error:', err);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureAndDetect = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg');
    });

    setIsDetecting(true);
    setError(null);

    try {
      // Detect faces
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      const result = await checkinApi.detectFaces(file);
      
      setDetectedFaces(result.faces);
      
      // Draw face boxes on canvas
      result.faces.forEach(face => {
        context.strokeStyle = face.person_id ? '#00ff00' : '#ff0000';
        context.lineWidth = 3;
        context.strokeRect(face.x, face.y, face.width, face.height);
        
        // Draw label
        if (face.person_name) {
          const label = `${face.person_name} (${(face.match_confidence! * 100).toFixed(1)}%)`;
          context.fillStyle = '#00ff00';
          context.fillRect(face.x, face.y - 25, context.measureText(label).width + 10, 25);
          context.fillStyle = '#ffffff';
          context.font = '16px Arial';
          context.fillText(label, face.x + 5, face.y - 7);
        } else {
          context.fillStyle = '#ff0000';
          context.fillRect(face.x, face.y - 25, 100, 25);
          context.fillStyle = '#ffffff';
          context.font = '16px Arial';
          context.fillText('Unknown', face.x + 5, face.y - 7);
        }
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to detect faces');
      console.error('Detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const handleCheckIn = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg');
    });

    setIsDetecting(true);
    setError(null);

    try {
      const file = new File([blob], 'checkin.jpg', { type: 'image/jpeg' });
      const record = await checkinApi.checkIn(file);
      
      setLastCheckIn(record);
      setDetectedFaces([]);
      loadTodayStats(); // Refresh stats
      
      // Show success message
      alert(`Check-in successful! Welcome ${record.person?.name}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Check-in failed');
      console.error('Check-in error:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Camera className="mr-3" size={32} />
            Face Recognition Check-In
          </h1>
          <p className="mt-2 text-gray-600">
            Use webcam to detect and recognize faces for attendance tracking
          </p>
        </div>

        {/* Today's Stats */}
        {todayStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Persons</p>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.total_persons}</p>
                </div>
                <Users className="text-blue-500" size={32} />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Checked In</p>
                  <p className="text-2xl font-bold text-green-600">{todayStats.checked_in}</p>
                </div>
                <CheckCircle className="text-green-500" size={32} />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{todayStats.attendance_rate}</p>
                </div>
                <Clock className="text-purple-500" size={32} />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-orange-600">{todayStats.records}</p>
                </div>
                <Download className="text-orange-500" size={32} />
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Webcam View */}
          <div className="lg:col-span-2">
            <Card>
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ display: stream ? 'block' : 'none' }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ display: detectedFaces.length > 0 ? 'block' : 'none' }}
                />
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera size={64} className="mx-auto mb-4 opacity-50" />
                      <p>Camera not started</p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {lastCheckIn && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 font-semibold">
                    ✓ Check-in successful: {lastCheckIn.person?.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Time: {new Date(lastCheckIn.check_in_time).toLocaleString()}
                  </p>
                  {lastCheckIn.confidence && (
                    <p className="text-sm text-gray-600">
                      Confidence: {(lastCheckIn.confidence * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                {!stream ? (
                  <Button onClick={startWebcam} className="flex items-center space-x-2">
                    <Camera size={20} />
                    <span>Start Camera</span>
                  </Button>
                ) : (
                  <>
                    <Button onClick={stopWebcam} variant="secondary" className="flex items-center space-x-2">
                      <Camera size={20} />
                      <span>Stop Camera</span>
                    </Button>
                    <Button
                      onClick={captureAndDetect}
                      disabled={isDetecting}
                      className="flex items-center space-x-2"
                    >
                      <Users size={20} />
                      <span>{isDetecting ? 'Detecting...' : 'Detect Faces'}</span>
                    </Button>
                    <Button
                      onClick={handleCheckIn}
                      disabled={isDetecting}
                      variant="secondary"
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle size={20} />
                      <span>{isDetecting ? 'Processing...' : 'Check In'}</span>
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Detected Faces</h2>
              </div>
              
              {detectedFaces.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No faces detected yet. Click "Detect Faces" to scan.
                </p>
              ) : (
                <div className="space-y-3">
                  {detectedFaces.map((face, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        face.person_id
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">
                            {face.person_name || 'Unknown Person'}
                          </p>
                          {face.match_confidence && (
                            <p className="text-sm text-gray-600">
                              Confidence: {(face.match_confidence * 100).toFixed(1)}%
                            </p>
                          )}
                        </div>
                        {face.person_id ? (
                          <CheckCircle className="text-green-600" size={20} />
                        ) : (
                          <UserPlus className="text-red-600" size={20} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Registered Persons</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {persons.map((person) => (
                  <div key={person.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{person.name}</p>
                    {person.employee_id && (
                      <p className="text-sm text-gray-600">ID: {person.employee_id}</p>
                    )}
                    {person.department && (
                      <p className="text-sm text-gray-600">{person.department}</p>
                    )}
                  </div>
                ))}
              </div>
              <Button
                onClick={() => router.push('/checkin/persons')}
                variant="secondary"
                className="w-full mt-4"
              >
                <UserPlus size={20} className="mr-2" />
                Manage Persons
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
