const pad = (value) => String(value).padStart(2, '0');

export const todayDateInputValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const toDateInputValue = (value) => {
  if (!value) return '';

  if (typeof value === 'string') {
    const datePrefix = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (datePrefix) return datePrefix;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const parseDateOnly = (value) => {
  const dateInputValue = toDateInputValue(value);
  if (!dateInputValue) return null;

  const [year, month, day] = dateInputValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
};

export const parseInterviewDateTime = (dateValue, timeValue = '00:00') => {
  const date = parseDateOnly(dateValue);
  if (!date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeValue)) return null;

  const [hours, minutes] = timeValue.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const formatDateOnly = (value, options) => {
  const date = parseDateOnly(value);
  return date ? date.toLocaleDateString(undefined, options || { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
};

export const daysFromToday = (value) => {
  const target = toDateInputValue(value);
  if (!target) return null;

  const today = todayDateInputValue();
  const toUtcDayNumber = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return Date.UTC(year, month - 1, day) / 86_400_000;
  };

  return toUtcDayNumber(target) - toUtcDayNumber(today);
};
