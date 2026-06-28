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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      collection_items: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          item_id: string
          item_kind: Database["public"]["Enums"]["item_kind"]
          position: number
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          item_id: string
          item_kind: Database["public"]["Enums"]["item_kind"]
          position?: number
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_kind?: Database["public"]["Enums"]["item_kind"]
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          cloned_from: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          owner_id: string
        }
        Insert: {
          cloned_from?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          owner_id: string
        }
        Update: {
          cloned_from?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_cloned_from_fkey"
            columns: ["cloned_from"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          item_id: string
          item_kind: Database["public"]["Enums"]["item_kind"]
          rating: Database["public"]["Enums"]["review_rating"]
          reverse_mode: boolean
          reviewed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          item_kind: Database["public"]["Enums"]["item_kind"]
          rating: Database["public"]["Enums"]["review_rating"]
          reverse_mode?: boolean
          reviewed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          item_kind?: Database["public"]["Enums"]["item_kind"]
          rating?: Database["public"]["Enums"]["review_rating"]
          reverse_mode?: boolean
          reviewed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sentences: {
        Row: {
          chinese: string
          created_at: string
          created_by: string | null
          english: string
          id: string
          is_public: boolean
          pinyin: string
        }
        Insert: {
          chinese: string
          created_at?: string
          created_by?: string | null
          english: string
          id?: string
          is_public?: boolean
          pinyin: string
        }
        Update: {
          chinese?: string
          created_at?: string
          created_by?: string | null
          english?: string
          id?: string
          is_public?: boolean
          pinyin?: string
        }
        Relationships: []
      }
      texts: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_public: boolean
          pinyin: string | null
          title: string
          translation: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          pinyin?: string | null
          title: string
          translation: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          pinyin?: string | null
          title?: string
          translation?: string
        }
        Relationships: []
      }
      user_flags: {
        Row: {
          created_at: string
          flag: Database["public"]["Enums"]["flag_kind"]
          id: string
          item_id: string
          item_kind: Database["public"]["Enums"]["item_kind"]
          user_id: string
        }
        Insert: {
          created_at?: string
          flag: Database["public"]["Enums"]["flag_kind"]
          id?: string
          item_id: string
          item_kind: Database["public"]["Enums"]["item_kind"]
          user_id: string
        }
        Update: {
          created_at?: string
          flag?: Database["public"]["Enums"]["flag_kind"]
          id?: string
          item_id?: string
          item_kind?: Database["public"]["Enums"]["item_kind"]
          user_id?: string
        }
        Relationships: []
      }
      words: {
        Row: {
          chinese: string
          created_at: string
          created_by: string | null
          english: string
          hsk_level: number | null
          id: string
          is_public: boolean
          pinyin: string
        }
        Insert: {
          chinese: string
          created_at?: string
          created_by?: string | null
          english: string
          hsk_level?: number | null
          id?: string
          is_public?: boolean
          pinyin: string
        }
        Update: {
          chinese?: string
          created_at?: string
          created_by?: string | null
          english?: string
          hsk_level?: number | null
          id?: string
          is_public?: boolean
          pinyin?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      flag_kind: "difficult" | "favorite"
      item_kind: "word" | "sentence" | "text"
      review_rating: "again" | "hard" | "good" | "easy"
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
      flag_kind: ["difficult", "favorite"],
      item_kind: ["word", "sentence", "text"],
      review_rating: ["again", "hard", "good", "easy"],
    },
  },
} as const
