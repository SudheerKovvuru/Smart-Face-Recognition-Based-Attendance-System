import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import './CameraDetailPage.css';

// ── All student names pulled from CorLab.csv ──────────────────────────────────
const ALL_STUDENTS = [
  'bharath', 'suri', 'akash', 'harshith', 'chandra', 'sudheer', 'shivamani',
  'anirudh', 'mahesh', 'vinay', 'chiru', 'sai krishna', 'praveen', 'satish',
  'manisha', 'harshitha', 'prasanna', 'bala sai', 'tirumala', 'harish',
  'kranthi', 'venky', 'uma', 'jugendra', 'srinivas', 'shajal', 'rashmitha',
  'bhumi', 'akshitha', 'sandhya', 'nikitha', 'ramya', 'monica', 'kavya',
  'pushpa', 'himabindhu', 'tejaswini', 'sravani', 'pavan', 'harsha', 'roopa',
  'yasaswini', 'haricharan', 'laxman', 'dilli', 'shareen', 'rohith', 'gayathri',
  'gnani', 'joshi', 'laxmi', 'srisha', 'naveen', 'keerthi', 'vikas', 'deepthi',
  'yashwant', 'karthick', 'dolly', 'harikrishna', 'shiva', 'rakesh', 'ganapathi',
  'nageshwari', 'dhanalaxmi', 'abhishek'
];

// ── Always absent students ──────────────────────────────────────────────────
const ALWAYS_ABSENT = [
  'yasaswini', 'haricharan', 'laxman', 'dilli', 'shareen', 'rohith', 'gayathri',
  'gnani', 'joshi', 'laxmi', 'srisha', 'naveen', 'keerthi', 'vikas', 'deepthi',
  'yashwant', 'karthick', 'dolly', 'harikrishna', 'shiva', 'rakesh', 'ganapathi',
  'nageshwari', 'dhanalaxmi', 'abhishek'
];

// ── Capitalise first letter of each word ─────────────────────────────────────
function toTitleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

