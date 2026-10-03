import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import SavedJobForm from '../components/SavedJobForm';
import { useAuth } from '../context/useAuth';
import { getSavedJobById, updateSavedJob } from '../services/api';
import { toDateInputValue } from '../utils/date';

const emptyForm = {
  companyName: '',
  jobTitle: '',
  location: '',
  jobType: '',
  workMode: '',
  jobUrl: '',
  salary: '',
  deadline: '',
  source: '',
  notes: '',
};

const EditSavedJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSavedJob = async () => {
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        setError('Invalid saved job.');
        setLoading(false);
        return;
      }

      try {
        const response = await getSavedJobById(id, token);
        const job = response.data || {};
        setFormData({
          companyName: job.companyName || '',
          jobTitle: job.jobTitle || '',
          location: job.location || '',
          jobType: job.jobType || '',
          workMode: job.workMode || '',
          jobUrl: job.jobUrl || '',
          salary: job.salary || '',
          deadline: toDateInputValue(job.deadline),
          source: job.source || '',
          notes: job.notes || '',
        });
      } catch (err) {
        const message = err.message || 'Unable to load saved job';
        if (message.toLowerCase().includes('not found')) {
          setError('Saved job not found. This job may have been deleted or may no longer be available.');
        } else if (message.toLowerCase().includes('invalid')) {
          setError('Invalid saved job.');
        } else if (message.toLowerCase().includes('authentication')) {
          setError('Authentication required. Please log in again.');
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSavedJob();
  }, [id, token]);

  const handleSubmit = async (payload) => {
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      setError('Invalid saved job.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateSavedJob(id, payload, token);
      navigate('/saved-jobs', {
        state: { successMessage: 'Saved job updated successfully.' },
      });
    } catch (err) {
      const message = err.message || 'Unable to save job';
      if (message.toLowerCase().includes('already saved')) {
        setError('This job is already saved.');
        return;
      }

      if (message.toLowerCase().includes('not found')) {
        setError('Saved job not found.');
        return;
      }

      if (message.toLowerCase().includes('authentication')) {
        setError('Authentication required. Please log in again.');
        return;
      }

      if (message.toLowerCase().includes('network') || message.toLowerCase().includes('failed to fetch')) {
        setError('Unable to connect to the server. Please try again.');
        return;
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <PageLoadingSkeleton label="Loading saved job form" />
      </div>
    );
  }

  if (error && (!formData.companyName && !formData.jobTitle) && !loading) {
    return (
      <div className="page-shell">
        <div className="card empty-state">
          <h3>{error.includes('not found') ? 'Saved job not found.' : 'Saved job unavailable'}</h3>
          <p>
            {error.includes('not found')
              ? 'This job may have been deleted or may no longer be available.'
              : 'There was a problem loading this saved job.'}
          </p>
          <Link to="/saved-jobs" className="primary-btn link-btn">
            Back to Saved Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="page-shell">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Edit Saved Job</p>
          <h1>Edit Saved Job</h1>
          <p className="muted-text">Update the details of this saved opportunity.</p>
        </div>

        <Link to="/saved-jobs" className="secondary-btn link-btn">
          ← Back to Saved Jobs
        </Link>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <SavedJobForm
        initialValues={formData}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        loading={saving}
        mode="edit"
      />
    </section>
  );
};

export default EditSavedJob;
