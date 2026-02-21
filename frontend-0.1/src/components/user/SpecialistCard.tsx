import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Award, Star, Briefcase } from 'lucide-react';

interface Skill {
  id: number;
  name: string;
  category: string;
}

interface Rating {
  averageRating: number;
  reviewCount: number;
}

interface Photo {
  id: number;
  url: string;
}

interface Portfolio {
  description: string;
  experience: number;
  city: string | null;
  rate: number | null;
  photos: Photo[];
}

export interface SpecialistData {
  id: number;
  firstName: string;
  lastName: string;
  portfolio: Portfolio;
  skills: Skill[];
  rating: Rating | null;
}

interface Props {
  specialist: SpecialistData;
}

const SpecialistCard: React.FC<Props> = ({ specialist }) => {
  const { id, firstName, lastName, portfolio, skills, rating } = specialist;
  const fullName = `${firstName} ${lastName}`;

  // Get avatar URL (first photo or fallback)
  const hasPhoto = portfolio.photos && portfolio.photos.length > 0 && portfolio.photos[0].url;
  const avatarUrl = hasPhoto
    ? `${import.meta.env.VITE_API_URL || ''}/api${portfolio.photos[0].url}`
    : null;

  // Get initials for fallback
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  // Truncate description
  const shortDescription = portfolio.description?.length > 150
    ? portfolio.description.substring(0, 150) + '...'
    : portfolio.description || 'Опис відсутній';

  // Get first 3 skills
  const displaySkills = skills.slice(0, 3);
  const hasMoreSkills = skills.length > 3;

  return (
    <Link
      to={`/specialist/${id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
    >
      <div className="p-5">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white shadow-md bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-indigo-600">
                  {initials}
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name and Rating */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {fullName}
              </h3>
              {rating && (
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg flex-shrink-0">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold text-amber-700">
                    {rating.averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-amber-600">
                    ({rating.reviewCount})
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {shortDescription}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
              {portfolio.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{portfolio.city}</span>
                </div>
              )}
              {portfolio.experience > 0 && (
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{portfolio.experience} {portfolio.experience === 1 ? 'рік' : portfolio.experience < 5 ? 'роки' : 'років'}</span>
                </div>
              )}
              {portfolio.rate && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm">₴</span>
                  <span>{portfolio.rate} ₴/год</span>
                </div>
              )}
            </div>

            {/* Skills */}
            {displaySkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {displaySkills.map(skill => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium"
                  >
                    <Award className="w-3 h-3" />
                    {skill.name}
                  </span>
                ))}
                {hasMoreSkills && (
                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                    +{skills.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SpecialistCard;
