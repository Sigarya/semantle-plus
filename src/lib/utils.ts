
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Calculate similarity color class based on score
export function getSimilarityClass(similarity: number): string {
  if (similarity >= 0.7) return "similarity-hot";
  if (similarity >= 0.3) return "similarity-warm";
  return "similarity-cold";
}

// Format date to Hebrew format
export function formatHebrewDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return date.toLocaleDateString('he-IL', options);
}

// Mock function for calculating word similarity
// In production, this would call your backend API
export function calculateSimilarity(guess: string, target: string): Promise<number> {
  return new Promise((resolve) => {
    // This is just a mock for development
    // In reality, this would use your embeddings or API
    const mockSimilarities: Record<string, number> = {
      "בית": 0.25,
      "דירה": 0.42,
      "מגורים": 0.55,
      "דיור": 0.68,
      "מעון": 0.82,
      "מעונות": 0.91,
    };
    
    setTimeout(() => {
      if (guess === target) resolve(1);
      else resolve(mockSimilarities[guess] || Math.random() * 0.3);
    }, 300);
  });
}

// Generate a random word for demo purposes
// In production, this would be set by admin
export const DEMO_WORDS = [
  "בית",
  "מחשב",
  "שמש",
  "ספר",
  "תפוח",
  "אוניברסיטה",
  "מדינה",
  "חלום",
  "אהבה"
];

export function getRandomDemoWord(): string {
  return DEMO_WORDS[Math.floor(Math.random() * DEMO_WORDS.length)];
}

// Get today's daily word (mock implementation)
export function getTodayWord(): Promise<string> {
  return Promise.resolve(getRandomDemoWord());
}

// Mock for checking if a word is valid Hebrew
export function isValidHebrewWord(word: string): boolean {
  // A real implementation would use a dictionary or API
  // For now, just check if it's Hebrew characters
  const hebrewPattern = /^[\u0590-\u05FF\s]+$/;
  return hebrewPattern.test(word) && word.trim().length > 0;
}
