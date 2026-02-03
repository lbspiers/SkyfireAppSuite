# EnergyAid Assessment Scraper - Feature Scope

**Date:** February 2, 2026  
**Prepared for:** Logan (Skyfire Solar)  
**Status:** Scoping Document

---

## TL;DR - What Needs to Happen

| Task | Where | Effort |
|------|-------|--------|
| Audit existing automation scripts | SSH → Server | 30 min |
| Run training on remaining 200 assessments | SSH → Server | 1-2 hrs |
| Update/create web-compatible orchestration | SSH → Server | 2-3 days |
| Add `document_type: 'energyaid_assessment'` support | SSH → API | 1 day |
| EnergyAid detection + UI swap in frontend | Claude Code | 1-2 days |
| Equipment auto-population after scrape | Claude Code | 1-2 days |
| Photo import flow | Both | 2-3 days |

**Total Estimated Effort:** 7-12 days

---

## Executive Summary

Enable EnergyAid users to upload assessment PDFs through the web app, run them through the AI PDF scraper, map equipment to the database, and auto-populate projects with extracted data and photos.

**Current State:**
- ✅ Equipment trainer: 100% match rate on 16 assessments (29 unique equipment items)
- ✅ Sales proposal flow exists in `ProjectInformationForm.js` (template to follow)
- ✅ Automation API endpoint exists: `POST /automation/upload`
- ✅ Equipment translations JSON trained for EnergyAid equipment patterns
- ⏳ ~200 more assessments available for training
- ❌ Assessment scraper not yet integrated with web app
- ❌ Photo extraction not integrated

---

## What We Have (Backend - Automation Server)

### 1. Assessment Scraper (`assessment_scraper.py`)
- Extracts customer name, address from EnergyAid PDFs
- Extracts equipment: panels, inverters, batteries
- Uses Claude AI for PDF parsing

### 2. Equipment Translator (`equipment_translator.py`)
- Maps scraped equipment strings → database IDs
- Fuzzy matching (80%+ similarity)
- 100% match rate achieved on EnergyAid equipment

### 3. Equipment Translations JSON (`equipment_translations.json`)
- Trained mappings for EnergyAid equipment variations
- Examples:
  - `Solar Edge SE7600H` → `SolarEdge SE7600H-US`
  - `Enphase 215's` → `Enphase M215`
  - `Telsa AC POWERWALL2.1,5KW, 13.5` → `Tesla PowerWall2.1`

### 4. Photo Extraction (EnergyAid-specific)
- `extract_images_from_pdf()` - pulls photos from assessment
- `deduplicate_photos()` - removes similar images
- `remove_branding()` - strips EnergyAid watermarks

---

## What Exists (Web App - Frontend)

### Current Sales Proposal Flow (`ProjectInformationForm.js`)

```
User uploads PDF → S3 → /automation/upload API → Poll status → Autofill form
```

**API Call:**
```javascript
POST /automation/upload
{
  company_id: companyId,
  user_id: userData.id,
  file_url: s3Url,
  document_type: 'sales_proposal'  // ← Change to 'energyaid_assessment'
}
```

**Response Flow:**
```javascript
{
  status: 'accepted',
  job_id: 'abc123'
}
// Poll: GET /automation/status/{job_id}
// Success:
{
  status: 'success',
  project_data: {
    customer_name: 'John Smith',
    address_street: '123 Main St',
    address_city: 'Phoenix',
    address_state: 'AZ',
    address_zip: '85001'
  }
}
```

---

