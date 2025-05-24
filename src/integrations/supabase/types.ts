export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          change_time: string
          changed_by: string | null
          details: Json | null
          id: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          change_time?: string
          changed_by?: string | null
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          change_time?: string
          changed_by?: string | null
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_scores: {
        Row: {
          completion_time: string
          created_at: string
          guesses_count: number
          id: string
          user_id: string
          word_date: string
        }
        Insert: {
          completion_time?: string
          created_at?: string
          guesses_count: number
          id?: string
          user_id: string
          word_date: string
        }
        Update: {
          completion_time?: string
          created_at?: string
          guesses_count?: number
          id?: string
          user_id?: string
          word_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_scores_word_date_fkey"
            columns: ["word_date"]
            isOneToOne: false
            referencedRelation: "daily_words"
            referencedColumns: ["date"]
          },
        ]
      }
      daily_words: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          hints: string[] | null
          id: string
          is_active: boolean | null
          word: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          hints?: string[] | null
          id?: string
          is_active?: boolean | null
          word: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          hints?: string[] | null
          id?: string
          is_active?: boolean | null
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_words_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          finished_at: string | null
          guesses_count: number | null
          id: string
          is_finished: boolean | null
          started_at: string
          user_id: string
          word_id: string
        }
        Insert: {
          finished_at?: string | null
          guesses_count?: number | null
          id?: string
          is_finished?: boolean | null
          started_at?: string
          user_id: string
          word_id: string
        }
        Update: {
          finished_at?: string | null
          guesses_count?: number | null
          id?: string
          is_finished?: boolean | null
          started_at?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "daily_words"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean | null
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          is_admin?: boolean | null
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          username?: string
        }
        Relationships: []
      }
      user_guesses: {
        Row: {
          created_at: string
          guess_order: number
          guess_word: string
          id: string
          is_correct: boolean
          rank: number | null
          similarity: number
          user_id: string
          word_date: string
        }
        Insert: {
          created_at?: string
          guess_order: number
          guess_word: string
          id?: string
          is_correct?: boolean
          rank?: number | null
          similarity: number
          user_id: string
          word_date: string
        }
        Update: {
          created_at?: string
          guess_order?: number
          guess_word?: string
          id?: string
          is_correct?: boolean
          rank?: number | null
          similarity?: number
          user_id?: string
          word_date?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          best_guess_count: number | null
          best_streak: number | null
          created_at: string
          games_played: number | null
          games_won: number | null
          id: string
          total_guesses: number | null
          updated_at: string
          win_streak: number | null
        }
        Insert: {
          best_guess_count?: number | null
          best_streak?: number | null
          created_at?: string
          games_played?: number | null
          games_won?: number | null
          id: string
          total_guesses?: number | null
          updated_at?: string
          win_streak?: number | null
        }
        Update: {
          best_guess_count?: number | null
          best_streak?: number | null
          created_at?: string
          games_played?: number | null
          games_won?: number | null
          id?: string
          total_guesses?: number | null
          updated_at?: string
          win_streak?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
