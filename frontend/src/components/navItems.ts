export interface NavItem {
  label: string
  icon: string
  path: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'pi-chart-bar', path: '/' },
  { label: 'Schedule', icon: 'pi-calendar', path: '/schedule' },
  { label: 'Task Log', icon: 'pi-clipboard', path: '/task-log' },
  { label: 'Budget & Finance', icon: 'pi-dollar', path: '/budget' },
  { label: 'Document', icon: 'pi-file', path: '/documents' },
  { label: 'Team', icon: 'pi-users', path: '/team' },
]
