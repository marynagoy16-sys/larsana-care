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
      academy_certificates: {
        Row: {
          enrollment_id: string
          id: string
          issued_at: string
          storage_path: string | null
        }
        Insert: {
          enrollment_id: string
          id?: string
          issued_at?: string
          storage_path?: string | null
        }
        Update: {
          enrollment_id?: string
          id?: string
          issued_at?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "academy_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_courses: {
        Row: {
          audience: Database["public"]["Enums"]["academy_audience"]
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          is_mandatory: boolean
          is_published: boolean
          profession: Database["public"]["Enums"]["profession_type"] | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["academy_audience"]
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_mandatory?: boolean
          is_published?: boolean
          profession?: Database["public"]["Enums"]["profession_type"] | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["academy_audience"]
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_mandatory?: boolean
          is_published?: boolean
          profession?: Database["public"]["Enums"]["profession_type"] | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      academy_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          professional_id: string
          status: Database["public"]["Enums"]["academy_enrollment_status"]
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          professional_id: string
          status?: Database["public"]["Enums"]["academy_enrollment_status"]
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          professional_id?: string
          status?: Database["public"]["Enums"]["academy_enrollment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "academy_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_enrollments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_gate_rules: {
        Row: {
          block_message: string | null
          course_id: string | null
          effective_from: string | null
          effective_until: string | null
          gate_target: Database["public"]["Enums"]["academy_gate_target"]
          id: string
          is_enabled: boolean
          required_lesson_ids: string[]
          required_module_ids: string[]
          requirement_type: Database["public"]["Enums"]["academy_requirement_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          block_message?: string | null
          course_id?: string | null
          effective_from?: string | null
          effective_until?: string | null
          gate_target: Database["public"]["Enums"]["academy_gate_target"]
          id?: string
          is_enabled?: boolean
          required_lesson_ids?: string[]
          required_module_ids?: string[]
          requirement_type?: Database["public"]["Enums"]["academy_requirement_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          block_message?: string | null
          course_id?: string | null
          effective_from?: string | null
          effective_until?: string | null
          gate_target?: Database["public"]["Enums"]["academy_gate_target"]
          id?: string
          is_enabled?: boolean
          required_lesson_ids?: string[]
          required_module_ids?: string[]
          requirement_type?: Database["public"]["Enums"]["academy_requirement_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_gate_rules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_gate_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_gate_rules_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          gate_target: Database["public"]["Enums"]["academy_gate_target"] | null
          id: string
          new_config: Json
          preset: Database["public"]["Enums"]["academy_gate_preset"] | null
          previous_config: Json | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          gate_target?:
            | Database["public"]["Enums"]["academy_gate_target"]
            | null
          id?: string
          new_config: Json
          preset?: Database["public"]["Enums"]["academy_gate_preset"] | null
          previous_config?: Json | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          gate_target?:
            | Database["public"]["Enums"]["academy_gate_target"]
            | null
          id?: string
          new_config?: Json
          preset?: Database["public"]["Enums"]["academy_gate_preset"] | null
          previous_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_gate_rules_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lesson_materials: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          sort_order: number
          storage_path: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          sort_order?: number
          storage_path: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          sort_order?: number
          storage_path?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_lesson_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lesson_progress: {
        Row: {
          completed_at: string | null
          enrollment_id: string
          id: string
          last_position_seconds: number
          lesson_id: string
          progress_percent: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          enrollment_id: string
          id?: string
          last_position_seconds?: number
          lesson_id: string
          progress_percent?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          enrollment_id?: string
          id?: string
          last_position_seconds?: number
          lesson_id?: string
          progress_percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "academy_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lessons: {
        Row: {
          content: string | null
          content_type: Database["public"]["Enums"]["academy_content_type"]
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_published: boolean
          metadata: Json
          module_id: string
          slug: string
          sort_order: number
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_type?: Database["public"]["Enums"]["academy_content_type"]
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          metadata?: Json
          module_id: string
          slug: string
          sort_order?: number
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_type?: Database["public"]["Enums"]["academy_content_type"]
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          metadata?: Json
          module_id?: string
          slug?: string
          sort_order?: number
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_modules: {
        Row: {
          code: string
          course_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          code: string
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          code?: string
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_platform_settings: {
        Row: {
          academy_enabled: boolean
          active_preset: Database["public"]["Enums"]["academy_gate_preset"]
          gates_master_enabled: boolean
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academy_enabled?: boolean
          active_preset?: Database["public"]["Enums"]["academy_gate_preset"]
          gates_master_enabled?: boolean
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academy_enabled?: boolean
          active_preset?: Database["public"]["Enums"]["academy_gate_preset"]
          gates_master_enabled?: boolean
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_quiz_responses: {
        Row: {
          answers: Json
          id: string
          lesson_id: string
          passed: boolean
          professional_id: string
          score: number | null
          submitted_at: string
        }
        Insert: {
          answers?: Json
          id?: string
          lesson_id: string
          passed?: boolean
          professional_id: string
          score?: number | null
          submitted_at?: string
        }
        Update: {
          answers?: Json
          id?: string
          lesson_id?: string
          passed?: boolean
          professional_id?: string
          score?: number | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_quiz_responses_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_quiz_responses_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_customers: {
        Row: {
          asaas_customer_id: string
          created_at: string
          id: string
          patient_id: string
        }
        Insert: {
          asaas_customer_id: string
          created_at?: string
          id?: string
          patient_id: string
        }
        Update: {
          asaas_customer_id?: string
          created_at?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_customers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_customers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_charges: {
        Row: {
          amount_cents: number
          assessment_id: string
          charge_id: string | null
          created_at: string
          due_days: number
          id: string
        }
        Insert: {
          amount_cents?: number
          assessment_id: string
          charge_id?: string | null
          created_at?: string
          due_days?: number
          id?: string
        }
        Update: {
          amount_cents?: number
          assessment_id?: string
          charge_id?: string | null
          created_at?: string
          due_days?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_charges_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "initial_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_charges_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_charges_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "charges_patient"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_status_history: {
        Row: {
          assessment_id: string
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["assessment_status"] | null
          id: string
          notes: string | null
          to_status: Database["public"]["Enums"]["assessment_status"]
        }
        Insert: {
          assessment_id: string
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["assessment_status"] | null
          id?: string
          notes?: string | null
          to_status: Database["public"]["Enums"]["assessment_status"]
        }
        Update: {
          assessment_id?: string
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["assessment_status"] | null
          id?: string
          notes?: string | null
          to_status?: Database["public"]["Enums"]["assessment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "assessment_status_history_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "initial_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sheets: {
        Row: {
          created_at: string
          cycle_id: string
          id: string
          patient_id: string
          professional_id: string
          session_id: string | null
          storage_path: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string
          cycle_id: string
          id?: string
          patient_id: string
          professional_id: string
          session_id?: string | null
          storage_path?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          cycle_id?: string
          id?: string
          patient_id?: string
          professional_id?: string
          session_id?: string | null
          storage_path?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sheets_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sheets_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sheets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sheets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sheets_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sheets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "care_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sheets_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_cycles: {
        Row: {
          assigned_professional_id: string
          closed_at: string | null
          created_at: string
          cycle_number: number
          id: string
          is_first_month_capture: boolean
          patient_id: string
          patient_level: Database["public"]["Enums"]["patient_level"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          pricing_version_id: string
          region_id: string | null
          session_count: number
          session_unit_price_cents: number
          started_at: string | null
          status: Database["public"]["Enums"]["cycle_status"]
          total_amount_cents: number
          updated_at: string
        }
        Insert: {
          assigned_professional_id: string
          closed_at?: string | null
          created_at?: string
          cycle_number: number
          id?: string
          is_first_month_capture?: boolean
          patient_id: string
          patient_level: Database["public"]["Enums"]["patient_level"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pricing_version_id: string
          region_id?: string | null
          session_count: number
          session_unit_price_cents: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["cycle_status"]
          total_amount_cents: number
          updated_at?: string
        }
        Update: {
          assigned_professional_id?: string
          closed_at?: string | null
          created_at?: string
          cycle_number?: number
          id?: string
          is_first_month_capture?: boolean
          patient_id?: string
          patient_level?: Database["public"]["Enums"]["patient_level"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pricing_version_id?: string
          region_id?: string | null
          session_count?: number
          session_unit_price_cents?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["cycle_status"]
          total_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_cycles_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_cycles_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_cycles_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_cycles_pricing_version_id_fkey"
            columns: ["pricing_version_id"]
            isOneToOne: false
            referencedRelation: "pricing_matrix_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_cycles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      care_sessions: {
        Row: {
          check_in_at: string | null
          check_out_at: string | null
          created_at: string
          cycle_id: string
          geo_lat: number | null
          geo_lng: number | null
          id: string
          intercorrencia_notes: string | null
          is_assessment_session: boolean
          professional_id: string
          scheduled_at: string | null
          session_number: number
          status: Database["public"]["Enums"]["session_status"]
          updated_at: string
        }
        Insert: {
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          cycle_id: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          intercorrencia_notes?: string | null
          is_assessment_session?: boolean
          professional_id: string
          scheduled_at?: string | null
          session_number: number
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
        }
        Update: {
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          cycle_id?: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          intercorrencia_notes?: string | null
          is_assessment_session?: boolean
          professional_id?: string
          scheduled_at?: string | null
          session_number?: number
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_sessions_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_sessions_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_sessions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      charges: {
        Row: {
          amount_cents: number
          asaas_payment_id: string | null
          assessment_id: string | null
          boleto_url: string | null
          created_at: string
          cycle_id: string | null
          description: string | null
          due_date: string | null
          id: string
          paid_at: string | null
          patient_id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pix_qr_code: string | null
          receipt_storage_path: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          asaas_payment_id?: string | null
          assessment_id?: string | null
          boleto_url?: string | null
          created_at?: string
          cycle_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          patient_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pix_qr_code?: string | null
          receipt_storage_path?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          asaas_payment_id?: string | null
          assessment_id?: string | null
          boleto_url?: string | null
          created_at?: string
          cycle_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          patient_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pix_qr_code?: string | null
          receipt_storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "charges_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "initial_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          id: string
          name: string
          region_id: string
          sp_municipality_id: string | null
          state: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          region_id: string
          sp_municipality_id?: string | null
          state?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          region_id?: string
          sp_municipality_id?: string | null
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_sp_municipality_id_fkey"
            columns: ["sp_municipality_id"]
            isOneToOne: false
            referencedRelation: "sp_municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          created_at: string
          id: string
          larsana_percent: number
          pp_class: Database["public"]["Enums"]["pp_class"]
          pp_percent: number
          version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          larsana_percent: number
          pp_class: Database["public"]["Enums"]["pp_class"]
          pp_percent: number
          version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          larsana_percent?: number
          pp_class?: Database["public"]["Enums"]["pp_class"]
          pp_percent?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "pricing_matrix_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_sequences: {
        Row: {
          created_at: string
          id: string
          last_sequence: number
          profession: Database["public"]["Enums"]["profession_type"]
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_sequence?: number
          profession: Database["public"]["Enums"]["profession_type"]
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          last_sequence?: number
          profession?: Database["public"]["Enums"]["profession_type"]
          year?: number
        }
        Relationships: []
      }
      contract_templates: {
        Row: {
          annex_i_template: string | null
          content_template: string | null
          created_at: string
          id: string
          is_active: boolean
          profession: Database["public"]["Enums"]["profession_type"]
          title: string
          version: string
        }
        Insert: {
          annex_i_template?: string | null
          content_template?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          profession: Database["public"]["Enums"]["profession_type"]
          title: string
          version?: string
        }
        Update: {
          annex_i_template?: string | null
          content_template?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          profession?: Database["public"]["Enums"]["profession_type"]
          title?: string
          version?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contract_number: string
          created_at: string
          generated_pdf_path: string | null
          id: string
          professional_id: string
          signed_at: string | null
          signed_pdf_path: string | null
          status: Database["public"]["Enums"]["contract_status"]
          template_id: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contract_number: string
          created_at?: string
          generated_pdf_path?: string | null
          id?: string
          professional_id: string
          signed_at?: string | null
          signed_pdf_path?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contract_number?: string
          created_at?: string
          generated_pdf_path?: string | null
          id?: string
          professional_id?: string
          signed_at?: string | null
          signed_pdf_path?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      credentialing_workflow_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status:
            | Database["public"]["Enums"]["credentialing_status"]
            | null
          id: string
          notes: string | null
          professional_id: string
          to_status: Database["public"]["Enums"]["credentialing_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?:
            | Database["public"]["Enums"]["credentialing_status"]
            | null
          id?: string
          notes?: string | null
          professional_id: string
          to_status: Database["public"]["Enums"]["credentialing_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?:
            | Database["public"]["Enums"]["credentialing_status"]
            | null
          id?: string
          notes?: string | null
          professional_id?: string
          to_status?: Database["public"]["Enums"]["credentialing_status"]
        }
        Relationships: [
          {
            foreignKeyName: "credentialing_workflow_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentialing_workflow_log_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      deluma_exports: {
        Row: {
          file_name: string | null
          file_path: string | null
          generated_at: string
          generated_by: string | null
          id: string
          metadata: Json
          reference_month: string
        }
        Insert: {
          file_name?: string | null
          file_path?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json
          reference_month: string
        }
        Update: {
          file_name?: string | null
          file_path?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json
          reference_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "deluma_exports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_responses: {
        Row: {
          decline_reason: string | null
          demand_id: string
          id: string
          professional_id: string
          responded_at: string
          response: Database["public"]["Enums"]["demand_response_type"]
        }
        Insert: {
          decline_reason?: string | null
          demand_id: string
          id?: string
          professional_id: string
          responded_at?: string
          response: Database["public"]["Enums"]["demand_response_type"]
        }
        Update: {
          decline_reason?: string | null
          demand_id?: string
          id?: string
          professional_id?: string
          responded_at?: string
          response?: Database["public"]["Enums"]["demand_response_type"]
        }
        Relationships: [
          {
            foreignKeyName: "demand_responses_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_responses_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      demands: {
        Row: {
          address_id: string | null
          assigned_professional_id: string | null
          created_at: string
          demand_type: Database["public"]["Enums"]["demand_type"]
          id: string
          notes: string | null
          patient_id: string
          region_id: string | null
          required_profession: Database["public"]["Enums"]["profession_type"]
          status: Database["public"]["Enums"]["demand_status"]
          updated_at: string
        }
        Insert: {
          address_id?: string | null
          assigned_professional_id?: string | null
          created_at?: string
          demand_type?: Database["public"]["Enums"]["demand_type"]
          id?: string
          notes?: string | null
          patient_id: string
          region_id?: string | null
          required_profession?: Database["public"]["Enums"]["profession_type"]
          status?: Database["public"]["Enums"]["demand_status"]
          updated_at?: string
        }
        Update: {
          address_id?: string | null
          assigned_professional_id?: string | null
          created_at?: string
          demand_type?: Database["public"]["Enums"]["demand_type"]
          id?: string
          notes?: string | null
          patient_id?: string
          region_id?: string | null
          required_profession?: Database["public"]["Enums"]["profession_type"]
          status?: Database["public"]["Enums"]["demand_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demands_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "patient_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_acceptances: {
        Row: {
          accepted_at: string
          acceptor_role: Database["public"]["Enums"]["user_role"]
          acceptor_user_id: string
          id: string
          ip_address: unknown
          patient_id: string | null
          professional_id: string | null
          term_id: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          acceptor_role: Database["public"]["Enums"]["user_role"]
          acceptor_user_id: string
          id?: string
          ip_address?: unknown
          patient_id?: string | null
          professional_id?: string | null
          term_id: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          acceptor_role?: Database["public"]["Enums"]["user_role"]
          acceptor_user_id?: string
          id?: string
          ip_address?: unknown
          patient_id?: string | null
          professional_id?: string | null
          term_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_acceptances_acceptor_user_id_fkey"
            columns: ["acceptor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_acceptances_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_acceptances_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_acceptances_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_acceptances_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "legal_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      first_month_retention_rules: {
        Row: {
          created_at: string
          id: string
          larsana_percent: number
          version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          larsana_percent?: number
          version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          larsana_percent?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "first_month_retention_rules_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: true
            referencedRelation: "pricing_matrix_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      initial_assessments: {
        Row: {
          accepted_weekly_frequency: number | null
          clinical_content: string | null
          comorbidities: string | null
          created_at: string
          crefito_number: string
          evaluator_professional_id: string
          family_response: Database["public"]["Enums"]["family_response"] | null
          id: string
          mobility: string
          patient_id: string
          patient_level_change_reason: string | null
          primary_diagnosis: string
          proposal_sent_at: string | null
          proposed_patient_level: Database["public"]["Enums"]["patient_level"]
          proposed_session_count: number
          proposed_weekly_frequency: number
          responded_at: string | null
          responded_by_user_id: string | null
          response_deadline_at: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          suggested_patient_level: Database["public"]["Enums"]["patient_level"]
          suggested_weekly_frequency: number | null
          updated_at: string
        }
        Insert: {
          accepted_weekly_frequency?: number | null
          clinical_content?: string | null
          comorbidities?: string | null
          created_at?: string
          crefito_number: string
          evaluator_professional_id: string
          family_response?:
            | Database["public"]["Enums"]["family_response"]
            | null
          id?: string
          mobility: string
          patient_id: string
          patient_level_change_reason?: string | null
          primary_diagnosis: string
          proposal_sent_at?: string | null
          proposed_patient_level: Database["public"]["Enums"]["patient_level"]
          proposed_session_count: number
          proposed_weekly_frequency: number
          responded_at?: string | null
          responded_by_user_id?: string | null
          response_deadline_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          suggested_patient_level: Database["public"]["Enums"]["patient_level"]
          suggested_weekly_frequency?: number | null
          updated_at?: string
        }
        Update: {
          accepted_weekly_frequency?: number | null
          clinical_content?: string | null
          comorbidities?: string | null
          created_at?: string
          crefito_number?: string
          evaluator_professional_id?: string
          family_response?:
            | Database["public"]["Enums"]["family_response"]
            | null
          id?: string
          mobility?: string
          patient_id?: string
          patient_level_change_reason?: string | null
          primary_diagnosis?: string
          proposal_sent_at?: string | null
          proposed_patient_level?: Database["public"]["Enums"]["patient_level"]
          proposed_session_count?: number
          proposed_weekly_frequency?: number
          responded_at?: string | null
          responded_by_user_id?: string | null
          response_deadline_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          suggested_patient_level?: Database["public"]["Enums"]["patient_level"]
          suggested_weekly_frequency?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "initial_assessments_evaluator_professional_id_fkey"
            columns: ["evaluator_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initial_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initial_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initial_assessments_responded_by_user_id_fkey"
            columns: ["responded_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_expenses: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string | null
          expense_type: string
          id: string
          notes: string | null
          reference_month: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by?: string | null
          expense_type: string
          id?: string
          notes?: string | null
          reference_month: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string | null
          expense_type?: string
          id?: string
          notes?: string | null
          reference_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      larsanapill_categories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      larsanapill_content_progress: {
        Row: {
          completed_at: string | null
          content_id: string
          id: string
          patient_id: string
          progress_percent: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          id?: string
          patient_id: string
          progress_percent?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          id?: string
          patient_id?: string
          progress_percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "larsanapill_content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "larsanapill_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "larsanapill_content_progress_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "larsanapill_content_progress_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
        ]
      }
      larsanapill_contents: {
        Row: {
          category_id: string
          content: string | null
          content_type: Database["public"]["Enums"]["academy_content_type"]
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_published: boolean
          metadata: Json
          slug: string
          sort_order: number
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          content?: string | null
          content_type?: Database["public"]["Enums"]["academy_content_type"]
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          metadata?: Json
          slug: string
          sort_order?: number
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          content?: string | null
          content_type?: Database["public"]["Enums"]["academy_content_type"]
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          metadata?: Json
          slug?: string
          sort_order?: number
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "larsanapill_contents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "larsanapill_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      larsanapill_plan_progress: {
        Row: {
          completed_at: string
          day_index: number
          id: string
          patient_id: string
          plan_id: string
        }
        Insert: {
          completed_at?: string
          day_index: number
          id?: string
          patient_id: string
          plan_id: string
        }
        Update: {
          completed_at?: string
          day_index?: number
          id?: string
          patient_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "larsanapill_plan_progress_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "larsanapill_plan_progress_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "larsanapill_plan_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "larsanapill_weekly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      larsanapill_weekly_plan_days: {
        Row: {
          content_id: string | null
          day_index: number
          id: string
          instructions: string | null
          plan_id: string
          sort_order: number
          title: string
        }
        Insert: {
          content_id?: string | null
          day_index: number
          id?: string
          instructions?: string | null
          plan_id: string
          sort_order?: number
          title: string
        }
        Update: {
          content_id?: string | null
          day_index?: number
          id?: string
          instructions?: string | null
          plan_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "larsanapill_weekly_plan_days_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "larsanapill_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "larsanapill_weekly_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "larsanapill_weekly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      larsanapill_weekly_plans: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          metadata: Json
          minutes_per_session: number
          sessions_per_week: number
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          metadata?: Json
          minutes_per_session?: number
          sessions_per_week?: number
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          metadata?: Json
          minutes_per_session?: number
          sessions_per_week?: number
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      legal_terms: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_current: boolean
          published_at: string
          requires_reaccept: boolean
          storage_path: string | null
          term_type: Database["public"]["Enums"]["legal_term_type"]
          title: string
          version: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_current?: boolean
          published_at?: string
          requires_reaccept?: boolean
          storage_path?: string | null
          term_type: Database["public"]["Enums"]["legal_term_type"]
          title: string
          version: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_current?: boolean
          published_at?: string
          requires_reaccept?: boolean
          storage_path?: string | null
          term_type?: Database["public"]["Enums"]["legal_term_type"]
          title?: string
          version?: string
        }
        Relationships: []
      }
      lgpd_requests: {
        Row: {
          created_at: string
          details: string | null
          id: string
          request_type: Database["public"]["Enums"]["lgpd_request_type"]
          requester_user_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["lgpd_request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          request_type: Database["public"]["Enums"]["lgpd_request_type"]
          requester_user_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["lgpd_request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          request_type?: Database["public"]["Enums"]["lgpd_request_type"]
          requester_user_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["lgpd_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lgpd_requests_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_access_log: {
        Row: {
          accessed_at: string
          accessed_by: string
          id: string
          medical_record_id: string
        }
        Insert: {
          accessed_at?: string
          accessed_by: string
          id?: string
          medical_record_id: string
        }
        Update: {
          accessed_at?: string
          accessed_by?: string
          id?: string
          medical_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_access_log_accessed_by_fkey"
            columns: ["accessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_access_log_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_attachments: {
        Row: {
          attachment_type: string | null
          created_at: string
          file_name: string | null
          id: string
          medical_record_id: string
          storage_path: string
        }
        Insert: {
          attachment_type?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          medical_record_id: string
          storage_path: string
        }
        Update: {
          attachment_type?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          medical_record_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_attachments_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_versions: {
        Row: {
          content_richtext: string | null
          edited_at: string
          edited_by: string | null
          id: string
          medical_record_id: string
        }
        Insert: {
          content_richtext?: string | null
          edited_at?: string
          edited_by?: string | null
          id?: string
          medical_record_id: string
        }
        Update: {
          content_richtext?: string | null
          edited_at?: string
          edited_by?: string | null
          id?: string
          medical_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_versions_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_versions_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          alert_24h_at: string | null
          alert_24h_triggered: boolean
          content_richtext: string | null
          created_at: string
          crefito_number: string
          cycle_id: string | null
          definitive_deadline_at: string | null
          id: string
          patient_id: string
          professional_id: string
          record_type: Database["public"]["Enums"]["medical_record_type"]
          recorded_at: string
          session_id: string | null
          updated_at: string
        }
        Insert: {
          alert_24h_at?: string | null
          alert_24h_triggered?: boolean
          content_richtext?: string | null
          created_at?: string
          crefito_number: string
          cycle_id?: string | null
          definitive_deadline_at?: string | null
          id?: string
          patient_id: string
          professional_id: string
          record_type?: Database["public"]["Enums"]["medical_record_type"]
          recorded_at?: string
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          alert_24h_at?: string | null
          alert_24h_triggered?: boolean
          content_richtext?: string | null
          created_at?: string
          crefito_number?: string
          cycle_id?: string | null
          definitive_deadline_at?: string | null
          id?: string
          patient_id?: string
          professional_id?: string
          record_type?: Database["public"]["Enums"]["medical_record_type"]
          recorded_at?: string
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "care_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          city_id: string
          created_at: string
          id: string
          name: string
          sp_neighborhood_id: string | null
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          name: string
          sp_neighborhood_id?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          name?: string
          sp_neighborhood_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neighborhoods_sp_neighborhood_id_fkey"
            columns: ["sp_neighborhood_id"]
            isOneToOne: false
            referencedRelation: "sp_neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nps_surveys: {
        Row: {
          comment: string | null
          cycle_id: string
          id: string
          rated_entity_id: string | null
          rated_entity_type: Database["public"]["Enums"]["nps_rated_entity_type"]
          rater_type: Database["public"]["Enums"]["nps_rater_type"]
          rater_user_id: string | null
          score: number
          submitted_at: string
        }
        Insert: {
          comment?: string | null
          cycle_id: string
          id?: string
          rated_entity_id?: string | null
          rated_entity_type: Database["public"]["Enums"]["nps_rated_entity_type"]
          rater_type: Database["public"]["Enums"]["nps_rater_type"]
          rater_user_id?: string | null
          score: number
          submitted_at?: string
        }
        Update: {
          comment?: string | null
          cycle_id?: string
          id?: string
          rated_entity_id?: string | null
          rated_entity_type?: Database["public"]["Enums"]["nps_rated_entity_type"]
          rater_type?: Database["public"]["Enums"]["nps_rater_type"]
          rater_user_id?: string | null
          score?: number
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nps_surveys_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_surveys_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_surveys_rater_user_id_fkey"
            columns: ["rater_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          entity_id: string
          entity_type: string
          id: string
          message: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          triggered_at: string
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          entity_id: string
          entity_type: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
          triggered_at?: string
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          entity_id?: string
          entity_type?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_addresses: {
        Row: {
          city_id: string | null
          complement: string | null
          created_at: string
          full_address: string
          id: string
          is_primary: boolean
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          number: string | null
          patient_id: string
          postal_code: string | null
          street: string | null
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          complement?: string | null
          created_at?: string
          full_address: string
          id?: string
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          patient_id: string
          postal_code?: string | null
          street?: string | null
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          complement?: string | null
          created_at?: string
          full_address?: string
          id?: string
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          patient_id?: string
          postal_code?: string | null
          street?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_addresses_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_addresses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_addresses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["patient_document_type"]
          file_name: string | null
          id: string
          patient_id: string
          source_url: string | null
          storage_path: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["patient_document_type"]
          file_name?: string | null
          id?: string
          patient_id: string
          source_url?: string | null
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["patient_document_type"]
          file_name?: string | null
          id?: string
          patient_id?: string
          source_url?: string | null
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_receipts: {
        Row: {
          charge_id: string
          cycle_id: string | null
          id: string
          issued_at: string
          storage_path: string | null
          template_id: string | null
        }
        Insert: {
          charge_id: string
          cycle_id?: string | null
          id?: string
          issued_at?: string
          storage_path?: string | null
          template_id?: string | null
        }
        Update: {
          charge_id?: string
          cycle_id?: string | null
          id?: string
          issued_at?: string
          storage_path?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_receipts_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_receipts_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "charges_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_receipts_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_receipts_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_receipts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "receipt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_responsibles: {
        Row: {
          backup_phone: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          patient_id: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          backup_phone?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          patient_id: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          backup_phone?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          patient_id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_responsibles_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_responsibles_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_responsibles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          allocated_professional_id: string | null
          asaas_customer_id: string | null
          attendance_period:
            | Database["public"]["Enums"]["patient_attendance_period"]
            | null
          birth_date: string | null
          care_status: Database["public"]["Enums"]["patient_care_status"]
          city_id: string | null
          clinical_summary: string | null
          cpf: string | null
          created_at: string
          diagnostic_hypothesis: string | null
          full_name: string
          id: string
          is_data_complete: boolean
          is_valor_social: boolean
          last_session_at: string | null
          patient_level: Database["public"]["Enums"]["patient_level"]
          region_id: string | null
          sex: Database["public"]["Enums"]["patient_sex"] | null
          suggested_weekly_frequency: number | null
          updated_at: string
          valor_social_amount_cents: number | null
          valor_social_approved_by: string | null
        }
        Insert: {
          allocated_professional_id?: string | null
          asaas_customer_id?: string | null
          attendance_period?:
            | Database["public"]["Enums"]["patient_attendance_period"]
            | null
          birth_date?: string | null
          care_status?: Database["public"]["Enums"]["patient_care_status"]
          city_id?: string | null
          clinical_summary?: string | null
          cpf?: string | null
          created_at?: string
          diagnostic_hypothesis?: string | null
          full_name: string
          id?: string
          is_data_complete?: boolean
          is_valor_social?: boolean
          last_session_at?: string | null
          patient_level?: Database["public"]["Enums"]["patient_level"]
          region_id?: string | null
          sex?: Database["public"]["Enums"]["patient_sex"] | null
          suggested_weekly_frequency?: number | null
          updated_at?: string
          valor_social_amount_cents?: number | null
          valor_social_approved_by?: string | null
        }
        Update: {
          allocated_professional_id?: string | null
          asaas_customer_id?: string | null
          attendance_period?:
            | Database["public"]["Enums"]["patient_attendance_period"]
            | null
          birth_date?: string | null
          care_status?: Database["public"]["Enums"]["patient_care_status"]
          city_id?: string | null
          clinical_summary?: string | null
          cpf?: string | null
          created_at?: string
          diagnostic_hypothesis?: string | null
          full_name?: string
          id?: string
          is_data_complete?: boolean
          is_valor_social?: boolean
          last_session_at?: string | null
          patient_level?: Database["public"]["Enums"]["patient_level"]
          region_id?: string | null
          sex?: Database["public"]["Enums"]["patient_sex"] | null
          suggested_weekly_frequency?: number | null
          updated_at?: string
          valor_social_amount_cents?: number | null
          valor_social_approved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_allocated_professional_id_fkey"
            columns: ["allocated_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_valor_social_approved_by_fkey"
            columns: ["valor_social_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          asaas_event_type: string
          asaas_payment_id: string | null
          asaas_transfer_id: string | null
          created_at: string
          error_message: string | null
          id: string
          payload: Json
          processed_at: string | null
        }
        Insert: {
          asaas_event_type: string
          asaas_payment_id?: string | null
          asaas_transfer_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload: Json
          processed_at?: string | null
        }
        Update: {
          asaas_event_type?: string
          asaas_payment_id?: string | null
          asaas_transfer_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
        }
        Relationships: []
      }
      pp_academy_exemptions: {
        Row: {
          created_at: string
          expires_at: string | null
          gate_target: Database["public"]["Enums"]["academy_gate_target"] | null
          granted_by: string | null
          id: string
          professional_id: string
          reason: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          gate_target?:
            | Database["public"]["Enums"]["academy_gate_target"]
            | null
          granted_by?: string | null
          id?: string
          professional_id: string
          reason: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          gate_target?:
            | Database["public"]["Enums"]["academy_gate_target"]
            | null
          granted_by?: string | null
          id?: string
          professional_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "pp_academy_exemptions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pp_academy_exemptions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_matrix_entries: {
        Row: {
          created_at: string
          id: string
          patient_level: Database["public"]["Enums"]["patient_level"]
          region_id: string
          session_price_cents: number
          version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_level: Database["public"]["Enums"]["patient_level"]
          region_id: string
          session_price_cents: number
          version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_level?: Database["public"]["Enums"]["patient_level"]
          region_id?: string
          session_price_cents?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_matrix_entries_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_matrix_entries_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "pricing_matrix_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_matrix_versions: {
        Row: {
          created_at: string
          effective_from: string
          id: string
          is_active: boolean
          notes: string | null
          version_code: string
        }
        Insert: {
          created_at?: string
          effective_from?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          version_code: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          version_code?: string
        }
        Relationships: []
      }
      professional_bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string | null
          agency: string | null
          bank_code: string | null
          bank_name: string | null
          created_at: string
          holder_document: string | null
          holder_name: string | null
          id: string
          pix_key: string | null
          professional_id: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string
          holder_document?: string | null
          holder_name?: string | null
          id?: string
          pix_key?: string | null
          professional_id: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string
          holder_document?: string | null
          holder_name?: string | null
          id?: string
          pix_key?: string | null
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_bank_accounts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_business_cards: {
        Row: {
          created_at: string
          id: string
          photo_source_url: string | null
          photo_storage_path: string | null
          professional_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_source_url?: string | null
          photo_storage_path?: string | null
          professional_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_source_url?: string | null
          photo_storage_path?: string | null
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_business_cards_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_councils: {
        Row: {
          council_type: Database["public"]["Enums"]["council_type"]
          created_at: string
          id: string
          professional_id: string
          registration_number: string
        }
        Insert: {
          council_type: Database["public"]["Enums"]["council_type"]
          created_at?: string
          id?: string
          professional_id: string
          registration_number: string
        }
        Update: {
          council_type?: Database["public"]["Enums"]["council_type"]
          created_at?: string
          id?: string
          professional_id?: string
          registration_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_councils_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["professional_document_type"]
          file_name: string | null
          id: string
          professional_id: string
          source_url: string | null
          storage_path: string | null
          uploaded_at: string
        }
        Insert: {
          document_type: Database["public"]["Enums"]["professional_document_type"]
          file_name?: string | null
          id?: string
          professional_id: string
          source_url?: string | null
          storage_path?: string | null
          uploaded_at?: string
        }
        Update: {
          document_type?: Database["public"]["Enums"]["professional_document_type"]
          file_name?: string | null
          id?: string
          professional_id?: string
          source_url?: string | null
          storage_path?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_invoices: {
        Row: {
          cycle_id: string
          file_name: string | null
          id: string
          professional_id: string
          storage_path: string
          transfer_id: string
          uploaded_at: string
        }
        Insert: {
          cycle_id: string
          file_name?: string | null
          id?: string
          professional_id: string
          storage_path: string
          transfer_id: string
          uploaded_at?: string
        }
        Update: {
          cycle_id?: string
          file_name?: string | null
          id?: string
          professional_id?: string
          storage_path?: string
          transfer_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_invoices_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_invoices_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_invoices_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_invoices_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: true
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_invoices_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: true
            referencedRelation: "transfers_pp"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_weekly_hours: {
        Row: {
          created_at: string
          id: string
          professional_id: string
          total_hours: number
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          professional_id: string
          total_hours?: number
          updated_at?: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          professional_id?: string
          total_hours?: number
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_weekly_hours_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          address: string | null
          asaas_wallet_id: string | null
          birth_date: string | null
          cpf_cnpj: string | null
          created_at: string
          credentialing_status: Database["public"]["Enums"]["credentialing_status"]
          email: string
          flag_assinado: boolean
          flag_encaminhado: boolean
          full_name: string
          id: string
          is_active: boolean
          person_type: Database["public"]["Enums"]["person_type"]
          phone: string | null
          pp_class: Database["public"]["Enums"]["pp_class"]
          profession: Database["public"]["Enums"]["profession_type"]
          referral_source: string | null
          specialty: string | null
          updated_at: string
          user_id: string | null
          weekly_hour_limit: number
        }
        Insert: {
          address?: string | null
          asaas_wallet_id?: string | null
          birth_date?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          credentialing_status?: Database["public"]["Enums"]["credentialing_status"]
          email: string
          flag_assinado?: boolean
          flag_encaminhado?: boolean
          full_name: string
          id?: string
          is_active?: boolean
          person_type?: Database["public"]["Enums"]["person_type"]
          phone?: string | null
          pp_class?: Database["public"]["Enums"]["pp_class"]
          profession?: Database["public"]["Enums"]["profession_type"]
          referral_source?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string | null
          weekly_hour_limit?: number
        }
        Update: {
          address?: string | null
          asaas_wallet_id?: string | null
          birth_date?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          credentialing_status?: Database["public"]["Enums"]["credentialing_status"]
          email?: string
          flag_assinado?: boolean
          flag_encaminhado?: boolean
          full_name?: string
          id?: string
          is_active?: boolean
          person_type?: Database["public"]["Enums"]["person_type"]
          phone?: string | null
          pp_class?: Database["public"]["Enums"]["pp_class"]
          profession?: Database["public"]["Enums"]["profession_type"]
          referral_source?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string | null
          weekly_hour_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "professionals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          must_reaccept_terms: boolean
          primary_role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          must_reaccept_terms?: boolean
          primary_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          must_reaccept_terms?: boolean
          primary_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      receipt_templates: {
        Row: {
          content_template: string
          created_at: string
          id: string
          is_default: boolean
          name: string
        }
        Insert: {
          content_template: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
        }
        Update: {
          content_template?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          cities_description: string | null
          code: Database["public"]["Enums"]["region_code"]
          created_at: string
          id: string
          name: string
        }
        Insert: {
          cities_description?: string | null
          code: Database["public"]["Enums"]["region_code"]
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          cities_description?: string | null
          code?: Database["public"]["Enums"]["region_code"]
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sp_municipalities: {
        Row: {
          created_at: string
          ibge_code: number
          id: string
          name: string
          state: string
        }
        Insert: {
          created_at?: string
          ibge_code: number
          id?: string
          name: string
          state?: string
        }
        Update: {
          created_at?: string
          ibge_code?: number
          id?: string
          name?: string
          state?: string
        }
        Relationships: []
      }
      sp_neighborhoods: {
        Row: {
          created_at: string
          id: string
          municipality_id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          municipality_id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          municipality_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sp_neighborhoods_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "sp_municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          can_approve_credenciamento: boolean
          can_manage_academy: boolean
          can_manage_pricing: boolean
          can_manage_users: boolean
          can_release_transfer: boolean
          created_at: string
          id: string
          staff_role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          can_approve_credenciamento?: boolean
          can_manage_academy?: boolean
          can_manage_pricing?: boolean
          can_manage_users?: boolean
          can_release_transfer?: boolean
          created_at?: string
          id?: string
          staff_role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          can_approve_credenciamento?: boolean
          can_manage_academy?: boolean
          can_manage_pricing?: boolean
          can_manage_users?: boolean
          can_release_transfer?: boolean
          created_at?: string
          id?: string
          staff_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_queue: {
        Row: {
          cycle_id: string
          id: string
          professional_id: string
          queued_at: string
          released_at: string | null
          status: Database["public"]["Enums"]["transfer_status"]
        }
        Insert: {
          cycle_id: string
          id?: string
          professional_id: string
          queued_at?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
        }
        Update: {
          cycle_id?: string
          id?: string
          professional_id?: string
          queued_at?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
        }
        Relationships: [
          {
            foreignKeyName: "transfer_queue_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: true
            referencedRelation: "care_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_queue_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: true
            referencedRelation: "care_cycles_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_queue_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          asaas_transfer_id: string | null
          commission_percent: number
          created_at: string
          cycle_id: string
          first_month_retention_applied: boolean
          id: string
          larsana_margin_cents: number
          patient_charged_amount_cents: number
          pp_class: Database["public"]["Enums"]["pp_class"]
          pp_transfer_amount_cents: number
          professional_id: string
          status: Database["public"]["Enums"]["transfer_status"]
          transferred_at: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          asaas_transfer_id?: string | null
          commission_percent: number
          created_at?: string
          cycle_id: string
          first_month_retention_applied?: boolean
          id?: string
          larsana_margin_cents: number
          patient_charged_amount_cents: number
          pp_class: Database["public"]["Enums"]["pp_class"]
          pp_transfer_amount_cents: number
          professional_id: string
          status?: Database["public"]["Enums"]["transfer_status"]
          transferred_at?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          asaas_transfer_id?: string | null
          commission_percent?: number
          created_at?: string
          cycle_id?: string
          first_month_retention_applied?: boolean
          id?: string
          larsana_margin_cents?: number
          patient_charged_amount_cents?: number
          pp_class?: Database["public"]["Enums"]["pp_class"]
          pp_transfer_amount_cents?: number
          professional_id?: string
          status?: Database["public"]["Enums"]["transfer_status"]
          transferred_at?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: true
            referencedRelation: "care_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: true
            referencedRelation: "care_cycles_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_pauses: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          patient_id: string
          paused_at: string
          reason: string | null
          resumed_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id: string
          paused_at?: string
          reason?: string | null
          resumed_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string
          paused_at?: string
          reason?: string | null
          resumed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_pauses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_pauses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_pauses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_protection_incidents: {
        Row: {
          description: string | null
          id: string
          incident_type: string
          patient_id: string | null
          professional_id: string | null
          reported_at: string
          reported_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          incident_type: string
          patient_id?: string | null
          professional_id?: string | null
          reported_at?: string
          reported_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          incident_type?: string
          patient_id?: string | null
          professional_id?: string | null
          reported_at?: string
          reported_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_protection_incidents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_protection_incidents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_protection_incidents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_protection_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      care_cycles_pp: {
        Row: {
          assigned_professional_id: string | null
          closed_at: string | null
          created_at: string | null
          cycle_number: number | null
          id: string | null
          is_first_month_capture: boolean | null
          patient_id: string | null
          patient_level: Database["public"]["Enums"]["patient_level"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          region_id: string | null
          session_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["cycle_status"] | null
          updated_at: string | null
        }
        Insert: {
          assigned_professional_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          cycle_number?: number | null
          id?: string | null
          is_first_month_capture?: boolean | null
          patient_id?: string | null
          patient_level?: Database["public"]["Enums"]["patient_level"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          region_id?: string | null
          session_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["cycle_status"] | null
          updated_at?: string | null
        }
        Update: {
          assigned_professional_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          cycle_number?: number | null
          id?: string | null
          is_first_month_capture?: boolean | null
          patient_id?: string | null
          patient_level?: Database["public"]["Enums"]["patient_level"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          region_id?: string | null
          session_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["cycle_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_cycles_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_cycles_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_cycles_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_cycles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      charges_patient: {
        Row: {
          amount_cents: number | null
          assessment_id: string | null
          boleto_url: string | null
          created_at: string | null
          cycle_id: string | null
          description: string | null
          due_date: string | null
          id: string | null
          paid_at: string | null
          patient_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pix_qr_code: string | null
          receipt_storage_path: string | null
        }
        Insert: {
          amount_cents?: number | null
          assessment_id?: string | null
          boleto_url?: string | null
          created_at?: string | null
          cycle_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pix_qr_code?: string | null
          receipt_storage_path?: string | null
        }
        Update: {
          amount_cents?: number | null
          assessment_id?: string | null
          boleto_url?: string | null
          created_at?: string | null
          cycle_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pix_qr_code?: string | null
          receipt_storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "charges_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "initial_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients_pp"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_kpis: {
        Row: {
          alertas_abertos: number | null
          avaliacoes_em_analise: number | null
          ciclos_abertos: number | null
          pacientes_ativos: number | null
          pacientes_pausa: number | null
          pagamentos_pendentes: number | null
          pagamentos_vencidos: number | null
          repasses_a_liberar: number | null
        }
        Relationships: []
      }
      patients_pp: {
        Row: {
          allocated_professional_id: string | null
          attendance_period:
            | Database["public"]["Enums"]["patient_attendance_period"]
            | null
          birth_date: string | null
          care_status: Database["public"]["Enums"]["patient_care_status"] | null
          city_id: string | null
          clinical_summary: string | null
          created_at: string | null
          diagnostic_hypothesis: string | null
          full_name: string | null
          id: string | null
          last_session_at: string | null
          patient_level: Database["public"]["Enums"]["patient_level"] | null
          region_id: string | null
          sex: Database["public"]["Enums"]["patient_sex"] | null
          suggested_weekly_frequency: number | null
        }
        Insert: {
          allocated_professional_id?: string | null
          attendance_period?:
            | Database["public"]["Enums"]["patient_attendance_period"]
            | null
          birth_date?: string | null
          care_status?:
            | Database["public"]["Enums"]["patient_care_status"]
            | null
          city_id?: string | null
          clinical_summary?: string | null
          created_at?: string | null
          diagnostic_hypothesis?: string | null
          full_name?: string | null
          id?: string | null
          last_session_at?: string | null
          patient_level?: Database["public"]["Enums"]["patient_level"] | null
          region_id?: string | null
          sex?: Database["public"]["Enums"]["patient_sex"] | null
          suggested_weekly_frequency?: number | null
        }
        Update: {
          allocated_professional_id?: string | null
          attendance_period?:
            | Database["public"]["Enums"]["patient_attendance_period"]
            | null
          birth_date?: string | null
          care_status?:
            | Database["public"]["Enums"]["patient_care_status"]
            | null
          city_id?: string | null
          clinical_summary?: string | null
          created_at?: string | null
          diagnostic_hypothesis?: string | null
          full_name?: string | null
          id?: string | null
          last_session_at?: string | null
          patient_level?: Database["public"]["Enums"]["patient_level"] | null
          region_id?: string | null
          sex?: Database["public"]["Enums"]["patient_sex"] | null
          suggested_weekly_frequency?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_allocated_professional_id_fkey"
            columns: ["allocated_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers_pp: {
        Row: {
          asaas_transfer_id: string | null
          commission_percent: number | null
          created_at: string | null
          cycle_id: string | null
          first_month_retention_applied: boolean | null
          id: string | null
          pp_class: Database["public"]["Enums"]["pp_class"] | null
          pp_transfer_amount_cents: number | null
          professional_id: string | null
          status: Database["public"]["Enums"]["transfer_status"] | null
          transferred_at: string | null
          updated_at: string | null
        }
        Insert: {
          asaas_transfer_id?: string | null
          commission_percent?: number | null
          created_at?: string | null
          cycle_id?: string | null
          first_month_retention_applied?: boolean | null
          id?: string | null
          pp_class?: Database["public"]["Enums"]["pp_class"] | null
          pp_transfer_amount_cents?: number | null
          professional_id?: string | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          transferred_at?: string | null
          updated_at?: string | null
        }
        Update: {
          asaas_transfer_id?: string | null
          commission_percent?: number | null
          created_at?: string | null
          cycle_id?: string | null
          first_month_retention_applied?: boolean | null
          id?: string | null
          pp_class?: Database["public"]["Enums"]["pp_class"] | null
          pp_transfer_amount_cents?: number | null
          professional_id?: string | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          transferred_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: true
            referencedRelation: "care_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: true
            referencedRelation: "care_cycles_pp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_demand: {
        Args: { p_demand_id: string }
        Returns: Json
      }
      add_business_days_from_date: {
        Args: { p_days: number; p_start: string }
        Returns: string
      }
      auth_user_id: { Args: never; Returns: string }
      calculate_transfer_amount: {
        Args: { p_cycle_id: string }
        Returns: {
          commission_percent: number
          first_month_retention_applied: boolean
          larsana_margin_cents: number
          pp_transfer_amount_cents: number
        }[]
      }
      can_access_patient: { Args: { p_patient_id: string }; Returns: boolean }
      check_prontuario_24h: { Args: never; Returns: number }
      current_patient_ids: { Args: never; Returns: string[] }
      current_professional_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      estimate_assessment_proposal_total_cents: {
        Args: {
          p_patient_id: string
          p_patient_level: Database["public"]["Enums"]["patient_level"]
          p_session_count: number
        }
        Returns: number
      }
      get_patient_proposal_preview: {
        Args: { p_assessment_id: string }
        Returns: Json
      }
      accept_assessment_proposal: {
        Args: {
          p_assessment_id: string
          p_response: Database["public"]["Enums"]["family_response"]
          p_chosen_weekly_frequency?: number | null
        }
        Returns: Json
      }
      simulate_charge_payment: {
        Args: { p_charge_id: string }
        Returns: Json
      }
      send_assessment_proposal: {
        Args: { p_assessment_id: string }
        Returns: Json
      }
      generate_contract_number: {
        Args: { p_profession: Database["public"]["Enums"]["profession_type"] }
        Returns: string
      }
      get_medical_record: {
        Args: { p_record_id: string }
        Returns: {
          alert_24h_at: string | null
          alert_24h_triggered: boolean
          content_richtext: string | null
          created_at: string
          crefito_number: string
          cycle_id: string | null
          definitive_deadline_at: string | null
          id: string
          patient_id: string
          professional_id: string
          record_type: Database["public"]["Enums"]["medical_record_type"]
          recorded_at: string
          session_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "medical_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_valid_acceptance: {
        Args: {
          p_patient_id: string
          p_term_types: Database["public"]["Enums"]["legal_term_type"][]
        }
        Returns: boolean
      }
      is_assigned_pp: { Args: { p_patient_id: string }; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_staff_role: {
        Args: { p_roles: Database["public"]["Enums"]["user_role"][] }
        Returns: boolean
      }
      pp_can_view_open_demand_patient: {
        Args: { p_patient_id: string }
        Returns: boolean
      }
      pp_passes_academy_gate: {
        Args: {
          p_gate_target: Database["public"]["Enums"]["academy_gate_target"]
        }
        Returns: boolean
      }
      resolve_demand_type: {
        Args: { p_patient_id: string }
        Returns: Database["public"]["Enums"]["demand_type"]
      }
    }
    Enums: {
      academy_audience: "pp" | "paciente"
      academy_content_type:
        | "video"
        | "pdf"
        | "richtext"
        | "quiz"
        | "exercise_steps"
        | "ebook"
      academy_enrollment_status: "not_started" | "in_progress" | "completed"
      academy_gate_preset:
        | "optional"
        | "soft_m1m3"
        | "full_m1m5"
        | "demands_m5_only"
        | "credenciamento_m5"
        | "phil_onboarding"
        | "custom"
      academy_gate_target:
        | "demands"
        | "credenciamento_ativo"
        | "paciente_p1"
        | "paciente_pagamento"
      academy_requirement_type: "full_course" | "modules" | "lessons" | "none"
      alert_severity: "info" | "warning" | "critical"
      alert_type:
        | "cobranca_vencida"
        | "contrato_pendente"
        | "prontuario_incompleto_24h"
        | "avaliacao_sem_resposta_5d"
        | "nps_baixo_consecutivo"
        | "demanda_alocada"
      assessment_status:
        | "avaliacao_feita"
        | "proposta_enviada"
        | "em_analise"
        | "respondida_sim"
        | "respondida_nao"
        | "vencida"
      contract_status:
        | "rascunho"
        | "gerado"
        | "pendente_aceite"
        | "assinado"
        | "aprovado"
        | "cancelado"
      council_type: "CREFITO" | "COREN"
      credentialing_status:
        | "rascunho"
        | "documentos_pendentes"
        | "termos_pendentes"
        | "contrato_pendente"
        | "aguardando_aprovacao"
        | "ativo"
        | "inativo"
        | "descredenciado"
      cycle_status:
        | "rascunho"
        | "aguardando_pagamento"
        | "ativo"
        | "encerrado"
        | "cancelado"
      demand_response_type: "accepted" | "declined"
      demand_status: "aberta" | "alocada" | "cancelada"
      demand_type: "avaliacao" | "continuidade"
      family_response: "SIM" | "NAO"
      legal_term_type:
        | "TERMO_ADESAO"
        | "DIRETRIZES"
        | "LGPD"
        | "DIRETRIZES_PP"
        | "LGPD_PP"
      lgpd_request_status: "pendente" | "em_analise" | "concluido" | "rejeitado"
      lgpd_request_type: "portabilidade" | "revogacao" | "exclusao" | "acesso"
      medical_record_type: "avaliacao" | "evolucao" | "alta"
      notification_type:
        | "avaliacao_resposta"
        | "repasse_liberado"
        | "prontuario_alerta"
        | "cobranca"
        | "proposta"
        | "nps"
        | "credenciamento"
        | "geral"
        | "academy_reminder"
        | "academy_course_completed"
      nps_rated_entity_type: "professional" | "patient" | "platform"
      nps_rater_type: "paciente" | "pp"
      patient_attendance_period: "MANHA" | "TARDE" | "NOITE"
      patient_care_status: "ATIVO" | "PAUSA"
      patient_document_type: "RG" | "LAUDO" | "EXAME" | "OUTRO"
      patient_level: "N1" | "N2" | "N3" | "VALOR_SOCIAL"
      patient_sex: "M" | "F" | "OUTRO"
      payment_method: "PIX" | "BOLETO"
      payment_status: "pendente" | "pago" | "vencido" | "cancelado"
      person_type: "PF" | "PJ"
      pp_class: "BRONZE" | "PRATA" | "OURO"
      profession_type: "FISIO" | "NUTI" | "MED" | "CUID" | "FONO"
      professional_document_type:
        | "RG_CNH"
        | "COUNCIL_CARD"
        | "CRIMINAL_BACKGROUND"
        | "CERTIFICATE"
        | "SIGNED_CONTRACT_PDF"
        | "VISIT_CARD_PHOTO"
      region_code: "A" | "B" | "C"
      session_status:
        | "prevista"
        | "realizada"
        | "falta"
        | "remarcada"
        | "intercorrencia"
      ticket_status: "aberto" | "em_andamento" | "resolvido" | "fechado"
      transfer_status:
        | "aguardando_nf"
        | "aguardando_validacao"
        | "liberado"
        | "transferido"
        | "falhou"
        | "cancelado"
      user_role: "admin" | "financeiro" | "gestao" | "pp" | "paciente"
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
      academy_audience: ["pp", "paciente"],
      academy_content_type: [
        "video",
        "pdf",
        "richtext",
        "quiz",
        "exercise_steps",
        "ebook",
      ],
      academy_enrollment_status: ["not_started", "in_progress", "completed"],
      academy_gate_preset: [
        "optional",
        "soft_m1m3",
        "full_m1m5",
        "demands_m5_only",
        "credenciamento_m5",
        "phil_onboarding",
        "custom",
      ],
      academy_gate_target: [
        "demands",
        "credenciamento_ativo",
        "paciente_p1",
        "paciente_pagamento",
      ],
      academy_requirement_type: ["full_course", "modules", "lessons", "none"],
      alert_severity: ["info", "warning", "critical"],
      alert_type: [
        "cobranca_vencida",
        "contrato_pendente",
        "prontuario_incompleto_24h",
        "avaliacao_sem_resposta_5d",
        "nps_baixo_consecutivo",
        "demanda_alocada",
      ],
      assessment_status: [
        "avaliacao_feita",
        "proposta_enviada",
        "em_analise",
        "respondida_sim",
        "respondida_nao",
        "vencida",
      ],
      contract_status: [
        "rascunho",
        "gerado",
        "pendente_aceite",
        "assinado",
        "aprovado",
        "cancelado",
      ],
      council_type: ["CREFITO", "COREN"],
      credentialing_status: [
        "rascunho",
        "documentos_pendentes",
        "termos_pendentes",
        "contrato_pendente",
        "aguardando_aprovacao",
        "ativo",
        "inativo",
        "descredenciado",
      ],
      cycle_status: [
        "rascunho",
        "aguardando_pagamento",
        "ativo",
        "encerrado",
        "cancelado",
      ],
      demand_response_type: ["accepted", "declined"],
      demand_status: ["aberta", "alocada", "cancelada"],
      demand_type: ["avaliacao", "continuidade"],
      family_response: ["SIM", "NAO"],
      legal_term_type: [
        "TERMO_ADESAO",
        "DIRETRIZES",
        "LGPD",
        "DIRETRIZES_PP",
        "LGPD_PP",
      ],
      lgpd_request_status: ["pendente", "em_analise", "concluido", "rejeitado"],
      lgpd_request_type: ["portabilidade", "revogacao", "exclusao", "acesso"],
      medical_record_type: ["avaliacao", "evolucao", "alta"],
      notification_type: [
        "avaliacao_resposta",
        "repasse_liberado",
        "prontuario_alerta",
        "cobranca",
        "proposta",
        "nps",
        "credenciamento",
        "geral",
        "academy_reminder",
        "academy_course_completed",
      ],
      nps_rated_entity_type: ["professional", "patient", "platform"],
      nps_rater_type: ["paciente", "pp"],
      patient_attendance_period: ["MANHA", "TARDE", "NOITE"],
      patient_care_status: ["ATIVO", "PAUSA"],
      patient_document_type: ["RG", "LAUDO", "EXAME", "OUTRO"],
      patient_level: ["N1", "N2", "N3", "VALOR_SOCIAL"],
      patient_sex: ["M", "F", "OUTRO"],
      payment_method: ["PIX", "BOLETO"],
      payment_status: ["pendente", "pago", "vencido", "cancelado"],
      person_type: ["PF", "PJ"],
      pp_class: ["BRONZE", "PRATA", "OURO"],
      profession_type: ["FISIO", "NUTI", "MED", "CUID", "FONO"],
      professional_document_type: [
        "RG_CNH",
        "COUNCIL_CARD",
        "CRIMINAL_BACKGROUND",
        "CERTIFICATE",
        "SIGNED_CONTRACT_PDF",
        "VISIT_CARD_PHOTO",
      ],
      region_code: ["A", "B", "C"],
      session_status: [
        "prevista",
        "realizada",
        "falta",
        "remarcada",
        "intercorrencia",
      ],
      ticket_status: ["aberto", "em_andamento", "resolvido", "fechado"],
      transfer_status: [
        "aguardando_nf",
        "aguardando_validacao",
        "liberado",
        "transferido",
        "falhou",
        "cancelado",
      ],
      user_role: ["admin", "financeiro", "gestao", "pp", "paciente"],
    },
  },
} as const
