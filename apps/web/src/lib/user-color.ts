const PALETTE = ['#E85D75', '#5D9AE8', '#E8B45D', '#5DE87A', '#B45DE8', '#5DD4E8', '#E8725D', '#5DE8C1'];

/**
 * Generates a consistent color for a given user ID.
 * @param userId The ID of the user.
 * @returns A hex color string from the predefined palette.
 */
export function getUserColor(userId: string): string {
  if (!userId) return PALETTE[0];
  // Hash the userId string to a palette index
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length];
}
