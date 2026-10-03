import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { getFollowUps, updateFollowUpStatus } from '../services/api';
import { formatDateOnly } from '../utils/date';
import { getFollowUpTiming } from '../utils/followUps';

const filters = ['All', 'Pending', 'Completed', 'Today', 'Upcoming', 'Overdue'];

const FollowUps = () => {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date-asc');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    try {
      const response = await getFollowUps();
      setApplications(response.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load follow-ups.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(refresh, 0);
    return () => clearTimeout(timeoutId);
  }, [refresh]);

  const counts = useMemo(() => applications.reduce((summary, item) => {
    const timing = getFollowUpTiming(item);
    summary.total += 1;
    if (timing.key === 'completed') summary.completed += 1;
    else {
      summary.pending += 1;
      if (timing.key === 'today') summary.today += 1;
      if (timing.key === 'upcoming') summary.upcoming += 1;
      if (timing.key === 'overdue') summary.overdue += 1;
    }
    return summary;
  }, { total: 0, pending: 0, completed: 0, today: 0, upcoming: 0, overdue: 0 }), [applications]);

  const visibleApplications = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const result = applications.filter((item) => {
      const timing = getFollowUpTiming(item);
      const text = [item.companyName, item.jobTitle, item.recruiterName, item.recruiterEmail].join(' ').toLowerCase();
      const matchesSearch = !needle || text.includes(needle);
      const matchesFilter = filter === 'All' || filter === 'Pending'
        ? filter === 'All' || item.followUpStatus !== 'Completed'
        : filter === 'Completed'
          ? item.followUpStatus === 'Completed'
          : timing.key === filter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
    return result.sort((a, b) => {
      if (sort === 'company-asc' || sort === 'company-desc') {
        const compared = a.companyName.localeCompare(b.companyName);
        return sort === 'company-asc' ? compared : -compared;
      }
      const compared = new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime();
      return sort === 'date-desc' ? -compared : compared;
    });
  }, [applications, filter, search, sort]);

  const toggleStatus = async (application) => {
    const nextStatus = application.followUpStatus === 'Completed' ? 'Pending' : 'Completed';
    setBusyId(application._id);
    setError('');
    setNotice('');
    try {
      const response = await updateFollowUpStatus(application._id, nextStatus);
      setApplications((items) => items.map((item) => item._id === application._id ? response.data : item));
      setNotice(`${application.companyName} follow-up marked ${nextStatus.toLowerCase()}.`);
    } catch (err) {
      setError(err.message || 'Unable to update follow-up status.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <main className="page-shell core-page follow-ups-page">
      <div className="page-header-row">
        <div><p className="eyebrow">RELATIONSHIP MOMENTUM</p><h1>Follow-Up Center</h1><p className="muted-text">Never let a promising opportunity go cold.</p></div>
        <Link className="secondary-btn link-btn" to="/applications">All Applications</Link>
      </div>

      <div className="stats-grid follow-up-stats">
        <div className="card stat-card"><span>Total Pending</span><strong>{loading ? <span className="skeleton interview-stat-skeleton" /> : counts.pending}</strong></div>
        <div className="card stat-card"><span>Due Today</span><strong>{loading ? <span className="skeleton interview-stat-skeleton" /> : counts.today}</strong></div>
        <div className="card stat-card"><span>Upcoming</span><strong>{loading ? <span className="skeleton interview-stat-skeleton" /> : counts.upcoming}</strong></div>
        <div className="card stat-card"><span>Overdue</span><strong>{loading ? <span className="skeleton interview-stat-skeleton" /> : counts.overdue}</strong></div>
        <div className="card stat-card"><span>Completed</span><strong>{loading ? <span className="skeleton interview-stat-skeleton" /> : counts.completed}</strong></div>
      </div>

      <div className="card filter-panel">
        <div className="filter-grid">
          <input className="form-input" aria-label="Search follow-ups" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, title, or recruiter" />
          <select className="form-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter follow-ups">
            {filters.map((value) => <option key={value}>{value}</option>)}
          </select>
          <select className="form-select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort follow-ups">
            <option value="date-asc">Follow-up date: earliest</option><option value="date-desc">Follow-up date: latest</option>
            <option value="company-asc">Company: A–Z</option><option value="company-desc">Company: Z–A</option>
          </select>
        </div>
      </div>

      {error && <div className="error-banner" role="alert">{error} <button type="button" className="text-link" onClick={() => { setError(''); refresh(); }}>Retry</button></div>}
      {notice && <div className="toast success-toast" role="status" aria-live="polite">{notice}</div>}
      {loading ? <div className="follow-up-skeleton-list" aria-label="Loading follow-ups" aria-busy="true">{Array.from({ length: 4 }, (_, index) => <div className="skeleton follow-up-skeleton-row" key={index} />)}</div> : error && applications.length === 0 ? null : visibleApplications.length === 0 ? (
        <div className="card empty-state"><h3>{search ? 'No follow-ups match your search.' : applications.length === 0 ? 'No follow-ups yet.' : filter === 'Pending' ? "You're all caught up!" : 'No follow-ups found.'}</h3><p>{applications.length === 0 ? 'Add a follow-up date to an application to stay on top of recruiter communication.' : 'Try another filter or search, or add a follow-up date to an application.'}</p><Link className="primary-btn link-btn" to="/applications">View Applications</Link></div>
      ) : (
        <div className="follow-up-list">
          {visibleApplications.map((application) => {
            const timing = getFollowUpTiming(application);
            const completed = application.followUpStatus === 'Completed';
            return (
              <article className={`card follow-up-card follow-up-${timing.key}`} key={application._id}>
                <div className="follow-up-main">
                  <div><Link className="follow-up-company" to={`/applications/${application._id}`}>{application.companyName}</Link><p>{application.jobTitle}</p>
                    {(application.recruiterName || application.recruiterEmail) && <small>Recruiter: {[application.recruiterName, application.recruiterEmail].filter(Boolean).join(' · ')}</small>}
                  </div>
                  <div className="follow-up-meta"><span className="date-emphasis">{formatDateOnly(application.followUpDate)}</span><strong className={`follow-up-timing ${timing.key}`}>{timing.label}</strong></div>
                  <div className="follow-up-meta"><StatusBadge status={application.status} /><StatusBadge status={application.followUpStatus || 'Pending'} /></div>
                  <div className="follow-up-actions"><Link className="text-link" to={`/applications/${application._id}`}>View application</Link><button type="button" className={completed ? 'secondary-btn' : 'primary-btn'} disabled={busyId === application._id} onClick={() => toggleStatus(application)}>{busyId === application._id ? 'Saving…' : completed ? 'Mark Pending' : 'Mark Complete'}</button></div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default FollowUps;
