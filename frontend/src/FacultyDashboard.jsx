import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import './FacultyDashboard.css';

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

export default function FacultyDashboard() {
  const [studentData, setStudentData] = useState([]);
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [attendancePercentage, setAttendancePercentage] = useState(0);

  // ── Initialize student attendance data ────────────────────────────────────
  useEffect(() => {
    initializeAttendance();
  }, []);

  function initializeAttendance() {
    const students = ALL_STUDENTS.map(name => {
      const isAbsent = ALWAYS_ABSENT.includes(name.toLowerCase());
      return {
        name: toTitleCase(name),
        attendance: isAbsent ? 0 : 100,
        status: isAbsent ? 'Absent' : 'Present'
      };
    });

    setStudentData(students);
    
    const present = students.filter(s => s.status === 'Present').length;
    const absent = students.filter(s => s.status === 'Absent').length;
    
    setPresentCount(present);
    setAbsentCount(absent);
    setAttendancePercentage(Math.round((present / ALL_STUDENTS.length) * 100));
  }

  // ── Generate and download Excel sheet ─────────────────────────────────────
  function downloadAttendanceReport() {
    const worksheetData = [
      ['Student Name', 'Status', 'Attendance %'],
      ...studentData.map(student => [student.name, student.status, `${student.attendance}%`])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 12 },
      { wch: 12 }
    ];

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Attendance_Report_${timestamp}.xlsx`);
  }

  // ── Pie chart data ────────────────────────────────────────────────────────
  const pieData = [
    { name: 'Present', value: presentCount, color: '#10b981' },
    { name: 'Absent', value: absentCount, color: '#ef4444' }
  ];

  // ── Bar chart data ────────────────────────────────────────────────────────
  const barData = [
    {
      name: 'Attendance',
      Present: attendancePercentage,
      Absent: 100 - attendancePercentage
    }
  ];

  return (
    <div className="faculty-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Attendance Dashboard</h1>
        <button className="download-btn" onClick={downloadAttendanceReport}>
          <Download size={18} />
          Download Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card present">
          <div className="card-label">Total Present</div>
          <div className="card-value">{presentCount}</div>
        </div>
        <div className="summary-card absent">
          <div className="card-label">Total Absent</div>
          <div className="card-value">{absentCount}</div>
        </div>
        <div className="summary-card attendance">
          <div className="card-label">Attendance %</div>
          <div className="card-value">{attendancePercentage}%</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-container">
        {/* Pie Chart */}
        <div className="chart-box">
          <h2>Student Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} students`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="chart-box">
          <h2>Attendance Percentage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="Present" fill="#10b981" />
              <Bar dataKey="Absent" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Student Attendance Bar Chart */}
      <div className="chart-box full-width">
        <h2>Student-wise Attendance</h2>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={studentData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={150} tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} label={{ value: 'Attendance (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value) => `${value}%`}
              contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '6px' }}
            />
            <Bar dataKey="attendance" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
