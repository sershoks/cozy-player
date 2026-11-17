import type { SVGProps } from 'react'

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props
})

export const PlayIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)} fill="currentColor" stroke="none">
    <path d="M7 4.5v15l13-7.5-13-7.5Z" />
  </svg>
)

export const PauseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)} fill="currentColor" stroke="none">
    <rect x="6" y="4.5" width="4.5" height="15" rx="1" />
    <rect x="13.5" y="4.5" width="4.5" height="15" rx="1" />
  </svg>
)

export const PrevIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)} fill="currentColor" stroke="none">
    <path d="M6 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Z" />
    <path d="M19.4 5.3a1 1 0 0 1 .6.9v11.6a1 1 0 0 1-1.6.8L9.9 13a1.4 1.4 0 0 1 0-2.2l8.5-6.4a1 1 0 0 1 1-.1Z" />
  </svg>
)

export const NextIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)} fill="currentColor" stroke="none">
    <path d="M18 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Z" />
    <path d="M4.6 5.3a1 1 0 0 0-.6.9v11.6a1 1 0 0 0 1.6.8L14.1 13a1.4 1.4 0 0 0 0-2.2L5.6 4.4a1 1 0 0 0-1-.1Z" />
  </svg>
)

export const ShuffleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="m3 5 4.5 0 8.5 14 5 0" />
    <path d="m21 5-5 0-3.2 5.3" />
    <path d="m3 19 4.5 0 2.1-3.5" />
    <path d="m18 3 3 2-3 2" />
    <path d="m18 15 3 2-3 2" />
  </svg>
)

export const RepeatIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M17 2 21 6 17 10" />
    <path d="M3 12v-2a4 4 0 0 1 4-4h14" />
    <path d="M7 22 3 18 7 14" />
    <path d="M21 12v2a4 4 0 0 1-4 4H3" />
  </svg>
)

export const ExpandIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
    <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
  </svg>
)

export const MiniPlayerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor" stroke="none" />
  </svg>
)

export const HeartIcon = ({ filled, ...props }: SVGProps<SVGSVGElement> & { filled?: boolean }) => (
  <svg {...base(props)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20.5s-7.5-4.6-10-9.3C0.3 8 1.7 4.5 5 3.6c2-.5 3.9.3 5 2 1.1-1.7 3-2.5 5-2 3.3.9 4.7 4.4 3 7.6-2.5 4.7-10 9.3-10 9.3Z" />
  </svg>
)

export const VolumeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M4 9v6h4l5 5V4L8 9H4Z" fill="currentColor" stroke="none" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
)
