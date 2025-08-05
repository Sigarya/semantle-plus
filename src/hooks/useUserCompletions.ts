import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface UserCompletion {
  word_date: string;
  guesses_count: number;
  completion_time: string;
}

export const useUserCompletions = () => {
  const { currentUser } = useAuth();
  const [completions, setCompletions] = useState<UserCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompletions = async () => {
    if (!currentUser) {
      setCompletions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_scores')
        .select('word_date, guesses_count, completion_time')
        .eq('user_id', currentUser.id)
        .order('word_date', { ascending: false });

      if (error) {
        console.error("Error fetching user completions:", error);
        setCompletions([]);
      } else {
        setCompletions(data || []);
      }
    } catch (error) {
      console.error("Error fetching user completions:", error);
      setCompletions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletions();
  }, [currentUser]);

  const isGameCompleted = (date: string): boolean => {
    return completions.some(completion => completion.word_date === date);
  };

  const getCompletionInfo = (date: string): UserCompletion | null => {
    return completions.find(completion => completion.word_date === date) || null;
  };

  return {
    completions,
    isLoading,
    isGameCompleted,
    getCompletionInfo,
    refreshCompletions: fetchCompletions
  };
};