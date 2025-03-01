// Utility to generate a consistent color from a string (like an address)
export function stringToColor(string: string): string {
  let hash = 0;

  // Generate a simple hash from the string
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert the hash to a hex color
  let color = "#";
  for (let i = 0; i < 3; i++) {
    // Extract R, G, B components by shifting and masking
    const value = (hash >> (i * 8)) & 0xff;
    // Ensure colors are bright enough to be visible on dark backgrounds
    const brightness = Math.max(value, 100);
    color += brightness.toString(16).padStart(2, "0");
  }

  return color;
}

// Alternative function that generates colors from a predefined vibrant palette
export function stringToVibrantColor(string: string): string {
  // Vibrant color palette suitable for dark backgrounds
  const vibrantColors = [
    "#FF5252", // Red
    "#FF4081", // Pink
    "#E040FB", // Purple
    "#7C4DFF", // Deep Purple
    "#536DFE", // Indigo
    "#448AFF", // Blue
    "#40C4FF", // Light Blue
    "#18FFFF", // Cyan
    "#64FFDA", // Teal
    "#69F0AE", // Green
    "#B2FF59", // Light Green
    "#EEFF41", // Lime
    "#FFFF00", // Yellow
    "#FFD740", // Amber
    "#FFAB40", // Orange
    "#FF6E40", // Deep Orange
  ];

  // Create a simple hash from the string
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to pick a color from the palette
  const index = Math.abs(hash) % vibrantColors.length;
  return vibrantColors[index];
}
