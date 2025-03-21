import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  icon: string;
  children: React.ReactNode;
  onClick?: () => void;
};

const NavLink = ({ href, icon, children, onClick }: NavLinkProps) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <li>
      <Link href={href}>
        <a
          onClick={onClick}
          className={cn(
            "flex items-center p-3 rounded-lg text-neutral-300 hover:bg-neutral-700 transition-colors",
            isActive && "bg-neutral-700 text-white"
          )}
        >
          <i className={`${icon} w-5 text-center mr-3`}></i>
          <span>{children}</span>
        </a>
      </Link>
    </li>
  );
};

type SidebarProps = {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
};

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <aside className={cn(
      "bg-secondary text-white w-full md:w-64 flex-shrink-0 md:h-screen md:flex flex-col",
      isMobileMenuOpen ? "block absolute z-40 inset-0" : "hidden md:flex"
    )}>
      {/* Logo */}
      <div className="py-4 px-6 border-b border-neutral-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <i className="fas fa-flag-checkered text-primary text-xl"></i>
          <h1 className="text-xl font-bold">Motorsport Stakes</h1>
        </div>
        <button 
          className="md:hidden text-neutral-400 hover:text-white"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-neutral-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center">
              <i className="fas fa-user text-neutral-400"></i>
            </div>
            <div>
              <p className="font-medium text-white">{user.username}</p>
              <p className="text-xs text-neutral-400">{user.email}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          <NavLink href="/" icon="fas fa-tachometer-alt" onClick={closeMobileMenu}>
            Dashboard
          </NavLink>
          <NavLink href="/teams" icon="fas fa-users" onClick={closeMobileMenu}>
            My Teams
          </NavLink>
          <NavLink href="/market" icon="fas fa-store" onClick={closeMobileMenu}>
            Market
          </NavLink>
          <NavLink href="/races" icon="fas fa-flag-checkered" onClick={closeMobileMenu}>
            Race Calendar
          </NavLink>
          <NavLink href="/standings" icon="fas fa-trophy" onClick={closeMobileMenu}>
            Standings
          </NavLink>
          {user?.isAdmin && (
            <NavLink href="/admin" icon="fas fa-shield-alt" onClick={closeMobileMenu}>
              Admin Panel
            </NavLink>
          )}
        </ul>
        
        {/* Logout Button */}
        <div className="mt-8">
          <button 
            className="flex items-center p-3 rounded-lg text-neutral-300 hover:bg-neutral-700 transition-colors w-full"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt w-5 text-center mr-3"></i>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
