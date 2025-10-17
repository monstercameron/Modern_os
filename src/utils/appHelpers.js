export function clearBadgeState(badges, id) {
  if (badges && Object.prototype.hasOwnProperty.call(badges, id)) {
    return { ...badges, [id]: 0 };
  }
  return badges;
}

export function acc(color) {
  if (color.includes("sky")) return "bg-sky-700";
  if (color.includes("rose")) return "bg-rose-700";
  if (color.includes("amber")) return "bg-amber-700";
  if (color.includes("emerald")) return "bg-emerald-700";
  if (color.includes("indigo")) return "bg-indigo-700";
  if (color.includes("purple")) return "bg-purple-700";
  if (color.includes("teal")) return "bg-teal-700";
  if (color.includes("zinc")) return "bg-zinc-800";
  return "bg-slate-800";
}
