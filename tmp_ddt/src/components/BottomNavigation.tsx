import { Home, Search, Calendar, User, Menu } from "lucide-react";
import { cn } from "./ui/utils";

interface BottomNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function BottomNavigation({ currentPage, onNavigate }: BottomNavigationProps) {
  const navigationItems = [
    { id: "home", label: "Головна", icon: Home },
    { id: "search", label: "Пошук", icon: Search },
    { id: "sessions", label: "Сесії", icon: Calendar },
    { id: "profile", label: "Профіль", icon: User },
    { id: "more", label: "Ще", icon: Menu }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 min-h-[44px] min-w-[44px] rounded-lg transition-colors",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}