import type { HTMLAttributes } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const BLUE = 'rgb(37, 99, 235)'
const BLUE_50 = 'rgba(37, 99, 235, 0.5)'
const BLUE_60 = 'rgba(37, 99, 235, 0.6)'
const BLUE_40 = 'rgba(37, 99, 235, 0.4)'

interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: {
    container: 'size-20',
    titleClass: 'text-sm/tight font-medium',
    subtitleClass: 'text-xs/relaxed',
    spacing: 'space-y-2',
    maxWidth: 'max-w-48',
  },
  md: {
    container: 'size-32',
    titleClass: 'text-base/snug font-medium',
    subtitleClass: 'text-sm/relaxed',
    spacing: 'space-y-3',
    maxWidth: 'max-w-56',
  },
  lg: {
    container: 'size-40',
    titleClass: 'text-lg/tight font-semibold',
    subtitleClass: 'text-base/relaxed',
    spacing: 'space-y-4',
    maxWidth: 'max-w-64',
  },
}

interface RingProps {
  rotate: number
  duration: number
  ease: 'linear' | [number, number, number, number]
  background: string
  mask: string
  opacity: number
}

function Ring({ rotate, duration, ease, background, mask, opacity }: RingProps) {
  return (
    <motion.div
      animate={{ rotate: [0, rotate] }}
      className="absolute inset-0 rounded-full"
      style={{
        background,
        mask,
        WebkitMask: mask,
        opacity,
      }}
      transition={{
        duration,
        repeat: Number.POSITIVE_INFINITY,
        ease,
      }}
    />
  )
}

export function Loader({
  title = 'Getting things ready...',
  subtitle = 'Please wait while we load your local data',
  size = 'md',
  className,
  ...props
}: LoaderProps) {
  const config = sizeConfig[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-8 bg-white p-8',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      {...props}
    >
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        className={cn('relative', config.container)}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: [0.4, 0, 0.6, 1],
        }}
      >
        <Ring
          rotate={360}
          duration={3}
          ease="linear"
          opacity={0.8}
          background={`conic-gradient(from 0deg, transparent 0deg, ${BLUE} 90deg, transparent 180deg)`}
          mask="radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)"
        />
        <Ring
          rotate={360}
          duration={2.5}
          ease={[0.4, 0, 0.6, 1]}
          opacity={0.9}
          background={`conic-gradient(from 0deg, transparent 0deg, ${BLUE} 120deg, ${BLUE_50} 240deg, transparent 360deg)`}
          mask="radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)"
        />
        <Ring
          rotate={-360}
          duration={4}
          ease={[0.4, 0, 0.6, 1]}
          opacity={0.35}
          background={`conic-gradient(from 180deg, transparent 0deg, ${BLUE_60} 45deg, transparent 90deg)`}
          mask="radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)"
        />
        <Ring
          rotate={360}
          duration={3.5}
          ease="linear"
          opacity={0.5}
          background={`conic-gradient(from 270deg, transparent 0deg, ${BLUE_40} 20deg, transparent 40deg)`}
          mask="radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)"
        />
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={cn('text-center', config.spacing, config.maxWidth)}
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.4, duration: 1, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            config.titleClass,
            'font-medium leading-[1.15] tracking-[-0.02em] text-slate-900 antialiased',
          )}
          initial={{ opacity: 0, y: 12 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.span
            animate={{ opacity: [0.9, 0.7, 0.9] }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: [0.4, 0, 0.6, 1],
            }}
          >
            {title}
          </motion.span>
        </motion.h1>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            config.subtitleClass,
            'font-normal leading-[1.45] tracking-[-0.01em] text-slate-500 antialiased',
          )}
          initial={{ opacity: 0, y: 8 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.span
            animate={{ opacity: [0.6, 0.4, 0.6] }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: [0.4, 0, 0.6, 1],
            }}
          >
            {subtitle}
          </motion.span>
        </motion.p>
      </motion.div>
    </div>
  )
}

export default Loader
