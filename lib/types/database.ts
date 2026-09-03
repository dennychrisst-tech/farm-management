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
      alert_thresholds: {
        Row: {
          farm_id: string
          feed_target_g_per_bird: number
          feed_variance_red_pct: number
          feed_variance_yellow_pct: number
          low_stock_lead_time_days: number
          low_stock_safety_buffer_days: number
          missing_report_cutoff_time: string
          mortality_spike_pct: number
          production_decline_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          farm_id: string
          feed_target_g_per_bird?: number
          feed_variance_red_pct?: number
          feed_variance_yellow_pct?: number
          low_stock_lead_time_days?: number
          low_stock_safety_buffer_days?: number
          missing_report_cutoff_time?: string
          mortality_spike_pct?: number
          production_decline_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          farm_id?: string
          feed_target_g_per_bird?: number
          feed_variance_red_pct?: number
          feed_variance_yellow_pct?: number
          low_stock_lead_time_days?: number
          low_stock_safety_buffer_days?: number
          missing_report_cutoff_time?: string
          mortality_spike_pct?: number
          production_decline_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_thresholds_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: true
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_thresholds_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          farm_id: string
          id: string
          message: string
          metadata: Json | null
          occurred_at: string
          related_daily_report_id: string | null
          related_feed_product_id: string | null
          severity: string
          status: string
          type: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          farm_id: string
          id?: string
          message: string
          metadata?: Json | null
          occurred_at?: string
          related_daily_report_id?: string | null
          related_feed_product_id?: string | null
          severity: string
          status?: string
          type: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          farm_id?: string
          id?: string
          message?: string
          metadata?: Json | null
          occurred_at?: string
          related_daily_report_id?: string | null
          related_feed_product_id?: string | null
          severity?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_related_daily_report_id_fkey"
            columns: ["related_daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_report_kpis"
            referencedColumns: ["daily_report_id"]
          },
          {
            foreignKeyName: "alerts_related_daily_report_id_fkey"
            columns: ["related_daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_related_feed_product_id_fkey"
            columns: ["related_feed_product_id"]
            isOneToOne: false
            referencedRelation: "feed_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_related_feed_product_id_fkey"
            columns: ["related_feed_product_id"]
            isOneToOne: false
            referencedRelation: "feed_stock_balances"
            referencedColumns: ["feed_product_id"]
          },
          {
            foreignKeyName: "alerts_related_feed_product_id_fkey"
            columns: ["related_feed_product_id"]
            isOneToOne: false
            referencedRelation: "feed_stock_coverage"
            referencedColumns: ["feed_product_id"]
          },
        ]
      }
      daily_report_revisions: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          daily_report_id: string
          id: string
          revision_number: number
          snapshot: Json
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          daily_report_id: string
          id?: string
          revision_number: number
          snapshot: Json
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          daily_report_id?: string
          id?: string
          revision_number?: number
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_revisions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_report_revisions_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_report_kpis"
            referencedColumns: ["daily_report_id"]
          },
          {
            foreignKeyName: "daily_report_revisions_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          closing_population: number | null
          created_at: string
          cull: number
          farm_id: string
          flock_id: string
          id: string
          mortality: number
          mortality_note: string | null
          notes: string | null
          opening_population: number
          population_adjustment: number
          report_date: string
          reporter_id: string
          status: string
          submitted_at: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          closing_population?: number | null
          created_at?: string
          cull?: number
          farm_id: string
          flock_id: string
          id?: string
          mortality?: number
          mortality_note?: string | null
          notes?: string | null
          opening_population?: number
          population_adjustment?: number
          report_date: string
          reporter_id: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          closing_population?: number | null
          created_at?: string
          cull?: number
          farm_id?: string
          flock_id?: string
          id?: string
          mortality?: number
          mortality_note?: string | null
          notes?: string | null
          opening_population?: number
          population_adjustment?: number
          report_date?: string
          reporter_id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_flock_id_fkey"
            columns: ["flock_id"]
            isOneToOne: false
            referencedRelation: "flocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      egg_production: {
        Row: {
          abnormal_eggs: number | null
          abnormal_loose: number
          abnormal_trays: number
          created_at: string
          daily_report_id: string
          egg_weight_kg: number | null
          id: string
          normal_eggs: number | null
          normal_loose: number
          normal_trays: number
          total_eggs: number | null
          updated_at: string
        }
        Insert: {
          abnormal_eggs?: number | null
          abnormal_loose?: number
          abnormal_trays?: number
          created_at?: string
          daily_report_id: string
          egg_weight_kg?: number | null
          id?: string
          normal_eggs?: number | null
          normal_loose?: number
          normal_trays?: number
          total_eggs?: number | null
          updated_at?: string
        }
        Update: {
          abnormal_eggs?: number | null
          abnormal_loose?: number
          abnormal_trays?: number
          created_at?: string
          daily_report_id?: string
          egg_weight_kg?: number | null
          id?: string
          normal_eggs?: number | null
          normal_loose?: number
          normal_trays?: number
          total_eggs?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "egg_production_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: true
            referencedRelation: "daily_report_kpis"
            referencedColumns: ["daily_report_id"]
          },
          {
            foreignKeyName: "egg_production_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: true
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          captured_at: string | null
          created_at: string
          daily_report_id: string
          id: string
          latitude: number | null
          longitude: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          captured_at?: string | null
          created_at?: string
          daily_report_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          captured_at?: string | null
          created_at?: string
          daily_report_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_report_kpis"
            referencedColumns: ["daily_report_id"]
          },
          {
            foreignKeyName: "evidence_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          container_sacks: number
          created_at: string
          id: string
          name: string
          sack_weight_kg: number
          timezone: string
          tray_size: number
        }
        Insert: {
          container_sacks?: number
          created_at?: string
          id?: string
          name: string
          sack_weight_kg?: number
          timezone?: string
          tray_size?: number
        }
        Update: {
          container_sacks?: number
          created_at?: string
          id?: string
          name?: string
          sack_weight_kg?: number
          timezone?: string
          tray_size?: number
        }
        Relationships: []
      }
      feed_products: {
        Row: {
          active: boolean
          code: string
          created_at: string
          farm_id: string
          id: string
          name: string
          phase: string | null
          sack_weight_kg: number
          sequence_order: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          farm_id: string
          id?: string
          name: string
          phase?: string | null
          sack_weight_kg?: number
          sequence_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          farm_id?: string
          id?: string
          name?: string
          phase?: string | null
          sack_weight_kg?: number
          sequence_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "feed_products_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_usage: {
        Row: {
          created_at: string
          daily_report_id: string
          feed_product_id: string
          id: string
          loose_kg: number
          sacks: number
          session: string
          total_kg: number | null
        }
        Insert: {
          created_at?: string
          daily_report_id: string
          feed_product_id: string
          id?: string
          loose_kg?: number
          sacks?: number
          session: string
          total_kg?: number | null
        }
        Update: {
          created_at?: string
          daily_report_id?: string
          feed_product_id?: string
          id?: string
          loose_kg?: number
          sacks?: number
          session?: string
          total_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_usage_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_report_kpis"
            referencedColumns: ["daily_report_id"]
          },
          {
            foreignKeyName: "feed_usage_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_usage_feed_product_id_fkey"
            columns: ["feed_product_id"]
            isOneToOne: false
            referencedRelation: "feed_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_usage_feed_product_id_fkey"
            columns: ["feed_product_id"]
            isOneToOne: false
            referencedRelation: "feed_stock_balances"
            referencedColumns: ["feed_product_id"]
          },
          {
            foreignKeyName: "feed_usage_feed_product_id_fkey"
            columns: ["feed_product_id"]
            isOneToOne: false
            referencedRelation: "feed_stock_coverage"
            referencedColumns: ["feed_product_id"]
          },
        ]
      }
      flock_targets: {
        Row: {
          created_at: string
          day_number: number
          flock_id: string
          id: string
          light_schedule: string | null
          target_feed_evening_kg: number | null
          target_feed_kg_per_day: number | null
          target_feed_morning_kg: number | null
        }
        Insert: {
          created_at?: string
          day_number: number
          flock_id: string
          id?: string
          light_schedule?: string | null
          target_feed_evening_kg?: number | null
          target_feed_kg_per_day?: number | null
          target_feed_morning_kg?: number | null
        }
        Update: {
          created_at?: string
          day_number?: number
          flock_id?: string
          id?: string
          light_schedule?: string | null
          target_feed_evening_kg?: number | null
          target_feed_kg_per_day?: number | null
          target_feed_morning_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "flock_targets_flock_id_fkey"
            columns: ["flock_id"]
            isOneToOne: false
            referencedRelation: "flocks"
            referencedColumns: ["id"]
          },
        ]
      }
      flocks: {
        Row: {
          arrival_age_weeks: number
          arrival_date: string
          closed_at: string | null
          created_at: string
          current_population: number
          farm_id: string
          id: string
          initial_population: number
          status: string
        }
        Insert: {
          arrival_age_weeks: number
          arrival_date: string
          closed_at?: string | null
          created_at?: string
          current_population: number
          farm_id: string
          id?: string
          initial_population: number
          status?: string
        }
        Update: {
          arrival_age_weeks?: number
          arrival_date?: string
          closed_at?: string | null
          created_at?: string
          current_population?: number
          farm_id?: string
          id?: string
          initial_population?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "flocks_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          daily_report_id: string | null
          farm_id: string
          feed_product_id: string
          id: string
          occurred_at: string
          qty_kg: number
          qty_sacks: number
          reason: string | null
          reference: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          daily_report_id?: string | null
          farm_id: string
          feed_product_id: string
          id?: string
          occurred_at?: string
          qty_kg: number
          qty_sacks?: number
          reason?: string | null
          reference?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          daily_report_id?: string | null
          farm_id?: string
          feed_product_id?: string
          id?: string
          occurred_at?: string
          qty_kg?: number
          qty_sacks?: number
          reason?: string | null
          reference?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_report_kpis"
            referencedColumns: ["daily_report_id"]
          },
          {
            foreignKeyName: "inventory_transactions_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_feed_product_id_fkey"
            columns: ["feed_product_id"]
            isOneToOne: false
            referencedRelation: "feed_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_feed_product_id_fkey"
            columns: ["feed_product_id"]
            isOneToOne: false
            referencedRelation: "feed_stock_balances"
            referencedColumns: ["feed_product_id"]
          },
          {
            foreignKeyName: "inventory_transactions_feed_product_id_fkey"
            columns: ["feed_product_id"]
            isOneToOne: false
            referencedRelation: "feed_stock_coverage"
            referencedColumns: ["feed_product_id"]
          },
        ]
      }
      milestones_reached: {
        Row: {
          created_at: string
          daily_report_id: string | null
          flock_id: string
          id: string
          milestone_pct: number
          reached_date: string
        }
        Insert: {
          created_at?: string
          daily_report_id?: string | null
          flock_id: string
          id?: string
          milestone_pct: number
          reached_date: string
        }
        Update: {
          created_at?: string
          daily_report_id?: string | null
          flock_id?: string
          id?: string
          milestone_pct?: number
          reached_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_reached_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_report_kpis"
            referencedColumns: ["daily_report_id"]
          },
          {
            foreignKeyName: "milestones_reached_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_reached_flock_id_fkey"
            columns: ["flock_id"]
            isOneToOne: false
            referencedRelation: "flocks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          farm_id: string
          id: string
          name: string
          phone: string | null
          role: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          farm_id: string
          id: string
          name: string
          phone?: string | null
          role: string
        }
        Update: {
          active?: boolean
          created_at?: string
          farm_id?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_items: {
        Row: {
          active: boolean
          category: string
          created_at: string
          farm_id: string
          id: string
          name: string
          unit: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          farm_id: string
          id?: string
          name: string
          unit?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          farm_id?: string
          id?: string
          name?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_items_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          farm_id: string
          id: string
          occurred_at: string
          qty: number
          reason: string | null
          reference: string | null
          supply_item_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          farm_id: string
          id?: string
          occurred_at?: string
          qty: number
          reason?: string | null
          reference?: string | null
          supply_item_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          farm_id?: string
          id?: string
          occurred_at?: string
          qty?: number
          reason?: string | null
          reference?: string | null
          supply_item_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_transactions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_transactions_supply_item_id_fkey"
            columns: ["supply_item_id"]
            isOneToOne: false
            referencedRelation: "supply_balances"
            referencedColumns: ["supply_item_id"]
          },
          {
            foreignKeyName: "supply_transactions_supply_item_id_fkey"
            columns: ["supply_item_id"]
            isOneToOne: false
            referencedRelation: "supply_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_report_kpis: {
        Row: {
          abnormal_egg_pct: number | null
          abnormal_eggs: number | null
          actual_feed_kg: number | null
          closing_population: number | null
          cull: number | null
          daily_report_id: string | null
          farm_id: string | null
          feed_intake_g_per_bird: number | null
          feed_target_kg: number | null
          feed_target_sacks: number | null
          flock_id: string | null
          hdp_pct: number | null
          mortality: number | null
          mortality_pct: number | null
          normal_eggs: number | null
          opening_population: number | null
          report_date: string | null
          status: string | null
          total_eggs: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_flock_id_fkey"
            columns: ["flock_id"]
            isOneToOne: false
            referencedRelation: "flocks"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_stock_balances: {
        Row: {
          balance_kg: number | null
          balance_sacks: number | null
          code: string | null
          farm_id: string | null
          feed_product_id: string | null
          name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_products_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_stock_coverage: {
        Row: {
          avg_daily_actual_kg: number | null
          balance_kg: number | null
          balance_sacks: number | null
          code: string | null
          coverage_days_actual: number | null
          coverage_days_target: number | null
          current_population: number | null
          farm_id: string | null
          feed_product_id: string | null
          feed_target_g_per_bird: number | null
          low_stock_lead_time_days: number | null
          low_stock_safety_buffer_days: number | null
          name: string | null
          target_daily_kg: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_products_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_balances: {
        Row: {
          balance: number | null
          category: string | null
          farm_id: string | null
          name: string | null
          supply_item_id: string | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_items_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_profile: {
        Args: never
        Returns: {
          active: boolean
          farm_id: string
          id: string
          role: string
        }[]
      }
      check_missing_reports: { Args: never; Returns: undefined }
      correct_daily_report: {
        Args: {
          p_cull: number
          p_egg: Json
          p_feed: Json
          p_mortality: number
          p_population_adjustment: number
          p_reason: string
          p_report_id: string
        }
        Returns: undefined
      }
      evaluate_feed_variance_alert: {
        Args: { p_report_id: string }
        Returns: undefined
      }
      evaluate_low_stock_alert: {
        Args: { p_farm_id: string }
        Returns: undefined
      }
      evaluate_milestone_alert: {
        Args: { p_report_id: string }
        Returns: undefined
      }
      evaluate_mortality_spike_alert: {
        Args: { p_report_id: string }
        Returns: undefined
      }
      evaluate_production_decline_alert: {
        Args: { p_flock_id: string; p_report_id: string }
        Returns: undefined
      }
      finalize_daily_report: {
        Args: { p_report_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
