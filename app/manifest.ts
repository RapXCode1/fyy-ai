import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FYY-AI Intelligence Platform',
    short_name: 'FYY-AI',
    description: 'Advanced AI Intelligence Platform by RapXCode',
    start_url: '/chat',
    display: 'standalone',
    background_color: '#08080A',
    theme_color: '#E11D48',
    icons: [
      {
        src: '/logo-nobg.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
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
