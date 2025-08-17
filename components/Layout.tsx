import { BookOpenCheck, Sun, Moon, LayoutDashboard, Library, BrainCircuit, PencilRuler } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
    { to: '/', text: 'Dashboard', icon: LayoutDashboard },
    { to: '/bank', text: 'Question Bank', icon: Library },
    { to: '/srs-review', text: 'Review', icon: BrainCircuit },
    { to: '/exams', text: 'Exams', icon: PencilRuler }
];

const NavItem: React.FC<{ to: string, children: React.ReactNode, icon: React.ElementType }> = ({ to, children, icon: Icon }) => {
    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    }`;

    return (
        <NavLink to={to} className={navLinkClass}>
            <Icon className="h-5 w-5" />
            {children}
        </NavLink>
    );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { toggleTheme } = useTheme();

  return (
    <div className="flex h-screen bg-muted/50">
      <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col p-4">
        <div className="flex items-center gap-2 px-3 mb-8">
            <BookOpenCheck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">PgQbank</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
            {navItems.map(item => (
                <NavItem key={item.to} to={item.to} icon={item.icon}>{item.text}</NavItem>
            ))}
        </nav>

        <div>
             <Button
                variant="ghost" 
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="w-full justify-start gap-3 px-3"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span>Toggle Theme</span>
              </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
            {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;