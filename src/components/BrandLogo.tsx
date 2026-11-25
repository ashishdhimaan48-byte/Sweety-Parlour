interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = 'h-9 w-9' }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="2"
        y="2"
        width="40"
        height="40"
        rx="12"
        className="fill-[#7a1f3d]/10 dark:fill-[#e06d91]/12 stroke-[#7a1f3d]/35 dark:stroke-[#e06d91]/35"
        strokeWidth="1.25"
      />
      <path
        d="M12 33V20C12 14.4772 16.4772 10 22 10C27.5228 10 32 14.4772 32 20V33"
        className="stroke-[#7a1f3d] dark:stroke-[#e06d91]"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M22 14.5C20.2 17.5 20.2 21 22 23.5C23.8 21 23.8 17.5 22 14.5Z"
        className="fill-[#b68250] dark:fill-[#e4b887]"
      />
      <path
        d="M22 23.5C19.3 21.8 16.5 21.8 15 23.4C17.2 24.9 19.6 25 22 23.5Z"
        className="fill-[#7a1f3d]/75 dark:fill-[#e06d91]/80"
      />
      <path
        d="M22 23.5C24.7 21.8 27.5 21.8 29 23.4C26.8 24.9 24.4 25 22 23.5Z"
        className="fill-[#7a1f3d]/75 dark:fill-[#e06d91]/80"
      />
      <path
        d="M15.5 29.5H28.5"
        className="stroke-[#b68250] dark:stroke-[#e4b887]"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle
        cx="22"
        cy="32.5"
        r="1.35"
        className="fill-[#7a1f3d] dark:fill-[#e06d91]"
      />
    </svg>
  );
}
