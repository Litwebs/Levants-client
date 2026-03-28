import React from "react";

const DevModeBanner: React.FC = () => {
  return (
    <div
      className="announcement-bar sticky top-0 z-50"
      role="status"
      aria-live="polite"
    >
      <p className="container-custom">
        Website is under development — no orders are expected to arrive.
      </p>
    </div>
  );
};

export default DevModeBanner;
