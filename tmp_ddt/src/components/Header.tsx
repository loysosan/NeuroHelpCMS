import { Heart, Menu, Search, User, LogIn } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

interface HeaderProps {
  currentPage?: string;
  onNavigate: (page: string) => void;
}

export function Header({ currentPage = "home", onNavigate }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { id: "home", label: "Головна", icon: null },
    { id: "search", label: "Спеціалісти", icon: Search },
    { id: "articles", label: "Статті", icon: null },
    { id: "about", label: "Про нас", icon: null }
  ];

  const NavContent = () => (
    <>
      {navigationItems.map((item) => (
        <Button
          key={item.id}
          variant={currentPage === item.id ? "default" : "ghost"}
          onClick={() => {
            onNavigate(item.id);
            setIsMenuOpen(false);
          }}
          className="flex items-center gap-2"
        >
          {item.icon && <item.icon className="w-4 h-4" />}
          {item.label}
        </Button>
      ))}
    </>
  );

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate("home")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">NeuroHelp</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <NavContent />
          </nav>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("favorites")}
              className="flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Обране
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("profile")}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Профіль
            </Button>
            <Button
              size="sm"
              onClick={() => onNavigate("login")}
              className="bg-primary hover:bg-primary/90"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Увійти
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-4 mt-8">
                  <NavContent />
                  <div className="border-t border-border pt-4 mt-4 space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        onNavigate("favorites");
                        setIsMenuOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Обране
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        onNavigate("profile");
                        setIsMenuOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Профіль
                    </Button>
                    <Button
                      onClick={() => {
                        onNavigate("login");
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Увійти
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}