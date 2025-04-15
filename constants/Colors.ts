/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// Define our app-specific color palette
const palette = {
  primary: '#4a90e2',      // Blue (Parent actions, links)
  secondary: '#50e3c2',    // Teal/Green (Child actions, positive feedback)
  accent: '#f5a623',       // Orange (Highlights, calls to action)
  danger: '#d9534f',       // Red (Logout, errors)
  lightGray: '#f0f4f7',    // Backgrounds
  mediumGray: '#888',     // Placeholder text
  darkGray: '#333',        // Primary text
  white: '#fff',
};

export const Colors = {
  light: {
    text: palette.darkGray,
    background: palette.lightGray,
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Add our palette to be accessible via useColorScheme()
    primary: palette.primary,
    secondary: palette.secondary,
    accent: palette.accent,
    danger: palette.danger,
    backgroundStrong: palette.white, // e.g., for input backgrounds
    placeholder: palette.mediumGray,
  },
  dark: {
    // Basic dark theme mapping (can be refined later)
    text: palette.lightGray,
    background: '#151718', // Keep existing dark background
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Add our palette (maybe adjust for dark mode later)
    primary: palette.primary,
    secondary: palette.secondary,
    accent: palette.accent,
    danger: palette.danger,
    backgroundStrong: palette.darkGray, // Darker input backgrounds
    placeholder: palette.mediumGray,
  },
};
