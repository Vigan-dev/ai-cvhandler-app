import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({
  size = 20,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const Icons = {
  grid: (props: IconProps) => (
    <IconBase {...props}>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </IconBase>
  ),
  upload: (props: IconProps) => (
    <IconBase {...props}>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </IconBase>
  ),
  users: (props: IconProps) => (
    <IconBase {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
  ),
  chart: (props: IconProps) => (
    <IconBase {...props}>
      <path d="M3 3v18h18" />
      <path d="m7 16 4-5 4 3 5-7" />
    </IconBase>
  ),
  search: (props: IconProps) => (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </IconBase>
  ),
  bell: (props: IconProps) => (
    <IconBase {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </IconBase>
  ),
  sun: (props: IconProps) => (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </IconBase>
  ),
  moon: (props: IconProps) => (
    <IconBase {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </IconBase>
  ),
  chevronDown: (props: IconProps) => (
    <IconBase {...props}><path d="m6 9 6 6 6-6" /></IconBase>
  ),
  arrowUp: (props: IconProps) => (
    <IconBase {...props}><path d="m18 15-6-6-6 6" /></IconBase>
  ),
  arrowRight: (props: IconProps) => (
    <IconBase {...props}><path d="M5 12h14M13 6l6 6-6 6" /></IconBase>
  ),
  file: (props: IconProps) => (
    <IconBase {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </IconBase>
  ),
  more: (props: IconProps) => (
    <IconBase {...props}>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  ),
  check: (props: IconProps) => (
    <IconBase {...props}><path d="m5 12 4 4L19 6" /></IconBase>
  ),
  close: (props: IconProps) => (
    <IconBase {...props}><path d="M18 6 6 18M6 6l12 12" /></IconBase>
  ),
  lock: (props: IconProps) => (
    <IconBase {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </IconBase>
  ),
  filter: (props: IconProps) => (
    <IconBase {...props}><path d="M4 6h16M7 12h10M10 18h4" /></IconBase>
  ),
  briefcase: (props: IconProps) => (
    <IconBase {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </IconBase>
  ),
  graduation: (props: IconProps) => (
    <IconBase {...props}>
      <path d="m2 10 10-5 10 5-10 5Z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5M22 10v6" />
    </IconBase>
  ),
  sparkles: (props: IconProps) => (
    <IconBase {...props}>
      <path d="m12 3-1.2 3.3L7.5 7.5l3.3 1.2L12 12l1.2-3.3 3.3-1.2-3.3-1.2Z" />
      <path d="m19 14-.7 1.8-1.8.7 1.8.7L19 19l.7-1.8 1.8-.7-1.8-.7Z" />
      <path d="m5 15-.7 1.8-1.8.7 1.8.7L5 20l.7-1.8 1.8-.7-1.8-.7Z" />
    </IconBase>
  ),
  mail: (props: IconProps) => (
    <IconBase {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></IconBase>
  ),
  phone: (props: IconProps) => (
    <IconBase {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.3 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" /></IconBase>
  ),
  location: (props: IconProps) => (
    <IconBase {...props}><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></IconBase>
  ),
  menu: (props: IconProps) => (
    <IconBase {...props}><path d="M4 6h16M4 12h16M4 18h16" /></IconBase>
  ),
  download: (props: IconProps) => (
    <IconBase {...props}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></IconBase>
  ),
  plus: (props: IconProps) => (
    <IconBase {...props}><path d="M12 5v14M5 12h14" /></IconBase>
  ),
  settings: (props: IconProps) => (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.2.37.3.7.6 1 .3.3.7.4 1.1.4h.1v4h-.1a1.7 1.7 0 0 0-1.7.6Z" />
    </IconBase>
  ),
};
