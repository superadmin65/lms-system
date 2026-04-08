/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',

  // ⭐⭐⭐ REQUIRED FOR HYDRATION FIX
  compiler: {
    styledComponents: true,
  },

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
