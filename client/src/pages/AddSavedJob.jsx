import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SavedJobForm from '../components/SavedJobForm';
import { useAuth } from '../context/useAuth';
import { createSavedJob } from '../services/api';

const AddSavedJob = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError('');

    try {
      await createSavedJob(payload, token);
      navigate('/saved-jobs', {
        state: { successMessage: 'Job saved successfully.' },
      });
    } catch (err) {
      const message = err.message || 'Unable to save job';
      if (message.toLowerCase().includes('already saved')) {
        setError('This job is already saved.');
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
      setLoading(false);
    }
  };

  return (
    <section className="page-shell">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">New Saved Job</p>
          <h1>Save a Job</h1>
          <p className="muted-text">Save an interesting opportunity and come back to it later.</p>
        </div>

        <Link to="/saved-jobs" className="secondary-btn link-btn">
          ← Back to Saved Jobs
        </Link>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <SavedJobForm onSubmit={handleSubmit} submitLabel="Save Job" loading={loading} mode="add" />
    </section>
  );
};

export default AddSavedJob;
