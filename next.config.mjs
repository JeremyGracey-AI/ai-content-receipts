/** @type {import('next').NextConfig} */
const nextConfig = {
  // c2pa-node ships a native (N-API) binding. Keep it out of the bundler so it
  // loads correctly from node_modules in server route handlers.
  serverExternalPackages: ["c2pa-node"],
};

export default nextConfig;
