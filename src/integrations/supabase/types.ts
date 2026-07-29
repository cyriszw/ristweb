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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      academic_results: {
        Row: {
          category: string
          created_at: string
          fail_rate: number
          id: string
          pass_rate: number
          updated_at: string
          year: number
        }
        Insert: {
          category: string
          created_at?: string
          fail_rate?: number
          id?: string
          pass_rate?: number
          updated_at?: string
          year?: number
        }
        Update: {
          category?: string
          created_at?: string
          fail_rate?: number
          id?: string
          pass_rate?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      admission_applications: {
        Row: {
          a_level_subjects: string[] | null
          created_at: string
          email: string
          id: string
          level: string
          o_level_subjects: string[] | null
          phone: string | null
          student_name: string
        }
        Insert: {
          a_level_subjects?: string[] | null
          created_at?: string
          email: string
          id?: string
          level: string
          o_level_subjects?: string[] | null
          phone?: string | null
          student_name: string
        }
        Update: {
          a_level_subjects?: string[] | null
          created_at?: string
          email?: string
          id?: string
          level?: string
          o_level_subjects?: string[] | null
          phone?: string | null
          student_name?: string
        }
        Relationships: []
      }
      application_tracking: {
        Row: {
          id: string
          application_id: string
          username: string
          password_hash: string
          tracking_token: string
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          application_id: string
          username: string
          password_hash: string
          tracking_token?: string
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          application_id?: string
          username?: string
          password_hash?: string
          tracking_token?: string
          created_at?: string
          last_login?: string | null
        }
        Relationships: [{
          foreignKeyName: "application_tracking_application_id_fkey"
          columns: ["application_id"]
          isOneToOne: true
          referencedRelation: "admission_applications"
          referencedColumns: ["id"]
        }]
      }
      application_statuses: {
        Row: {
          id: string
          application_id: string
          status: string
          notes: string | null
          updated_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          status: string
          notes?: string | null
          updated_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          status?: string
          notes?: string | null
          updated_by?: string | null
          created_at?: string
        }
        Relationships: [{
          foreignKeyName: "application_statuses_application_id_fkey"
          columns: ["application_id"]
          isOneToOne: false
          referencedRelation: "admission_applications"
          referencedColumns: ["id"]
        }]
      }
      application_chat_messages: {
        Row: {
          id: string
          application_id: string
          sender_type: string
          sender_id: string | null
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          sender_type: string
          sender_id?: string | null
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          sender_type?: string
          sender_id?: string | null
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [{
          foreignKeyName: "application_chat_messages_application_id_fkey"
          columns: ["application_id"]
          isOneToOne: false
          referencedRelation: "admission_applications"
          referencedColumns: ["id"]
        }]
      }
      application_attachments: {
        Row: {
          id: string
          application_id: string
          file_name: string
          file_url: string
          file_size: number
          file_type: string
          uploaded_by: string
          is_deleted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          file_name: string
          file_url: string
          file_size?: number
          file_type?: string
          uploaded_by: string
          is_deleted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          file_name?: string
          file_url?: string
          file_size?: number
          file_type?: string
          uploaded_by?: string
          is_deleted?: boolean
          created_at?: string
        }
        Relationships: [{
          foreignKeyName: "application_attachments_application_id_fkey"
          columns: ["application_id"]
          isOneToOne: false
          referencedRelation: "admission_applications"
          referencedColumns: ["id"]
        }]
      }
      application_activity_log: {
        Row: {
          id: string
          application_id: string
          action: string
          details: string | null
          performed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          action: string
          details?: string | null
          performed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          action?: string
          details?: string | null
          performed_by?: string | null
          created_at?: string
        }
        Relationships: [{
          foreignKeyName: "application_activity_log_application_id_fkey"
          columns: ["application_id"]
          isOneToOne: false
          referencedRelation: "admission_applications"
          referencedColumns: ["id"]
        }]
      }
      application_notifications: {
        Row: {
          id: string
          application_id: string
          recipient_type: string
          title: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          recipient_type: string
          title: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          recipient_type?: string
          title?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [{
          foreignKeyName: "application_notifications_application_id_fkey"
          columns: ["application_id"]
          isOneToOne: false
          referencedRelation: "admission_applications"
          referencedColumns: ["id"]
        }]
      }
      clubs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          meeting_days: string | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          meeting_days?: string | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          meeting_days?: string | null
          name?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      fees: {
        Row: {
          amount: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          title: string
        }
        Insert: {
          amount?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          title: string
        }
        Update: {
          amount?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          file_name: string
          file_url: string
          id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_url: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_url?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      gallery: {
        Row: {
          caption: string | null
          category: string | null
          id: string
          image_url: string
          likes: number
          uploaded_at: string
        }
        Insert: {
          caption?: string | null
          category?: string | null
          id?: string
          image_url: string
          likes?: number
          uploaded_at?: string
        }
        Update: {
          caption?: string | null
          category?: string | null
          id?: string
          image_url?: string
          likes?: number
          uploaded_at?: string
        }
        Relationships: []
      }
      homepage_stats: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_visible: boolean
          order_index: number
          title: string
          value: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          order_index?: number
          title: string
          value: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          order_index?: number
          title?: string
          value?: string
        }
        Relationships: []
      }
      innovation_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          innovation_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          innovation_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          innovation_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "innovation_images_innovation_id_fkey"
            columns: ["innovation_id"]
            isOneToOne: false
            referencedRelation: "innovations"
            referencedColumns: ["id"]
          },
        ]
      }
      innovation_social_links: {
        Row: {
          created_at: string
          display_order: number
          icon_name: string
          id: string
          innovation_id: string
          platform_name: string
          platform_url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon_name?: string
          id?: string
          innovation_id: string
          platform_name: string
          platform_url?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon_name?: string
          id?: string
          innovation_id?: string
          platform_name?: string
          platform_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "innovation_social_links_innovation_id_fkey"
            columns: ["innovation_id"]
            isOneToOne: false
            referencedRelation: "innovations"
            referencedColumns: ["id"]
          },
        ]
      }
      innovations: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      messages: {
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
      posts: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          title: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: string
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          content?: string
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          content?: string
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      social_media_links: {
        Row: {
          created_at: string
          display_order: number
          icon_name: string
          id: string
          is_active: boolean
          platform_name: string
          platform_url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean
          platform_name: string
          platform_url?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean
          platform_name?: string
          platform_url?: string
        }
        Relationships: []
      }
      sports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          season: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          season?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          season?: string | null
        }
        Relationships: []
      }
      stationery: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price?: number
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number
          quantity?: number
        }
        Relationships: []
      }
      subjects: {
        Row: {
          category: string | null
          created_at: string
          id: string
          level: string
          name: string
          sort_order: number
          stream: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          level: string
          name: string
          sort_order?: number
          stream?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          level?: string
          name?: string
          sort_order?: number
          stream?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          message: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          message?: string
          name?: string
        }
        Relationships: []
      }
      uniforms: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price?: number
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number
          quantity?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_logs: {
        Row: {
          created_at: string
          id: string
          visitor_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          visitor_type: string
        }
        Update: {
          created_at?: string
          id?: string
          visitor_type?: string
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
      increment_gallery_likes: { Args: { row_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
