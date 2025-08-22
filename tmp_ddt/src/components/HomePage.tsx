import { ArrowRight, CheckCircle, Star, Users, Clock, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { QuickSearchForm } from "./QuickSearchForm";
import { SpecialistCard } from "./SpecialistCard";

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const handleSearch = (data: { city: string; skill: string; query: string }) => {
    onNavigate("search", { filters: data });
  };

  const handleViewProfile = (id: string) => {
    onNavigate("profile", { id });
  };

  const handleContact = (id: string) => {
    onNavigate("contact", { specialistId: id });
  };

  // Mock data
  const popularSpecialists = [
    {
      id: "1",
      name: "Олена Петренко",
      title: "Дитячий психолог",
      city: "Київ",
      experience: 8,
      rating: 4.9,
      reviewCount: 47,
      skills: ["ABA-терапія", "Мовленнєва терапія", "Соціальні навички", "Поведінкова терапія"]
    },
    {
      id: "2", 
      name: "Михайло Коваленко",
      title: "Спеціаліст з аутизму",
      city: "Харків",
      experience: 12,
      rating: 4.8,
      reviewCount: 63,
      skills: ["Сенсорна інтеграція", "Ігрова терапія", "Арт-терапія", "Ерготерапія"]
    }
  ];

  const skillCategories = [
    "ABA-терапія", "Мовленнєва терапія", "Сенсорна інтеграція", 
    "Соціальні навички", "Поведінкова терапія", "Ігрова терапія",
    "Арт-терапія", "Музична терапія", "Логопедія", "Ерготерапія"
  ];

  const steps = [
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Знайдіть спеціаліста",
      description: "Використайте фільтри для пошуку найкращого експерта для вашої дитини"
    },
    {
      icon: <Star className="w-8 h-8 text-accent" />,
      title: "Перегляньте профілі",
      description: "Ознайомтеся з досвідом, навичками та відгуками інших батьків"
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-success" />,
      title: "Зв'яжіться безпосередньо",
      description: "Надішліть запит або зателефонуйте для консультації"
    }
  ];

  const testimonials = [
    {
      name: "Анна М.",
      text: "Знайшла чудового спеціаліста для сина. Результати вже через місяць!",
      rating: 5,
      city: "Київ"
    },
    {
      name: "Петро К.",
      text: "Дуже зручний пошук. Всі спеціалісти перевірені та професійні.",
      rating: 5,
      city: "Львів"
    },
    {
      name: "Марія Д.",
      text: "Платформа допомогла швидко знайти терапевта в нашому місті.",
      rating: 5,
      city: "Одеса"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-semibold text-foreground mb-6 max-w-4xl mx-auto">
              Знайдіть спеціаліста для вашої дитини
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Професійні психологи та терапевти, які працюють з дітьми з розладами аутистичного спектру
            </p>
            <QuickSearchForm onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-foreground mb-4">
              Як це працює
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Простий процес знаходження професійної допомоги для вашої дитини
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="text-center border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex justify-center mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Categories */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-foreground mb-4">
              Категорії навичок
            </h2>
            <p className="text-lg text-muted-foreground">
              Знайдіть спеціаліста за необхідною навичкою
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {skillCategories.map((skill, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-4 py-2 text-base cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => onNavigate("search", { filters: { skill } })}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Specialists */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-semibold text-foreground mb-4">
                Популярні спеціалісти
              </h2>
              <p className="text-lg text-muted-foreground">
                Найкраще оцінені експерти на платформі
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => onNavigate("search")}
              className="hidden md:flex items-center gap-2"
            >
              Всі спеціалісти
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {popularSpecialists.map((specialist) => (
              <SpecialistCard
                key={specialist.id}
                {...specialist}
                onViewProfile={handleViewProfile}
                onContact={handleContact}
              />
            ))}
          </div>
          
          <div className="text-center mt-8 md:hidden">
            <Button
              variant="outline"
              onClick={() => onNavigate("search")}
              className="flex items-center gap-2"
            >
              Всі спеціалісти
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section - Reviews */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-foreground mb-4">
              Відгуки батьків
            </h2>
            <p className="text-lg text-muted-foreground">
              Досвід інших сімей з нашою платформою
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-accent fill-current" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4 italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {testimonial.name}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {testimonial.city}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold text-foreground mb-4">
            Готові знайти ідеального спеціаліста?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Приєднуйтесь до тисяч батьків, які вже знайшли професійну допомогу
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => onNavigate("search")}
              className="bg-primary hover:bg-primary/90"
            >
              Обрати спеціаліста
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => onNavigate("about")}
            >
              Дізнатися більше
            </Button>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-success" />
              <span className="text-muted-foreground">Перевірені спеціалісти</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">1000+ сімей</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              <span className="text-muted-foreground">Швидка відповідь</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}