import { daysFromToday } from './date.js';

export const getFollowUpTiming = (application) => {
  const days = daysFromToday(application.followUpDate);
  if (application.followUpStatus === 'Completed') return { key: 'completed', label: 'Completed', days };
  if (days === null) return { key: 'pending', label: 'Date unavailable', days };
  if (days < 0) return { key: 'overdue', label: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`, days };
  if (days === 0) return { key: 'today', label: 'Due Today', days };
  if (days === 1) return { key: 'upcoming', label: 'Due Tomorrow', days };
  return { key: 'upcoming', label: `Due in ${days} days`, days };
};
