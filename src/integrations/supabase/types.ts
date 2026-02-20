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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          business_id: string
          client_id: string
          created_at: string
          ends_at: string
          id: string
          notes: string | null
          professional_id: string
          service_id: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          client_id: string
          created_at?: string
          ends_at: string
          id?: string
          notes?: string | null
          professional_id: string
          service_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          notes?: string | null
          professional_id?: string
          service_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          closing_time: string | null
          created_at: string
          id: string
          name: string
          opening_time: string | null
          phone: string | null
          vertical: Database["public"]["Enums"]["business_vertical"]
        }
        Insert: {
          address?: string | null
          closing_time?: string | null
          created_at?: string
          id?: string
          name: string
          opening_time?: string | null
          phone?: string | null
          vertical?: Database["public"]["Enums"]["business_vertical"]
        }
        Update: {
          address?: string | null
          closing_time?: string | null
          created_at?: string
          id?: string
          name?: string
          opening_time?: string | null
          phone?: string | null
          vertical?: Database["public"]["Enums"]["business_vertical"]
        }
        Relationships: []
      }
      clients: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string
          id: string
          last_message_at: string | null
          status: string
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          business_id: string
          conversation_id: string
          created_at: string
          direction: string
          from_phone: string | null
          id: string
          provider_message_id: string | null
          status: string | null
          to_phone: string | null
        }
        Insert: {
          body: string
          business_id: string
          conversation_id: string
          created_at?: string
          direction: string
          from_phone?: string | null
          id?: string
          provider_message_id?: string | null
          status?: string | null
          to_phone?: string | null
        }
        Update: {
          body?: string
          business_id?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          from_phone?: string | null
          id?: string
          provider_message_id?: string | null
          status?: string | null
          to_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          id: string
          name: string
          specialty: string | null
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          id?: string
          name: string
          specialty?: string | null
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          specialty?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          duration_minutes: number
          id: string
          name: string
          price_cents: number
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          name: string
          price_cents?: number
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          name?: string
          price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections: {
        Row: {
          business_id: string
          connected_at: string | null
          phone_number: string | null
          phone_number_id: string | null
          status: string
          updated_at: string
          waba_id: string | null
        }
        Insert: {
          business_id: string
          connected_at?: string | null
          phone_number?: string | null
          phone_number_id?: string | null
          status?: string
          updated_at?: string
          waba_id?: string | null
        }
        Update: {
          business_id?: string
          connected_at?: string | null
          phone_number?: string | null
          phone_number_id?: string | null
          status?: string
          updated_at?: string
          waba_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_business_id: { Args: never; Returns: string }
      is_business_member: { Args: { _business_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "professional" | "reception"
      appointment_status: "scheduled" | "confirmed" | "cancelled" | "done"
      business_vertical: "barbearia" | "salao"
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
      app_role: ["owner", "professional", "reception"],
      appointment_status: ["scheduled", "confirmed", "cancelled", "done"],
      business_vertical: ["barbearia", "salao"],
    },
  },
} as const
