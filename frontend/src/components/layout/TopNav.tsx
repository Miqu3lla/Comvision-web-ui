import { Link, NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const link = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-md text-sm transition-colors ${isActive ? 'bg-accent-soft text-ink font-medium' : 'text-muted hover:text-ink'}`

export default function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-accent"><span className="block h-full w-full scale-50 rounded-full bg-hot" /></span>
          </span>
          <span className="font-semibold tracking-tight">CV Lab Workbench</span>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={link}>Home</NavLink>
          <NavLink to="/about" className={link}>About</NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
