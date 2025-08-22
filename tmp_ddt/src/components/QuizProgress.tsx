import { Progress } from "./ui/progress";
import { ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";

interface QuizProgressProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  onBack?: () => void;
  canGoBack?: boolean;
}

export function QuizProgress({ 
  currentStep, 
  totalSteps, 
  title, 
  onBack, 
  canGoBack = true 
}: QuizProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4 mb-4">
          {canGoBack && onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="p-2 h-auto"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">
              Крок {currentStep} з {totalSteps}
            </p>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}