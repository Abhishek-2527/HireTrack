import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import { useAuth } from '../context/useAuth';
import { getApplicationById, updateApplication } from '../services/api';
import { toDateInputValue } from '../utils/date';

const emptyForm = {
  companyName: '',
  jobTitle: '',
  jobType: 'Full-time',
  location: '',
  workMode: 'Remote',
  applicationDate: '',
  status: 'Saved',
  salary: '',
  jobUrl: '',
  recruiterName: '',
  recruiterEmail: '',
  followUpDate: '',
  notes: '',
};

const EditApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await getApplicationById(id, token);
        const app = response.data;
        setFormData({
          companyName: app.companyName || '',
          jobTitle: app.jobTitle || '',
          jobType: app.jobType || 'Full-time',
          location: app.location || '',
          workMode: app.workMode || 'Remote',
          applicationDate: toDateInputValue(app.applicationDate),
          status: app.status || 'Saved',
          salary: app.salary || '',
          jobUrl: app.jobUrl || '',
          recruiterName: app.recruiterName || '',
          recruiterEmail: app.recruiterEmail || '',
          followUpDate: toDateInputValue(app.followUpDate),
          notes: app.notes || '',
        });
      } catch (err) {
        setError(err.message || 'Unable to load application');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id, token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await updateApplication(id, formData, token);
      navigate(`/applications/${id}`);
      return response;
    } catch (err) {
      setError(err.message || 'Unable to update application');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <PageLoadingSkeleton label="Loading application form" />
      </div>
    );
  }

  return (
    <section className="page-shell">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Update</p>
          <h1>Edit Application</h1>
          <p className="muted-text">Update the details and follow-up date for this opportunity.</p>
        </div>

        <Link to={`/applications/${id}`} className="secondary-btn link-btn">
          Back to details
        </Link>
      </div>

      <div className="card form-card">
        <form onSubmit={handleSubmit} className="application-form">
          <div className="form-grid">
            <label>
              Company Name *
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required />
            </label>

            <label>
              Job Title *
              <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} required />
            </label>

            <label>
              Job Type *
              <select name="jobType" value={formData.jobType} onChange={handleChange}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Location
              <input type="text" name="location" value={formData.location} onChange={handleChange} />
            </label>

            <label>
              Work Mode
              <select name="workMode" value={formData.workMode} onChange={handleChange}>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </label>

            <label>
              Application Date *
              <input type="date" name="applicationDate" value={formData.applicationDate} onChange={handleChange} required />
            </label>

            <label>
              Status
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Saved">Saved</option>
                <option value="Applied">Applied</option>
                <option value="Screening">Screening</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            </label>

            <label>
              Salary
              <input type="text" name="salary" value={formData.salary} onChange={handleChange} />
            </label>

            <label>
              Job URL
              <input type="url" name="jobUrl" value={formData.jobUrl} onChange={handleChange} />
            </label>

            <label>
              Recruiter Name
              <input type="text" name="recruiterName" value={formData.recruiterName} onChange={handleChange} />
            </label>

            <label>
              Recruiter Email
              <input type="email" name="recruiterEmail" value={formData.recruiterEmail} onChange={handleChange} />
            </label>

            <label>
              Follow-up Date
              <input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleChange} />
              <small className="field-help">Set a date to remind yourself to follow up with the recruiter.</small>
            </label>

            <label className="full-width">
              Notes
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="5" />
            </label>
          </div>

          {error && <div className="error-banner" role="alert">{error}</div>}

          <div className="form-actions">
            <Link to={`/applications/${id}`} className="secondary-btn link-btn">
              Cancel
            </Link>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Saving changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default EditApplication;
