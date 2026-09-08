/** نشان برند نسق — سه ستون صعودی، نماد رشد و نظم مالی */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <span className="logo-mark" aria-hidden>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3.5" y="12.5" width="3.6" height="7" rx="1.8" fill="currentColor" opacity="0.62" />
        <rect x="10.2" y="8.5" width="3.6" height="11" rx="1.8" fill="currentColor" opacity="0.8" />
        <rect x="16.9" y="4" width="3.6" height="15.5" rx="1.8" fill="currentColor" />
      </svg>
    </span>
  );
}
