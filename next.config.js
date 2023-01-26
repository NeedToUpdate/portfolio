/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["fra1.digitaloceanspaces.com", "icandoathing.fra1.cdn.digitaloceanspaces.com", "media.licdn.com"],
    unoptimized: true,
  },
};

module.exports = nextConfig;
