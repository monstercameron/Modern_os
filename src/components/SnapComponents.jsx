export function SnapCell({ onClick, className = "", ariaLabel = "", children }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`px-3 py-3 bg-white/10 hover:bg-white/20 border border-white/20 grid place-items-center ${className}`}
    >
      {children}
    </button>
  );
}

export function SnapIcon({ type }) {
  const W = 48, H = 32;
  const base = "fill='none' stroke='white' stroke-opacity='0.3' stroke-width='2'";
  const hi = "fill='white' fill-opacity='0.35'";
  const rect = (x,y,w,h) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' ${hi}/>`;
  let mark = "";
  if (type === "full")   mark = rect(0,0,W,H);
  if (type === "left")   mark = rect(0,0,W/2,H);
  if (type === "right")  mark = rect(W/2,0,W/2,H);
  if (type === "top")    mark = rect(0,0,W,H/2);
  if (type === "bottom") mark = rect(0,H/2,W,H/2);
  if (type === "tl")     mark = rect(0,0,W/2,H/2);
  if (type === "tr")     mark = rect(W/2,0,W/2,H/2);
  if (type === "bl")     mark = rect(0,H/2,W/2,H/2);
  if (type === "br")     mark = rect(W/2,H/2,W/2,H/2);
  const svg = `
    <svg viewBox='0 0 ${W} ${H}' width='24' height='18' xmlns='http://www.w3.org/2000/svg'>
      <rect x='0' y='0' width='${W}' height='${H}' ${base}/>
      <line x1='${W/2}' y1='0' x2='${W/2}' y2='${H}' ${base}/>
      <line x1='0' y1='${H/2}' x2='${W}' y2='${H/2}' ${base}/>
      ${mark}
    </svg>`;
  return <span dangerouslySetInnerHTML={{ __html: svg }} />;
}