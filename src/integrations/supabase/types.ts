export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      advanced_insights: {
        Row: {
          action_items: Json
          competitive_landscape: Json
          consumer_personas: Json
          created_at: string
          engagement_rate: number | null
          executive_summary: string
          id: string
          keyword: string
          opportunities: Json
          overall_sentiment_score: number | null
          project_id: string | null
          search_period: string | null
          sentiment_trends: Json
          threats: Json
          total_reviews_analyzed: number
          trend_predictions: Json
          user_id: string
        }
        Insert: {
          action_items?: Json
          competitive_landscape?: Json
          consumer_personas?: Json
          created_at?: string
          engagement_rate?: number | null
          executive_summary: string
          id?: string
          keyword: string
          opportunities?: Json
          overall_sentiment_score?: number | null
          project_id?: string | null
          search_period?: string | null
          sentiment_trends?: Json
          threats?: Json
          total_reviews_analyzed?: number
          trend_predictions?: Json
          user_id: string
        }
        Update: {
          action_items?: Json
          competitive_landscape?: Json
          consumer_personas?: Json
          created_at?: string
          engagement_rate?: number | null
          executive_summary?: string
          id?: string
          keyword?: string
          opportunities?: Json
          overall_sentiment_score?: number | null
          project_id?: string | null
          search_period?: string | null
          sentiment_trends?: Json
          threats?: Json
          total_reviews_analyzed?: number
          trend_predictions?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advanced_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_results: {
        Row: {
          category: string | null
          created_at: string | null
          full_content: string | null
          id: string
          is_consumer_review: boolean
          key_topics: Json | null
          search_result_id: string
          sentiment: Database["public"]["Enums"]["sentiment_type"] | null
          structured_data: Json | null
          summary: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          full_content?: string | null
          id?: string
          is_consumer_review: boolean
          key_topics?: Json | null
          search_result_id: string
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          structured_data?: Json | null
          summary?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          full_content?: string | null
          id?: string
          is_consumer_review?: boolean
          key_topics?: Json | null
          search_result_id?: string
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          structured_data?: Json | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_search_result_id_fkey"
            columns: ["search_result_id"]
            isOneToOne: false
            referencedRelation: "search_results"
            referencedColumns: ["id"]
          },
        ]
      }
      first_stage_analysis_cache: {
        Row: {
          analysis_data: Json
          cache_key: string
          created_at: string
          id: string
          keyword: string | null
          result_count: number
          search_period: string | null
          trend_data: Json
          user_id: string
        }
        Insert: {
          analysis_data: Json
          cache_key: string
          created_at?: string
          id?: string
          keyword?: string | null
          result_count: number
          search_period?: string | null
          trend_data: Json
          user_id: string
        }
        Update: {
          analysis_data?: Json
          cache_key?: string
          created_at?: string
          id?: string
          keyword?: string | null
          result_count?: number
          search_period?: string | null
          trend_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      keywords: {
        Row: {
          category: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_active: boolean | null
          is_favorite: boolean | null
          keyword: string
          last_searched_at: string | null
          project_id: string | null
          search_count: number | null
          source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          is_favorite?: boolean | null
          keyword: string
          last_searched_at?: string | null
          project_id?: string | null
          search_count?: number | null
          source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          is_favorite?: boolean | null
          keyword?: string
          last_searched_at?: string | null
          project_id?: string | null
          search_count?: number | null
          source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "keywords_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          project_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          project_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          project_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_results: {
        Row: {
          article_published_at: string | null
          created_at: string | null
          id: string
          keyword: string
          project_id: string | null
          search_period: string | null
          snippet: string | null
          source_domain: string | null
          status: Database["public"]["Enums"]["search_status"] | null
          title: string
          updated_at: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          article_published_at?: string | null
          created_at?: string | null
          id?: string
          keyword: string
          project_id?: string | null
          search_period?: string | null
          snippet?: string | null
          source_domain?: string | null
          status?: Database["public"]["Enums"]["search_status"] | null
          title: string
          updated_at?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          article_published_at?: string | null
          created_at?: string | null
          id?: string
          keyword?: string
          project_id?: string | null
          search_period?: string | null
          snippet?: string | null
          source_domain?: string | null
          status?: Database["public"]["Enums"]["search_status"] | null
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      search_status: "pending" | "crawling" | "analyzed" | "failed"
      sentiment_type: "positive" | "negative" | "neutral" | "mixed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      search_status: ["pending", "crawling", "analyzed", "failed"],
      sentiment_type: ["positive", "negative", "neutral", "mixed"],
    },
  },
} as const
