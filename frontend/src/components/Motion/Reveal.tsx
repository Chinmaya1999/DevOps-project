import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface RevealProps {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
}

/** Fades + lifts children into view once, respecting prefers-reduced-motion. */
export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, y = 28, className }) => {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export const CountUp: React.FC<{ to: number; suffix?: string; duration?: number }> = ({ to, suffix = '', duration = 1.6 }) => {
  const ref = React.useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const [val, setVal] = React.useState(reduce ? to : 0)
  React.useEffect(() => {
    if (reduce || !ref.current) return
    const el = ref.current
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min((t - t0) / (duration * 1000), 1)
        setVal(Math.round(to * (1 - Math.pow(1 - p, 3))))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration, reduce])
  return <span ref={ref}>{val}{suffix}</span>
}
