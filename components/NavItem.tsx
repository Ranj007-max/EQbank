import { NavLink } from 'react-router-dom';

export const NavItem: React.FC<{ to: string, children: React.ReactNode, icon: React.ElementType }> = ({ to, children, icon: Icon }) => {
    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 px-4 h-[60px] rounded-lg text-lg font-bold transition-colors card-tilt ${
      isActive
        ? 'bg-primary/20 text-primary animate-pulse'
        : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
    }`;

    return (
        <NavLink to={to} className={navLinkClass} style={{ fontFamily: '"SF Pro Display", sans-serif' }}>
            <Icon className="h-6 w-6" />
            <span>{children}</span>
        </NavLink>
    );
};
