import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// The class-name helper every component uses: join classes, and let the last conflicting one win.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
