const StatusBadge = ({ status }) => {
  const normalizedStatus = status || 'Saved';

  const statusClassMap = {
    Saved: 'status-badge saved',
    Applied: 'status-badge applied',
    Screening: 'status-badge screening',
    Interview: 'status-badge interview',
    Offer: 'status-badge offer',
    Rejected: 'status-badge rejected',
    Withdrawn: 'status-badge withdrawn',
  };

  return <span className={statusClassMap[normalizedStatus] || 'status-badge saved'}>{normalizedStatus}</span>;
};

export default StatusBadge;
