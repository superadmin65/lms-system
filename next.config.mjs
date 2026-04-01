/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',

  basePath: '/lms-system',
  assetPrefix: '/lms-system',

  // ⭐⭐⭐ REQUIRED FOR HYDRATION FIX
  compiler: {
    styledComponents: true,
  },

  images: {
    unoptimized: true,
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/lms-system',
        basePath: false,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
