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
          contact_email: string | null
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
          contact_email?: string | null
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
          contact_email?: string | null
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
      bot_qa: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          keywords: string[]
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          question?: string
          sort_order?: number
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
          pdf_file: string | null
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
          pdf_file?: string | null
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
          pdf_file?: string | null
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
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      support_chats: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          status: string
          visitor_name: string | null
          visitor_token: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          visitor_name?: string | null
          visitor_token: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          visitor_name?: string | null
          visitor_token?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          chat_id: string
          created_at: string
          id: string
          sender: string
        }
        Insert: {
          body: string
          chat_id: string
          created_at?: string
          id?: string
          sender: string
        }
        Update: {
          body?: string
          chat_id?: string
          created_at?: string
          id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "support_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      vip_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          plan: string | null
          receipt_path: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          plan?: string | null
          receipt_path?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          plan?: string | null
          receipt_path?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
