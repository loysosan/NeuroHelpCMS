import { useState } from "react";
import { QuizProgress } from "./QuizProgress";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { CheckCircle } from "lucide-react";

interface ClientRegistrationProps {
  onComplete: (data: any) => void;
  onCancel: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  city: string;
  interests: string[];
  agreeToCookies: boolean;
}

export function ClientRegistration({ onComplete, onCancel }: ClientRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "",
    interests: [],
    agreeToCookies: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 4;

  const cities = [
    "Київ", "Харків", "Одеса", "Дніпро", "Львів", "Запоріжжя", 
    "Кривий Ріг", "Миколаїв", "Маріуполь", "Вінниця", "Херсон", "Полтава"
  ];

  const interestOptions = [
    "ABA-терапія", "Мовленнєва терапія", "Сенсорна інтеграція", 
    "Соціальні навички", "Поведінкова терапія", "Ігрова терапія",
    "Арт-терапія", "Музична терапія", "Логопедія", "Ерготерапія",
    "Діагностика", "Консультації для батьків"
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = "Обов'язкове поле";
        if (!formData.lastName.trim()) newErrors.lastName = "Обов'язкове поле";
        if (!formData.email.trim()) newErrors.email = "Обов'язкове поле";
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "Невірний формат email";
        }
        if (!formData.password) newErrors.password = "Обов'язкове поле";
        if (formData.password && formData.password.length < 6) {
          newErrors.password = "Мінімум 6 символів";
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Паролі не співпадають";
        }
        break;
      case 4:
        if (!formData.agreeToCookies) {
          newErrors.agreeToCookies = "Необхідно погодитися з умовами";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete(formData);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold mb-2">Створення акаунту</h2>
                <p className="text-muted-foreground">Основна інформація</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ім'я *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Введіть ваше ім'я"
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Прізвище *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Введіть ваше прізвище"
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Мінімум 6 символів"
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Підтвердження паролю *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Повторіть пароль"
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold mb-2">Контактна інформація</h2>
                <p className="text-muted-foreground">Допоможе спеціалістам зв'язатися з вами</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон (необов'язково)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+380 XX XXX XX XX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Місто</Label>
                <Select 
                  value={formData.city} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть ваше місто" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold mb-2">Інтереси та цілі</h2>
                <p className="text-muted-foreground">Оберіть напрямки, що вас цікавлять (необов'язково)</p>
              </div>

              <div className="space-y-4">
                <Label>Напрямки терапії</Label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => (
                    <Badge
                      key={interest}
                      variant={formData.interests.includes(interest) ? "default" : "secondary"}
                      className="cursor-pointer px-3 py-2 text-sm"
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
                {formData.interests.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Обрано: {formData.interests.length} напрямків
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Підтвердження реєстрації</h2>
                <p className="text-muted-foreground">Перевірте ваші дані</p>
              </div>

              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div>
                  <span className="font-medium">Ім'я:</span> {formData.firstName} {formData.lastName}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {formData.email}
                </div>
                {formData.phone && (
                  <div>
                    <span className="font-medium">Телефон:</span> {formData.phone}
                  </div>
                )}
                {formData.city && (
                  <div>
                    <span className="font-medium">Місто:</span> {formData.city}
                  </div>
                )}
                {formData.interests.length > 0 && (
                  <div>
                    <span className="font-medium">Інтереси:</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.interests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToCookies"
                  checked={formData.agreeToCookies}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, agreeToCookies: !!checked }))
                  }
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="agreeToCookies"
                    className="text-sm cursor-pointer"
                  >
                    Я погоджуюся з{" "}
                    <span className="text-primary underline">Політикою приватності</span> та{" "}
                    <span className="text-primary underline">Умовами використання</span>
                  </Label>
                  {errors.agreeToCookies && (
                    <p className="text-sm text-destructive">{errors.agreeToCookies}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <QuizProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        title="Реєстрація батька/опікуна"
        onBack={currentStep > 1 ? handleBack : undefined}
        canGoBack={currentStep > 1}
      />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {renderStep()}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border md:relative md:border-t-0 md:bg-transparent md:p-0 md:mt-6">
          <div className="flex gap-3 max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Скасувати
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {currentStep === totalSteps ? "Завершити реєстрацію" : "Далі"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}