import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardChart from '../components/DashboardChart';
import StatusBadge from '../components/StatusBadge';
import { getAnalytics } from '../services/api';
import { formatDateOnly } from '../utils/date';
import { getFollowUpTiming } from '../utils/followUps';

const initialData = {
  overview: {},
  applicationsByStatus: [],
  applicationsByJobType: [],
  applicationsByWorkMode: [],
  applicationsOverTime: [],
  interviewsByStatus: [],
  followUps: { pending: 0, completed: 0, overdue: 0 },
  savedJobs: { total: 0, converted: 0, notConverted: 0 },
  recentApplications: [],
  upcomingFollowUps: [],
};

const metrics = [
  ['Total Applications', 'totalApplications'],
  ['Interviews', 'totalInterviews'],
  ['Offers', 'totalOffers'],
  ['Rejected', 'totalRejected'],
  ['Saved Jobs', 'totalSavedJobs'],
  ['Pending Follow-Ups', 'pendingFollowUps'],
];

const AnalyticsPage = () => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAnalytics();
      setData({ ...initialData, ...response.data });
    } catch (requestError) {
      setError(requestError.message || 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(loadAnalytics, 0);
    return () => clearTimeout(timeoutId);
  }, [loadAnalytics]);

  const overview = data.overview || {};
  const savedJobs = data.savedJobs || initialData.savedJobs;

  return (
    <main className="page-shell core-page analytics-page">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">SEARCH PERFORMANCE</p>
          <h1>Job Search Analytics</h1>
          <p className="muted-text">Understand your application pipeline and job-search activity.</p>
        </div>
        <Link to="/applications" className="secondary-btn link-btn">View Applications</Link>
      </div>

      {error && <div className="error-banner" role="alert">{error} <button type="button" className="text-link" onClick={loadAnalytics}>Retry</button></div>}

      <section className="analytics-kpi-grid" aria-label="Job search metrics">
        {loading ? metrics.map(([label]) => <div className="card analytics-kpi-card" key={label}><span className="skeleton skeleton-label" /><span className="skeleton skeleton-number" /></div>) : metrics.map(([label, key]) => (
          <article className="card analytics-kpi-card" key={key}>
            <span>{label}</span>
            <strong>{error ? '—' : overview[key] ?? 0}</strong>
          </article>
        ))}
      </section>

      <section className="core-section" aria-labelledby="analytics-charts-heading">
        <div className="core-section-heading"><div><p className="eyebrow">APPLICATION ACTIVITY</p><h2 id="analytics-charts-heading">Your search, by the numbers</h2></div></div>
        {loading ? <div className="analytics-grid">{metrics.slice(0, 4).map(([label]) => <div className="card analytics-card analytics-skeleton" key={label}><span className="skeleton skeleton-label" /><span className="skeleton skeleton-chart" /></div>)}</div> : overview.totalApplications ? (
          <div className="analytics-grid">
            <DashboardChart title="Applications Over Time" description="Monthly applications · last 6 months" data={data.applicationsOverTime} labelKey="month" />
            <DashboardChart title="Applications by Status" description="Where each opportunity stands" data={data.applicationsByStatus} labelKey="status" />
            <DashboardChart title="Job Type Breakdown" description="Opportunities by role type" data={data.applicationsByJobType} labelKey="jobType" />
            <DashboardChart title="Work Mode Breakdown" description="Remote, hybrid, and on-site roles" data={data.applicationsByWorkMode} labelKey="workMode" />
            <DashboardChart title="Interview Status" description="The status of your scheduled conversations" data={data.interviewsByStatus} labelKey="status" />
          </div>
        ) : !error ? (
          <div className="card core-empty-state"><span className="core-empty-icon" aria-hidden="true">↗</span><h3>Add some applications to see your job-search analytics.</h3><p>Your charts will fill in as you track opportunities.</p><Link className="primary-btn link-btn" to="/applications/new">Add Application</Link></div>
        ) : null}
      </section>

      <div className="analytics-detail-grid">
        <section className="card analytics-summary-panel" aria-labelledby="followup-summary-heading">
          <div className="core-section-heading"><div><p className="eyebrow">NEXT STEPS</p><h2 id="followup-summary-heading">Follow-Up Summary</h2></div><Link to="/follow-ups" className="text-link">Open follow-ups</Link></div>
          {loading ? <div className="analytics-summary-stats">{[0, 1, 2].map((item) => <span className="skeleton" key={item} />)}</div> : error ? <p className="analytics-summary-empty">Follow-up analytics are unavailable.</p> : (
            <div className="analytics-summary-stats">
              <div><strong>{data.followUps.pending}</strong><span>Pending</span></div>
              <div><strong>{data.followUps.overdue}</strong><span>Overdue</span></div>
              <div><strong>{data.followUps.completed}</strong><span>Completed</span></div>
            </div>
          )}
          {!loading && !error && data.upcomingFollowUps.length > 0 && <div className="analytics-followup-list">
            {data.upcomingFollowUps.slice(0, 4).map((item) => {
              const timing = getFollowUpTiming(item);
              return <Link to={`/applications/${item._id}`} key={item._id}><span><strong>{item.companyName}</strong><small>{item.jobTitle}</small></span><span className={`follow-up-timing ${timing.key}`}>{formatDateOnly(item.followUpDate)}</span></Link>;
            })}
          </div>}
          {!loading && !error && data.upcomingFollowUps.length === 0 && <p className="analytics-summary-empty">No follow-ups scheduled.</p>}
        </section>

        <section className="card analytics-summary-panel saved-analytics-panel" aria-labelledby="saved-summary-heading">
          <div className="core-section-heading"><div><p className="eyebrow">OPPORTUNITY LIBRARY</p><h2 id="saved-summary-heading">Saved Job Insights</h2></div><Link to="/saved-jobs" className="text-link">View saved jobs</Link></div>
          {loading ? <><span className="skeleton skeleton-number" /><span className="skeleton skeleton-row" /></> : error ? <p className="analytics-summary-empty">Saved job analytics are unavailable.</p> : (
            <>
              <div className="saved-analytics-total"><strong>{savedJobs.total}</strong><span>saved opportunities</span></div>
              <div className="saved-analytics-bar" role="img" aria-label={`${savedJobs.converted} of ${savedJobs.total} saved jobs converted`}><span style={{ width: savedJobs.total ? `${(savedJobs.converted / savedJobs.total) * 100}%` : '0%' }} /></div>
              <div className="saved-analytics-legend"><span>{savedJobs.converted} converted</span><span>{savedJobs.notConverted} to explore</span></div>
            </>
          )}
        </section>
      </div>

      <section className="card analytics-recent-panel" aria-labelledby="analytics-recent-heading">
        <div className="core-section-heading"><div><p className="eyebrow">LATEST ACTIVITY</p><h2 id="analytics-recent-heading">Recent Applications</h2></div><Link to="/applications" className="text-link">View all</Link></div>
        {loading ? <div className="analytics-list-skeleton">{[0, 1, 2].map((item) => <span className="skeleton" key={item} />)}</div> : error ? <p className="analytics-summary-empty">Recent applications are unavailable.</p> : data.recentApplications.length ? (
          <div className="table-wrapper"><table className="data-table analytics-data-table"><thead><tr><th>Company</th><th>Position</th><th>Status</th><th>Applied</th></tr></thead><tbody>
            {data.recentApplications.map((application) => <tr key={application._id}><td><Link to={`/applications/${application._id}`}>{application.companyName}</Link></td><td>{application.jobTitle}</td><td><StatusBadge status={application.status} /></td><td>{formatDateOnly(application.applicationDate)}</td></tr>)}
          </tbody></table></div>
        ) : <p className="analytics-summary-empty">No applications to show yet.</p>}
      </section>
    </main>
  );
};

export default AnalyticsPage;
