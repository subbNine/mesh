const USER_PALETTE = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#0ca3ba', // teal
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#a855f7', // purple
  '#ec4899', // pink
];

export const getUserColor = (id: string | null | undefined): string => {
  if (!id) return '#a1a1aa'; // default gray
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_PALETTE[Math.abs(hash) % USER_PALETTE.length];
};
