export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          date_of_birth: string | null
          sex: string | null
          height: number | null // in cm
          weight: number | null // in kg
          blood_group: string | null
          allergies: string[] | null
          medical_history: string | null
          current_medications: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & { created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      assessments: {
        Row: {
          id: string
          user_id: string
          title: string | null
          status: 'draft' | 'in_progress' | 'analyzing' | 'completed' | 'failed'
          urgency: 'routine' | 'soon' | 'urgent' | 'emergency' | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['assessments']['Row'], 'created_at' | 'updated_at'> & { created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['assessments']['Insert']>
      }
      // I will generate remaining types progressively as they are needed
    }
  }
}
