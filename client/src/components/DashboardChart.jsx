const DashboardChart = ({ title, data = [], labelKey, valueKey = 'count', description }) => {
  const maximum = Math.max(...data.map((item) => Number(item[valueKey]) || 0), 1);

  return (
    <section className="card analytics-card" aria-label={title}>
      <div className="analytics-card-heading">
        <h2>{title}</h2>
        {description && <p className="muted-text">{description}</p>}
      </div>
      {data.length === 0 ? (
        <p className="analytics-empty">No data yet.</p>
      ) : (
        <div className="analytics-bars" role="list" aria-label={`${title} data`}>
          {data.map((item, index) => {
            const value = Number(item[valueKey]) || 0;
            const label = [item[labelKey], item.year].filter(Boolean).join(' ');
            return (
              <div className="analytics-bar-row" role="listitem" key={`${label}-${index}`}>
                <span className="analytics-bar-label" title={label}>{label}</span>
                <div className="analytics-bar-track" aria-hidden="true">
                  <span className="analytics-bar-fill" style={{ width: `${(value / maximum) * 100}%` }} />
                </div>
                <strong className="analytics-bar-value">{value}</strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default DashboardChart;
