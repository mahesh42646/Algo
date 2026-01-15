// Frontend environment variables (client-side accessible)
// Only NEXT_PUBLIC_* variables are exposed to the browser
export const env = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'AlgoBot',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  BACKEND_URL: process.env.BACKEND_URL || 'https://algo.skylith.cloud/api',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://algo.skylith.cloud',
};
