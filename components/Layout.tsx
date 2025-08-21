
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpenCheck, Sun, Moon, LayoutDashboard, Library, BrainCircuit, PencilRuler, Search, ChevronLeft, User, Menu, PanelLeftClose, Bell } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
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
  const { toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isExamMode = location.pathname.startsWith('/exam/session');

  const title = "E-Qbank";
  const titleVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const letterVariants: {
      hidden: { opacity: number; y: number; scale: number };
      visible: {
          opacity: number;
          y: number;
          scale: number;
          transition: { type: "spring"; damping: number; stiffness: number };
      };
  } = {
      hidden: { opacity: 0, y: 10, scale: 0.8 },
      visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
              type: "spring",
              damping: 12,
              stiffness: 100,
          },
      },
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
  }

  if (isExamMode) {
    return <div className="bg-background text-foreground h-screen">{children}</div>;
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className={`grid ${isDesktopSidebarCollapsed ? 'lg:grid-cols-[80px_1fr]' : 'lg:grid-cols-[minmax(250px,20%)_1fr]'} h-screen transition-all duration-300`}>
        {/* Sidebar */}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-full max-w-[280px] lg:max-w-none lg:w-auto transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out bg-black/10 backdrop-blur-lg border-r border-white/10 flex-col ${isExamMode ? 'hidden lg:flex' : 'flex'}`}>
          <div className={`flex items-center gap-2.5 px-4 h-20 border-b border-white/10 ${isDesktopSidebarCollapsed ? 'justify-center' : ''}`}>
              <BookOpenCheck className="h-7 w-7 text-primary" />
              <motion.h1
                variants={titleVariants}
                initial="hidden"
                animate="visible"
                className={`text-xl font-bold tracking-tighter flex overflow-hidden ${isDesktopSidebarCollapsed ? 'hidden' : 'block'}`}
              >
                {title.split("").map((char, index) => (
                  <motion.span key={index} variants={letterVariants} className="inline-block">
                    {char}
                  </motion.span>
                ))}
              </motion.h1>
          </div>

          <nav className="flex flex-col gap-1 p-4 flex-grow">
              {navItems.map(item => (
                  <NavItem key={item.to} to={item.to} icon={item.icon} isCollapsed={isDesktopSidebarCollapsed}>{item.text}</NavItem>
              ))}
          </nav>

          <div className="p-4 border-t border-white/10 space-y-4">
            <Button variant="ghost" size="icon" className="hidden lg:block w-full" onClick={toggleDesktopSidebar}>
              <PanelLeftClose className={`transition-transform duration-300 ${isDesktopSidebarCollapsed ? 'rotate-180' : ''}`} />
            </Button>
            <div className="flex items-center justify-center">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className={`flex flex-col ${isExamMode ? 'col-span-2' : 'lg:col-start-2'} overflow-hidden`}>
          {/* Top Bar */}
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
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" aria-label="Notifications">
                    <Bell />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Profile">
                    <User />
                </Button>
            </div>
          </header>

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
