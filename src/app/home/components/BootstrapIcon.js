'use client';

// Bootstrap-icon component
export default function BootstrapIcon({ name, className = "", ...props }) {
  return (
    <i className={`bi bi-${name} ${className}`} {...props} />
  );
}
