export const palette = {
  mist50: "#F4F6F5",
  mist100: "#E8EEEC",
  mist200: "#D5DFDC",
  ink950: "#121816",
  ink900: "#1A221F",
  ink800: "#24302C",
  ink700: "#33403B",
  moss500: "#1F7A66",
  moss400: "#2F9A82",
  moss300: "#5BB89F",
  slate500: "#5B6B66",
  slate400: "#7A8A85",
  slate300: "#9AABA5",
  success: "#2F8F6B",
  danger: "#B4233B",
  borderLight: "rgba(18, 24, 22, 0.08)",
  borderDark: "rgba(244, 246, 245, 0.1)",
} as const;

export type ThemeColors = {
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentMuted: string;
  border: string;
  heroBackground: string;
  tabBar: string;
  tabBarBorder: string;
  checkComplete: string;
  checkPending: string;
  highlight: string;
  surface: string;
  glow: string;
};

export const lightColors: ThemeColors = {
  background: palette.mist50,
  backgroundSecondary: "rgba(255, 255, 255, 0.62)",
  surface: "#FFFFFF",
  text: palette.ink950,
  textSecondary: palette.slate500,
  textTertiary: palette.slate300,
  accent: palette.moss500,
  accentMuted: palette.moss400,
  border: palette.borderLight,
  heroBackground: "rgba(255, 255, 255, 0.55)",
  tabBar: "rgba(255, 255, 255, 0.72)",
  tabBarBorder: palette.borderLight,
  checkComplete: palette.success,
  checkPending: palette.slate300,
  highlight: "rgba(31, 122, 102, 0.1)",
  glow: "rgba(47, 154, 130, 0.18)",
};

export const darkColors: ThemeColors = {
  background: palette.ink950,
  backgroundSecondary: "rgba(36, 48, 44, 0.72)",
  surface: palette.ink800,
  text: palette.mist50,
  textSecondary: palette.slate300,
  textTertiary: palette.slate400,
  accent: palette.moss300,
  accentMuted: palette.moss400,
  border: palette.borderDark,
  heroBackground: "rgba(36, 48, 44, 0.66)",
  tabBar: "rgba(26, 34, 31, 0.82)",
  tabBarBorder: palette.borderDark,
  checkComplete: palette.moss300,
  checkPending: palette.slate400,
  highlight: "rgba(91, 184, 159, 0.14)",
  glow: "rgba(91, 184, 159, 0.16)",
};
