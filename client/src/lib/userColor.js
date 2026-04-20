/**
 * Generates a consistent, vibrant color for a user ID.
 */
export const getUserColor = (userId) => {
  if (!userId) return '#ffffff';
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use HSL for vibrant, consistent saturation and lightness
  const h = Math.abs(hash) % 360;
  const s = 70; // 70% saturation
  const l = 60; // 60% lightness
  
  return `hsl(${h}, ${s}%, ${l}%)`;
};
