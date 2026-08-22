/** @type {import('next').NextConfig} */
const nextConfig = {
  // The previous config suppressed type errors during builds. The codebase now
  // type-checks cleanly, so let the build fail loudly if that stops being true.
  images: {
    // Project screenshots are 400–800KB PNGs; letting Next resize and serve
    // AVIF/WebP is the single largest win available on this page.
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
