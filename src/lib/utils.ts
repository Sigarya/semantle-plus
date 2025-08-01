
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculate similarity color class based on score
export function getSimilarityClass(similarity: number): string {
  if (similarity >= 0.7) return "text-green-600 dark:text-green-400 font-bold";
  if (similarity >= 0.3) return "text-amber-600 dark:text-amber-400 font-bold";
  return "text-blue-600 dark:text-blue-400";
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

// Validation result type for specific error handling
export type WordValidationResult = {
  isValid: boolean;
  errorType?: 'multiple_words' | 'non_hebrew' | 'empty';
  errorMessage?: string;
};

// Enhanced validation function for Hebrew words with specific error types
export function validateHebrewWord(word: string): WordValidationResult {
  const trimmedWord = word.trim();
  
  // Check if empty
  if (!trimmedWord) {
    return {
      isValid: false,
      errorType: 'empty',
      errorMessage: 'אנא הזן מילה'
    };
  }
  
  // Check for multiple words (contains spaces)
  if (trimmedWord.includes(' ')) {
    return {
      isValid: false,
      errorType: 'multiple_words',
      errorMessage: 'המילה הסודית צריכה להיות רק מילה אחת'
    };
  }
  
  // Check if contains only Hebrew characters (no Latin, numbers, special chars except Hebrew)
  const hebrewPattern = /^[\u0590-\u05FF]+$/;
  if (!hebrewPattern.test(trimmedWord)) {
    return {
      isValid: false,
      errorType: 'non_hebrew',
      errorMessage: 'המילה הסודית צריכה להיות רק בעברית'
    };
  }
  
  return { isValid: true };
}

// Keep the old function for backward compatibility but make it use the new validation
export function isValidHebrewWord(word: string): boolean {
  return validateHebrewWord(word).isValid;
}
