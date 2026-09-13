import BanorteChat from "@/components/banorte-chat"
import InstitutionalTopBar from "@/components/institutional-top-bar"
import MainFooter from "@/components/main-footer"
import MainHeader from "@/components/main-header"

export default function Page() {
  return (
    <div className="hero-bg-pattern flex h-dvh flex-col overflow-hidden text-slate-800">
      <InstitutionalTopBar />
      <MainHeader />
      <BanorteChat />
      <MainFooter />
    </div>
  )
}
