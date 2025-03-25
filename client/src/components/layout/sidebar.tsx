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
  X,
  PercentCircle,
  Calculator
} from "lucide-react";
import { useState, useEffect } from "react";

type NavLinkProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  index: number;
};

const NavLink = ({ href, icon, children, onClick, index }: NavLinkProps) => {
  const [location] = useLocation();
  const isActive = location === href;
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50 + index * 50); // Staggered animation
    
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <li 
      className={`transform transition-all duration-300 ease-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-[-20px] opacity-0"
      }`}
    >
      <Link href={href}>
        <div
          onClick={onClick}
          className={cn(
            "flex items-center p-3 rounded-lg text-gray-400 hover:bg-muted transition-all duration-200 cursor-pointer hover:translate-x-1 group",
            isActive && "bg-muted text-white border-l-2 border-primary"
          )}
        >
          <span className={cn(
            "w-5 mr-3 transition-colors duration-200",
            isActive ? "text-primary" : "text-gray-500 group-hover:text-secondary"
          )}>
            {icon}
          </span>
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
  const [animateLogo, setAnimateLogo] = useState(false);

  useEffect(() => {
    setAnimateLogo(true);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <aside className={cn(
      "bg-black text-white w-full md:w-64 flex-shrink-0 md:h-screen md:flex flex-col border-r border-border",
      isMobileMenuOpen ? "block fixed z-40 inset-0" : "hidden md:flex"
    )}>
      {/* Logo */}
      <div className="py-6 px-6 border-b border-border flex items-center justify-between">
        <div 
          className={`flex items-center space-x-2 transition-all duration-700 ease-out ${
            animateLogo ? "translate-x-0 opacity-100" : "translate-x-[-20px] opacity-0"
          }`}
        >
          <div className="relative">
            <Flag className="text-primary animate-pulse-glow" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full animate-ping opacity-60"></div>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-white to-secondary bg-clip-text text-transparent animate-gradient-x">
            Motorsport Stakes
          </h1>
        </div>
        <button 
          className="md:hidden text-gray-400 hover:text-white transition-colors"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X size={20} />
        </button>
      </div>
      
      {/* User Info */}
      {user && (
        <div className="p-5 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center ring-1 ring-border overflow-hidden hover-scale">
              <User className="text-gray-300" size={20} />
            </div>
            <div>
              <p className="font-medium text-white">{user.username}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="py-5 px-4 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          <NavLink href="/" icon={<Home size={18} />} onClick={closeMobileMenu} index={0}>
            Dashboard
          </NavLink>
          <NavLink href="/teams" icon={<Users size={18} />} onClick={closeMobileMenu} index={1}>
            My Teams
          </NavLink>
          <NavLink href="/market" icon={<ShoppingBag size={18} />} onClick={closeMobileMenu} index={2}>
            Market
          </NavLink>
          <NavLink href="/races" icon={<Flag size={18} />} onClick={closeMobileMenu} index={3}>
            Race Calendar
          </NavLink>
          <NavLink href="/statistics" icon={<BarChart2 size={18} />} onClick={closeMobileMenu} index={4}>
            Statistics
          </NavLink>
          <NavLink href="/leaderboard" icon={<Medal size={18} />} onClick={closeMobileMenu} index={5}>
            Leaderboard
          </NavLink>
          <NavLink href="/valuation-table" icon={<PercentCircle size={18} />} onClick={closeMobileMenu} index={6}>
            Valuation System
          </NavLink>
          {user?.isAdmin && (
            <NavLink href="/admin" icon={<Shield size={18} />} onClick={closeMobileMenu} index={7}>
              Admin Panel
            </NavLink>
          )}
        </ul>
        
        {/* Logout Button */}
        <div className="mt-8 px-1">
          <button 
            className="flex items-center p-3 rounded-lg text-gray-400 hover:bg-muted transition-all duration-200 w-full hover:text-white group"
            onClick={handleLogout}
          >
            <LogOut className="w-5 mr-3 text-red-500 group-hover:text-red-400" size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
