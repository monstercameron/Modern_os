export function AppShell({ icon, title, description, accentColor = "var(--theme-accent)" }) {
  return (
    <div 
      className="w-full h-full p-6 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--theme-surface)' }}
    >
      <div className="text-6xl mb-4">{icon}</div>
      <h2 
        className="text-2xl font-bold mb-2"
        style={{ color: accentColor }}
      >
        {title}
      </h2>
      <p 
        className="text-center max-w-md"
        style={{ color: 'var(--theme-text)' }}
      >
        {description}
      </p>
    </div>
  );
}
