import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/useAuth';
import { deleteApplication, getApplicationById } from '../services/api';
import { formatDateOnly } from '../utils/date';
import { updateFollowUpStatus } from '../services/api';
import { getFollowUpTiming } from '../utils/followUps';

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplication = useCallback(async () => {
    try {
      const response = await getApplicationById(id, token);
      setApplication(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    const timeoutId = setTimeout(fetchApplication, 0);
    return () => clearTimeout(timeoutId);
  }, [fetchApplication]);

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this application?\n\nThis action cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteApplication(id, token);
      navigate('/applications');
    } catch (err) {
      setError(err.message || 'Unable to delete application');
    }
  };

  const handleFollowUpStatus = async () => {
    const nextStatus = application.followUpStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      const response = await updateFollowUpStatus(id, nextStatus, token);
      setApplication(response.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to update follow-up status');
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return formatDateOnly(value);
  };

  if (loading) {
    return (
      <div className="page-shell">
        <PageLoadingSkeleton label="Loading application details" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="page-shell">
        <div className="card empty-state">
          <h3>Application not found</h3>
          <p>{error || 'This application may not exist or you may not have access to it.'}</p>
          <Link to="/applications" className="primary-btn link-btn">
            Back to Applications
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
          <p className="eyebrow">Application</p>
          <h1>{application.companyName}</h1>
        </div>

        <div className="header-actions">
          <Link to="/applications" className="secondary-btn link-btn">
            Back to Applications
          </Link>
          <Link to={`/applications/${application._id}/edit`} className="primary-btn link-btn">
            Edit Application
          </Link>
          <button type="button" className="danger-btn" onClick={handleDelete}>
            Delete Application
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card detail-card">
          <h3>Company Information</h3>
          <div className="detail-list">
            <div><span>Company</span><strong>{application.companyName}</strong></div>
            <div><span>Job Title</span><strong>{application.jobTitle}</strong></div>
            <div><span>Location</span><strong>{application.location || '—'}</strong></div>
            <div><span>Work Mode</span><strong>{application.workMode || '—'}</strong></div>
            <div><span>Job Type</span><strong>{application.jobType}</strong></div>
          </div>
        </div>

        <div className="card detail-card">
          <h3>Application Information</h3>
          <div className="detail-list">
            <div><span>Status</span><StatusBadge status={application.status} /></div>
            <div><span>Application Date</span><strong>{formatDate(application.applicationDate)}</strong></div>
            <div><span>Salary</span><strong>{application.salary || '—'}</strong></div>
            <div><span>Follow-up Date</span><strong>{formatDate(application.followUpDate)}</strong></div>
            {application.followUpDate && <div><span>Follow-up Status</span><strong>{application.followUpStatus === 'Completed' ? 'Completed' : `Pending · ${getFollowUpTiming(application).label}`}</strong></div>}
          </div>
          {application.followUpDate && <button type="button" className="secondary-btn follow-up-detail-button" onClick={handleFollowUpStatus}>{application.followUpStatus === 'Completed' ? 'Mark Pending' : 'Mark Complete'}</button>}
        </div>

        <div className="card detail-card">
          <h3>Recruiter</h3>
          <div className="detail-list">
            <div><span>Recruiter Name</span><strong>{application.recruiterName || '—'}</strong></div>
            <div><span>Recruiter Email</span><strong>{application.recruiterEmail || '—'}</strong></div>
          </div>
        </div>

        <div className="card detail-card wide-card">
          <h3>Job Details</h3>
          <div className="detail-list">
            <div>
              <span>Job URL</span>
              {application.jobUrl ? (
                <a href={application.jobUrl} target="_blank" rel="noreferrer" className="text-link">
                  Open job posting
                </a>
              ) : (
                <strong>—</strong>
              )}
            </div>
          </div>
        </div>

        <div className="card detail-card wide-card">
          <h3>Notes</h3>
          <p className="notes-box">{application.notes || 'No notes added yet.'}</p>
        </div>
      </div>
    </section>
  );
};

export default ApplicationDetails;
