import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/useAuth';
import { getApplications } from '../services/api';
import { formatDateOnly } from '../utils/date';
import { getFollowUpTiming } from '../utils/followUps';

const initialFilters = {
  status: '',
  jobType: '',
  workMode: '',
};

const Applications = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState('applicationDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalApplications: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    pageLimit: 10,
  });

  const queryParams = useMemo(
    () => ({
      search,
      status: filters.status,
      jobType: filters.jobType,
      workMode: filters.workMode,
      sortBy,
      sortOrder,
      page,
      limit: 10,
    }),
    [search, filters, sortBy, sortOrder, page]
  );

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getApplications(queryParams, token);
        setApplications(response.data || []);
        setPagination(response.pagination || {});
      } catch (err) {
        setError(err.message || 'Unable to load applications');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [queryParams, token, reloadKey]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setSearch('');
    setSortBy('applicationDate');
    setSortOrder('desc');
    setPage(1);
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return formatDateOnly(value);
  };

  const startIndex = applications.length > 0 ? (pagination.currentPage - 1) * pagination.pageLimit + 1 : 0;
  const endIndex = Math.min(startIndex + applications.length - 1, pagination.totalApplications);
  const hasActiveFilters = Boolean(search || Object.values(filters).some(Boolean));

  return (
    <section className="page-shell core-page applications-page">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">YOUR PIPELINE</p>
          <h1>Applications</h1>
          <p className="muted-text">Track every opportunity from application to offer.</p>
        </div>

        <button type="button" className="primary-btn" onClick={() => navigate('/applications/new')}>
          + Add Application
        </button>
      </div>

      <div className="card filter-panel">
        <div className="filter-grid">
          <input
            type="text"
            aria-label="Search applications"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search by company or job title"
            className="form-input"
          />

          <select name="status" value={filters.status} onChange={handleFilterChange} className="form-select">
            <option value="">All statuses</option>
            <option value="Saved">Saved</option>
            <option value="Applied">Applied</option>
            <option value="Screening">Screening</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>

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

          <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} className="form-select">
            <option value="applicationDate">Sort by Applied Date</option>
            <option value="companyName">Sort by Company Name</option>
            <option value="jobTitle">Sort by Job Title</option>
            <option value="status">Sort by Status</option>
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

      {loading ? (
        <div className="application-skeleton-list" aria-label="Loading applications" aria-busy="true">
          <div className="skeleton application-skeleton-toolbar" />
          {Array.from({ length: 5 }, (_, index) => <div className="skeleton application-skeleton-row" key={index} />)}
        </div>
      ) : error && applications.length === 0 ? null : applications.length === 0 ? (
        <div className="card empty-state search-empty-state">
          <span className="empty-search-icon" aria-hidden="true">⌕</span>
          <h3>{hasActiveFilters ? 'No applications match your search' : 'No applications yet'}</h3>
          <p>{hasActiveFilters ? 'Try another search or adjust your filters.' : 'Start tracking your opportunities and keep your job search organized.'}</p>
          {hasActiveFilters ? <button type="button" className="secondary-btn" onClick={clearFilters}>Clear Filters</button> : <button type="button" className="primary-btn" onClick={() => navigate('/applications/new')}>Add Application</button>}
        </div>
      ) : (
        <>
          <div className="list-meta">
            <span>
              Showing {startIndex}-{endIndex} of {pagination.totalApplications} applications
            </span>
          </div>

          <div className="table-wrapper card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Job Title</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Work Mode</th>
                  <th>Applied Date</th>
                  <th>Follow-up</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application._id}>
                    <td>
                      <Link to={`/applications/${application._id}`}>{application.companyName}</Link>
                    </td>
                    <td>{application.jobTitle}</td>
                    <td>{application.location || '—'}</td>
                    <td>{application.jobType}</td>
                    <td>{application.workMode || '—'}</td>
                    <td className="date-emphasis">{formatDate(application.applicationDate)}</td>
                    <td>{application.followUpDate ? <span className={`application-followup ${getFollowUpTiming(application).key}`}>{getFollowUpTiming(application).label}</span> : <span className="muted-text">—</span>}</td>
                    <td>
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="action-cell">
                      <Link to={`/applications/${application._id}`} className="text-link">
                        View
                      </Link>
                      <Link to={`/applications/${application._id}/edit`} className="text-link">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <button
              type="button"
              className="secondary-btn"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
            >
              Previous
            </button>

            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>

            <button
              type="button"
              className="secondary-btn"
              disabled={!pagination.hasNextPage}
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

export default Applications;
