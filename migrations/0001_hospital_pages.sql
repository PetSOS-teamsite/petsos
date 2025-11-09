-- Create hospitals table
CREATE TABLE "hospitals" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "name_en" text NOT NULL,
  "name_zh" text NOT NULL,
  "address_en" text NOT NULL,
  "address_zh" text NOT NULL,
  "region_id" varchar NOT NULL,
  "latitude" numeric,
  "longitude" numeric,
  "location" geography(Point,4326),
  "phone" text,
  "whatsapp" text,
  "website_url" text,
  "open_247" boolean DEFAULT true NOT NULL,
  "live_status" text,
  "photos" jsonb,
  "last_verified_at" timestamp,
  "verified_by_id" varchar,
  "on_site_vet_247" boolean,
  "triage_policy" text,
  "typical_wait_band" text,
  "isolation_ward" boolean,
  "ambulance_support" boolean,
  "icu_level" text,
  "nurse_24h" boolean,
  "owner_visit_policy" text,
  "eol_support" boolean,
  "imaging_xray" boolean,
  "imaging_us" boolean,
  "imaging_ct" boolean,
  "same_day_ct" boolean,
  "in_house_lab" boolean,
  "ext_lab_cutoff" text,
  "blood_bank_access" text,
  "sx_emergency_soft" boolean,
  "sx_emergency_ortho" boolean,
  "anaes_monitoring" text,
  "specialist_avail" text,
  "species_accepted" text[],
  "whatsapp_triage" boolean,
  "languages" text[],
  "parking" boolean,
  "wheelchair_access" boolean,
  "pay_methods" text[],
  "admission_deposit" boolean,
  "deposit_band" text,
  "insurance_support" text[],
  "recheck_window" text,
  "refund_policy" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "hospitals_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint

-- Create hospital_consult_fees table
CREATE TABLE "hospital_consult_fees" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "hospital_id" varchar NOT NULL,
  "fee_type" text NOT NULL,
  "species" text NOT NULL,
  "min_fee" numeric,
  "max_fee" numeric,
  "currency" text DEFAULT 'HKD' NOT NULL,
  "notes" text,
  "last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create hospital_updates table
CREATE TABLE "hospital_updates" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "hospital_id" varchar NOT NULL,
  "submitted_by_id" varchar,
  "update_type" text NOT NULL,
  "field_name" text,
  "old_value" text,
  "new_value" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "reviewed_by_id" varchar,
  "reviewed_at" timestamp,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign keys
ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hospital_consult_fees" ADD CONSTRAINT "hospital_consult_fees_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hospital_updates" ADD CONSTRAINT "hospital_updates_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hospital_updates" ADD CONSTRAINT "hospital_updates_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hospital_updates" ADD CONSTRAINT "hospital_updates_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- Create indexes
CREATE INDEX "idx_hospital_location" ON "hospitals" USING gist ("location");
--> statement-breakpoint
CREATE INDEX "idx_hospital_region" ON "hospitals"("region_id");
--> statement-breakpoint
CREATE INDEX "idx_consult_fees_hospital" ON "hospital_consult_fees"("hospital_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_consult_fees_unique" ON "hospital_consult_fees"("hospital_id", "fee_type", "species");
--> statement-breakpoint
CREATE INDEX "idx_hospital_updates_hospital" ON "hospital_updates"("hospital_id");
--> statement-breakpoint

-- Create trigger to auto-update location from lat/lng (similar to clinics)
CREATE OR REPLACE FUNCTION update_hospital_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude::float, NEW.latitude::float), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER hospital_location_trigger
BEFORE INSERT OR UPDATE ON hospitals
FOR EACH ROW
EXECUTE FUNCTION update_hospital_location();
