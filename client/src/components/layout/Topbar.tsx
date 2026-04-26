interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div className="bg-white border-b border-[#E2E8ED] px-7 h-[58px] flex items-center justify-between flex-shrink-0">
      <div>
        <p className="text-[16px] font-bold text-[#0F1E2B] leading-tight">{title}</p>
        {subtitle && <p className="text-[12px] text-[#7A909F] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  )
}
