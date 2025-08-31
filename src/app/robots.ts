import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard/',
        '/manage/',
        '/_next/',
        '/admin/',
        '/private/',
      ],
    },
    sitemap: 'https://ceesin.vercel.app/sitemap.xml',
    host: 'https://ceesin.vercel.app',
  }
}
