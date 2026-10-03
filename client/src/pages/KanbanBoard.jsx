import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KanbanApplicationCard from '../components/KanbanApplicationCard';
import { useAuth } from '../context/useAuth';
import { deleteApplication, getApplications, updateApplicationStatus } from '../services/api';

const KANBAN_STATUSES = ['Saved', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];

const normalizeSortValue = (application, sortBy) => {
  if (sortBy === 'companyName') {
    return (application.companyName || '').toLowerCase();
  }

  return new Date(application.applicationDate || 0).getTime();
};

const KanbanBoard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [sortBy, setSortBy] = useState('applicationDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({ type: '', text: '' });
  const [draggedApplicationId, setDraggedApplicationId] = useState(null);
  const [dropTargetStatus, setDropTargetStatus] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBoardApplications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getApplications({ limit: 1000, sortBy: 'applicationDate', sortOrder: 'desc' }, token);
      setApplications(response.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load the board');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeoutId = setTimeout(fetchBoardApplications, 0);
    return () => clearTimeout(timeoutId);
  }, [fetchBoardApplications]);

  useEffect(() => {
    if (!notification.text) return undefined;

    const timeoutId = setTimeout(() => {
      setNotification({ type: '', text: '' });
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [notification]);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = applications.filter((application) => {
      const matchesSearch =
        !normalizedSearch ||
        (application.companyName || '').toLowerCase().includes(normalizedSearch) ||
        (application.jobTitle || '').toLowerCase().includes(normalizedSearch);

      const matchesJobType = !jobType || application.jobType === jobType;
      const matchesWorkMode = !workMode || application.workMode === workMode;

      return matchesSearch && matchesJobType && matchesWorkMode;
    });

    return [...filtered].sort((first, second) => {
      const firstValue = normalizeSortValue(first, sortBy);
      const secondValue = normalizeSortValue(second, sortBy);

      if (sortBy === 'companyName') {
        const comparison = String(firstValue).localeCompare(String(secondValue));
        return sortOrder === 'asc' ? comparison : comparison * -1;
      }

      const comparison = firstValue > secondValue ? 1 : firstValue < secondValue ? -1 : 0;
      return sortOrder === 'asc' ? comparison : comparison * -1;
    });
  }, [applications, jobType, search, sortBy, sortOrder, workMode]);

  const boardColumns = useMemo(() => {
    const grouped = Object.fromEntries(KANBAN_STATUSES.map((status) => [status, []]));

    filteredApplications.forEach((application) => {
      if (grouped[application.status]) {
        grouped[application.status].push(application);
      }
    });

    return grouped;
  }, [filteredApplications]);

  const handleNotification = (type, text) => {
    setNotification({ type, text });
  };

  const handleStatusUpdate = async (applicationId, nextStatus, previousStatus) => {
    const currentApplication = applications.find((application) => application._id === applicationId);

    if (!currentApplication || currentApplication.status === nextStatus) {
      return;
    }

    setUpdatingId(applicationId);
    setApplications((current) =>
      current.map((application) =>
        application._id === applicationId ? { ...application, status: nextStatus } : application
      )
    );

    try {
      const response = await updateApplicationStatus(applicationId, nextStatus, token);
      setApplications((current) =>
        current.map((application) =>
          application._id === applicationId ? { ...application, ...(response.data || {}) } : application
        )
      );
      handleNotification('success', 'Application status updated.');
    } catch (err) {
      setApplications((current) =>
        current.map((application) =>
          application._id === applicationId ? { ...application, status: previousStatus } : application
        )
      );
      handleNotification('error', err.message || 'Unable to update application status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (applicationId) => {
    const targetApplication = applications.find((application) => application._id === applicationId);

    if (!targetApplication) return;

    try {
      await deleteApplication(applicationId, token);
      setApplications((current) => current.filter((application) => application._id !== applicationId));
      handleNotification('success', 'Application deleted.');
    } catch (err) {
      handleNotification('error', err.message || 'Unable to delete application.');
    }
  };

  const handleDrop = (targetStatus) => {
    if (!draggedApplicationId) {
      return;
    }

    const draggedApplication = applications.find((application) => application._id === draggedApplicationId);

    if (!draggedApplication || draggedApplication.status === targetStatus) {
      setDraggedApplicationId(null);
      setDropTargetStatus(null);
      return;
    }

    handleStatusUpdate(draggedApplicationId, targetStatus, draggedApplication.status);
    setDraggedApplicationId(null);
    setDropTargetStatus(null);
  };

  const clearFilters = () => {
    setSearch('');
    setJobType('');
    setWorkMode('');
    setSortBy('applicationDate');
    setSortOrder('desc');
  };

  return (
    <section className="page-shell core-page kanban-shell">
      {notification.text && <div className={`toast ${notification.type === 'error' ? 'error-toast' : 'success-toast'}`} role={notification.type === 'error' ? 'alert' : 'status'} aria-live={notification.type === 'error' ? 'assertive' : 'polite'}>{notification.text}</div>}

      <div className="page-header-row">
        <div>
          <p className="eyebrow">HIRING JOURNEY</p>
          <h1>Application Pipeline</h1>
          <p className="muted-text">Move opportunities through your hiring journey.</p>
        </div>

        <div className="header-actions">
          <button type="button" className="secondary-btn" onClick={() => navigate('/applications')}>
            List View
          </button>
          <button type="button" className="primary-btn" onClick={() => navigate('/applications/new')}>
            + Add Application
          </button>
        </div>
      </div>

      <div className="card filter-panel">
        <div className="filter-grid kanban-filter-grid">
          <input
            type="text"
            aria-label="Search applications on the board"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search applications"
            className="form-input"
          />

          <select value={jobType} onChange={(event) => setJobType(event.target.value)} className="form-select">
            <option value="">All job types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
            <option value="Temporary">Temporary</option>
            <option value="Other">Other</option>
          </select>

          <select value={workMode} onChange={(event) => setWorkMode(event.target.value)} className="form-select">
            <option value="">All work modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="form-select">
            <option value="applicationDate">Sort by Application Date</option>
            <option value="companyName">Sort by Company Name</option>
          </select>

          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="form-select">
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <button type="button" className="secondary-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      {loading ? (
        <div className="kanban-board kanban-loading-board" aria-label="Loading application pipeline">
          {KANBAN_STATUSES.map((status) => <div className="kanban-column" key={status}><div className="kanban-column-header"><h3>{status}</h3><span className="skeleton kanban-count-skeleton" /></div><div className="kanban-skeleton-card skeleton" /><div className="kanban-skeleton-card skeleton" /></div>)}
        </div>
      ) : error && applications.length === 0 ? (
        <div className="card core-empty-state"><span className="core-empty-icon" aria-hidden="true">!</span><h3>Pipeline unavailable</h3><p>{error}</p><button type="button" className="secondary-btn" onClick={fetchBoardApplications}>Retry</button></div>
      ) : filteredApplications.length === 0 ? (
        <div className="card empty-state core-empty-state">
          <span className="core-empty-icon" aria-hidden="true">↗</span>
          <h3>{applications.length ? 'No applications match these filters' : 'Your pipeline starts here'}</h3>
          <p>{applications.length ? 'Adjust your search or filters to see more opportunities.' : 'Add an application to start building your hiring journey.'}</p>
          {applications.length ? <button type="button" className="secondary-btn" onClick={clearFilters}>Clear Filters</button> : <button type="button" className="primary-btn" onClick={() => navigate('/applications/new')}>+ Add Application</button>}
        </div>
      ) : (
        <div className="kanban-board">
          {KANBAN_STATUSES.map((status) => {
            const columnApplications = boardColumns[status] || [];

            return (
              <div
                key={status}
                className={`kanban-column kanban-column-${status.toLowerCase()} ${dropTargetStatus === status ? 'is-drop-target' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropTargetStatus(status);
                }}
                onDragLeave={() => setDropTargetStatus((current) => (current === status ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(status);
                }}
              >
                <div className="kanban-column-header">
                  <h3>{status}</h3>
                  <span>{columnApplications.length}</span>
                </div>

                <div className="kanban-column-body">
                  {columnApplications.length === 0 ? (
                    <div className="kanban-empty-state">No applications</div>
                  ) : (
                    columnApplications.map((application) => (
                      <KanbanApplicationCard
                        key={application._id}
                        application={application}
                        isUpdating={updatingId === application._id}
                        isDragging={draggedApplicationId === application._id}
                        onDragStart={(event) => {
                          if (!event.dataTransfer) return;
                          event.dataTransfer.setData('text/plain', application._id);
                          event.dataTransfer.effectAllowed = 'move';
                          setDraggedApplicationId(application._id);
                        }}
                        onDragEnd={() => {
                          setDraggedApplicationId(null);
                          setDropTargetStatus(null);
                        }}
                        onOpenDetails={(id) => navigate(`/applications/${id}`)}
                        onEdit={(id) => navigate(`/applications/${id}/edit`)}
                        onDelete={handleDelete}
                        onStatusChange={(id, nextStatus) => {
                          const previousStatus = applications.find((application) => application._id === id)?.status;
                          if (previousStatus) {
                            handleStatusUpdate(id, nextStatus, previousStatus);
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default KanbanBoard;
