import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar />
      <main style={{ paddingLeft: '16rem' }}>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </main>
      <style>{`
        @media (max-width: 1023px) {
          main { padding-left: 0 !important; }
          main > div { padding-top: 4rem !important; }
        }
      `}</style>
    </div>
  )
}
