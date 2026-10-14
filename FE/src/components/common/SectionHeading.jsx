export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = true,
  variant = 'dark',
}) {
  const isLight = variant === 'light';

  return (
    <div className={`mb-10 ${center ? 'text-center' : ''}`}>
      {eyebrow && (
        <span
          className={`mb-2 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
            isLight ? 'bg-white/10 text-blue-200' : 'bg-brand-50 text-brand-600'
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl ${
          isLight ? 'text-white' : 'text-gray-900'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mx-auto mt-2 max-w-xl text-sm ${
            isLight ? 'text-blue-200' : 'text-gray-500'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
