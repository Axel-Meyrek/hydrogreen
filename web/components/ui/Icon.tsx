import type { ReactNode } from 'react';

const PATHS = {
  droplet: <path d="M12 2c4 5 7 8.5 7 12a7 7 0 0 1-14 0c0-3.5 3-7 7-12Z" />,
  thermometer: <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  cloud: <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4 1.5A4 4 0 0 0 6.5 19h11Z" />,
  leaf: (
    <>
      <path d="M5 13c0-5.2 4-9 12-9 0 8-3.8 12-9 12H5Z" />
      <path d="M5 20c0-3.5 2-6 5-7" />
    </>
  ),
  check: <path d="M4 12.5 9 17l11-11" />,
  gauge: (
    <>
      <path d="M4 14a8 8 0 1 1 16 0" />
      <path d="M12 14l4-5" />
      <path d="M12 18h.01" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21V10" />
      <path d="M12 10C12 6 9 4 5 4c0 4 3 6 7 6Z" />
      <path d="M12 13c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5Z" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9" />
    </>
  ),
  alertTriangle: (
    <>
      <path d="M12 3.5 21 19H3L12 3.5Z" />
      <path d="M12 9.5v4.5" />
      <path d="M12 17h.01" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </>
  ),
  arrowDown: (
    <>
      <path d="M12 5v14" />
      <path d="M18 13l-6 6-6-6" />
    </>
  ),
  fan: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10c0-4 1-7 4-7 2 0 3 2 2 4l-4 4" />
      <path d="M14 12c4 0 7 1 7 4 0 2-2 3-4 2l-4-4" />
      <path d="M12 14c0 4-1 7-4 7-2 0-3-2-2-4l4-4" />
      <path d="M10 12c-4 0-7-1-7-4 0-2 2-3 4-2l4 4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

export function BrandMark() {
  return (
    <span className="brand-mark">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13c0-5.2 4-9 12-9 0 8-3.8 12-9 12H5Z" />
        <path d="M5 20c0-3.5 2-6 5-7" />
      </svg>
    </span>
  );
}
