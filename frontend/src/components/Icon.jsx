const paths = {
  chevron: 'M6 4l4 4-4 4',
  plus: 'M8 3v10M3 8h10',
  page: 'M4 2h5l3 3v9H4zM9 2v3h3',
  folder: 'M2 4h4l1.5 1.5H14V13H2z',
};

export default function Icon({ name, size = 16, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
