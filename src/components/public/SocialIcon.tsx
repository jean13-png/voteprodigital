interface SocialIconProps {
  label: string;
  href: string;
  svg: string;
}

export default function SocialIcon({ label, href, svg }: SocialIconProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 bg-white/10 hover:bg-[#F5A623] flex items-center justify-center transition-colors"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d={svg} />
      </svg>
    </a>
  );
}
