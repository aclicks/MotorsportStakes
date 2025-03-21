import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Users, 
  ShoppingBag, 
  Flag, 
  Trophy, 
  BarChart2, 
  Medal, 
  Shield, 
  LogOut, 
  User,
  X
} from "lucide-react";

type NavLinkProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
};

const NavLink = ({ href, icon, children, onClick }: NavLinkProps) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <li>
      <Link href={href}>
        <div
          onClick={onClick}
          className={cn(
            "flex items-center p-3 rounded-lg text-neutral-300 hover:bg-neutral-700 transition-colors cursor-pointer",
            isActive && "bg-neutral-700 text-white"
          )}
        >
          <span className="w-5 mr-3">{icon}</span>
          <span>{children}</span>
        </div>
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
          <Flag className="text-primary" />
          <h1 className="text-xl font-bold">Motorsport Stakes</h1>
        </div>
        <button 
          className="md:hidden text-neutral-400 hover:text-white"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X size={20} />
        </button>
      </div>
      
      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-neutral-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center">
              <User className="text-neutral-400" size={20} />
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
          <NavLink href="/" icon={<Home size={18} />} onClick={closeMobileMenu}>
            Dashboard
          </NavLink>
          <NavLink href="/teams" icon={<Users size={18} />} onClick={closeMobileMenu}>
            My Teams
          </NavLink>
          <NavLink href="/market" icon={<ShoppingBag size={18} />} onClick={closeMobileMenu}>
            Market
          </NavLink>
          <NavLink href="/races" icon={<Flag size={18} />} onClick={closeMobileMenu}>
            Race Calendar
          </NavLink>
          <NavLink href="/standings" icon={<Trophy size={18} />} onClick={closeMobileMenu}>
            Standings
          </NavLink>
          <NavLink href="/statistics" icon={<BarChart2 size={18} />} onClick={closeMobileMenu}>
            Estatísticas
          </NavLink>
          <NavLink href="/leaderboard" icon={<Medal size={18} />} onClick={closeMobileMenu}>
            Leaderboard
          </NavLink>
          {user?.isAdmin && (
            <NavLink href="/admin" icon={<Shield size={18} />} onClick={closeMobileMenu}>
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
            <LogOut className="w-5 mr-3" size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
