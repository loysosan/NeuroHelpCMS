import { Star, MapPin, MessageCircle, User } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

interface SpecialistCardProps {
  id: string;
  name: string;
  title: string;
  city: string;
  experience: number;
  rating: number;
  reviewCount: number;
  skills: string[];
  avatar?: string;
  onViewProfile: (id: string) => void;
  onContact: (id: string) => void;
}

export function SpecialistCard({
  id,
  name,
  title,
  city,
  experience,
  rating,
  reviewCount,
  skills,
  avatar,
  onViewProfile,
  onContact
}: SpecialistCardProps) {
  const displayedSkills = skills.slice(0, 4);
  const remainingSkills = skills.length - 4;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200 border border-border">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {avatar ? (
              <img 
                src={avatar} 
                alt={name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-foreground mb-1">{name}</h3>
                <p className="text-muted-foreground">{title}</p>
              </div>
              <div className="flex items-center gap-1 text-accent">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-medium">{rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviewCount})</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3 text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{city}</span>
              </div>
              <span>{experience} років досвіду</span>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {displayedSkills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {skill}
                </Badge>
              ))}
              {remainingSkills > 0 && (
                <Badge variant="outline" className="text-sm">
                  +{remainingSkills}
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => onViewProfile(id)}
                className="flex-1"
              >
                Переглянути профіль
              </Button>
              <Button 
                onClick={() => onContact(id)}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Запитати
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}