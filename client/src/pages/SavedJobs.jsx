import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getSavedJobStats, getSavedJobs } from '../services/api';
import { daysFromToday, formatDateOnly } from '../utils/date';
import { getSafeHttpUrl } from '../utils/safeUrl';

const SOURCE_SUGGESTIONS = ['LinkedIn', 'Naukri', 'Indeed', 'Company Website', 'Referral', 'Other'];

const defaultFilters = {
  jobType: '',
  workMode: '',
  source: '',
  isConverted: '',
};

const formatDate = (value) => {
  if (!value) return '—';
  return formatDateOnly(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatSavedDate = (value) => {
  if (!value) return '—';
  return formatDateOnly(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDeadlineStatus = (deadline) => {
  if (!deadline) return { label: 'No deadline', tone: 'neutral' };

  const diffDays = daysFromToday(deadline);
  if (diffDays === null) return { label: 'Invalid deadline', tone: 'danger' };

  if (diffDays < 0) return { label: 'Expired', tone: 'danger' };
  if (diffDays === 0) return { label: 'Due today', tone: 'warning' };
  if (diffDays === 1) return { label: 'Due tomorrow', tone: 'warning' };
  if (diffDays <= 7) return { label: `Due in ${diffDays} days`, tone: 'warning' };
  return { label: `Due in ${diffDays} days`, tone: 'neutral' };
};

const SavedJobs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    converted: 0,
    notConverted: 0,
    withDeadline: 0,
    expired: 0,
  });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(defaultFilters);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [statsReloadKey, setStatsReloadKey] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const queryParams = useMemo(
    () => ({
      search,
      jobType: filters.jobType,
      workMode: filters.workMode,
      source: filters.source,
      isConverted: filters.isConverted,
      sortBy,
      sortOrder,
      page,
      limit: 10,
    }),
    [search, filters, sortBy, sortOrder, page]
  );

  const toast = location.state?.successMessage || '';

  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      setStatsError('');
      try {
        const response = await getSavedJobStats(token);
        setStats(response.data || { total: 0, converted: 0, notConverted: 0, withDeadline: 0, expired: 0 });
        setStatsLoaded(true);
      } catch (err) {
        setStatsError(err.message || 'Unable to load saved job statistics.');
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [token, statsReloadKey]);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getSavedJobs(queryParams, token);
        setJobs(response.data || []);
        setPagination(response.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });

      } catch (err) {
        setError(err.message || 'Unable to load saved jobs');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [queryParams, token, reloadKey]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setFilters(defaultFilters);
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const startIndex = jobs.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endIndex = Math.min(startIndex + jobs.length - 1, pagination.total);
  const hasActiveFilters = Boolean(search || Object.values(filters).some(Boolean));

  return (
    <section className="page-shell core-page saved-jobs-page">
      {toast && <div className="toast success-toast" role="status" aria-live="polite">{toast}</div>}

      <div className="page-header-row">
        <div>
          <p className="eyebrow">YOUR OPPORTUNITY LIBRARY</p>
          <h1>Saved Opportunities</h1>
          <p className="muted-text">Keep interesting roles organized until you're ready to apply.</p>
        </div>

        <button type="button" className="primary-btn" onClick={() => navigate('/saved-jobs/new')}>
          + Save Job
        </button>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <span className="eyebrow">Total Saved</span>
          <strong>{statsLoading ? <span className="skeleton interview-stat-skeleton" /> : statsLoaded ? stats.total : '—'}</strong>
        </div>
        <div className="card stat-card">
          <span className="eyebrow">Not Converted</span>
          <strong>{statsLoading ? <span className="skeleton interview-stat-skeleton" /> : statsLoaded ? stats.notConverted : '—'}</strong>
        </div>
        <div className="card stat-card">
          <span className="eyebrow">Converted</span>
          <strong>{statsLoading ? <span className="skeleton interview-stat-skeleton" /> : statsLoaded ? stats.converted : '—'}</strong>
        </div>
        <div className="card stat-card">
          <span className="eyebrow">With Deadline</span>
          <strong>{statsLoading ? <span className="skeleton interview-stat-skeleton" /> : statsLoaded ? stats.withDeadline : '—'}</strong>
        </div>
        <div className="card stat-card">
          <span className="eyebrow">Expired</span>
          <strong>{statsLoading ? <span className="skeleton interview-stat-skeleton" /> : statsLoaded ? stats.expired : '—'}</strong>
        </div>
      </div>

      <div className="card filter-panel">
        <div className="filter-grid">
          <input
            type="text"
            aria-label="Search saved jobs"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search saved jobs..."
            className="form-input"
          />

          <select name="jobType" value={filters.jobType} onChange={handleFilterChange} className="form-select">
            <option value="">All job types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
            <option value="Temporary">Temporary</option>
            <option value="Other">Other</option>
          </select>

          <select name="workMode" value={filters.workMode} onChange={handleFilterChange} className="form-select">
            <option value="">All work modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          <input
            name="source"
            aria-label="Filter by source"
            value={filters.source}
            onChange={handleFilterChange}
            list="saved-job-filter-sources"
            placeholder="Filter by source"
            className="form-input"
          />
          <datalist id="saved-job-filter-sources">
            {SOURCE_SUGGESTIONS.map((source) => <option key={source} value={source} />)}
          </datalist>

          <select name="isConverted" value={filters.isConverted} onChange={handleFilterChange} className="form-select">
            <option value="">All</option>
            <option value="false">Not Converted</option>
            <option value="true">Converted</option>
          </select>

          <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} className="form-select">
            <option value="createdAt">Newest First</option>
            <option value="companyName">Company Name</option>
            <option value="jobTitle">Job Title</option>
            <option value="deadline">Deadline</option>
          </select>

          <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setPage(1); }} className="form-select">
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <button type="button" className="secondary-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="error-banner" role="alert">{error}<button type="button" className="text-link" onClick={() => setReloadKey((value) => value + 1)}>Retry</button></div>}
      {statsError && <div className="error-banner" role="alert">{statsError}<button type="button" className="text-link" onClick={() => setStatsReloadKey((value) => value + 1)}>Retry</button></div>}

      {loading ? (
        <div className="saved-job-skeleton-grid" aria-label="Loading saved opportunities" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => <div className="saved-job-skeleton-card" key={index}><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div>)}
        </div>
      ) : error && jobs.length === 0 ? null : jobs.length === 0 ? (
        <div className="card empty-state search-empty-state">
          <span className="empty-search-icon" aria-hidden="true">☆</span>
          <h3>{hasActiveFilters ? 'No saved opportunities match' : 'No saved opportunities yet'}</h3>
          <p>{hasActiveFilters ? 'Try adjusting your search or filters.' : 'Save roles you want to explore later.'}</p>
          {hasActiveFilters ? <button type="button" className="secondary-btn" onClick={clearFilters}>Clear Filters</button> : <button type="button" className="primary-btn" onClick={() => navigate('/saved-jobs/new')}>+ Save Your First Job</button>}
        </div>
      ) : (
        <>
          <div className="list-meta">
            <span>
              Showing {startIndex}-{endIndex} of {pagination.total} saved jobs
            </span>
          </div>

          <div className="interview-grid">
            {jobs.map((job) => {
              const deadlineStatus = getDeadlineStatus(job.deadline);
              const safeJobUrl = getSafeHttpUrl(job.jobUrl);

              return (
                <article key={job._id} className="card interview-card">
                  <div className="interview-card-header">
                    <div>
                    <p className="eyebrow small-eyebrow">{job.companyName}</p>
                      <h3>{job.jobTitle}</h3>
                    </div>
                    <span className={job.isConverted ? 'status-badge completed' : 'status-badge scheduled'}>
                      {job.isConverted ? 'Converted' : 'Not Converted'}
                    </span>
                  </div>

                  <div className="interview-card-body">
                    <div className="mini-row">
                      <span>Location</span>
                      <strong>{job.location || 'Location not specified'}</strong>
                    </div>
                    <div className="mini-row">
                      <span>Job Type</span>
                      <strong>{job.jobType || '—'}</strong>
                    </div>
                    <div className="mini-row">
                      <span>Work Mode</span>
                      <strong>{job.workMode || '—'}</strong>
                    </div>
                    <div className="mini-row">
                      <span>Source</span>
                      <strong>{job.source || '—'}</strong>
                    </div>
                    <div className="mini-row">
                      <span>Salary</span>
                      <strong>{job.salary || '—'}</strong>
                    </div>
                    <div className={`mini-row saved-deadline-row ${deadlineStatus.tone}`}>
                      <span>Deadline</span>
                      <strong>{job.deadline ? `${formatDate(job.deadline)} • ${deadlineStatus.label}` : 'No deadline'}</strong>
                    </div>
                    <div className="mini-row">
                      <span>Saved</span>
                      <strong>{formatSavedDate(job.createdAt)}</strong>
                    </div>
                  </div>

                  <div className="interview-actions">
                    {safeJobUrl && (
                      <a href={safeJobUrl} target="_blank" rel="noopener noreferrer" className="primary-btn link-btn small-btn">
                        View Job
                      </a>
                    )}
                    <button type="button" className="secondary-btn small-btn" onClick={() => navigate(`/saved-jobs/${job._id}`)}>
                      Details
                    </button>
                    <button type="button" className="secondary-btn small-btn" onClick={() => navigate(`/saved-jobs/${job._id}/edit`)}>
                      Edit
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="pagination-bar">
            <button
              type="button"
              className="secondary-btn"
              disabled={pagination.page <= 1}
              onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
            >
              Previous
            </button>

            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              className="secondary-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default SavedJobs;
