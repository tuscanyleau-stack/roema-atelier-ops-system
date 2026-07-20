export type ViewType = 'roema' | 'designer' | 'bride'
export type RoemaNav = 'dashboard' | 'prospects' | 'brides' | 'books' | 'team'
export type BrideTab = 'brief' | 'timeline' | 'design' | 'payments' | 'notes'
export type BridePortalTab = 'timeline' | 'design' | 'payments'
export type StatusColor = 'amber' | 'teal' | 'blue' | 'coral' | 'green' | 'red'
export type ProspectStatus = 'new' | 'qualified' | 'brief_booked'
export type LogisticsStatus = 'in_transit' | 'delivered'
export type ActivityType = 'design' | 'payment' | 'alert' | 'prospect' | 'logistics' | 'milestone'

export interface TimelineStep {
  date: string
  label: string
  done?: boolean
  current?: boolean
  overdue?: boolean
}

export interface DiscussionMessage {
  date: string
  from: 'Roéma' | 'Putri' | 'Bride'
  text: string
}

export interface Bride {
  id: number
  name: string
  initials: string
  location: string
  status: string
  statusColor: StatusColor
  designer: string
  weddingDate: string
  paymentPercent: number
  paid: number
  total: number
  margin: number
  brief: string
  kyc: string
  gatekeeper: string
  timeline: TimelineStep[]
  discussions: DiscussionMessage[]
}

export interface Prospect {
  id: number
  name: string
  phone: string
  location: string
  weddingDate: string
  budget: string
  receivedAt: string
  status: ProspectStatus
  rawMessage: string
}

export interface LogisticsItem {
  id: number
  bride: string
  item: string
  courier: string
  trackingNumber: string
  status: LogisticsStatus
  eta: string
}

export interface OverdueItem {
  bride: string
  item: string
  daysOverdue: number
  pic: string
  email: string
  statusColor: StatusColor
}

export interface ActivityItem {
  id: number
  time: string
  icon: string
  text: string
  type: ActivityType
}

export interface CommGap {
  bride: string
  initials: string
  daysAgo: string
  statusColor: StatusColor
  status: string
}

export interface TravelItem {
  dates: string
  city: string
  note: string
}

export interface TeamMember {
  name: string
  email: string
  role: string
  initials: string
  color: StatusColor
}

export interface NotificationRule {
  title: string
  recipients: string
  trigger: string
  color: StatusColor
}
