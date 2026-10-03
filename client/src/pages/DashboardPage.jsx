import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardChart from '../components/DashboardChart';
import InterviewStatusBadge from '../components/InterviewStatusBadge';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/useAuth';
import { getAnalytics, getFollowUps, getInterviews } from '../services/api';
import { daysFromToday, formatDateOnly, parseInterviewDateTime } from '../utils/date';
import { getFollowUpTiming } from '../utils/followUps';
import './DashboardPage.css';

const emptyAnalytics = {
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

const pipelineStages = [
  { label: 'Saved', color: '#8b91a5' },
  { label: 'Applied', color: '#5480d8' },
  { label: 'Screening', color: '#d39b3e' },
  { label: 'Interview', color: '#766bd3' },
  { label: 'Offer', color: '#3c9a70' },
  { label: 'Rejected', color: '#d16d75' },
  { label: 'Withdrawn', color: '#9ca3b1' },
];

const metricItems = [
  { label: 'Applications', key: 'totalApplications', icon: 'applications', to: '/applications', tone: 'violet' },
  { label: 'Interviews', key: 'totalInterviews', icon: 'interviews', to: '/interviews', tone: 'blue' },
  { label: 'Offers', key: 'totalOffers', icon: 'offer', to: '/applications', tone: 'green' },
  { label: 'Saved jobs', key: 'totalSavedJobs', icon: 'saved', to: '/saved-jobs', tone: 'amber' },
  { label: 'Pending follow-ups', key: 'pendingFollowUps', icon: 'followup', to: '/follow-ups', tone: 'rose' },
  { label: 'Rejected', key: 'totalRejected', icon: 'rejected', to: '/applications', tone: 'slate' },
];

const Icon = ({ name, className = '' }) => {
  const paths = {
    applications: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    interviews: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18M8 15h3" /></>,
    offer: <><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></>,
    saved: <><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" /></>,
    followup: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    rejected: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    plus: <><path d="M12 5v14m-7-7h14" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
    kanban: <><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="10" rx="1.5" /><rect x="17" y="4" width="5" height="13" rx="1.5" /></>,
    analytics: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 5-6" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2" /></>,
  };

  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

const formatInterviewTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const getInterviewDayLabel = (date) => {
  const days = daysFromToday(date);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return `In ${days} days`;
  return formatDateOnly(date, { month: 'short', day: 'numeric' });
};

const getStatusCount = (analytics, status) => {
  const match = analytics.applicationsByStatus.find((item) => item.status?.toLowerCase() === status.toLowerCase());
  return match?.count || 0;
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [interviews, setInterviews] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState([]);
  const [loaded, setLoaded] = useState({ analytics: false, interviews: false, followUps: false });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadErrors([]);
    setLoaded({ analytics: false, interviews: false, followUps: false });

    const [analyticsResult, interviewsResult, followUpsResult] = await Promise.allSettled([
      getAnalytics(),
      getInterviews({ type: 'upcoming', page: 1, limit: 100, sortBy: 'date', sortOrder: 'asc' }),
      getFollowUps(),
    ]);

    const errors = [];
    if (analyticsResult.status === 'fulfilled') {
      setAnalytics({ ...emptyAnalytics, ...analyticsResult.value.data });
      setLoaded((value) => ({ ...value, analytics: true }));
    } else {
      errors.push('Dashboard analytics could not be loaded.');
    }
    if (interviewsResult.status === 'fulfilled') {
      setInterviews(interviewsResult.value.data || []);
      setLoaded((value) => ({ ...value, interviews: true }));
    } else {
      errors.push('Upcoming interviews could not be loaded.');
    }
    if (followUpsResult.status === 'fulfilled') {
      setFollowUps(followUpsResult.value.data || []);
      setLoaded((value) => ({ ...value, followUps: true }));
    } else {
      errors.push('Follow-ups could not be loaded.');
    }

    setLoadErrors(errors);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(loadDashboard, 0);
    return () => clearTimeout(timeoutId);
  }, [loadDashboard]);

  const overview = analytics.overview || {};
  const statusCounts = useMemo(() => analytics.applicationsByStatus.reduce((result, item) => {
    result[item.status?.toLowerCase()] = item.count || 0;
    return result;
  }, {}), [analytics.applicationsByStatus]);

  const upcomingInterviews = useMemo(() => interviews
    .filter((interview) => {
      const days = daysFromToday(interview.date);
      return ['Scheduled', 'Rescheduled'].includes(interview.status) && days !== null && days >= 0;
    })
    .sort((left, right) => {
      const leftTime = parseInterviewDateTime(left.date, left.startTime)?.getTime() || 0;
      const rightTime = parseInterviewDateTime(right.date, right.startTime)?.getTime() || 0;
      return leftTime - rightTime;
    })
    .slice(0, 3), [interviews]);

  const followUpSummary = useMemo(() => {
    const activeFollowUps = followUps.map((item) => ({ ...item, timing: getFollowUpTiming(item) }))
      .filter((item) => item.timing.key !== 'completed');
    return {
      today: activeFollowUps.filter((item) => item.timing.key === 'today').length,
      upcoming: activeFollowUps.filter((item) => item.timing.key === 'upcoming').length,
      overdue: activeFollowUps.filter((item) => item.timing.key === 'overdue').length,
      nextItems: activeFollowUps
        .sort((left, right) => (left.timing.days ?? Number.MAX_SAFE_INTEGER) - (right.timing.days ?? Number.MAX_SAFE_INTEGER))
        .slice(0, 3),
    };
  }, [followUps]);

  const displayName = user?.name?.trim().split(/\s+/)[0] || '';
  const productivityInsight = getStatusCount(analytics, 'Interview') > 0
    ? `You have ${getStatusCount(analytics, 'Interview')} ${getStatusCount(analytics, 'Interview') === 1 ? 'application' : 'applications'} in the Interview stage.`
    : followUpSummary.overdue + followUpSummary.today > 0
      ? `${followUpSummary.overdue + followUpSummary.today} follow-up${followUpSummary.overdue + followUpSummary.today === 1 ? '' : 's'} need your attention.`
      : '';

  const savedJobs = analytics.savedJobs || emptyAnalytics.savedJobs;
  const conversionWidth = savedJobs.total ? `${(savedJobs.converted / savedJobs.total) * 100}%` : '0%';

  return (
    <main className="page-shell dashboard-page">
      <section className="dashboard-hero" aria-labelledby="dashboard-welcome">
        <div className="dashboard-hero-copy">
          <p className="eyebrow"><Icon name="spark" /> JOB SEARCH COMMAND CENTER</p>
          <h1 id="dashboard-welcome">Welcome back{displayName ? `, ${displayName}` : ''}<span className="welcome-wave" aria-hidden="true"> ✦</span></h1>
          <p className="dashboard-hero-description">Keep your applications moving, your interviews prepared, and every next step in view.</p>
          <p className="dashboard-current-date"><Icon name="calendar" /> Your job search, organized in one place</p>
          <div className="dashboard-hero-actions">
            <Link className="primary-btn" to="/applications/new"><Icon name="plus" /> Add Application</Link>
            <Link className="secondary-btn" to="/saved-jobs/new"><Icon name="plus" /> Save a Job</Link>
          </div>
        </div>
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="hero-note" aria-hidden="true"><span className="hero-note-icon"><Icon name="briefcase" /></span><span><strong>One clear next step</strong><small>Make your progress count</small></span><span className="hero-note-check">✓</span></div>
      </section>

      {loadErrors.length > 0 && (
        <div className="error-banner dashboard-error" role="alert">
          <span>{loadErrors.length === 1 ? loadErrors[0] : 'Some dashboard information could not be loaded.'}</span>
          <button type="button" className="text-link" onClick={loadDashboard}>Retry</button>
        </div>
      )}

      <section className="dashboard-kpi-grid" aria-label="Job search overview">
        {loading ? Array.from({ length: 6 }, (_, index) => <div className="dashboard-kpi skeleton-card" key={index}><span className="skeleton skeleton-icon" /><span className="skeleton skeleton-number" /><span className="skeleton skeleton-label" /></div>) : metricItems.map((metric) => (
          <Link className={`dashboard-kpi card tone-${metric.tone}`} key={metric.key} to={metric.to}>
            <span className="kpi-icon"><Icon name={metric.icon} /></span>
            <strong className="kpi-value">{loaded.analytics ? overview[metric.key] ?? 0 : '—'}</strong>
            <span className="kpi-label">{metric.label}</span>
          </Link>
        ))}
      </section>

      <section className="dashboard-panel pipeline-panel" aria-labelledby="pipeline-heading">
        <div className="dashboard-section-title">
          <div><p className="eyebrow">APPLICATION TRACKER</p><h2 id="pipeline-heading">Your application pipeline</h2><p className="muted-text">A clear view of every opportunity in motion.</p></div>
          <Link className="text-link dashboard-heading-link" to="/applications">All applications <Icon name="arrow" /></Link>
        </div>
        {loading ? <div className="pipeline-skeleton"><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div> : !loaded.analytics ? (
          <div className="dashboard-empty compact-empty"><span className="empty-icon"><Icon name="applications" /></span><div><strong>Pipeline unavailable.</strong><p>We couldn't load your application statuses.</p></div><button type="button" className="secondary-btn small-btn" onClick={loadDashboard}>Retry</button></div>
        ) : overview.totalApplications ? (
          <div className="pipeline-grid" role="list" aria-label="Application counts by status">
            {pipelineStages.map((stage) => (
              <div className="pipeline-stage" key={stage.label} role="listitem" style={{ '--stage-color': stage.color }}>
                <span className="pipeline-stage-top"><span className="pipeline-dot" /><span>{stage.label}</span></span>
                <strong>{statusCounts[stage.label.toLowerCase()] || 0}</strong>
                <span className="pipeline-track"><span style={{ width: `${statusCounts[stage.label.toLowerCase()] ? (statusCounts[stage.label.toLowerCase()] / overview.totalApplications) * 100 : 0}%` }} /></span>
              </div>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty compact-empty"><span className="empty-icon"><Icon name="applications" /></span><div><strong>Your job search starts here.</strong><p>Add your first application to begin tracking your progress.</p></div><Link className="secondary-btn small-btn" to="/applications/new">Add application</Link></div>
        )}
      </section>

      <div className="dashboard-feature-grid">
        <section className="dashboard-panel interviews-panel" aria-labelledby="upcoming-heading">
          <div className="dashboard-section-title">
            <div><p className="eyebrow">BE READY FOR WHAT'S NEXT</p><h2 id="upcoming-heading">Upcoming interviews</h2></div>
            <Link className="text-link dashboard-heading-link" to="/interviews">View all <Icon name="arrow" /></Link>
          </div>
          {loading ? <div className="interview-skeleton-list"><span className="skeleton" /><span className="skeleton" /></div> : !loaded.interviews ? (
            <div className="dashboard-empty"><span className="empty-icon"><Icon name="calendar" /></span><strong>Interviews unavailable.</strong><p>We couldn't load your interview schedule.</p><button type="button" className="secondary-btn small-btn" onClick={loadDashboard}>Retry</button></div>
          ) : upcomingInterviews.length ? (
            <div className="dashboard-interview-list">
              {upcomingInterviews.map((interview) => (
                <article className="dashboard-interview-item" key={interview._id}>
                  <div className="interview-date-tile"><strong>{formatDateOnly(interview.date, { day: '2-digit' })}</strong><span>{formatDateOnly(interview.date, { month: 'short' })}</span></div>
                  <div className="dashboard-interview-copy"><div className="interview-title-line"><h3>{interview.round} interview</h3><InterviewStatusBadge status={interview.status} /></div><p>{interview.companyName} <span>·</span> {interview.jobTitle}</p><small>{getInterviewDayLabel(interview.date)}{interview.startTime ? ` · ${formatInterviewTime(interview.startTime)}` : ''}</small></div>
                  <Link className="icon-link" to={`/interviews/${interview._id}`} aria-label={`View ${interview.companyName} interview`}><Icon name="arrow" /></Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty interview-empty"><span className="empty-icon"><Icon name="calendar" /></span><strong>Your calendar is clear.</strong><p>No upcoming interviews scheduled.</p><Link className="secondary-btn small-btn" to="/interviews/new">Add interview</Link></div>
          )}
        </section>

        <section className="dashboard-panel followup-panel" aria-labelledby="followup-heading">
          <div className="dashboard-section-title">
            <div><p className="eyebrow">STAY ON TOP OF THE DETAILS</p><h2 id="followup-heading">Follow-up attention</h2></div>
            <Link className="text-link dashboard-heading-link" to="/follow-ups">View all <Icon name="arrow" /></Link>
          </div>
          {loading ? <><div className="followup-count-skeleton"><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div><span className="skeleton skeleton-row" /></> : !loaded.followUps ? (
            <div className="dashboard-empty"><span className="empty-icon"><Icon name="followup" /></span><strong>Follow-ups unavailable.</strong><p>We couldn't load your follow-up schedule.</p><button type="button" className="secondary-btn small-btn" onClick={loadDashboard}>Retry</button></div>
          ) : (
            <>
              <div className="followup-counts">
                <div className="followup-count overdue-count"><strong>{followUpSummary.overdue}</strong><span>Overdue</span></div>
                <div className="followup-count today-count"><strong>{followUpSummary.today}</strong><span>Due today</span></div>
                <div className="followup-count upcoming-count"><strong>{followUpSummary.upcoming}</strong><span>Upcoming</span></div>
              </div>
              {followUpSummary.nextItems.length ? (
                <div className="dashboard-followup-list">
                  {followUpSummary.nextItems.map((item) => (
                    <Link className="dashboard-followup-item" to={`/applications/${item._id}`} key={item._id}>
                      <span className={`followup-status-dot ${item.timing.key}`} />
                      <span className="followup-item-copy"><strong>{item.companyName}</strong><small>{item.jobTitle}</small></span>
                      <span className={`followup-item-date ${item.timing.key}`}>{item.timing.label}</span>
                    </Link>
                  ))}
                </div>
              ) : <div className="dashboard-empty followup-empty"><span className="empty-icon"><Icon name="followup" /></span><strong>You're all caught up.</strong><p>No pending follow-ups right now.</p></div>}
            </>
          )}
        </section>
      </div>

      <div className="dashboard-lower-grid">
        <section className="dashboard-panel recent-panel" aria-labelledby="recent-heading">
          <div className="dashboard-section-title">
            <div><p className="eyebrow">LATEST ACTIVITY</p><h2 id="recent-heading">Recent applications</h2></div>
            <Link className="text-link dashboard-heading-link" to="/applications">View all <Icon name="arrow" /></Link>
          </div>
          {loading ? <div className="recent-skeleton-list"><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div> : !loaded.analytics ? (
            <div className="dashboard-empty recent-empty"><span className="empty-icon"><Icon name="applications" /></span><strong>Activity unavailable.</strong><p>We couldn't load your recent applications.</p><button type="button" className="secondary-btn small-btn" onClick={loadDashboard}>Retry</button></div>
          ) : analytics.recentApplications.length ? (
            <div className="recent-application-list">
              {analytics.recentApplications.map((application) => (
                <Link className="recent-application-item" to={`/applications/${application._id}`} key={application._id}>
                  <span className="company-mark" aria-hidden="true">{application.companyName?.trim().charAt(0)?.toUpperCase() || <Icon name="briefcase" />}</span>
                  <span className="recent-application-copy"><strong>{application.companyName}</strong><small>{application.jobTitle}</small></span>
                  <span className="recent-application-status"><StatusBadge status={application.status} /><small>{formatDateOnly(application.applicationDate, { month: 'short', day: 'numeric' })}</small></span>
                  <Icon className="recent-item-arrow" name="arrow" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty recent-empty"><span className="empty-icon"><Icon name="applications" /></span><strong>No applications yet.</strong><p>Add an opportunity to start building your application history.</p><Link className="secondary-btn small-btn" to="/applications/new">Add application</Link></div>
          )}
        </section>

        <div className="dashboard-aside-stack">
          <section className="dashboard-panel saved-insight-panel" aria-labelledby="saved-insight-heading">
            <div className="dashboard-section-title">
              <div><p className="eyebrow">OPPORTUNITIES TO EXPLORE</p><h2 id="saved-insight-heading">Saved jobs</h2></div>
              <Link className="text-link dashboard-heading-link" to="/saved-jobs">Open <Icon name="arrow" /></Link>
            </div>
            {loading ? <><span className="skeleton skeleton-number" /><span className="skeleton skeleton-row" /></> : !loaded.analytics ? <div className="dashboard-empty saved-empty"><strong>Saved jobs unavailable.</strong><button type="button" className="secondary-btn small-btn" onClick={loadDashboard}>Retry</button></div> : savedJobs.total ? (
              <>
                <div className="saved-insight-total"><strong>{savedJobs.total}</strong><span>opportunities saved</span></div>
                <div className="saved-insight-track" role="img" aria-label={`${savedJobs.converted} of ${savedJobs.total} saved jobs converted to applications`}><span style={{ width: conversionWidth }} /></div>
                <div className="saved-insight-legend"><span><i className="converted-dot" />{savedJobs.converted} converted</span><span>{savedJobs.notConverted} to explore</span></div>
              </>
            ) : (
              <div className="dashboard-empty saved-empty"><span className="empty-icon"><Icon name="saved" /></span><strong>Keep good roles close.</strong><p>Save interesting opportunities and keep them in one place.</p><Link className="secondary-btn small-btn" to="/saved-jobs/new">Save a job</Link></div>
            )}
          </section>

          <section className="dashboard-panel quick-actions-panel" aria-labelledby="quick-actions-heading">
            <div className="dashboard-section-title"><div><p className="eyebrow">MAKE YOUR NEXT MOVE</p><h2 id="quick-actions-heading">Quick actions</h2></div></div>
            <div className="dashboard-quick-actions">
              <Link to="/applications/new"><span className="quick-action-icon violet"><Icon name="plus" /></span><span>Add application</span><Icon className="quick-action-arrow" name="arrow" /></Link>
              <Link to="/interviews/new"><span className="quick-action-icon blue"><Icon name="calendar" /></span><span>Schedule interview</span><Icon className="quick-action-arrow" name="arrow" /></Link>
              <Link to="/kanban"><span className="quick-action-icon amber"><Icon name="kanban" /></span><span>Open Kanban board</span><Icon className="quick-action-arrow" name="arrow" /></Link>
              <Link to="/analytics"><span className="quick-action-icon green"><Icon name="analytics" /></span><span>View analytics</span><Icon className="quick-action-arrow" name="arrow" /></Link>
            </div>
          </section>
        </div>
      </div>

      {productivityInsight && !loading && loaded.analytics && loaded.followUps && (
        <aside className="dashboard-productivity-note"><span className="productivity-spark"><Icon name="spark" /></span><div><span>YOUR MOMENTUM</span><strong>{productivityInsight}</strong></div><Link className="text-link" to={getStatusCount(analytics, 'Interview') > 0 ? '/applications' : '/follow-ups'}>Take a look <Icon name="arrow" /></Link></aside>
      )}

      <section className="dashboard-section dashboard-analytics-section">
        <div className="dashboard-section-title"><div><p className="eyebrow">THE BIGGER PICTURE</p><h2>Application analytics</h2><p className="muted-text">Patterns across your search, all in one place.</p></div><Link className="text-link dashboard-heading-link" to="/analytics">Full analytics <Icon name="arrow" /></Link></div>
        {loading ? <div className="analytics-grid">{Array.from({ length: 4 }, (_, index) => <div className="card analytics-card analytics-skeleton" key={index}><span className="skeleton skeleton-label" /><span className="skeleton skeleton-chart" /></div>)}</div> : !loaded.analytics ? null : overview.totalApplications ? (
          <div className="analytics-grid">
            <DashboardChart title="Applications Over Time" description="Monthly applications · last 6 months" data={analytics.applicationsOverTime} labelKey="month" />
            <DashboardChart title="Applications by Status" data={analytics.applicationsByStatus} labelKey="status" />
            <DashboardChart title="Applications by Job Type" data={analytics.applicationsByJobType} labelKey="jobType" />
            <DashboardChart title="Applications by Work Mode" data={analytics.applicationsByWorkMode} labelKey="workMode" />
            <DashboardChart title="Interviews by Status" data={analytics.interviewsByStatus} labelKey="status" />
          </div>
        ) : (
          <div className="dashboard-empty analytics-empty-state"><span className="empty-icon"><Icon name="analytics" /></span><strong>Your insights will take shape here.</strong><p>Add applications to see patterns in your search.</p></div>
        )}
      </section>
    </main>
  );
};

export default DashboardPage;
