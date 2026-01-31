-- ALTER TABLE command to add Battery Chain and Backup Chain BOS fields
--
-- BATTERY CHAIN: 2 BOS slots per battery type (after Battery 1 and Battery 2)
--   - bos_sys1_battery1_type1, bos_sys1_battery1_type2
--   - bos_sys1_battery2_type1, bos_sys1_battery2_type2
--   (Repeated for sys2, sys3, sys4)
--
-- BACKUP CHAIN: 3 BOS slots after backup subpanel
--   - bos_sys1_backup_type1, bos_sys1_backup_type2, bos_sys1_backup_type3
--   (Repeated for sys2, sys3, sys4)
--
-- Total new fields: 4 systems × (2 batteries × 2 slots + 1 backup × 3 slots) × 6 fields per slot
--                  = 4 × (4 + 3) × 6 = 4 × 7 × 6 = 168 fields
--
-- Replace 'your_table_name' with actual table name (e.g., 'projects' or 'system_details')

ALTER TABLE your_table_name

-- ========================================
-- SYSTEM 1 - Battery 1 Chain (2 BOS slots)
-- ========================================
ADD COLUMN bos_sys1_battery1_type1_equipment_type VARCHAR(255),
ADD COLUMN bos_sys1_battery1_type1_make VARCHAR(255),
ADD COLUMN bos_sys1_battery1_type1_model VARCHAR(255),
ADD COLUMN bos_sys1_battery1_type1_amp_rating VARCHAR(50),
ADD COLUMN bos_sys1_battery1_type1_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys1_battery1_type1_trigger VARCHAR(100),

ADD COLUMN bos_sys1_battery1_type2_equipment_type VARCHAR(255),
ADD COLUMN bos_sys1_battery1_type2_make VARCHAR(255),
ADD COLUMN bos_sys1_battery1_type2_model VARCHAR(255),
ADD COLUMN bos_sys1_battery1_type2_amp_rating VARCHAR(50),
ADD COLUMN bos_sys1_battery1_type2_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys1_battery1_type2_trigger VARCHAR(100),

-- ========================================
-- SYSTEM 1 - Battery 2 Chain (2 BOS slots)
-- ========================================
ADD COLUMN bos_sys1_battery2_type1_equipment_type VARCHAR(255),
ADD COLUMN bos_sys1_battery2_type1_make VARCHAR(255),
ADD COLUMN bos_sys1_battery2_type1_model VARCHAR(255),
ADD COLUMN bos_sys1_battery2_type1_amp_rating VARCHAR(50),
ADD COLUMN bos_sys1_battery2_type1_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys1_battery2_type1_trigger VARCHAR(100),

ADD COLUMN bos_sys1_battery2_type2_equipment_type VARCHAR(255),
ADD COLUMN bos_sys1_battery2_type2_make VARCHAR(255),
ADD COLUMN bos_sys1_battery2_type2_model VARCHAR(255),
ADD COLUMN bos_sys1_battery2_type2_amp_rating VARCHAR(50),
ADD COLUMN bos_sys1_battery2_type2_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys1_battery2_type2_trigger VARCHAR(100),

-- ========================================
-- SYSTEM 1 - Backup Chain (3 BOS slots)
-- ========================================
ADD COLUMN bos_sys1_backup_type1_equipment_type VARCHAR(255),
ADD COLUMN bos_sys1_backup_type1_make VARCHAR(255),
ADD COLUMN bos_sys1_backup_type1_model VARCHAR(255),
ADD COLUMN bos_sys1_backup_type1_amp_rating VARCHAR(50),
ADD COLUMN bos_sys1_backup_type1_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys1_backup_type1_trigger VARCHAR(100),

ADD COLUMN bos_sys1_backup_type2_equipment_type VARCHAR(255),
ADD COLUMN bos_sys1_backup_type2_make VARCHAR(255),
ADD COLUMN bos_sys1_backup_type2_model VARCHAR(255),
ADD COLUMN bos_sys1_backup_type2_amp_rating VARCHAR(50),
ADD COLUMN bos_sys1_backup_type2_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys1_backup_type2_trigger VARCHAR(100),

