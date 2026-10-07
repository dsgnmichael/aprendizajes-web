/** Async feature bundle for `<LazyMotion features={loadMotionFeatures}>`. */
export const loadMotionFeatures = () => import('./motion-features').then((mod) => mod.default)
