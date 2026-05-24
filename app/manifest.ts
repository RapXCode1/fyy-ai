import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FYY-AI Intelligence Platform',
    short_name: 'FYY-AI',
    description: 'Advanced AI Intelligence Platform by RapXCode',
    start_url: '/chat',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#0ea5e9',
    icons: [
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
