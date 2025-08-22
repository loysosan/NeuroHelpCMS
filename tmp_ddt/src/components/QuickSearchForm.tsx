import { Search, MapPin, Brain } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";

interface QuickSearchFormProps {
  onSearch: (data: { city: string; skill: string; query: string }) => void;
}

export function QuickSearchForm({ onSearch }: QuickSearchFormProps) {
  const [city, setCity] = useState("");
  const [skill, setSkill] = useState("");
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ city, skill, query });
  };

  const cities = [
    "Київ", "Харків", "Одеса", "Дніпро", "Львів", "Запоріжжя", 
    "Кривий Ріг", "Миколаїв", "Маріуполь", "Вінниця", "Херсон", "Полтава"
  ];

  const skills = [
    "ABA-терапія", "Мовленнєва терапія", "Сенсорна інтеграція", 
    "Соціальні навички", "Поведінкова терапія", "Ігрова терапія",
    "Арт-терапія", "Музична терапія", "Логопедія", "Ерготерапія"
  ];

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* City Select */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-foreground font-medium">
              <MapPin className="w-4 h-4" />
              Місто
            </label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Оберіть місто" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((cityName) => (
                  <SelectItem key={cityName} value={cityName}>
                    {cityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skill Select */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-foreground font-medium">
              <Brain className="w-4 h-4" />
              Навичка
            </label>
            <Select value={skill} onValueChange={setSkill}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Оберіть навичку" />
              </SelectTrigger>
              <SelectContent>
                {skills.map((skillName) => (
                  <SelectItem key={skillName} value={skillName}>
                    {skillName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-foreground font-medium">
              <Search className="w-4 h-4" />
              Пошук
            </label>
            <Input
              placeholder="Ключові слова..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Search Button */}
          <div className="space-y-2">
            <label className="text-transparent">Action</label>
            <Button type="submit" className="w-full h-10 bg-primary hover:bg-primary/90">
              <Search className="w-4 h-4 mr-2" />
              Знайти
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}