export default function CameraDetailPage() {
  const { cameraId } = useParams();
  const location   = useLocation();
  const token      = localStorage.getItem('token');

  // ── Demo video URL (served via Express with auth token) ───────────────────
  const API_URL = 'http://localhost:5000/api/video';
  // Using converted file with proper H.264 codec
  const DEMO_VIDEO_FILENAME = 'Class_Attendance_output_converted.mp4';
  
  const getVideoUrlWithAuth = (baseUrl) => {
    const token = localStorage.getItem('token');
    if (token) {
      return `${baseUrl}?token=${token}`;
    }
    return baseUrl;
  };
  
  const videoSrc = getVideoUrlWithAuth(`${API_URL}/${DEMO_VIDEO_FILENAME}`);

  // ── Fake stats state ───────────────────────────────────────────────────────
  const [detectedStudents, setDetectedStudents] = useState([]);
  const [presentCount,     setPresentCount]     = useState(0);
  const [absentCount,      setAbsentCount]      = useState(0);
  const [currentCheck,     setCurrentCheck]     = useState(1);
  const [nextCheckIn,      setNextCheckIn]      = useState(10);
  const [elapsedTime,      setElapsedTime]      = useState(0);
  const [isLoading,        setIsLoading]        = useState(true);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const elapsedRef = useRef(0);

  // ── Derive a friendly camera name from the id ─────────────────────────────
  const cameraName = location.state?.cameraName
    || `Camera ${cameraId?.replace('cam', '').replace('_trim', '')}`;

  // ── Initialise with a first batch of fake detections ─────────────────────
  useEffect(() => {
    // Start with loading state for 3-4 seconds to simulate face recognition
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      refreshStats();
    }, 3500); // 3.5 seconds of loading

    // Simulate "new detection check" every 10 s (mirrors real backend interval)
    const interval = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        elapsedRef.current += 10;
        setElapsedTime(elapsedRef.current);
        refreshStats();
        setCurrentCheck(prev => prev + 1);
        setNextCheckIn(10);
      }, 10_000);
    }, 3500); // Start checks after loading is done

    // Countdown ticker
    countdownRef.current = setInterval(() => {
      setNextCheckIn(prev => (prev > 1 ? prev - 1 : prev));
    }, 1_000);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(interval);
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  // ── Send absence notification email ──────────────────────────────────────
  useEffect(() => {
    sendAbsenceNotification();
  }, []);

  async function sendAbsenceNotification() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notification/send-absence-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentEmail: '22a51a4242@adityatekkali.edu.in',
          studentName: 'Student'
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ Absence email sent successfully');
      } else {
        console.log('⚠️ Email status:', data.error);
      }
    } catch (error) {
      console.log('ℹ️ Email service note:', error.message);
    }
  }

  function refreshStats() {
    const students = ALL_STUDENTS.map(name => {
      // Check if student is always absent
      const isAlwaysAbsent = ALWAYS_ABSENT.includes(name.toLowerCase());
      // Check if roopa and still in first 25 seconds
      const isRoopaAbsentPeriod = name.toLowerCase() === 'roopa' && elapsedRef.current < 21;
      
      const isAbsent = isAlwaysAbsent || isRoopaAbsentPeriod;
      
      return {
        name,
        confidence: isAbsent ? null : (90 + Math.random() * 9.5).toFixed(1),
        isAbsent
      };
    });

    setDetectedStudents(students);
    const present = students.filter(s => !s.isAbsent).length;
    const absent = students.filter(s => s.isAbsent).length;
    setPresentCount(present);
    setAbsentCount(absent);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="camera-detail-container">

      {/* ── Left: 70 % – demo video ───────────────────────────────────────── */}
      <div className="video-section">
        <div className="video-header">
          <span className="camera-label">{cameraName}</span>
          <span className="live-badge">● LIVE</span>
        </div>

        <div className="video-wrapper">
          {isLoading && (
            <div className="video-loading-overlay">
              <div className="overlay-spinner">
                <div className="overlay-ring"></div>
                <div className="overlay-ring"></div>
              </div>
              <p className="overlay-text">Loading Camera Feed...</p>
            </div>
          )}
          <video
            autoPlay
            loop
            muted
            playsInline
            className={`detail-video ${isLoading ? 'hidden' : ''}`}
            src={videoSrc}
          >
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="video-footer">
          <span>Next scan in {nextCheckIn}s</span>
        </div>
      </div>

      {/* ── Right: 30 % – fake stats panel ───────────────────────────────── */}
      <div className="stats-section">

        {isLoading ? (
          // ── Loading animation while recognizing faces ────────────────────
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <h3 className="loading-text">Recognizing Faces...</h3>
            <p className="loading-subtext">Analyzing video stream</p>
            <div className="scan-lines">
              <div className="scan-line"></div>
            </div>
          </div>
        ) : (
          // ── Detection results once loading is complete ───────────────────
          <>
            <div className="stats-header">
              <h2>Detection Results</h2>
              <span className="stats-badge">Period 1</span>
            </div>

            {/* Summary counts */}
            <div className="stats-summary">
              <div className="stat-box">
                <span className="stat-value">{presentCount}</span>
                <span className="stat-label">Present</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">{absentCount}</span>
                <span className="stat-label">Absent</span>
              </div>
            </div>

            {/* Student list */}
            <div className="detected-list-header">
              <span>Detected Students</span>
            </div>

            <div className="detected-list">
              {detectedStudents.map((student, idx) => (
                <div key={idx} className="detected-item">
                  <div className="detected-avatar">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="detected-info">
                    <span className="detected-name">{toTitleCase(student.name)}</span>
                    <span className={`detected-status ${student.isAbsent ? 'absent' : 'present'}`}>
                      {student.isAbsent ? 'Absent' : 'Present'}
                    </span>
                  </div>
                  <span className="detected-confidence">{student.isAbsent ? '—' : `${student.confidence}%`}</span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}