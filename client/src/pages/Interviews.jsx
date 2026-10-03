import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import InterviewStatusBadge from '../components/InterviewStatusBadge';
import { useAuth } from '../context/useAuth';
import { deleteInterview, getInterviews } from '../services/api';
import { daysFromToday, formatDateOnly, parseDateOnly, parseInterviewDateTime } from '../utils/date';

const STATUSES = ['Scheduled', 'Completed', 'Rescheduled', 'Cancelled'];
const INTERVIEW_TYPES = ['Online', 'In-person', 'Phone', 'Video Call'];
const INTERVIEW_ROUNDS = ['HR', 'Technical', 'Coding', 'Managerial', 'System Design', 'Final Round', 'Other'];

const initialFilters = {
  status: '',
  interviewType: '',
  round: '',
};

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

const getCountdownLabel = (dateString) => {
  const diffDays = daysFromToday(dateString);
  if (diffDays === null) return 'Date unavailable';

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1) return `In ${diffDays} days`;
  if (diffDays === -1) return 'Yesterday';
  return 'Past';
};

const IntervalsList = ({ interviews, totalCount, onDelete, onView, onEdit, page, pageSize, onPageChange, totalPages }) => {
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, interviews.length);

  return (
    <>
      <div className="list-meta">
        <span>
          Showing {interviews.length === 0 ? 0 : startIndex}-{endIndex} of {totalCount} interviews
        </span>
      </div>

      {interviews.length === 0 ? (
        <div className="card empty-state">
          <h3>No interviews found</h3>
          <p>Try adjusting your filters or schedule a new interview.</p>
        </div>
      ) : (
        <div className="interview-grid">
          {interviews.map((interview) => (
            <article key={interview._id} className="interview-card card">
              <div className="interview-card-header">
                <div>
                  <p className="eyebrow small-eyebrow">{interview.companyName}</p>
                  <h3>{interview.jobTitle}</h3>
                </div>
                <InterviewStatusBadge status={interview.status} />
              </div>

              <div className="interview-card-body">
                <div className="mini-row">
                  <span>Round</span>
                  <strong>{interview.round}</strong>
                </div>
                <div className="mini-row">
                  <span>Date</span>
                  <strong>{formatDate(interview.date)}</strong>
                </div>
                <div className="mini-row">
                  <span>Time</span>
                  <strong>{`${formatTime(interview.startTime)}${interview.endTime ? ` - ${formatTime(interview.endTime)}` : ''}`}</strong>
                </div>
                <div className="mini-row">
                  <span>Type</span>
                  <strong>{interview.interviewType}</strong>
                </div>
                {interview.interviewerName && (
                  <div className="mini-row">
                    <span>Interviewer</span>
                    <strong>{interview.interviewerName}</strong>
                  </div>
                )}
              </div>

              <div className="interview-actions">
                <button type="button" className="secondary-btn" onClick={() => onView(interview._id)}>
                  View
                </button>
                <button type="button" className="secondary-btn" onClick={() => onEdit(interview._id)}>
                  Edit
                </button>
                <button type="button" className="danger-btn" onClick={() => onDelete(interview._id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {interviews.length > 0 && (
        <div className="pagination-bar">
          <button type="button" className="secondary-btn" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" className="secondary-btn" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
            Next
          </button>
        </div>
      )}
    </>
  );
};

const Interviews = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [clock, setClock] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const pageSize = 6;

  useEffect(() => {
    const updateClock = () => setClock(Date.now());
    const initialTimeout = setTimeout(updateClock, 0);
    const intervalId = setInterval(updateClock, 60_000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getInterviews({ limit: 1000, sortBy, sortOrder }, token);
        setInterviews(response.data || []);
      } catch (err) {
        setError(err.message || 'Unable to load interviews');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [sortBy, sortOrder, token, reloadKey]);

  const filteredInterviews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...interviews]
      .filter((interview) => {
        const matchesSearch =
          !normalizedSearch ||
          (interview.companyName || '').toLowerCase().includes(normalizedSearch) ||
          (interview.jobTitle || '').toLowerCase().includes(normalizedSearch) ||
          (interview.interviewerName || '').toLowerCase().includes(normalizedSearch);

        const matchesStatus = !filters.status || interview.status === filters.status;
        const matchesType = !filters.interviewType || interview.interviewType === filters.interviewType;
        const matchesRound = !filters.round || interview.round === filters.round;

        return matchesSearch && matchesStatus && matchesType && matchesRound;
      })
      .sort((first, second) => {
        const firstValue = first[sortBy] || '';
        const secondValue = second[sortBy] || '';

        if (sortBy === 'date') {
          const firstTime = new Date(firstValue).getTime();
          const secondTime = new Date(secondValue).getTime();
          return sortOrder === 'asc' ? firstTime - secondTime : secondTime - firstTime;
        }

        if (sortBy === 'companyName') {
          return sortOrder === 'asc'
            ? String(firstValue).localeCompare(String(secondValue))
            : String(secondValue).localeCompare(String(firstValue));
        }

        return sortOrder === 'asc'
          ? String(firstValue).localeCompare(String(secondValue))
          : String(secondValue).localeCompare(String(firstValue));
      });
  }, [filters, interviews, search, sortBy, sortOrder]);

  const now = useMemo(() => new Date(clock), [clock]);
  const { todayStart, todayEnd } = useMemo(() => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { todayStart: start, todayEnd: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
  }, [now]);

  const summaries = useMemo(() => {
    const isUpcoming = (interview) => {
      const startsAt = parseInterviewDateTime(interview.date, interview.startTime);
      return startsAt >= now && !['Completed', 'Cancelled'].includes(interview.status);
    };

    return {
      upcoming: interviews.filter(isUpcoming).length,
      today: interviews.filter((interview) => {
        const interviewDate = parseDateOnly(interview.date);
        return interviewDate >= todayStart && interviewDate < todayEnd;
      }).length,
      completed: interviews.filter((interview) => interview.status === 'Completed').length,
      scheduled: interviews.filter((interview) => interview.status === 'Scheduled').length,
      cancelled: interviews.filter((interview) => interview.status === 'Cancelled').length,
    };
  }, [interviews, now, todayStart, todayEnd]);

  const upcomingInterviews = useMemo(() => interviews
    .filter((interview) => {
      const startsAt = parseInterviewDateTime(interview.date, interview.startTime);
      return startsAt >= now && !['Completed', 'Cancelled'].includes(interview.status);
    })
    .sort((first, second) => parseInterviewDateTime(first.date, first.startTime) - parseInterviewDateTime(second.date, second.startTime)), [interviews, now]);

  const todaysInterviews = useMemo(() => interviews.filter(
    (interview) => {
      const interviewDate = parseDateOnly(interview.date);
      return interviewDate >= todayStart && interviewDate < todayEnd;
    }
  ), [interviews, todayStart, todayEnd]);

  const pastInterviews = useMemo(() => filteredInterviews.filter((interview) => {
    const startsAt = parseInterviewDateTime(interview.date, interview.startTime);
    return ['Completed', 'Cancelled'].includes(interview.status) || !startsAt || startsAt < now;
  }), [filteredInterviews, now]);
  const totalPages = Math.max(1, Math.ceil(pastInterviews.length / pageSize));
  const currentPageItems = pastInterviews.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (interviewId) => {
    const confirmed = window.confirm('Delete this interview?');
    if (!confirmed) return;

    try {
      await deleteInterview(interviewId, token);
      setInterviews((current) => current.filter((interview) => interview._id !== interviewId));
      navigate('/interviews', { state: { successMessage: 'Interview deleted successfully' } });
    } catch (err) {
      setError(err.message || 'Unable to delete interview');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilters(initialFilters);
    setSortBy('date');
    setSortOrder('asc');
    setPage(1);
  };

  return (
    <section className="page-shell core-page interviews-page">
      {location.state?.successMessage && <div className="toast success-toast" role="status" aria-live="polite">{location.state.successMessage}</div>}

      <div className="page-header-row">
        <div>
          <p className="eyebrow">PREPARATION & MOMENTUM</p>
          <h1>Interview Tracker</h1>
          <p className="muted-text">Stay prepared for every conversation.</p>
        </div>

        <button type="button" className="primary-btn" onClick={() => navigate('/interviews/new')}>
          + Schedule Interview
        </button>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <span className="eyebrow">Upcoming</span>
          <strong>{loading ? <span className="skeleton interview-stat-skeleton" /> : error && interviews.length === 0 ? '—' : summaries.upcoming}</strong>
        </div>
        <div className="card stat-card">
          <span className="eyebrow">Today</span>
          <strong>{loading ? <span className="skeleton interview-stat-skeleton" /> : error && interviews.length === 0 ? '—' : summaries.today}</strong>
        </div>
        <div className="card stat-card">
          <span className="eyebrow">Completed</span>
          <strong>{loading ? <span className="skeleton interview-stat-skeleton" /> : error && interviews.length === 0 ? '—' : summaries.completed}</strong>
        </div>
        <div className="card stat-card">
          <span className="eyebrow">Scheduled</span>
          <strong>{loading ? <span className="skeleton interview-stat-skeleton" /> : error && interviews.length === 0 ? '—' : summaries.scheduled}</strong>
        </div>
        <div className="card stat-card">
          <span className="eyebrow">Cancelled</span>
          <strong>{loading ? <span className="skeleton interview-stat-skeleton" /> : error && interviews.length === 0 ? '—' : summaries.cancelled}</strong>
        </div>
      </div>

      <div className="card filter-panel">
        <div className="filter-grid interviews-filter-grid">
          <input
            type="text"
            aria-label="Search interviews"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search by company, job, or interviewer"
            className="form-input"
          />

          <select value={filters.status} onChange={(event) => { setFilters((current) => ({ ...current, status: event.target.value })); setPage(1); }} className="form-select">
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select value={filters.interviewType} onChange={(event) => { setFilters((current) => ({ ...current, interviewType: event.target.value })); setPage(1); }} className="form-select">
            <option value="">All types</option>
            {INTERVIEW_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select value={filters.round} onChange={(event) => { setFilters((current) => ({ ...current, round: event.target.value })); setPage(1); }} className="form-select">
            <option value="">All rounds</option>
            {INTERVIEW_ROUNDS.map((round) => (
              <option key={round} value={round}>{round}</option>
            ))}
          </select>

          <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} className="form-select">
            <option value="date">Sort by Date</option>
            <option value="companyName">Sort by Company</option>
            <option value="status">Sort by Status</option>
          </select>

          <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setPage(1); }} className="form-select">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          <button type="button" className="secondary-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="error-banner" role="alert">{error}<button type="button" className="text-link" onClick={() => setReloadKey((value) => value + 1)}>Retry</button></div>}

      {loading ? (
        <div className="interview-skeleton-grid" aria-label="Loading interviews" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => <div className="interview-skeleton-card" key={index}><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div>)}
        </div>
      ) : error && interviews.length === 0 ? null : (
        <>
          <div className="section-block">
            <div className="section-heading-row">
              <h2>Upcoming Interviews</h2>
            </div>
            <div className="interview-stack">
              {upcomingInterviews.length === 0 ? (
                <div className="card empty-state search-empty-state">
                  <span className="empty-search-icon" aria-hidden="true">▣</span>
                  <h3>Your calendar is clear</h3>
                  <p>No upcoming interviews scheduled.</p>
                  <Link to="/interviews/new" className="secondary-btn link-btn">Schedule Interview</Link>
                </div>
              ) : (
                upcomingInterviews.slice(0, 4).map((interview) => (
                  <div key={interview._id} className="card list-row-item">
                    <div>
                      <strong>{interview.companyName}</strong>
                      <p>{interview.jobTitle}</p>
                    </div>
                    <div>
                      <span className="mini-badge">{interview.round}</span>
                    </div>
                    <div>
                      <span className="date-emphasis">{formatDate(interview.date)}</span>
                      <small>{getCountdownLabel(interview.date)}</small>
                    </div>
                    <div>
                      <span>{interview.interviewType}</span>
                    </div>
                    <div className="flex-actions">
                      {interview.meetingLink && (
                        <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="primary-btn link-btn small-btn">
                          Join Meeting ↗
                        </a>
                      )}
                      <button type="button" className="secondary-btn small-btn" onClick={() => navigate(`/interviews/${interview._id}`)}>
                        Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="section-block">
            <div className="section-heading-row">
              <h2>Today's Interviews</h2>
            </div>
            {todaysInterviews.length === 0 ? (
              <div className="card empty-state">
                <p>No interviews scheduled for today.</p>
              </div>
            ) : (
              <div className="interview-grid">
                {todaysInterviews.map((interview) => (
                  <article key={interview._id} className="interview-card card highlighted-card">
                    <div className="interview-card-header">
                      <div>
                        <p className="eyebrow small-eyebrow">{interview.companyName}</p>
                        <h3>{interview.jobTitle}</h3>
                      </div>
                      <InterviewStatusBadge status={interview.status} />
                    </div>
                    <div className="interview-card-body">
                      <div className="mini-row"><span>Round</span><strong>{interview.round}</strong></div>
                      <div className="mini-row"><span>Time</span><strong>{`${formatTime(interview.startTime)}${interview.endTime ? ` - ${formatTime(interview.endTime)}` : ''}`}</strong></div>
                      <div className="mini-row"><span>Type</span><strong>{interview.interviewType}</strong></div>
                    </div>
                    <div className="interview-actions">
                      {interview.meetingLink && (
                        <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="primary-btn link-btn small-btn">
                          Join Meeting ↗
                        </a>
                      )}
                      <button type="button" className="secondary-btn small-btn" onClick={() => navigate(`/interviews/${interview._id}`)}>
                        Details
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="section-block">
            <div className="section-heading-row">
              <h2>Past Interviews</h2>
            </div>
            <div className="section-action-row">
              <Link to="/interviews/new" className="secondary-btn link-btn">
                Schedule Interview
              </Link>
            </div>
            <IntervalsList
              interviews={currentPageItems}
              totalCount={pastInterviews.length}
              onDelete={handleDelete}
              onView={(id) => navigate(`/interviews/${id}`)}
              onEdit={(id) => navigate(`/interviews/${id}/edit`)}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              onPageChange={(nextPage) => setPage(Math.min(Math.max(nextPage, 1), totalPages))}
            />
          </div>
        </>
      )}
    </section>
  );
};

export default Interviews;
