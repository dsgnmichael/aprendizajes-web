import next from '@repo/eslint-config/next'

const config = [
  ...next,
  {
    rules: {
      // The public site deliberately navigates between pages as documents
      // (static pages + cross-document View Transitions + Speculation Rules),
      // which is also robust right after on-demand cache invalidations.
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
]

export default config