ADD COLUMN bos_sys1_backup_type3_equipment_type VARCHAR(255),
ADD COLUMN bos_sys1_backup_type3_make VARCHAR(255),
ADD COLUMN bos_sys1_backup_type3_model VARCHAR(255),
ADD COLUMN bos_sys1_backup_type3_amp_rating VARCHAR(50),
ADD COLUMN bos_sys1_backup_type3_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys1_backup_type3_trigger VARCHAR(100),

-- ========================================
-- SYSTEM 2 - Battery 1 Chain (2 BOS slots)
-- ========================================
ADD COLUMN bos_sys2_battery1_type1_equipment_type VARCHAR(255),
ADD COLUMN bos_sys2_battery1_type1_make VARCHAR(255),
ADD COLUMN bos_sys2_battery1_type1_model VARCHAR(255),
ADD COLUMN bos_sys2_battery1_type1_amp_rating VARCHAR(50),
ADD COLUMN bos_sys2_battery1_type1_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys2_battery1_type1_trigger VARCHAR(100),

ADD COLUMN bos_sys2_battery1_type2_equipment_type VARCHAR(255),
ADD COLUMN bos_sys2_battery1_type2_make VARCHAR(255),
ADD COLUMN bos_sys2_battery1_type2_model VARCHAR(255),
ADD COLUMN bos_sys2_battery1_type2_amp_rating VARCHAR(50),
ADD COLUMN bos_sys2_battery1_type2_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys2_battery1_type2_trigger VARCHAR(100),

-- ========================================
-- SYSTEM 2 - Battery 2 Chain (2 BOS slots)
-- ========================================
ADD COLUMN bos_sys2_battery2_type1_equipment_type VARCHAR(255),
ADD COLUMN bos_sys2_battery2_type1_make VARCHAR(255),
ADD COLUMN bos_sys2_battery2_type1_model VARCHAR(255),
ADD COLUMN bos_sys2_battery2_type1_amp_rating VARCHAR(50),
ADD COLUMN bos_sys2_battery2_type1_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys2_battery2_type1_trigger VARCHAR(100),

ADD COLUMN bos_sys2_battery2_type2_equipment_type VARCHAR(255),
ADD COLUMN bos_sys2_battery2_type2_make VARCHAR(255),
ADD COLUMN bos_sys2_battery2_type2_model VARCHAR(255),
ADD COLUMN bos_sys2_battery2_type2_amp_rating VARCHAR(50),
ADD COLUMN bos_sys2_battery2_type2_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys2_battery2_type2_trigger VARCHAR(100),

-- ========================================
-- SYSTEM 2 - Backup Chain (3 BOS slots)
-- ========================================
ADD COLUMN bos_sys2_backup_type1_equipment_type VARCHAR(255),
ADD COLUMN bos_sys2_backup_type1_make VARCHAR(255),
ADD COLUMN bos_sys2_backup_type1_model VARCHAR(255),
ADD COLUMN bos_sys2_backup_type1_amp_rating VARCHAR(50),
ADD COLUMN bos_sys2_backup_type1_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys2_backup_type1_trigger VARCHAR(100),

ADD COLUMN bos_sys2_backup_type2_equipment_type VARCHAR(255),
ADD COLUMN bos_sys2_backup_type2_make VARCHAR(255),
ADD COLUMN bos_sys2_backup_type2_model VARCHAR(255),
ADD COLUMN bos_sys2_backup_type2_amp_rating VARCHAR(50),
ADD COLUMN bos_sys2_backup_type2_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys2_backup_type2_trigger VARCHAR(100),

ADD COLUMN bos_sys2_backup_type3_equipment_type VARCHAR(255),
ADD COLUMN bos_sys2_backup_type3_make VARCHAR(255),
ADD COLUMN bos_sys2_backup_type3_model VARCHAR(255),
ADD COLUMN bos_sys2_backup_type3_amp_rating VARCHAR(50),
ADD COLUMN bos_sys2_backup_type3_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys2_backup_type3_trigger VARCHAR(100),

