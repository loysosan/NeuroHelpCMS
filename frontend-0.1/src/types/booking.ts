export type AvailabilitySlot = {
  id: number;
  psychologistId: number;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked';
  createdAt: string;
};

export type Session = {
  id: number;
  psychologistId: number;
  clientId?: number;
  availabilityId?: number;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  clientNotes?: string;
  psychologist?: { id: number; firstName: string; lastName: string };
  client?: { id: number; firstName: string; lastName: string };
  createdAt: string;
};

export type ScheduleTemplate = {
  id: number;
  psychologistId: number;
  dayOfWeek: number; // 0=Пн..6=Нд
  startTime: string; // "HH:MM:SS"
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
  createdAt: string;
};

export type ScheduleInfo = {
  scheduleEnforced: boolean;
  availability: AvailabilitySlot[];
};
