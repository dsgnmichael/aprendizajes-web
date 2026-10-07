import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { baseRules } from './base.js'

export default [
  { ignores: ['.next/**', 'next-env.d.ts', 'node_modules/**', 'coverage/**'] },
  ...nextVitals,
  ...nextTs,
  { rules: baseRules },
]
