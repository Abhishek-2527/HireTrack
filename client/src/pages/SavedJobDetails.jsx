import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import { useAuth } from '../context/useAuth';
import { deleteSavedJob, getSavedJobById } from '../services/api';
import { convertSavedJobToApplication } from '../services/savedJobService';
import { daysFromToday, formatDateOnly } from '../utils/date';
import { getSafeHttpUrl } from '../utils/safeUrl';

const getDeadlineStatus = (deadline) => {
  if (!deadline) return { label: 'No deadline', tone: 'saved' };

  const daysRemaining = daysFromToday(deadline);
  if (daysRemaining === null) return { label: 'Invalid deadline', tone: 'rejected' };
  if (daysRemaining < 0) return { label: 'Expired', tone: 'rejected' };
  if (daysRemaining === 0) return { label: 'Due today', tone: 'screening' };
  if (daysRemaining === 1) return { label: 'Due tomorrow', tone: 'screening' };
  return { label: `Due in ${daysRemaining} days`, tone: daysRemaining <= 7 ? 'screening' : 'saved' };
};

const getSavedJobErrorMessage = (error, fallback) => {
  const message = error?.message?.trim();
  const normalizedMessage = message?.toLowerCase() || '';

  if (normalizedMessage.includes('authentication') || normalizedMessage.includes('unauthorized')) {
    return 'Please log in again.';
  }
  if (normalizedMessage.includes('not found')) return 'Saved job not found.';
  if (normalizedMessage.includes('already') && normalizedMessage.includes('converted')) {
    return 'This saved job has already been converted to an application.';
  }

  return message || fallback;
};

const SavedJobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [savedJob, setSavedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadSavedJob = useCallback(async () => {
    setLoading(true);
    setError('');

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      setSavedJob(null);
      setError('Invalid saved job ID.');
      setLoading(false);
      return;
    }

    try {
      const response = await getSavedJobById(id, token);
      setSavedJob(response.data);
    } catch (loadError) {
      setSavedJob(null);
      setError(getSavedJobErrorMessage(loadError, 'Unable to load saved job.'));
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    const timeoutId = setTimeout(loadSavedJob, 0);
    return () => clearTimeout(timeoutId);
  }, [loadSavedJob]);

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this saved job? It will be permanently removed.');
    if (!confirmed || deleting) return;

    setDeleting(true);
    setError('');

    try {
      await deleteSavedJob(id, token);
      navigate('/saved-jobs', { state: { successMessage: 'Saved job deleted successfully.' } });
    } catch (deleteError) {
      setError(getSavedJobErrorMessage(deleteError, 'Unable to delete saved job.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleConvert = async () => {
    if (!savedJob || savedJob.isConverted || converting) return;

    const confirmed = window.confirm(
      'Convert this saved job into an application?\n\nThe new application will initially have status Saved.'
    );
    if (!confirmed) return;

    setConverting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await convertSavedJobToApplication(id);
      const application = response.data?.application;

      if (!application?._id) {
        throw new Error('Conversion completed, but the application ID was not returned.');
      }

      setSavedJob((currentJob) => ({
        ...currentJob,
        isConverted: true,
        convertedApplicationId: application._id,
      }));
      setSuccessMessage('Saved job converted to application successfully.');
    } catch (conversionError) {
      const nextError = getSavedJobErrorMessage(conversionError, 'Unable to convert saved job.');
      setError(nextError);

      if (nextError === 'This saved job has already been converted to an application.') {
        try {
          const latestJob = await getSavedJobById(id, token);
          setSavedJob(latestJob.data);
        } catch {
          // Keep the conflict message visible if the latest state cannot be fetched.
        }
      }
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <PageLoadingSkeleton label="Loading saved job details" />
      </div>
    );
  }

  if (error && !savedJob) {
    return (
      <div className="page-shell">
        <div className="card empty-state">
          <h3>Saved job unavailable</h3>
          <p role="alert">{error}</p>
          <Link to="/saved-jobs" className="primary-btn link-btn">Back to Saved Jobs</Link>
        </div>
      </div>
    );
  }

  if (!savedJob) return null;

  const deadlineStatus = getDeadlineStatus(savedJob.deadline);
  const safeJobUrl = getSafeHttpUrl(savedJob.jobUrl);
  const savedDate = savedJob.createdAt
    ? formatDateOnly(savedJob.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  const openJobPosting = () => {
    if (!safeJobUrl) return;
    window.open(safeJobUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="page-shell">
      {successMessage && <div className="toast success-toast" role="status" aria-live="polite">{successMessage}</div>}

      <div className="page-header-row">
        <div>
          <p className="eyebrow">Saved Job</p>
          <h1>{savedJob.companyName}</h1>
          <p className="muted-text">{savedJob.jobTitle}</p>
        </div>
        <div className="header-actions">
          <Link to="/saved-jobs" className="secondary-btn link-btn">Back to Saved Jobs</Link>
          <Link to={`/saved-jobs/${id}/edit`} className="primary-btn link-btn">Edit Job</Link>
          <button type="button" className="danger-btn" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="detail-grid">
        <div className="card detail-card">
          <h3>Job Details</h3>
          <div className="detail-list">
            <div><span>Company</span><strong>{savedJob.companyName}</strong></div>
            <div><span>Job Title</span><strong>{savedJob.jobTitle}</strong></div>
            <div><span>Job Type</span><strong>{savedJob.jobType || '—'}</strong></div>
            <div><span>Work Mode</span><strong>{savedJob.workMode || '—'}</strong></div>
            <div><span>Location</span><strong>{savedJob.location || '—'}</strong></div>
            <div><span>Source</span><strong>{savedJob.source || '—'}</strong></div>
            <div><span>Salary</span><strong>{savedJob.salary || '—'}</strong></div>
            <div className="saved-job-deadline-row">
              <span>Application Deadline</span>
              <strong>{formatDateOnly(savedJob.deadline, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              <span className={`status-badge ${deadlineStatus.tone}`}>{deadlineStatus.label}</span>
            </div>
            <div><span>Saved Date</span><strong>{savedDate}</strong></div>
            <div>
              <span>Conversion Status</span>
              <span className={`status-badge ${savedJob.isConverted ? 'completed' : 'scheduled'}`}>
                {savedJob.isConverted ? 'Converted to Application' : 'Not Converted'}
              </span>
            </div>
          </div>
        </div>

        <div className="card detail-card">
          <h3>Job Posting</h3>
          {safeJobUrl ? (
            <button type="button" className="primary-btn" onClick={openJobPosting}>View Job</button>
          ) : (
            <p className="muted-text">
              {savedJob.jobUrl ? 'The saved URL is not a safe HTTP or HTTPS link.' : 'No job URL saved.'}
            </p>
          )}
        </div>

        <div className="card detail-card wide-card">
          <h3>Application Conversion</h3>
          {savedJob.isConverted ? (
            <div className="saved-job-conversion-state">
              <span className="status-badge completed">Converted to Application</span>
              {savedJob.convertedApplicationId ? (
                <Link to={`/applications/${savedJob.convertedApplicationId}`} className="primary-btn link-btn">
                  View Application
                </Link>
              ) : (
                <p className="muted-text">This saved job was converted, but its application could not be found.</p>
              )}
            </div>
          ) : (
            <div className="saved-job-conversion-state">
              <p className="muted-text">The application will start with status Saved. You can update its status later.</p>
              <button type="button" className="primary-btn" onClick={handleConvert} disabled={converting}>
                {converting ? 'Converting...' : 'Convert to Application'}
              </button>
            </div>
          )}
        </div>

        <div className="card detail-card wide-card">
          <h3>Notes</h3>
          <p className="notes-box">{savedJob.notes || 'No notes added yet.'}</p>
        </div>
      </div>
    </section>
  );
};

export default SavedJobDetails;
