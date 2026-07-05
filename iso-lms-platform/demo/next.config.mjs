/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure the bundled sample document is included when the /api/extract route
  // is traced for a serverless deploy (it reads the file at runtime).
  outputFileTracingIncludes: {
    "/api/extract": ["./sample/**"],
  },
};

export default nextConfig;
