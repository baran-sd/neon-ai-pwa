import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NeonAI',
    short_name: 'NeonAI',
    description: 'AI Image Generation with Neon Noir aesthetic.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a1a2e',
    theme_color: '#1a1a2e',
    icons: [
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
