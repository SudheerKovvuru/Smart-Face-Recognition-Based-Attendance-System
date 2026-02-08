import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import './Auth.css';

function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    rollNo: '',
    email: '',
    password: '',
    confirmPassword: '',
    branch: '',
    course: '',
    year: '',
    section: ''
  });
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Branches and courses
  const branches = ['cse', 'it', 'csm', 'csd', 'csc', 'ece', 'eee', 'civil', 'mech'];
  const courses = ['btech', 'diploma', 'mba', 'mca'];
  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Get max year based on course
  const getMaxYear = () => {
    if (formData.course === 'btech') return 4;
    if (formData.course === 'diploma') return 3;
    if (formData.course === 'mba' || formData.course === 'mca') return 2;
    return 4;
  };

  // Auto-detect role from roll number
  useEffect(() => {
    const { rollNo } = formData;
    if (rollNo === 'admin') {
      setRole('admin');
      setFormData(prev => ({ ...prev, email: 'admin@gmail.com' }));
    } else if (rollNo.length === 10 && rollNo[0] === 'A') {
      setRole('faculty');
    } else if (rollNo.length === 10 && !isNaN(rollNo[0])) {
      setRole('student');
      setFormData(prev => ({ ...prev, email: `${rollNo}@adityatekkali.edu.in` }));
    } else {
      setRole('');
    }
  }, [formData.rollNo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!role) {
      setError('Invalid roll number format');
      return;
    }

    if (role === 'student' && (!formData.branch || !formData.course || !formData.year || !formData.section)) {
      setError('Please fill all student fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to login or dashboard
      alert('Account created successfully! Please login.');
      navigate('/login');

    } catch (err) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card signup-card">
        <div className="auth-header">
          <UserPlus className="auth-icon" size={40} />
          <h1>Sign Up</h1>
          <p>Create your account to get started.</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {role && (
          <div className="role-indicator">
            Registering as: <strong>{role.toUpperCase()}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="rollNo">Roll Number / Username *</label>
            <input
              type="text"
              id="rollNo"
              name="rollNo"
              value={formData.rollNo}
              onChange={handleChange}
              placeholder="22A51A4260 or A5CSE00000 or admin"
              required
              autoFocus
            />
            <span className="form-hint">
              10 digits for student/faculty, 'admin' for admin
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email {role === 'faculty' ? '*' : '(Auto-generated)'}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              disabled={role === 'student' || role === 'admin'}
              required={role === 'faculty'}
            />
            {role === 'student' && (
              <span className="form-hint">Auto: {formData.rollNo}@adityatekkali.edu.in</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
              />
            </div>
          </div>

          {/* Student-specific fields */}
          {role === 'student' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="branch">Branch *</label>
                  <select
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map(b => (
                      <option key={b} value={b}>{b.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="course">Course *</label>
                  <select
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(c => (
                      <option key={c} value={c}>{c.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="year">Year *</label>
                  <select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    disabled={!formData.course}
                  >
                    <option value="">Select Year</option>
                    {[...Array(getMaxYear())].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="section">Section *</label>
                  <select
                    id="section"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Section</option>
                    {sections.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading || !role}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Signup;