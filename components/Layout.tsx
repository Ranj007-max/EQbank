import { useState } from 'react';
import { BookOpenCheck, Sun, Moon, LayoutDashboard, Library, BrainCircuit, PencilRuler, Plus, Minus, Search, ChevronLeft, User, Menu } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useFontSize } from '../hooks/useFontSize';
import { Button } from './ui/button';
import { NavItem } from './NavItem';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from './ui/input';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
    { to: '/', text: 'Dashboard', icon: LayoutDashboard },
    { to: '/bank', text: 'Question Bank', icon: Library },
    { to: '/review', text: 'Review', icon: BrainCircuit },
    { to: '/exams', text: 'Exams', icon: PencilRuler }
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { increaseFontSize, decreaseFontSize } = useFontSize();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isExamMode = location.pathname.startsWith('/exam/session');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="grid lg:grid-cols-[minmax(250px,20%)_1fr] h-screen">
        {/* Sidebar */}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-full max-w-[280px] lg:max-w-none lg:w-auto transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out bg-black/10 backdrop-blur-lg border-r border-white/10 flex flex-col`}>
          <div className="flex items-center gap-2.5 px-4 h-20 border-b border-white/10">
              <BookOpenCheck className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold tracking-tighter">E-Qbank</h1>
          </div>

          <nav className="flex flex-col gap-1 p-4 flex-grow">
              {navItems.map(item => (
                  <NavItem key={item.to} to={item.to} icon={item.icon}>{item.text}</NavItem>
              ))}
          </nav>

          <div className="p-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sun className="h-5 w-5" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="1"
                    value={theme === 'dark' ? 1 : 0}
                    onChange={toggleTheme}
                    className="neumorphic-slider w-20"
                    aria-label="Theme toggle"
                  />
                  <Moon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={decreaseFontSize} aria-label="Decrease font size">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={increaseFontSize} aria-label="Increase font size">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-col lg:col-start-2 overflow-hidden">
          {/* Top Bar */}
          {!isExamMode && (
            <header className="sticky top-0 z-40 h-20 bg-background/80 backdrop-filter backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-6 lg:px-10">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
                  <Menu />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
                  <ChevronLeft />
                </Button>
              </div>
              <div className="flex-1 max-w-md mx-auto">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Global Search..." className="pl-10 neumorphic-input" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" aria-label="Profile">
                      <User />
                  </Button>
              </div>
            </header>
          )}

          <main className="flex-1 overflow-y-auto p-6 lg:p-10">
              {children}
          </main>
        </div>
      </div>
       {isSidebarOpen && <div onClick={toggleSidebar} className="fixed inset-0 z-40 bg-black/50 lg:hidden"></div>}
    </div>
  );
};

export default Layout;