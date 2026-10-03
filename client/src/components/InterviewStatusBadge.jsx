const InterviewStatusBadge = ({ status }) => {
  const normalizedStatus = status || 'Scheduled';

  const statusClassMap = {
    Scheduled: 'status-badge scheduled',
    Completed: 'status-badge completed',
    Rescheduled: 'status-badge rescheduled',
    Cancelled: 'status-badge cancelled',
  };

  return <span className={statusClassMap[normalizedStatus] || 'status-badge scheduled'}>{normalizedStatus}</span>;
};

export default InterviewStatusBadge;