## Proposed Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WEB APP (Frontend)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. DETECT ENERGYAID CONTEXT                                             │
│     ├─ User belongs to EnergyAid company                                 │
│     └─ OR project linked to EnergyAid                                    │
│                                                                          │
│  2. SWAP UI LABEL                                                        │
│     "Sales Proposal" → "Assessment Upload"                               │
│                                                                          │
│  3. UPLOAD PDF                                                           │
│     ├─ Upload to S3: sales-proposals/energyaid/{timestamp}_{filename}    │
│     └─ Call API with document_type: 'energyaid_assessment'               │
│                                                                          │
│  4. POLL & POPULATE                                                      │
│     ├─ Poll /automation/status/{job_id}                                  │
│     ├─ Autofill form (customer, address)                                 │
│     └─ Autofill equipment (panels, inverter, battery)                    │
│                                                                          │
│  5. PHOTOS (Post-project creation)                                       │
│     ├─ Extracted photos uploaded to S3                                   │
│     └─ Photos auto-tagged by section                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       BACKEND (Node.js API)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  POST /automation/upload                                                 │
│  ├─ Accept document_type: 'energyaid_assessment'                         │
│  ├─ Route to appropriate scraper                                         │
│  └─ Return job_id for polling                                            │
│                                                                          │
│  GET /automation/status/{job_id}                                         │
│  ├─ Return scraping progress                                             │
│  ├─ Return extracted data on success                                     │
│  └─ Include equipment_data for auto-population                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     AUTOMATION SERVER (Python)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. RECEIVE JOB                                                          │
│     ├─ Download PDF from S3 URL                                          │
│     └─ Detect document type: energyaid_assessment                        │
│                                                                          │
│  2. SCRAPE PDF                                                           │
│     ├─ assessment_scraper.py                                             │
│     ├─ Extract: customer_name, address, equipment                        │
│     └─ Claude AI for parsing                                             │
│                                                                          │
│  3. TRANSLATE EQUIPMENT                                                  │
│     ├─ equipment_translator.py                                           │
│     ├─ Match to equipment master IDs                                     │
│     └─ Return: make, model, equipment_id                                 │
│                                                                          │
│  4. EXTRACT PHOTOS                                                       │
│     ├─ extract_images_from_pdf()                                         │
│     ├─ deduplicate_photos()                                              │
│     ├─ remove_branding()                                                 │
│     └─ Upload to S3: photos/{project_uuid}/                              │
│                                                                          │
│  5. RETURN RESULTS                                                       │
│     └─ project_data + equipment_data + photo_urls                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: EnergyAid Detection & UI Swap (Frontend)
**Effort:** 1-2 days

**Tasks:**
1. Add EnergyAid company detection logic
   - Check `companyData.name` or `companyData.id` against EnergyAid identifier
   - Store in context/state for reuse

2. Conditional UI in `ProjectInformationForm.js`
   - Swap "Sales Proposal" label → "Assessment Upload"
   - Potentially different upload instructions/tooltip

3. Update S3 upload path
   - `sales-proposals/energyaid/{timestamp}_{filename}`

**Files to modify:**
- `src/components/project/ProjectInformationForm.js`
- `src/utils/adminUtils.ts` (add EnergyAid detection)

---

### Phase 2: Backend API Updates (Node.js)
**Effort:** 1 day

**Tasks:**
1. Update `/automation/upload` to accept `document_type: 'energyaid_assessment'`
2. Route to appropriate automation server endpoint
3. Extend response schema to include equipment_data

**Response Schema Addition:**
```typescript
interface AutomationResult {
  status: 'success' | 'failed';
  project_data: {
    customer_name: string;
    address_street: string;
    address_city: string;
    address_state: string;
    address_zip: string;
  };
  equipment_data?: {  // NEW
    panels: {
      make: string;
      model: string;
      quantity: number;
      equipment_id?: number;
    };
    inverter: {
      make: string;
      model: string;
      equipment_id?: number;
    };
    battery?: {
      make: string;
      model: string;
      quantity: number;
      equipment_id?: number;
    };
  };
  photo_urls?: string[];  // NEW
}
```

---

### Phase 3: Automation Server Integration (Python)
**Effort:** 2-3 days

**Tasks:**
1. Create `Orchestration_EnergyAid_Web.py` (or update existing)
   - Accept PDF URL instead of Monday item ID
   - No Monday.com dependencies

2. Integrate scrapers:
   ```python
   def process_energyaid_assessment(pdf_url, job_id):
       # 1. Download PDF
       pdf_path = download_from_s3(pdf_url)
       
       # 2. Scrape customer/address
       project_data = assessment_scraper.scrape(pdf_path)
       
       # 3. Scrape & translate equipment
       raw_equipment = assessment_scraper.scrape_equipment(pdf_path)
       equipment_data = equipment_translator.translate(raw_equipment)
       
       # 4. Extract photos
       photos = extract_images_from_pdf(pdf_path)
       photos = deduplicate_photos(photos)
       photos = remove_branding(photos)
       photo_urls = upload_photos_to_s3(photos, job_id)
       
       # 5. Return results
       return {
           'project_data': project_data,
           'equipment_data': equipment_data,
           'photo_urls': photo_urls
       }
   ```

