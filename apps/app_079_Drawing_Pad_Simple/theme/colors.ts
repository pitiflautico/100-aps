/**
 * Standard color palette used across all 100 apps
 */

export const colors = {
  primary: '#4A6CF7',
  secondary: '#F7C948',
  background: '#FFFFFF',
  text: '#1A1A1A',
  accent: '#36CFC9',

  // Additional colors
  gray: {
    light: '#F5F5F5',
    medium: '#CCCCCC',
    dark: '#666666',
  },

  status: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },

  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

export type ColorScheme = typeof colors;
