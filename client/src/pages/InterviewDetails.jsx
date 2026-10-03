import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import InterviewStatusBadge from '../components/InterviewStatusBadge';
import { useAuth } from '../context/useAuth';
import { deleteInterview, getInterviewById } from '../services/api';
import { formatDateOnly } from '../utils/date';

const formatDate = (value) => {
  if (!value) return '—';
  return formatDateOnly(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (value) => {
  if (!value) return '—';
  const [hours, minutes] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const InterviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInterview = useCallback(async () => {
    try {
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new Error('Invalid interview ID');
      }

      const response = await getInterviewById(id, token);
      setInterview(response.data);
    } catch (err) {
      setError(err.message || 'Unable to load interview');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    const timeoutId = setTimeout(fetchInterview, 0);
    return () => clearTimeout(timeoutId);
  }, [fetchInterview]);

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this interview?');
    if (!confirmed) return;

    try {
      await deleteInterview(id, token);
      navigate('/interviews', { state: { successMessage: 'Interview deleted successfully' } });
    } catch (err) {
      setError(err.message || 'Unable to delete interview');
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <PageLoadingSkeleton label="Loading interview details" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="page-shell">
        <div className="card empty-state">
          <h3>Interview not found</h3>
          <p>{error || 'This interview may not exist or you may not have access to it.'}</p>
          <Link to="/interviews" className="primary-btn link-btn">
            Back to Interviews
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="page-shell">
      {location.state?.successMessage && <div className="toast success-toast" role="status" aria-live="polite">{location.state.successMessage}</div>}
      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="page-header-row">
        <div>
          <p className="eyebrow">Interview</p>
          <h1>{interview.companyName}</h1>
        </div>

        <div className="header-actions">
          <Link to="/interviews" className="secondary-btn link-btn">
            Back to Interviews
          </Link>
          <Link to={`/interviews/${interview._id}/edit`} className="primary-btn link-btn">
            Edit Interview
          </Link>
          <button type="button" className="danger-btn" onClick={handleDelete}>
            Delete Interview
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card detail-card">
          <h3>Interview Information</h3>
          <div className="detail-list">
            <div><span>Company</span><strong>{interview.companyName}</strong></div>
            <div><span>Job Title</span><strong>{interview.jobTitle}</strong></div>
            <div><span>Round</span><strong>{interview.round}</strong></div>
            <div><span>Type</span><strong>{interview.interviewType}</strong></div>
            <div><span>Date</span><strong>{formatDate(interview.date)}</strong></div>
            <div><span>Time</span><strong>{`${formatTime(interview.startTime)}${interview.endTime ? ` - ${formatTime(interview.endTime)}` : ''}`}</strong></div>
            <div><span>Status</span><InterviewStatusBadge status={interview.status} /></div>
          </div>
        </div>

        <div className="card detail-card">
          <h3>Interviewer</h3>
          <div className="detail-list">
            <div><span>Name</span><strong>{interview.interviewerName || '—'}</strong></div>
            <div><span>Email</span><strong>{interview.interviewerEmail || '—'}</strong></div>
          </div>
        </div>

        <div className="card detail-card">
          <h3>Meeting</h3>
          <div className="detail-list">
            <div>
              <span>Meeting Link</span>
              {interview.meetingLink ? (
                <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="text-link">
                  Join Interview
                </a>
              ) : (
                <strong>—</strong>
              )}
            </div>
            <div><span>Location</span><strong>{interview.location || '—'}</strong></div>
          </div>
        </div>

        <div className="card detail-card wide-card">
          <h3>Preparation</h3>
          <p className="notes-box">{interview.preparationNotes || 'No preparation notes yet.'}</p>
        </div>

        <div className="card detail-card wide-card">
          <h3>Feedback</h3>
          <p className="notes-box">{interview.feedback || 'No feedback added yet.'}</p>
        </div>

        <div className="card detail-card wide-card">
          <h3>Application</h3>
          {interview.application ? (
            <div className="detail-list">
              <div><span>Linked Application</span><strong>{interview.application.companyName || interview.companyName}</strong></div>
              <div><span>Role</span><strong>{interview.application.jobTitle || interview.jobTitle}</strong></div>
              <div>
                <span>Action</span>
                <Link to={`/applications/${interview.application._id || interview.application}`} className="primary-btn link-btn">
                  View Application
                </Link>
              </div>
            </div>
          ) : (
            <p className="notes-box">No application linked.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default InterviewDetails;