-- ========================================
-- SYSTEM 3 - Battery 1 Chain (2 BOS slots)
-- ========================================
ADD COLUMN bos_sys3_battery1_type1_equipment_type VARCHAR(255),
ADD COLUMN bos_sys3_battery1_type1_make VARCHAR(255),
ADD COLUMN bos_sys3_battery1_type1_model VARCHAR(255),
ADD COLUMN bos_sys3_battery1_type1_amp_rating VARCHAR(50),
ADD COLUMN bos_sys3_battery1_type1_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys3_battery1_type1_trigger VARCHAR(100),

ADD COLUMN bos_sys3_battery1_type2_equipment_type VARCHAR(255),
ADD COLUMN bos_sys3_battery1_type2_make VARCHAR(255),
ADD COLUMN bos_sys3_battery1_type2_model VARCHAR(255),
ADD COLUMN bos_sys3_battery1_type2_amp_rating VARCHAR(50),
ADD COLUMN bos_sys3_battery1_type2_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys3_battery1_type2_trigger VARCHAR(100),

-- ========================================
-- SYSTEM 3 - Battery 2 Chain (2 BOS slots)
-- ========================================
ADD COLUMN bos_sys3_battery2_type1_equipment_type VARCHAR(255),
ADD COLUMN bos_sys3_battery2_type1_make VARCHAR(255),
ADD COLUMN bos_sys3_battery2_type1_model VARCHAR(255),
ADD COLUMN bos_sys3_battery2_type1_amp_rating VARCHAR(50),
ADD COLUMN bos_sys3_battery2_type1_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys3_battery2_type1_trigger VARCHAR(100),

ADD COLUMN bos_sys3_battery2_type2_equipment_type VARCHAR(255),
ADD COLUMN bos_sys3_battery2_type2_make VARCHAR(255),
ADD COLUMN bos_sys3_battery2_type2_model VARCHAR(255),
ADD COLUMN bos_sys3_battery2_type2_amp_rating VARCHAR(50),
ADD COLUMN bos_sys3_battery2_type2_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys3_battery2_type2_trigger VARCHAR(100),

-- ========================================
-- SYSTEM 3 - Backup Chain (3 BOS slots)
-- ========================================
ADD COLUMN bos_sys3_backup_type1_equipment_type VARCHAR(255),
ADD COLUMN bos_sys3_backup_type1_make VARCHAR(255),
ADD COLUMN bos_sys3_backup_type1_model VARCHAR(255),
ADD COLUMN bos_sys3_backup_type1_amp_rating VARCHAR(50),
ADD COLUMN bos_sys3_backup_type1_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys3_backup_type1_trigger VARCHAR(100),

ADD COLUMN bos_sys3_backup_type2_equipment_type VARCHAR(255),
ADD COLUMN bos_sys3_backup_type2_make VARCHAR(255),
ADD COLUMN bos_sys3_backup_type2_model VARCHAR(255),
ADD COLUMN bos_sys3_backup_type2_amp_rating VARCHAR(50),
ADD COLUMN bos_sys3_backup_type2_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys3_backup_type2_trigger VARCHAR(100),

ADD COLUMN bos_sys3_backup_type3_equipment_type VARCHAR(255),
ADD COLUMN bos_sys3_backup_type3_make VARCHAR(255),
ADD COLUMN bos_sys3_backup_type3_model VARCHAR(255),
ADD COLUMN bos_sys3_backup_type3_amp_rating VARCHAR(50),
ADD COLUMN bos_sys3_backup_type3_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys3_backup_type3_trigger VARCHAR(100),

-- ========================================
-- SYSTEM 4 - Battery 1 Chain (2 BOS slots)
-- ========================================
ADD COLUMN bos_sys4_battery1_type1_equipment_type VARCHAR(255),
ADD COLUMN bos_sys4_battery1_type1_make VARCHAR(255),
ADD COLUMN bos_sys4_battery1_type1_model VARCHAR(255),
ADD COLUMN bos_sys4_battery1_type1_amp_rating VARCHAR(50),
ADD COLUMN bos_sys4_battery1_type1_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys4_battery1_type1_trigger VARCHAR(100),

ADD COLUMN bos_sys4_battery1_type2_equipment_type VARCHAR(255),
ADD COLUMN bos_sys4_battery1_type2_make VARCHAR(255),
ADD COLUMN bos_sys4_battery1_type2_model VARCHAR(255),
ADD COLUMN bos_sys4_battery1_type2_amp_rating VARCHAR(50),
ADD COLUMN bos_sys4_battery1_type2_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys4_battery1_type2_trigger VARCHAR(100),