3. Add endpoint handler to Flask/FastAPI app

---

### Phase 4: Equipment Auto-Population (Frontend)
**Effort:** 1-2 days

**Tasks:**
1. Extend form autofill to include equipment
2. After project creation, auto-populate `project_system_details`:
   - `sys1_solar_panel_make`, `sys1_solar_panel_model`
   - `sys1_micro_inverter_make`, `sys1_micro_inverter_model`
   - `sys1_battery_1_make`, `sys1_battery_1_model`

**Files to modify:**
- `src/components/project/ProjectInformationForm.js`
- `src/services/systemDetailsAPI.ts`

---

### Phase 5: Photo Import (Frontend + Backend)
**Effort:** 2-3 days

**Tasks:**
1. After project creation, import photos from automation result
2. Auto-tag photos by section (if detectable)
3. Display in project photo gallery

**API Flow:**
```javascript
// After project created with UUID
POST /project/{uuid}/photos/bulk-import
{
  photos: [
    { url: 's3://...', section: 'msp_photos', filename: 'msp_1.jpg' },
    { url: 's3://...', section: 'roof_photos', filename: 'roof_1.jpg' }
  ]
}
```

---

### Phase 6: Training & Edge Cases
**Effort:** Ongoing

**Tasks:**
1. Run remaining 200 assessments through trainer
2. Add any unmatched equipment to translations JSON
3. Monitor scraping accuracy
4. Add fallback for unknown document formats

---

## Work Location Summary

| Component | Location | Access |
|-----------|----------|--------|
| **Frontend (React)** | This project / Claude Code | `/mnt/project/src/` |
| **Backend API (Node.js)** | AWS Server | SSH → `~/skyfire-api/` |
| **Automation Scripts (Python)** | AWS Server | SSH → `~/skyfire-automation/` |
| **Equipment Translations** | AWS Server | SSH → `~/skyfire-automation/equipment_translations.json` |
| **Assessment Scraper** | AWS Server | SSH → `~/skyfire-automation/assessment_scraper.py` |
| **Equipment Trainer** | AWS Server | SSH → `~/skyfire-automation/equipment_trainer.py` |

---

## Server-Side Files to Check/Modify (SSH)

### Automation Server (`~/skyfire-automation/`)
```bash
# Key files to audit:
ls -la ~/skyfire-automation/
├── assessment_scraper.py        # EnergyAid PDF scraper
├── equipment_translator.py      # Maps scraped → DB equipment
├── equipment_translations.json  # Trained mappings
├── equipment_trainer.py         # Batch training script
├── Orchestration_EnergyAid.py   # Current Monday-dependent flow
└── photo_utils.py               # Photo extraction/dedup/branding
```

### Backend API (`~/skyfire-api/`)
```bash
# Check automation endpoint:
grep -r "automation/upload" ~/skyfire-api/
grep -r "document_type" ~/skyfire-api/
```

---

## Immediate Next Steps

### 1. SSH Audit - Check Current State
```bash
# Connect to server
ssh your-server

# Check what automation files exist
ls -la ~/skyfire-automation/

# Check if assessment scraper exists and review it
cat ~/skyfire-automation/assessment_scraper.py

# Check equipment translations (trained data)
cat ~/skyfire-automation/equipment_translations.json | head -100

# Check current automation API endpoint
grep -r "energyaid\|assessment" ~/skyfire-api/src/

# Check if photo extraction utils exist
ls -la ~/skyfire-automation/*photo*
```

### 2. Run Training on Remaining Assessments
```bash
# Run trainer on remaining ~200 assessments
python3 ~/skyfire-automation/equipment_trainer.py 200

# This will show any unmatched equipment that needs translations
```

### 3. Test Current Scraper Standalone
```bash
# Test scraper on a single assessment
python3 ~/skyfire-automation/assessment_scraper.py /path/to/test_assessment.pdf
```

---

## Database Considerations

### Equipment Matching
The equipment translator returns equipment master IDs from the `equipments` table:
- `sys1_solarpanel_id` → links to `equipments.id`
- `sys1_micro_inverter_id` → links to `equipments.id`
- `sys1_battery1_id` → links to `equipments.id`

### Photo Storage
Photos will be uploaded to S3 and linked via the `project_photos` table.