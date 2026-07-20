import {
  Bride, Prospect, LogisticsItem, OverdueItem,
  ActivityItem, CommGap, TravelItem, TeamMember, NotificationRule,
} from './types'

export const BRIDES: Bride[] = [
  {
    id: 1,
    name: 'Mei Lin Tan',
    initials: 'MT',
    location: 'Singapore',
    status: 'Design review',
    statusColor: 'amber',
    designer: 'Putri Rahayu',
    weddingDate: 'Aug 15, 2025',
    paymentPercent: 75,
    paid: 15000,
    total: 20000,
    margin: 35,
    brief:
      'Modern romantic silhouette with floral lace appliqué. Prefers ivory over pure white. Comfortable fit for a 12-hour reception.',
    kyc: 'CEO of a tech startup. Very detail-oriented. Father Henry approves all decisions before bride signs off.',
    gatekeeper: 'Henry Tan (Father)',
    timeline: [
      { date: 'Mar 1', label: 'Kickoff brief', done: true },
      { date: 'Mar 20', label: 'Design concept', done: true },
      { date: 'Apr 10', label: 'Revision #1', done: true },
      { date: 'May 11', label: 'First toile fitting', current: true },
      { date: 'Jun 15', label: 'Fabric sign-off' },
      { date: 'Jul 10', label: 'Final fitting' },
      { date: 'Aug 1', label: 'Gown delivery' },
    ],
    discussions: [
      { date: 'Apr 28', from: 'Putri', text: 'Revised sketch sent — deeper V-neckline per your request.' },
      { date: 'Apr 29', from: 'Roéma', text: 'Client approved V-neckline. Confirming button closure at back.' },
      { date: 'May 2', from: 'Bride', text: 'Prefer zip closure — easier to put on alone.' },
    ],
  },
  {
    id: 2,
    name: 'Priya Sharma',
    initials: 'PS',
    location: 'London, UK',
    status: 'Fitting stage',
    statusColor: 'teal',
    designer: 'Putri Rahayu',
    weddingDate: 'Sep 22, 2025',
    paymentPercent: 50,
    paid: 14000,
    total: 28000,
    margin: 42,
    brief:
      'Indo-Western fusion with gold zardosi hand embroidery. Colorway: blush and gold.',
    kyc: 'NRI bride based in London. Mother Anita is very involved. Husband\'s family is traditional — keep bridalwear aesthetic.',
    gatekeeper: 'Mrs. Anita Sharma (Mother)',
    timeline: [
      { date: 'Feb 10', label: 'Kickoff brief', done: true },
      { date: 'Feb 28', label: 'Mood board approval', done: true },
      { date: 'Mar 22', label: 'Design sign-off', done: true },
      { date: 'Apr 18', label: 'Embroidery approval', done: true },
      { date: 'May 20', label: 'First fitting (London)', current: true },
      { date: 'Jul 5', label: 'Final fitting' },
      { date: 'Sep 10', label: 'Delivery' },
    ],
    discussions: [
      { date: 'May 1', from: 'Putri', text: 'Embroidery sample sent via DHL. ETA May 12.' },
      { date: 'May 3', from: 'Bride', text: 'Received! Gold thread is perfect — can we increase density on the bodice?' },
      { date: 'May 8', from: 'Roéma', text: 'Confirming with Putri — she will respond by May 10.' },
    ],
  },
  {
    id: 3,
    name: 'Sofia Chen',
    initials: 'SC',
    location: 'Hong Kong',
    status: 'Brief confirmed',
    statusColor: 'blue',
    designer: 'Putri Rahayu',
    weddingDate: 'Nov 10, 2025',
    paymentPercent: 25,
    paid: 3500,
    total: 14000,
    margin: 38,
    brief:
      'Clean, structured column gown. Minimal ornamentation, possible slit. Off-white/champagne colorway.',
    kyc: 'Finance professional. Precise and time-driven. Wants weekly updates. No surprises.',
    gatekeeper: 'Sofia Chen (direct)',
    timeline: [
      { date: 'Apr 20', label: 'Kickoff brief', done: true },
      { date: 'May 10', label: 'Design concept', current: true, overdue: true },
      { date: 'Jun 5', label: 'Design sign-off' },
      { date: 'Jul 15', label: 'First toile' },
      { date: 'Sep 1', label: 'Fitting' },
      { date: 'Oct 15', label: 'Final fitting' },
      { date: 'Nov 1', label: 'Delivery' },
    ],
    discussions: [
      { date: 'Apr 25', from: 'Roéma', text: 'Welcome sent. Design questionnaire shared.' },
      { date: 'Apr 26', from: 'Bride', text: 'Questionnaire completed. Reference images attached.' },
    ],
  },
]

