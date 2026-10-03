const PageLoadingSkeleton = ({ label }) => (
  <div className="card page-loading-skeleton" role="status" aria-label={label} aria-busy="true">
    <span className="skeleton page-skeleton-title" aria-hidden="true" />
    <div className="page-skeleton-grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="page-skeleton-field" key={index}>
          <span className="skeleton page-skeleton-label" />
          <span className="skeleton page-skeleton-value" />
        </div>
      ))}
    </div>
    <span className="skeleton page-skeleton-notes" aria-hidden="true" />
  </div>
);

export default PageLoadingSkeleton;
