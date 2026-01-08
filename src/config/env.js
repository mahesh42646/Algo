// Frontend environment variables (client-side accessible)
// Only NEXT_PUBLIC_* variables are exposed to the browser
export const env = {
  FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4040/api',
  PROJECT_NAME: process.env.NEXT_PUBLIC_PROJECT_NAME || 'AlgoBot',
};
