import { format } from 'date-fns';

export const formatDate = (timestamp: number): string => {
  return format(new Date(timestamp * 1000), "MMM dd, yyyy HH:mm:ss");
};
