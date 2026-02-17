import React from "react";

const DevModeBanner: React.FC = () => {
  return (
    <div
      className="announcement-bar sticky top-0 z-50"
      role="status"
      aria-live="polite"
    >
      <p className="container-custom">
        Development notice: This website is still in development. Payments are
        demo only, and no orders will be delivered.
      </p>
    </div>
  );
};

export default DevModeBanner;
