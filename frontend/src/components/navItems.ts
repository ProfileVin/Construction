export interface NavItem {
  label: string
  icon: string
  path: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'pi-th-large', path: '/' },
  { label: 'Schedule', icon: 'pi-calendar', path: '/schedule' },
  { label: 'Task Log', icon: 'pi-list-check', path: '/task-log' },
  { label: 'Budget & Finance', icon: 'pi-wallet', path: '/budget' },
  { label: 'Document', icon: 'pi-file', path: '/documents' },
  { label: 'Team', icon: 'pi-users', path: '/team' },
]