export const PROSPECTS: Prospect[] = [
  {
    id: 1,
    name: 'Sarah Lim',
    phone: '+65 9123 4567',
    location: 'Bali',
    weddingDate: 'Mar 2026',
    budget: 'SGD 15k',
    receivedAt: '10 min ago',
    status: 'new',
    rawMessage:
      "Hi, I'm Sarah, getting married in Bali in March 2026, I'd love a custom gown, budget around SGD 15k",
  },
  {
    id: 2,
    name: 'Anika Patel',
    phone: '+44 7700 900123',
    location: 'London, UK',
    weddingDate: 'Jun 2026',
    budget: 'GBP 12k',
    receivedAt: '2 hrs ago',
    status: 'qualified',
    rawMessage:
      'Hello! Seen your work on Instagram. I have a June 2026 wedding in London, looking for something unique around GBP 12k',
  },
  {
    id: 3,
    name: 'Chen Wei',
    phone: '+852 9876 5432',
    location: 'Hong Kong',
    weddingDate: 'Oct 2026',
    budget: 'HKD 80k',
    receivedAt: 'Yesterday',
    status: 'brief_booked',
    rawMessage:
      'Looking for a bespoke gown for Oct 2026 HK wedding, have a budget of HKD 80k, can we set up a call?',
  },
]

export const LOGISTICS: LogisticsItem[] = [
  {
    id: 1,
    bride: 'Priya',
    item: 'Embroidery sample',
    courier: 'DHL',
    trackingNumber: 'DHL9234812',
    status: 'in_transit',
    eta: 'May 12',
  },
  {
    id: 2,
    bride: 'Mei Lin',
    item: 'Lace fabric swatches',
    courier: 'FedEx',
    trackingNumber: 'FEX7891234',
    status: 'delivered',
    eta: 'May 9',
  },
]

export const OVERDUE_ITEMS: OverdueItem[] = [
  {
    bride: 'Priya Sharma',
    item: 'Embroidery density sign-off',
    daysOverdue: 3,
    pic: 'Putri',
    email: 'putri@designer.id',
    statusColor: 'teal',
  },
  {
    bride: 'Sofia Chen',
    item: 'Design concept delivery',
    daysOverdue: 1,
    pic: 'Putri',
    email: 'putri@designer.id',
    statusColor: 'blue',
  },
]

export const ACTIVITY_FEED: ActivityItem[] = [
  { id: 1, time: '2h ago', icon: '💬', text: "Priya S. replied: 'Can we increase density on bodice?'", type: 'design' },
  { id: 2, time: '4h ago', icon: '✉️', text: 'Payment reminder auto-sent to Mei Lin (7 days before due)', type: 'payment' },
  { id: 3, time: 'Today', icon: '⚠️', text: 'Overdue alert emailed to putri@designer.id (Sofia — design concept)', type: 'alert' },
  { id: 4, time: 'Yesterday', icon: '👤', text: 'New WA prospect: Sarah Lim (+65 9123 4567)', type: 'prospect' },
  { id: 5, time: 'Yesterday', icon: '📦', text: 'DHL9234812 in transit to Singapore · ETA May 12', type: 'logistics' },
  { id: 6, time: '2d ago', icon: '✅', text: 'Mei Lin: Design revision #1 marked complete', type: 'milestone' },
]

export const COMMS_GAPS: CommGap[] = [
  { bride: 'Sofia Chen', initials: 'SC', daysAgo: '9 days', statusColor: 'blue', status: 'Brief confirmed' },
  { bride: 'Priya Sharma', initials: 'PS', daysAgo: '5 days', statusColor: 'teal', status: 'Fitting stage' },
]

export const TEAM_TRAVEL: TravelItem[] = [
  { dates: 'May 20–22', city: 'Jakarta, ID', note: 'Priya fitting w/ Putri' },
  { dates: 'Jun 8–10', city: 'Singapore', note: 'Mei Lin toile session' },
  { dates: 'Jul 15', city: 'Hong Kong', note: 'Sofia first fitting' },
]

export const TEAM_MEMBERS: TeamMember[] = [
  { name: 'You (Admin)', email: 'hi@roemaatelier.com', role: 'Roéma admin', initials: 'RA', color: 'amber' },
  { name: 'Putri Rahayu', email: 'putri@designer.id', role: 'Designer', initials: 'PR', color: 'teal' },
]

export const NOTIFICATION_RULES: NotificationRule[] = [
  { title: 'Payment reminder', recipients: 'Email + WA to bride', trigger: '7, 3, 1 day before due', color: 'green' },
  { title: 'Milestone overdue', recipients: 'Email to PIC immediately', trigger: 'Fires same day', color: 'red' },
  { title: 'Communication gap', recipients: 'Email to Roéma team', trigger: 'After 5 days silence', color: 'amber' },
  { title: 'New WA prospect', recipients: 'Email to Roéma admin', trigger: 'Instant on WA receipt', color: 'teal' },
  { title: 'Logistics update', recipients: 'Email to bride + Roéma', trigger: 'On courier webhook', color: 'blue' },
]

export const CALENDAR_EVENTS: Record<number, string> = {
  5: 'amber',
  11: 'teal',
  15: 'coral',
  22: 'amber',
  28: 'blue',
}
