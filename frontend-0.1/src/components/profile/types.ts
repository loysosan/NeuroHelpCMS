export type Photo = {
  id: number;
  url: string;
};

export type Language = {
  ID: number;
  Name: string;
  Proficiency: string;
};

export type Education = {
  ID: number;
  Title: string;
  Institution: string;
  IssueDate: string;
  DocumentURL?: string;
};

export type SkillItem = {
  id: number;
  name: string;
  category: string;
};

export type ChildData = {
  id?: number;
  age: number;
  gender: string;
  problem: string;
};

export type UserProfile = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  verified: boolean;
  skills?: SkillItem[];
  child?: ChildData;
  portfolio?: {
    id: number;
    description?: string;
    experience?: number;
    contactEmail?: string;
    contactPhone?: string;
    city?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: string;
    telegram?: string;
    facebookURL?: string;
    instagramURL?: string;
    videoURL?: string;
    rate?: number;
    clientAgeMin?: number;
    clientAgeMax?: number;
    photos?: Photo[];
    educations?: Education[];
  };
};

export type ProfileTab = 'overview' | 'portfolio' | 'skills' | 'education' | 'photos' | 'languages' | 'child';