-- ========================================
-- SYSTEM 4 - Battery 2 Chain (2 BOS slots)
-- ========================================
ADD COLUMN bos_sys4_battery2_type1_equipment_type VARCHAR(255),
ADD COLUMN bos_sys4_battery2_type1_make VARCHAR(255),
ADD COLUMN bos_sys4_battery2_type1_model VARCHAR(255),
ADD COLUMN bos_sys4_battery2_type1_amp_rating VARCHAR(50),
ADD COLUMN bos_sys4_battery2_type1_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys4_battery2_type1_trigger VARCHAR(100),

ADD COLUMN bos_sys4_battery2_type2_equipment_type VARCHAR(255),
ADD COLUMN bos_sys4_battery2_type2_make VARCHAR(255),
ADD COLUMN bos_sys4_battery2_type2_model VARCHAR(255),
ADD COLUMN bos_sys4_battery2_type2_amp_rating VARCHAR(50),
ADD COLUMN bos_sys4_battery2_type2_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys4_battery2_type2_trigger VARCHAR(100),

-- ========================================
-- SYSTEM 4 - Backup Chain (3 BOS slots)
-- ========================================
ADD COLUMN bos_sys4_backup_type1_equipment_type VARCHAR(255),
ADD COLUMN bos_sys4_backup_type1_make VARCHAR(255),
ADD COLUMN bos_sys4_backup_type1_model VARCHAR(255),
ADD COLUMN bos_sys4_backup_type1_amp_rating VARCHAR(50),
ADD COLUMN bos_sys4_backup_type1_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys4_backup_type1_trigger VARCHAR(100),

ADD COLUMN bos_sys4_backup_type2_equipment_type VARCHAR(255),
ADD COLUMN bos_sys4_backup_type2_make VARCHAR(255),
ADD COLUMN bos_sys4_backup_type2_model VARCHAR(255),
ADD COLUMN bos_sys4_backup_type2_amp_rating VARCHAR(50),
ADD COLUMN bos_sys4_backup_type2_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys4_backup_type2_trigger VARCHAR(100),

ADD COLUMN bos_sys4_backup_type3_equipment_type VARCHAR(255),
ADD COLUMN bos_sys4_backup_type3_make VARCHAR(255),
ADD COLUMN bos_sys4_backup_type3_model VARCHAR(255),
ADD COLUMN bos_sys4_backup_type3_amp_rating VARCHAR(50),
ADD COLUMN bos_sys4_backup_type3_is_new BOOLEAN DEFAULT true,
ADD COLUMN bos_sys4_backup_type3_trigger VARCHAR(100);

-- ========================================
-- SUMMARY
-- ========================================
-- Total fields added: 168
-- Breakdown:
--   - 4 Systems × 7 chains × 6 fields per slot = 168 fields
--   - Battery chains: 4 systems × 2 batteries × 2 slots × 6 fields = 96 fields
--   - Backup chains: 4 systems × 1 backup × 3 slots × 6 fields = 72 fields
--
-- Fields per BOS slot:
--   1. equipment_type - VARCHAR(255) - Stores utility-specific equipment name
--   2. make - VARCHAR(255) - Manufacturer name
--   3. model - VARCHAR(255) - Model number
--   4. amp_rating - VARCHAR(50) - Amperage rating
--   5. is_new - BOOLEAN - Whether equipment is new (default: true)
--   6. trigger - VARCHAR(100) - Which component triggered this BOS (e.g., 'sys1_battery1')
--
-- Chain Structure:
--   BATTERY 1 CHAIN: Battery 1 → BOS slot 1 → BOS slot 2
--   BATTERY 2 CHAIN: Battery 2 → BOS slot 1 → BOS slot 2
--   BACKUP CHAIN: Backup Subpanel → BOS slot 1 → BOS slot 2 → BOS slot 3
--
-- Usage:
--   Replace 'your_table_name' with actual table name (e.g., 'projects' or 'system_details')
--   Run in pgAdmin or psql
