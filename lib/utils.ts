import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
  const diffInDays = Math.floor(diffInSeconds / (60 * 60 * 24));

  if (diffInDays === 0) {
    return 'today';
  }
  if (diffInDays === 1) {
    return 'tomorrow';
  }
  if (diffInDays > 1) {
    return `in ${diffInDays} days`;
  }
  if (diffInDays < 0) {
    return `${Math.abs(diffInDays)} days ago`;
  }
  return 'today';
}

export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
}