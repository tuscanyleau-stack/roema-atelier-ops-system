'use client'
import AuthGate from '@/components/AuthGate'
import CRMApp from '@/components/CRMApp'

export default function Home() {
  return <AuthGate>{(profile) => <CRMApp profile={profile} />}</AuthGate>
}
