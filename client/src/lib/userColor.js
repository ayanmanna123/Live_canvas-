/**
 * Generates a consistent, vibrant color for a user ID.
 * Uses a more robust hashing algorithm to avoid collisions.
 */
export const getUserColor = (userId) => {
  // If no userId, return a neutral gray to indicate missing data
  if (!userId || userId === 'anonymous') return '#94a3b8'; 
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    // DJB2 hash-like approach
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Use a variety of shifts to scramble the bits more for better color distribution
  // Multiply by a large prime to ensure even small differences in hash result in widely different hues
  const hue = (Math.abs(hash * 137) % 360);
  const saturation = 75 + (Math.abs(hash >> 8) % 15); // 75-90%
  const lightness = 60 + (Math.abs(hash >> 16) % 5); // 60-65%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
