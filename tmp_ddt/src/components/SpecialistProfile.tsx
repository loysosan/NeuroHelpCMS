import { useState } from "react";
import { Star, MapPin, Phone, Mail, Calendar, Heart, MessageCircle, Clock, Award, Users, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";

interface SpecialistProfileProps {
  specialistId: string;
  onContact: (id: string) => void;
  onBooking: (id: string) => void;
}

export function SpecialistProfile({ specialistId, onContact, onBooking }: SpecialistProfileProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock data
  const specialist = {
    id: specialistId,
    firstName: "Олена",
    lastName: "Петренко",
    title: "Дитячий психолог",
    city: "Київ",
    experience: 8,
    rating: 4.9,
    reviewCount: 47,
    sessionsCount: 342,
    bio: "Професійний дитячий психолог з 8-річним досвідом роботи з дітьми з розладами аутистичного спектру. Спеціалізуюся на ABA-терапії та розвитку соціальних навичок. Маю сертифікацію BCBA та постійно підвищую кваліфікацію.",
    education: [
      "Київський національний університет імені Тараса Шевченка - Психологія (2015)",
      "Сертифікат BCBA - Board Certified Behavior Analyst (2017)",
      "Курси з сенсорної інтеграції (2019)"
    ],
    skills: [
      { category: "Поведінкова терапія", items: ["ABA-терапія", "Поведінкова модифікація", "Функціональний аналіз"] },
      { category: "Мовлення", items: ["Мовленнєва терапія", "Альтернативна комунікація", "PECS"] },
      { category: "Соціальні навички", items: ["Соціальна взаємодія", "Ігрові навички", "Емоційна регуляція"] }
    ],
    contact: {
      phone: "+380 67 123 45 67",
      email: "olena.petrenko@example.com",
      telegram: "@olena_psychologist"
    },
    photos: [
      "/api/placeholder/300/200",
      "/api/placeholder/300/200", 
      "/api/placeholder/300/200",
      "/api/placeholder/300/200"
    ],
    availability: [
      { day: "Понеділок", slots: ["09:00", "10:30", "14:00", "15:30"] },
      { day: "Вівторок", slots: ["10:00", "11:30", "16:00"] },
      { day: "Середа", slots: ["09:00", "14:00", "15:30", "17:00"] },
      { day: "Четвер", slots: ["10:30", "13:00", "16:30"] },
      { day: "П'ятниця", slots: ["09:00", "10:30", "14:00"] }
    ],
    reviews: [
      {
        id: "1",
        clientName: "Анна М.",
        rating: 5,
        text: "Олена допомогла моєму синові значно покращити соціальні навички. Професійний підхід та чуйність. Рекомендую!",
        date: "2024-01-15"
      },
      {
        id: "2", 
        clientName: "Петро К.",
        rating: 5,
        text: "Чудовий спеціаліст! Дитина з радістю йде на сесії. Помітний прогрес у поведінці та комунікації.",
        date: "2024-01-10"
      },
      {
        id: "3",
        clientName: "Марія Д.",
        rating: 4,
        text: "Кваліфікований психолог з індивідуальним підходом. Дякуємо за терпіння та професіоналізм.",
        date: "2024-01-05"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
              <Avatar className="w-24 h-24 md:w-32 md:h-32">
                <AvatarImage src="/api/placeholder/128/128" />
                <AvatarFallback className="text-2xl">
                  {specialist.firstName[0]}{specialist.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-semibold mb-2">
                  {specialist.firstName} {specialist.lastName}
                </h1>
                <p className="text-lg text-muted-foreground mb-2">{specialist.title}</p>
                <div className="flex items-center gap-4 text-muted-foreground flex-wrap justify-center md:justify-start">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{specialist.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    <span>{specialist.experience} років досвіду</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating and Stats */}
            <div className="flex-1 w-full md:w-auto">
              <div className="flex flex-col md:flex-row gap-4 items-center md:items-start md:justify-end">
                <div className="flex gap-6 text-center">
                  <div>
                    <div className="flex items-center gap-1 justify-center">
                      <Star className="w-5 h-5 text-accent fill-current" />
                      <span className="font-semibold text-xl">{specialist.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{specialist.reviewCount} відгуків</p>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div>
                    <div className="flex items-center gap-1 justify-center">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-xl">{specialist.sessionsCount}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">сесій проведено</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
              onClick={() => onContact(specialist.id)}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Написати повідомлення
            </Button>
            <Button 
              onClick={() => onBooking(specialist.id)}
              variant="secondary"
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Записатися на сесію
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsFavorite(!isFavorite)}
              className={isFavorite ? "text-destructive" : ""}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-5 md:grid-cols-5">
            <TabsTrigger value="about" className="text-xs md:text-sm">Про мене</TabsTrigger>
            <TabsTrigger value="skills" className="text-xs md:text-sm">Навички</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs md:text-sm">Розклад</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs md:text-sm">Відгуки</TabsTrigger>
            <TabsTrigger value="photos" className="text-xs md:text-sm">Фото</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Про спеціаліста</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{specialist.bio}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Освіта та кваліфікація</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {specialist.education.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Контакти</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span>{specialist.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span>{specialist.contact.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                    <span>{specialist.contact.telegram}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Професійні навички</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {specialist.skills.map((category, index) => (
                    <AccordionItem key={index} value={`category-${index}`}>
                      <AccordionTrigger>{category.category}</AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {category.items.map((skill, skillIndex) => (
                            <Badge key={skillIndex} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Доступні години</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {specialist.availability.map((day, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{day.day}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {day.slots.map((slot, slotIndex) => (
                          <Button
                            key={slotIndex}
                            variant="outline"
                            size="sm"
                            className="text-sm"
                            onClick={() => onBooking(specialist.id)}
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {slot}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Відгуки клієнтів</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {specialist.reviews.map((review) => (
                    <div key={review.id} className="border-b border-border pb-6 last:border-b-0">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>{review.clientName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{review.clientName}</span>
                            <div className="flex">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-accent fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-2">{review.text}</p>
                          <p className="text-sm text-muted-foreground">{review.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full mt-6">
                  Залишити відгук
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Фотогалерея</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {specialist.photos.map((photo, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={photo} 
                        alt={`Фото ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}