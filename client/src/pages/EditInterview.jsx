import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import { useAuth } from '../context/useAuth';
import { getApplications, getInterviewById, updateInterview } from '../services/api';
import { toDateInputValue } from '../utils/date';

const EditInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
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
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [interviewResponse, applicationsResponse] = await Promise.all([
          getInterviewById(id, token),
          getApplications({ limit: 1000 }, token),
        ]);

        const interview = interviewResponse.data || {};
        setFormData({
          companyName: interview.companyName || '',
          jobTitle: interview.jobTitle || '',
          application: interview.application?._id || interview.application || '',
          round: interview.round || 'Technical',
          interviewType: interview.interviewType || 'Online',
          date: toDateInputValue(interview.date),
          startTime: interview.startTime || '',
          endTime: interview.endTime || '',
          interviewerName: interview.interviewerName || '',
          interviewerEmail: interview.interviewerEmail || '',
          meetingLink: interview.meetingLink || '',
          location: interview.location || '',
          status: interview.status || 'Scheduled',
          preparationNotes: interview.preparationNotes || '',
          feedback: interview.feedback || '',
        });
        setApplications(applicationsResponse.data || []);
      } catch (err) {
        setError(err.message || 'Unable to load interview');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, token]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new Error('Invalid interview ID');
      }

      if (!formData.companyName || !formData.jobTitle || !formData.date || !formData.startTime) {
        throw new Error('Please complete all required fields.');
      }

      if (formData.interviewerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.interviewerEmail)) {
        throw new Error('Please provide a valid interviewer email.');
      }

      if (formData.meetingLink && !/^https?:\/\/.+/.test(formData.meetingLink)) {
        throw new Error('Please provide a valid meeting link.');
      }

      if (formData.endTime) {
        const [startHour, startMinute] = formData.startTime.split(':').map(Number);
        const [endHour, endMinute] = formData.endTime.split(':').map(Number);
        const startTotal = startHour * 60 + startMinute;
        const endTotal = endHour * 60 + endMinute;

        if (endTotal <= startTotal) {
          throw new Error('End time must be after the start time.');
        }
      }

      await updateInterview(id, formData, token);
      navigate(`/interviews/${id}`, { state: { successMessage: 'Interview updated successfully' } });
    } catch (err) {
      setError(err.message || 'Unable to save interview');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <PageLoadingSkeleton label="Loading interview form" />
      </div>
    );
  }

  return (
    <section className="page-shell">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Edit Interview</p>
          <h1>Update Interview Details</h1>
          <p className="muted-text">Keep the interview schedule and details up to date.</p>
        </div>

        <Link to={`/interviews/${id}`} className="secondary-btn link-btn">
          Cancel
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
            <Link to={`/interviews/${id}`} className="secondary-btn link-btn">
              Cancel
            </Link>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default EditInterview;
