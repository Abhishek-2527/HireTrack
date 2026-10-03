import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const defaultValues = {
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

const sourceSuggestions = ['LinkedIn', 'Naukri', 'Indeed', 'Company Website', 'Referral', 'Other'];

const normalizeValue = (value) => (typeof value === 'string' ? value.trim() : '');

const validateUrl = (value) => {
  if (!value) return '';

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'Job URL must use http:// or https://.';
    }
  } catch {
    return 'Please provide a valid job URL.';
  }

  return '';
};

const SavedJobFormFields = ({
  initialValues = defaultValues,
  onSubmit,
  submitLabel = 'Save Job',
  loading = false,
  mode = 'add',
}) => {
  const [formData, setFormData] = useState({ ...defaultValues, ...initialValues });
  const [errors, setErrors] = useState({});

  const openJobLink = useMemo(() => {
    if (!formData.jobUrl) return null;
    const cleanUrl = formData.jobUrl.trim();
    if (!cleanUrl) return null;

    try {
      const parsed = new URL(cleanUrl);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
    } catch {
      return null;
    }
  }, [formData.jobUrl]);

  const validateForm = () => {
    const nextErrors = {};

    if (!normalizeValue(formData.companyName)) {
      nextErrors.companyName = 'Company name is required.';
    }

    if (!normalizeValue(formData.jobTitle)) {
      nextErrors.jobTitle = 'Job title is required.';
    }

    const jobUrlError = validateUrl(formData.jobUrl);
    if (jobUrlError) {
      nextErrors.jobUrl = jobUrlError;
    }

    if (formData.deadline) {
      const parsed = new Date(formData.deadline);
      if (Number.isNaN(parsed.getTime())) {
        nextErrors.deadline = 'Please provide a valid deadline date.';
      }
    }

    if (formData.jobType && !['Full-time', 'Part-time', 'Internship', 'Contract', 'Temporary', 'Other'].includes(formData.jobType)) {
      nextErrors.jobType = 'Please select a valid job type.';
    }

    if (formData.workMode && !['Remote', 'Hybrid', 'On-site'].includes(formData.workMode)) {
      nextErrors.workMode = 'Please select a valid work mode.';
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      companyName: normalizeValue(formData.companyName),
      jobTitle: normalizeValue(formData.jobTitle),
      location: normalizeValue(formData.location),
      jobType: normalizeValue(formData.jobType),
      workMode: normalizeValue(formData.workMode),
      jobUrl: normalizeValue(formData.jobUrl),
      salary: normalizeValue(formData.salary),
      deadline: formData.deadline || '',
      source: normalizeValue(formData.source),
      notes: normalizeValue(formData.notes),
    };

    await onSubmit(payload);
  };

  return (
    <div className="card form-card">
      <form onSubmit={handleSubmit} className="application-form">
        <div className="form-grid">
          <label>
            Company Name *
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="e.g. Google"
              className={errors.companyName ? 'input-error' : ''}
              aria-invalid={Boolean(errors.companyName)}
              aria-describedby={errors.companyName ? 'saved-job-company-error' : undefined}
            />
            {errors.companyName && <span id="saved-job-company-error" className="form-error" role="alert">{errors.companyName}</span>}
          </label>

          <label>
            Job Title *
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="e.g. Software Engineer"
              className={errors.jobTitle ? 'input-error' : ''}
              aria-invalid={Boolean(errors.jobTitle)}
              aria-describedby={errors.jobTitle ? 'saved-job-title-error' : undefined}
            />
            {errors.jobTitle && <span id="saved-job-title-error" className="form-error" role="alert">{errors.jobTitle}</span>}
          </label>

          <label>
            Location
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Bangalore, India"
            />
          </label>

          <label>
            Job Type
            <select name="jobType" value={formData.jobType} onChange={handleChange} className={errors.jobType ? 'input-error' : ''} aria-invalid={Boolean(errors.jobType)} aria-describedby={errors.jobType ? 'saved-job-type-error' : undefined}>
              <option value="">Select job type</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
              <option value="Temporary">Temporary</option>
              <option value="Other">Other</option>
            </select>
            {errors.jobType && <span id="saved-job-type-error" className="form-error" role="alert">{errors.jobType}</span>}
          </label>

          <label>
            Work Mode
            <select name="workMode" value={formData.workMode} onChange={handleChange} className={errors.workMode ? 'input-error' : ''} aria-invalid={Boolean(errors.workMode)} aria-describedby={errors.workMode ? 'saved-job-work-mode-error' : undefined}>
              <option value="">Select work mode</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
            {errors.workMode && <span id="saved-job-work-mode-error" className="form-error" role="alert">{errors.workMode}</span>}
          </label>

          <label>
            Job URL
            <input
              type="url"
              name="jobUrl"
              value={formData.jobUrl}
              onChange={handleChange}
              placeholder="https://example.com/job"
              className={errors.jobUrl ? 'input-error' : ''}
              aria-invalid={Boolean(errors.jobUrl)}
              aria-describedby={errors.jobUrl ? 'saved-job-url-error' : undefined}
            />
            {errors.jobUrl && <span id="saved-job-url-error" className="form-error" role="alert">{errors.jobUrl}</span>}
            {openJobLink && (
              <a href={openJobLink} target="_blank" rel="noreferrer" className="text-link">
                Open job link ↗
              </a>
            )}
          </label>

          <label>
            Salary
            <input type="text" name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g. ₹8–12 LPA" />
          </label>

          <label>
            Application Deadline
            <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className={errors.deadline ? 'input-error' : ''} aria-invalid={Boolean(errors.deadline)} aria-describedby={errors.deadline ? 'saved-job-deadline-error' : undefined} />
            {errors.deadline && <span id="saved-job-deadline-error" className="form-error" role="alert">{errors.deadline}</span>}
          </label>

          <label className="full-width">
            Source
            <input
              list="saved-job-source-list"
              type="text"
              name="source"
              value={formData.source}
              onChange={handleChange}
              placeholder="LinkedIn, Naukri, Referral..."
            />
            <datalist id="saved-job-source-list">
              {sourceSuggestions.map((source) => (
                <option key={source} value={source} />
              ))}
            </datalist>
          </label>

          <label className="full-width">
            Notes
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="5" placeholder="Add useful notes about this opportunity..." />
          </label>
        </div>

        <div className="form-actions">
          <Link to="/saved-jobs" className="secondary-btn link-btn">
            Cancel
          </Link>
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? (mode === 'edit' ? 'Saving Changes...' : 'Saving...') : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

const SavedJobForm = (props) => (
  <SavedJobFormFields
    key={JSON.stringify(props.initialValues || defaultValues)}
    {...props}
  />
);

export default SavedJobForm;
