import { NavLink } from 'react-router-dom';

export const NavItem: React.FC<{ to: string, children: React.ReactNode, icon: React.ElementType }> = ({ to, children, icon: Icon }) => {
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
