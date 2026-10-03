import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { createInterview, getApplications } from '../services/api';

const emptyForm = {
  companyName: '',
  jobTitle: '',
  application: '',
  round: 'Technical',
  interviewType: 'Online',
  date: '',
  startTime: '',
  endTime: '',
  interviewerName: '',
  interviewerEmail: '',
  meetingLink: '',
  location: '',
  status: 'Scheduled',
  preparationNotes: '',
  feedback: '',
};

const AddInterview = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState(emptyForm);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingApplications, setFetchingApplications] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const response = await getApplications({ limit: 1000 }, token);
        setApplications(response.data || []);
      } catch (err) {
        setError(err.message || 'Unable to load applications');
      } finally {
        setFetchingApplications(false);
      }
    };

    loadApplications();
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplicationChange = (event) => {
    const applicationId = event.target.value;
    const selectedApplication = applications.find((application) => application._id === applicationId);

    setFormData((prev) => ({
      ...prev,
      application: applicationId,
      companyName: selectedApplication ? selectedApplication.companyName : prev.companyName,
      jobTitle: selectedApplication ? selectedApplication.jobTitle : prev.jobTitle,
    }));
  };

  const validateForm = () => {
    const requiredFields = ['companyName', 'jobTitle', 'round', 'interviewType', 'date', 'startTime', 'status'];

    for (const field of requiredFields) {
      if (!formData[field] || String(formData[field]).trim() === '') {
        return 'Please complete all required interview fields.';
      }
    }

    if (formData.interviewerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.interviewerEmail)) {
      return 'Please provide a valid interviewer email.';
    }

    if (formData.meetingLink && !/^https?:\/\/.+/.test(formData.meetingLink)) {
      return 'Please provide a valid meeting link.';
    }

    if (formData.startTime && formData.endTime) {
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      if (endMinutes <= startMinutes) {
        return 'End time must be after the start time.';
      }
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const validationError = validateForm();
      if (validationError) {
        throw new Error(validationError);
      }

      await createInterview(formData, token);
      navigate('/interviews', { state: { successMessage: 'Interview scheduled successfully' } });
    } catch (err) {
      setError(err.message || 'Unable to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-shell">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">New Interview</p>
          <h1>Schedule Interview</h1>
          <p className="muted-text">Add the date, format, and preparation details for your interview.</p>
        </div>

        <Link to="/interviews" className="secondary-btn link-btn">
          Back to Interviews
        </Link>
      </div>

      <div className="card form-card">
        <form onSubmit={handleSubmit} className="application-form">
          <div className="form-grid">
            <label>
              Application
              <select value={formData.application} onChange={handleApplicationChange} className="form-select">
                <option value="">No linked application</option>
                {applications.map((application) => (
                  <option key={application._id} value={application._id}>
                    {application.companyName} — {application.jobTitle}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Company Name *
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required />
            </label>

            <label>
              Job Title *
              <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} required />
            </label>

            <label>
              Interview Round *
              <select name="round" value={formData.round} onChange={handleChange} required>
                <option value="HR">HR</option>
                <option value="Technical">Technical</option>
                <option value="Coding">Coding</option>
                <option value="Managerial">Managerial</option>
                <option value="System Design">System Design</option>
                <option value="Final Round">Final Round</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Interview Type *
              <select name="interviewType" value={formData.interviewType} onChange={handleChange} required>
                <option value="Online">Online</option>
                <option value="In-person">In-person</option>
                <option value="Phone">Phone</option>
                <option value="Video Call">Video Call</option>
              </select>
            </label>

            <label>
              Date *
              <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </label>

            <label>
              Start Time *
              <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
            </label>

            <label>
              End Time
              <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} />
            </label>

            <label>
              Interviewer Name
              <input type="text" name="interviewerName" value={formData.interviewerName} onChange={handleChange} />
            </label>

            <label>
              Interviewer Email
              <input type="email" name="interviewerEmail" value={formData.interviewerEmail} onChange={handleChange} />
            </label>

            <label>
              Meeting Link
              <input type="url" name="meetingLink" value={formData.meetingLink} onChange={handleChange} />
            </label>

            <label>
              Location
              <input type="text" name="location" value={formData.location} onChange={handleChange} />
            </label>

            <label>
              Status
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>

            <label className="full-width">
              Preparation Notes
              <textarea name="preparationNotes" value={formData.preparationNotes} onChange={handleChange} rows="4" />
            </label>

            <label className="full-width">
              Feedback
              <textarea name="feedback" value={formData.feedback} onChange={handleChange} rows="4" />
            </label>
          </div>

          {error && <div className="error-banner" role="alert">{error}</div>}

          <div className="form-actions">
            <Link to="/interviews" className="secondary-btn link-btn">
              Cancel
            </Link>
            <button type="submit" className="primary-btn" disabled={loading || fetchingApplications}>
              {loading ? 'Scheduling...' : 'Save Interview'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AddInterview;
