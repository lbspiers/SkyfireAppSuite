-- ALTER TABLE command to add BOS Type 4, 5, and 6 fields for Systems 1-4
-- Total: 24 new fields (6 fields per BOS type × 3 BOS types × 4 systems = 72 fields)
-- Actually: 6 fields per type × 4 types × 3 systems = 72 fields total

-- Assuming table name is 'projects' or 'system_details'
-- Replace 'your_table_name' with actual table name

ALTER TABLE your_table_name

-- ========================================
-- SYSTEM 1 - BOS Type 4 (6 fields)
-- ========================================
ADD COLUMN bos_sys1_type4_equipment_type VARCHAR(255),
ADD COLUMN bos_sys1_type4_make VARCHAR(255),
ADD COLUMN bos_sys1_type4_model VARCHAR(255),
ADD COLUMN bos_sys1_type4_amp_rating VARCHAR(50),
ADD COLUMN bos_sys1_type4_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys1_type4_active BOOLEAN DEFAULT false,

-- ========================================
-- SYSTEM 1 - BOS Type 5 (6 fields)
-- ========================================
ADD COLUMN bos_sys1_type5_equipment_type VARCHAR(255),
ADD COLUMN bos_sys1_type5_make VARCHAR(255),
ADD COLUMN bos_sys1_type5_model VARCHAR(255),
ADD COLUMN bos_sys1_type5_amp_rating VARCHAR(50),
ADD COLUMN bos_sys1_type5_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys1_type5_active BOOLEAN DEFAULT false,

-- ========================================
-- SYSTEM 1 - BOS Type 6 (6 fields)
-- ========================================
ADD COLUMN bos_sys1_type6_equipment_type VARCHAR(255),
ADD COLUMN bos_sys1_type6_make VARCHAR(255),
ADD COLUMN bos_sys1_type6_model VARCHAR(255),
ADD COLUMN bos_sys1_type6_amp_rating VARCHAR(50),
ADD COLUMN bos_sys1_type6_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys1_type6_active BOOLEAN DEFAULT false,

-- ========================================
-- SYSTEM 2 - BOS Type 4 (6 fields)
-- ========================================
ADD COLUMN bos_sys2_type4_equipment_type VARCHAR(255),
ADD COLUMN bos_sys2_type4_make VARCHAR(255),
ADD COLUMN bos_sys2_type4_model VARCHAR(255),
ADD COLUMN bos_sys2_type4_amp_rating VARCHAR(50),
ADD COLUMN bos_sys2_type4_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys2_type4_active BOOLEAN DEFAULT false,

-- ========================================
-- SYSTEM 2 - BOS Type 5 (6 fields)
-- ========================================
ADD COLUMN bos_sys2_type5_equipment_type VARCHAR(255),
ADD COLUMN bos_sys2_type5_make VARCHAR(255),
ADD COLUMN bos_sys2_type5_model VARCHAR(255),
ADD COLUMN bos_sys2_type5_amp_rating VARCHAR(50),
ADD COLUMN bos_sys2_type5_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys2_type5_active BOOLEAN DEFAULT false,

-- ========================================
-- SYSTEM 2 - BOS Type 6 (6 fields)
-- ========================================
ADD COLUMN bos_sys2_type6_equipment_type VARCHAR(255),
ADD COLUMN bos_sys2_type6_make VARCHAR(255),
ADD COLUMN bos_sys2_type6_model VARCHAR(255),
ADD COLUMN bos_sys2_type6_amp_rating VARCHAR(50),
ADD COLUMN bos_sys2_type6_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys2_type6_active BOOLEAN DEFAULT false,

-- ========================================
-- SYSTEM 3 - BOS Type 4 (6 fields)
-- ========================================
ADD COLUMN bos_sys3_type4_equipment_type VARCHAR(255),
ADD COLUMN bos_sys3_type4_make VARCHAR(255),
ADD COLUMN bos_sys3_type4_model VARCHAR(255),
ADD COLUMN bos_sys3_type4_amp_rating VARCHAR(50),
ADD COLUMN bos_sys3_type4_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys3_type4_active BOOLEAN DEFAULT false,

-- ========================================
-- SYSTEM 3 - BOS Type 5 (6 fields)
-- ========================================
ADD COLUMN bos_sys3_type5_equipment_type VARCHAR(255),
ADD COLUMN bos_sys3_type5_make VARCHAR(255),
ADD COLUMN bos_sys3_type5_model VARCHAR(255),
ADD COLUMN bos_sys3_type5_amp_rating VARCHAR(50),
ADD COLUMN bos_sys3_type5_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys3_type5_active BOOLEAN DEFAULT false,

-- ========================================
-- SYSTEM 3 - BOS Type 6 (6 fields)
-- ========================================
ADD COLUMN bos_sys3_type6_equipment_type VARCHAR(255),
ADD COLUMN bos_sys3_type6_make VARCHAR(255),
ADD COLUMN bos_sys3_type6_model VARCHAR(255),
ADD COLUMN bos_sys3_type6_amp_rating VARCHAR(50),
ADD COLUMN bos_sys3_type6_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys3_type6_active BOOLEAN DEFAULT false,

-- ========================================
-- SYSTEM 4 - BOS Type 4 (6 fields)
-- ========================================
ADD COLUMN bos_sys4_type4_equipment_type VARCHAR(255),
ADD COLUMN bos_sys4_type4_make VARCHAR(255),
ADD COLUMN bos_sys4_type4_model VARCHAR(255),
ADD COLUMN bos_sys4_type4_amp_rating VARCHAR(50),
ADD COLUMN bos_sys4_type4_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys4_type4_active BOOLEAN DEFAULT false,

-- ========================================
-- SYSTEM 4 - BOS Type 5 (6 fields)
-- ========================================
ADD COLUMN bos_sys4_type5_equipment_type VARCHAR(255),
ADD COLUMN bos_sys4_type5_make VARCHAR(255),
ADD COLUMN bos_sys4_type5_model VARCHAR(255),
ADD COLUMN bos_sys4_type5_amp_rating VARCHAR(50),
ADD COLUMN bos_sys4_type5_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys4_type5_active BOOLEAN DEFAULT false,

-- ========================================
-- SYSTEM 4 - BOS Type 6 (6 fields)
-- ========================================
ADD COLUMN bos_sys4_type6_equipment_type VARCHAR(255),
ADD COLUMN bos_sys4_type6_make VARCHAR(255),
ADD COLUMN bos_sys4_type6_model VARCHAR(255),
ADD COLUMN bos_sys4_type6_amp_rating VARCHAR(50),
ADD COLUMN bos_sys4_type6_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys4_type6_active BOOLEAN DEFAULT false;

-- ========================================
-- SUMMARY
-- ========================================
-- Total fields added: 72
-- Breakdown:
--   - 4 Systems × 3 BOS Types (4, 5, 6) × 6 fields per type = 72 fields
--
-- Fields per BOS type:
--   1. equipment_type - VARCHAR(255) - Stores utility-specific equipment name
--   2. make - VARCHAR(255) - Manufacturer name
--   3. model - VARCHAR(255) - Model number
--   4. amp_rating - VARCHAR(50) - Amperage rating
--   5. is_new - BOOLEAN - Whether equipment is new (default: true)
--   6. active - BOOLEAN - Whether section is visible (default: false)
--
-- Usage:
--   Replace 'your_table_name' with actual table name (e.g., 'projects' or 'system_details')
--   Run in pgAdmin or psql
