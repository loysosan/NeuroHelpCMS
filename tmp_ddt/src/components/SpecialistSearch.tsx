import { useState } from "react";
import { Search, Filter, MapPin, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { SpecialistCard } from "./SpecialistCard";
import { Separator } from "./ui/separator";

interface SearchFilters {
  query: string;
  city: string;
  gender: string;
  minAge: number;
  maxAge: number;
  experience: number;
  skills: string[];
  sortBy: string;
}

interface SpecialistSearchProps {
  onViewProfile: (id: string) => void;
  onContact: (id: string) => void;
}

export function SpecialistSearch({ onViewProfile, onContact }: SpecialistSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    city: "",
    gender: "any",
    minAge: 25,
    maxAge: 65,
    experience: 0,
    skills: [],
    sortBy: "rating"
  });

  const cities = [
    "Київ", "Харків", "Одеса", "Дніпро", "Львів", "Запоріжжя", 
    "Кривий Ріг", "Миколаїв", "Маріуполь", "Вінниця", "Херсон", "Полтава"
  ];

  const skillCategories = {
    "Поведінкова терапія": ["ABA-терапія", "Поведінкова терапія", "Соціальні навички"],
    "Мовлення": ["Мовленнєва терапія", "Логопедія", "Комунікативні навички"],
    "Сенсорна": ["Сенсорна інтеграція", "Ерготерапія", "Фізична терапія"],
    "Творча": ["Арт-терапія", "Музична терапія", "Ігрова терапія"],
    "Діагностика": ["Психологічна діагностика", "Медична діагностика", "Нейропсихологія"]
  };

  const sortOptions = [
    { value: "rating", label: "За рейтингом" },
    { value: "experience", label: "За досвідом" },
    { value: "reviews", label: "За відгуками" },
    { value: "name", label: "За іменем" }
  ];

  // Mock data
  const mockSpecialists = [
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
    },
    {
      id: "3",
      name: "Анна Сидоренко",
      title: "Дитячий терапевт",
      city: "Одеса",
      experience: 6,
      rating: 4.7,
      reviewCount: 29,
      skills: ["Музична терапія", "Логопедія", "Ігрова терапія"]
    }
  ];

  const toggleSkill = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      city: "",
      gender: "any",
      minAge: 25,
      maxAge: 65,
      experience: 0,
      skills: [],
      sortBy: "rating"
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.city) count++;
    if (filters.gender !== "any") count++;
    if (filters.experience > 0) count++;
    if (filters.skills.length > 0) count++;
    return count;
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Gender */}
      <div className="space-y-3">
        <Label>Стать</Label>
        <RadioGroup
          value={filters.gender}
          onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="any" id="any" />
            <Label htmlFor="any">Будь-яка</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" />
            <Label htmlFor="female">Жінка</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" />
            <Label htmlFor="male">Чоловік</Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* City */}
      <div className="space-y-3">
        <Label>Місто</Label>
        <Select 
          value={filters.city} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Оберіть місто" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Всі міста</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Experience */}
      <div className="space-y-3">
        <Label>Мінімальний досвід: {filters.experience} років</Label>
        <Slider
          value={[filters.experience]}
          onValueChange={(value) => setFilters(prev => ({ ...prev, experience: value[0] }))}
          max={20}
          min={0}
          step={1}
          className="w-full"
        />
      </div>

      <Separator />

      {/* Skills */}
      <div className="space-y-3">
        <Label>Навички</Label>
        <Accordion type="multiple" className="w-full">
          {Object.entries(skillCategories).map(([category, skills]) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="text-sm">
                {category}
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2 pt-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant={filters.skills.includes(skill) ? "default" : "secondary"}
                      className="cursor-pointer text-sm"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={clearFilters} className="flex-1">
          Очистити
        </Button>
        <Button onClick={() => setIsFilterOpen(false)} className="flex-1">
          Застосувати
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold mb-4">Пошук спеціалістів</h1>
          
          {/* Search Bar */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Пошук за іменем або навичками..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            {/* Mobile Filters Button */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden relative">
                  <SlidersHorizontal className="w-4 h-4" />
                  {getActiveFilterCount() > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
                    >
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh]">
                <SheetHeader className="text-left">
                  <SheetTitle>Фільтри</SheetTitle>
                </SheetHeader>
                <div className="mt-6 overflow-y-auto pb-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Знайдено {mockSpecialists.length} спеціалістів
            </p>
            <Select 
              value={filters.sortBy} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-6 p-6 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Фільтри</h3>
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </div>
              <FilterContent />
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {mockSpecialists.map((specialist) => (
                <SpecialistCard
                  key={specialist.id}
                  {...specialist}
                  onViewProfile={onViewProfile}
                  onContact={onContact}
                />
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-8">
              <Button variant="outline">
                Показати більше
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}