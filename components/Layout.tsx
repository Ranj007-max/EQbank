import { BookOpenCheck, Sun, Moon, LayoutDashboard, Library, BrainCircuit, PencilRuler } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/button';
import { NavItem } from './NavItem';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
    { to: '/', text: 'Dashboard', icon: LayoutDashboard },
    { to: '/bank', text: 'Question Bank', icon: Library },
    { to: '/srs-review', text: 'Review', icon: BrainCircuit },
    { to: '/exams', text: 'Exams', icon: PencilRuler }
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-56 flex-shrink-0 border-r bg-card flex flex-col">
        <div className="flex items-center gap-2.5 px-4 h-20 border-b">
            <BookOpenCheck className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold text-foreground tracking-tighter">E-Qbank</h1>
        </div>
        
        <nav className="flex flex-col gap-1 p-4 flex-grow">
            {navItems.map(item => (
                <NavItem key={item.to} to={item.to} icon={item.icon}>{item.text}</NavItem>
            ))}
        </nav>

        <div className="p-4 border-t">
             <Button 
                variant="ghost" 
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span>{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
              </Button>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-10">
            {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;