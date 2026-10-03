import { useState } from 'react';
import StatusBadge from './StatusBadge';
import { formatDateOnly } from '../utils/date';

const STATUS_OPTIONS = ['Saved', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

const formatDate = (value) => {
  if (!value) return '—';
  return formatDateOnly(value);
};

const KanbanApplicationCard = ({
  application,
  isUpdating,
  isDragging,
  onDragStart,
  onDragEnd,
  onOpenDetails,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = () => {
    if (isDragging) return;
    onOpenDetails(application._id);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    const confirmed = window.confirm('Delete this application?\n\nThis action cannot be undone.');
    if (confirmed) {
      onDelete(application._id);
    }
  };

  return (
    <article
      className={`kanban-card ${isUpdating ? 'is-updating' : ''} ${isDragging ? 'is-dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      aria-label={`${application.companyName} ${application.jobTitle} card`}
    >
      <div className="kanban-card-header">
        <div className="kanban-company-block">
          <div className="kanban-company-name">{application.companyName}</div>
          <div className="kanban-job-title">{application.jobTitle}</div>
        </div>

        <button
          type="button"
          className="kanban-menu-button"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
          aria-label={`Open actions for ${application.companyName}`}
        >
          ⋮
        </button>
      </div>

      {menuOpen && (
        <div className="kanban-menu" onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => { setMenuOpen(false); onOpenDetails(application._id); }}>
            View Details
          </button>
          <button type="button" onClick={() => { setMenuOpen(false); onEdit(application._id); }}>
            Edit
          </button>
          <button type="button" onClick={handleDelete}>
            Delete
          </button>
          <div className="kanban-status-menu">
            <span>Change Status</span>
            <div className="kanban-status-options">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={application.status === status ? 'active' : ''}
                  onClick={() => {
                    setMenuOpen(false);
                    onStatusChange(application._id, status);
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="kanban-card-meta">
        <span>{application.location || 'Location not specified'}</span>
        <span>{application.workMode || 'Work mode not specified'}</span>
      </div>

      <div className="kanban-card-row">
        <span>Applied</span>
        <strong>{formatDate(application.applicationDate)}</strong>
      </div>

      {application.salary && (
        <div className="kanban-card-row">
          <span>Salary</span>
          <strong>{application.salary}</strong>
        </div>
      )}

      {application.followUpDate && (
        <div className="kanban-card-row">
          <span>Follow-up</span>
          <strong>{formatDate(application.followUpDate)}</strong>
        </div>
      )}

      <div className="kanban-card-footer">
        <StatusBadge status={application.status} />
        {isUpdating && <span className="kanban-updating-text">Updating...</span>}
      </div>
    </article>
  );
};

export default KanbanApplicationCard;
