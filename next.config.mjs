/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  serverExternalPackages: ['pdfjs-dist', 'sharp', 'tesseract.js', 'tesseract.js-core'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
