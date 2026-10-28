import { Tooltip } from 'primereact/tooltip'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

interface NavLinksProps {
  onNavigate?: () => void
  /** Icon-only rail (collapsed desktop sidebar); labels move to tooltips. */
  collapsed?: boolean
}

export function NavLinks({ onNavigate, collapsed = false }: NavLinksProps) {
  return (
    <nav className="flex flex-col gap-2">
      {collapsed && <Tooltip target=".nav-rail-link" position="right" />}
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          onClick={onNavigate}
          aria-label={collapsed ? item.label : undefined}
          data-pr-tooltip={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            `flex items-center gap-4 rounded-lg py-3 text-[17px] font-medium transition ${
              collapsed ? 'nav-rail-link justify-center px-0' : 'px-4'
            } ${isActive ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-200/60'}`
          }
        >
          <i className={`pi ${item.icon} text-xl`} />
          {!collapsed && item.label}
        </NavLink>
      ))}
    </nav>
  )
}
