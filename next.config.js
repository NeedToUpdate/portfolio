/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["fra1.digitaloceanspaces.com"],
  },
};

module.exports = nextConfig;
