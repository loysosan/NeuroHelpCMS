import { useState } from "react";
import { Header } from "./components/Header";
import { BottomNavigation } from "./components/BottomNavigation";
import { HomePage } from "./components/HomePage";
import { ClientRegistration } from "./components/ClientRegistration";
import { SpecialistSearch } from "./components/SpecialistSearch";
import { SpecialistProfile } from "./components/SpecialistProfile";

interface AppState {
  currentPage: string;
  pageParams?: any;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    currentPage: "home"
  });

  const handleNavigate = (page: string, params?: any) => {
    setAppState({
      currentPage: page,
      pageParams: params
    });
  };

  const handleRegistrationComplete = (data: any) => {
    console.log("Registration completed:", data);
    // Here you would typically send data to backend
    handleNavigate("home");
  };

  const renderCurrentPage = () => {
    switch (appState.currentPage) {
      case "home":
        return <HomePage onNavigate={handleNavigate} />;
        
      case "search":
        return (
          <SpecialistSearch 
            onViewProfile={(id) => handleNavigate("profile", { id })}
            onContact={(id) => handleNavigate("contact", { specialistId: id })}
          />
        );
        
      case "profile":
        return (
          <SpecialistProfile 
            specialistId={appState.pageParams?.id || "1"}
            onContact={(id) => handleNavigate("contact", { specialistId: id })}
            onBooking={(id) => handleNavigate("booking", { specialistId: id })}
          />
        );
        
      case "client-registration":
        return (
          <ClientRegistration 
            onComplete={handleRegistrationComplete}
            onCancel={() => handleNavigate("home")}
          />
        );
        
      case "sessions":
        return (
          <div className="min-h-screen bg-background py-8 pb-20 md:pb-8">
            <div className="max-w-4xl mx-auto px-4">
              <div className="text-center">
                <h1 className="text-3xl font-semibold text-foreground mb-4">
                  Мої сесії
                </h1>
                <p className="text-muted-foreground mb-8">
                  Ця сторінка буде доступна в наступних оновленнях
                </p>
                <button
                  onClick={() => handleNavigate("home")}
                  className="text-primary hover:underline"
                >
                  Повернутися на головну
                </button>
              </div>
            </div>
          </div>
        );
        
      case "articles":
        return (
          <div className="min-h-screen bg-background py-8 pb-20 md:pb-8">
            <div className="max-w-4xl mx-auto px-4">
              <div className="text-center">
                <h1 className="text-3xl font-semibold text-foreground mb-4">
                  Статті та новини
                </h1>
                <p className="text-muted-foreground mb-8">
                  Ця сторінка буде доступна в наступних оновленнях
                </p>
                <button
                  onClick={() => handleNavigate("home")}
                  className="text-primary hover:underline"
                >
                  Повернутися на головну
                </button>
              </div>
            </div>
          </div>
        );
        
      case "about":
        return (
          <div className="min-h-screen bg-background py-8 pb-20 md:pb-8">
            <div className="max-w-4xl mx-auto px-4">
              <div className="text-center">
                <h1 className="text-3xl font-semibold text-foreground mb-4">
                  Про нас
                </h1>
                <p className="text-muted-foreground mb-8">
                  Ця сторінка буде доступна в наступних оновленнях
                </p>
                <button
                  onClick={() => handleNavigate("home")}
                  className="text-primary hover:underline"
                >
                  Повернутися на головну
                </button>
              </div>
            </div>
          </div>
        );
        
      case "favorites":
        return (
          <div className="min-h-screen bg-background py-8 pb-20 md:pb-8">
            <div className="max-w-4xl mx-auto px-4">
              <div className="text-center">
                <h1 className="text-3xl font-semibold text-foreground mb-4">
                  Обране
                </h1>
                <p className="text-muted-foreground mb-8">
                  Ця сторінка буде доступна в наступних оновленнях
                </p>
                <button
                  onClick={() => handleNavigate("home")}
                  className="text-primary hover:underline"
                >
                  Повернутися на головну
                </button>
              </div>
            </div>
          </div>
        );
        
      case "login":
        return (
          <div className="min-h-screen bg-background py-8 pb-20 md:pb-8">
            <div className="max-w-md mx-auto px-4">
              <div className="text-center">
                <h1 className="text-3xl font-semibold text-foreground mb-4">
                  Увійти до акаунту
                </h1>
                <p className="text-muted-foreground mb-8">
                  Ця сторінка буде доступна в наступних оновленнях
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => handleNavigate("client-registration")}
                    className="w-full text-center bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors"
                  >
                    Реєстрація як батько/опікун
                  </button>
                  <button
                    onClick={() => handleNavigate("home")}
                    className="text-primary hover:underline"
                  >
                    Повернутися на головну
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
        
      case "more":
        return (
          <div className="min-h-screen bg-background py-8 pb-20 md:pb-8">
            <div className="max-w-4xl mx-auto px-4">
              <div className="text-center">
                <h1 className="text-3xl font-semibold text-foreground mb-4">
                  Додатково
                </h1>
                <div className="grid gap-4 max-w-sm mx-auto">
                  <button
                    onClick={() => handleNavigate("favorites")}
                    className="p-4 text-left border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <h3 className="font-medium">Обране</h3>
                    <p className="text-sm text-muted-foreground">Збережені спеціалісти</p>
                  </button>
                  <button
                    onClick={() => handleNavigate("articles")}
                    className="p-4 text-left border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <h3 className="font-medium">Статті</h3>
                    <p className="text-sm text-muted-foreground">Корисна інформація</p>
                  </button>
                  <button
                    onClick={() => handleNavigate("about")}
                    className="p-4 text-left border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <h3 className="font-medium">Про нас</h3>
                    <p className="text-sm text-muted-foreground">Інформація про платформу</p>
                  </button>
                </div>
                <button
                  onClick={() => handleNavigate("home")}
                  className="text-primary hover:underline mt-8"
                >
                  Повернутися на головну
                </button>
              </div>
            </div>
          </div>
        );
        
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage={appState.currentPage} onNavigate={handleNavigate} />
      <main>
        {renderCurrentPage()}
      </main>
      <BottomNavigation currentPage={appState.currentPage} onNavigate={handleNavigate} />
      
      {/* Footer - Hidden on mobile when bottom nav is present */}
      <footer className="hidden md:block bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">N</span>
                </div>
                <span className="text-xl font-semibold text-foreground">NeuroHelp</span>
              </div>
              <p className="text-muted-foreground">
                Професійна допомога для дітей з розладами аутистичного спектру
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Навігація</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><button onClick={() => handleNavigate("home")} className="hover:text-foreground">Головна</button></li>
                <li><button onClick={() => handleNavigate("search")} className="hover:text-foreground">Спеціалісти</button></li>
                <li><button onClick={() => handleNavigate("articles")} className="hover:text-foreground">Статті</button></li>
                <li><button onClick={() => handleNavigate("about")} className="hover:text-foreground">Про нас</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Підтримка</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Допомога</a></li>
                <li><a href="#" className="hover:text-foreground">Контакти</a></li>
                <li><a href="#" className="hover:text-foreground">Зворотний зв'язок</a></li>
                <li><a href="#" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Правова інформація</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Політика приватності</a></li>
                <li><a href="#" className="hover:text-foreground">Умови використання</a></li>
                <li><a href="#" className="hover:text-foreground">Файли cookie</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 NeuroHelp. Всі права захищені.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}