import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

interface NavLinksProps {
  onNavigate?: () => void
}

export function NavLinks({ onNavigate }: NavLinksProps) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium transition ${
              isActive ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'
            }`
          }
        >
          <i className={`pi ${item.icon}`} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
