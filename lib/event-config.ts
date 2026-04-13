/**
 * Event Banner Config — edit this file to control active events.
 * Set `enabled: false` or leave `endDate` in the past to hide the banner.
 */
export interface EventConfig {
  enabled: boolean
  id: string
  title: string
  subtitle: string
  description: string
  badgeLabel: string
  badgeColor: 'gold' | 'red' | 'blue' | 'green'
  endDate: string // ISO date string. Banner hides automatically after this date.
  ctaLabel: string
  ctaHref: string
  accentColor: string // Tailwind gradient class segment, e.g. 'from-orange-500 to-red-600'
}

const EVENT_CONFIG: EventConfig = {
  enabled: true,
  id: 'genetic-apex-launch',
  title: 'Genetic Apex',
  subtitle: 'Limited Collection Available',
  description: 'The rarest holographic cards from the Genetic Apex expansion are now available. Open packs to collect Mewtwo, Charizard & Pikachu alt-arts before the event ends!',
  badgeLabel: 'LIMITED EVENT',
  badgeColor: 'gold',
  endDate: '2026-05-01T00:00:00Z',
  ctaLabel: 'Open Packs Now',
  ctaHref: '/pack-opening',
  accentColor: 'from-amber-500 via-orange-500 to-red-600',
}

export default EVENT_CONFIG
