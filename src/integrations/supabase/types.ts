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
      ad_comments: {
        Row: {
          ad_id: string
          author_name: string
          body: string
          contact: string | null
          created_at: string
          created_by: string | null
          id: string
        }
        Insert: {
          ad_id: string
          author_name: string
          body: string
          contact?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Update: {
          ad_id?: string
          author_name?: string
          body?: string
          contact?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_comments_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          domain: string | null
          id: string
          image_url: string | null
          link_url: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["ad_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          role_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          role_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_requests: {
        Row: {
          company_name: string
          created_at: string
          email: string | null
          facility_location: string
          id: string
          pdf_url: string
          project_id: string
          status: Database["public"]["Enums"]["request_status"]
          submitter_type: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          email?: string | null
          facility_location: string
          id?: string
          pdf_url: string
          project_id: string
          status?: Database["public"]["Enums"]["request_status"]
          submitter_type?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string | null
          facility_location?: string
          id?: string
          pdf_url?: string
          project_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          submitter_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_submissions: {
        Row: {
          approved_project_id: string | null
          contact_phone: string
          created_at: string
          description: string
          id: string
          images: string[]
          location: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_project_id?: string | null
          contact_phone: string
          created_at?: string
          description: string
          id?: string
          images?: string[]
          location: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_project_id?: string | null
          contact_phone?: string
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          location?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_submissions_approved_project_id_fkey"
            columns: ["approved_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          ad_id: string | null
          admin_approval: string
          cover_image: string | null
          created_at: string
          created_by: string | null
          description: string | null
          domain: string | null
          duration: string | null
          id: string
          images: string[]
          location: string | null
          name: string
          owner_id: string | null
        }
        Insert: {
          ad_id?: string | null
          admin_approval?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain?: string | null
          duration?: string | null
          id?: string
          images?: string[]
          location?: string | null
          name: string
          owner_id?: string | null
        }
        Update: {
          ad_id?: string | null
          admin_approval?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain?: string | null
          duration?: string | null
          id?: string
          images?: string[]
          location?: string | null
          name?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          label: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          name?: string
        }
        Relationships: []
      }
      team_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ad_status: "pending" | "approved" | "rejected"
      app_role: "admin" | "employee"
      request_status: "new" | "reviewing" | "accepted" | "rejected"
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
      ad_status: ["pending", "approved", "rejected"],
      app_role: ["admin", "employee"],
      request_status: ["new", "reviewing", "accepted", "rejected"],
    },
  },
} as const
