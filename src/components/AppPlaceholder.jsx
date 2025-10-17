export function AppPlaceholder({ emoji, title, description }) {
  return (
    <div className="w-full h-full p-6 flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--theme-background)' }}>
      <div className="text-6xl mb-4">{emoji}</div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text)' }}>{title}</h2>
      <p className="text-center max-w-md" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
        {description}
      </p>
    </div>
  );
}
