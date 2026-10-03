import { convertSavedJob } from './api';
import { todayDateInputValue } from '../utils/date';

export const convertSavedJobToApplication = (savedJobId) =>
  convertSavedJob(savedJobId, { applicationDate: todayDateInputValue() });
