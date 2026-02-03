# Claude Code Task: EnergyAid Assessment Scraper Frontend Integration

## Overview

Enable EnergyAid users to upload assessment PDFs through the existing "Sales Proposal" upload flow. The backend is already fully built - we just need frontend changes to:
1. Detect when user is from EnergyAid company
2. Swap UI labels ("Sales Proposal" → "Assessment Upload")
3. Pass the correct `document_type` to the API
4. Handle equipment data in the response

## Context

### Backend Status: ✅ READY (No changes needed)

The server at `~/skyfire-automation/` already handles everything:
- `/api/process/document` endpoint accepts `document_type: "assessment"`
- AI scraper routes to assessment-specific prompts
- Photo extraction triggers automatically for assessments
- Equipment translation is 100% trained for EnergyAid equipment
- EnergyAid company config exists: `company_id: 5`, `company_uuid: "80787a7b-b2be-4373-97e2-f480843d1118"`

### Current Sales Proposal Flow (in ProjectInformationForm.js)

```javascript
// Current flow at line ~437
const automationResponse = await axios.post('/automation/upload', {
  company_id: companyId,
  user_id: userData.id,
  file_url: s3Url,
  document_type: 'sales_proposal'  // ← Change to 'assessment' for EnergyAid
});
```

The response includes:
```javascript
{
  status: 'success',
  project_data: {
    customer_name: 'John Smith',
    address_street: '123 Main St',
    address_city: 'Phoenix',
    address_state: 'AZ',
    address_zip: '85001'
  },
  // NEW - equipment data (already returned by backend)
  equipment_data: {
    panel_make: 'Jinko Solar',
    panel_model: 'JKM410M-72HL-V',
    panel_quantity: 20,
    inverter_make: 'SolarEdge',
    inverter_model: 'SE7600H-US',
    battery_make: 'Tesla',
    battery_model: 'PowerWall 3',
    battery_quantity: 1
  }
}
```

---

## Tasks

### Task 1: Create EnergyAid Detection Utility

**File:** `src/utils/companyUtils.ts` (new file)

```typescript
/**
 * Company detection utilities for customer-specific features
 */

// EnergyAid company identifiers
const ENERGYAID_COMPANY_ID = 5;
const ENERGYAID_COMPANY_UUID = '80787a7b-b2be-4373-97e2-f480843d1118';
const ENERGYAID_COMPANY_NAME = 'EnergyAid';

/**
 * Check if the given company is EnergyAid
 * @param companyId - Company ID (number or string)
 * @param companyUuid - Company UUID (optional)
 * @param companyName - Company name (optional)
 * @returns boolean
 */
export const isEnergyAidCompany = (
  companyId?: number | string | null,
  companyUuid?: string | null,
  companyName?: string | null
): boolean => {
  // Check by ID
  if (companyId !== undefined && companyId !== null) {
    const numericId = typeof companyId === 'string' ? parseInt(companyId, 10) : companyId;
    if (numericId === ENERGYAID_COMPANY_ID) return true;
  }
  
  // Check by UUID
  if (companyUuid && companyUuid.toLowerCase() === ENERGYAID_COMPANY_UUID.toLowerCase()) {
    return true;
  }
  
  // Check by name (case-insensitive)
  if (companyName && companyName.toLowerCase().includes('energyaid')) {
    return true;
  }
  
  return false;
};

/**
 * Get the document type based on company
 * EnergyAid uses 'assessment', others use 'sales_proposal'
 */
export const getDocumentTypeForCompany = (
  companyId?: number | string | null,
  companyUuid?: string | null,
  companyName?: string | null
): 'assessment' | 'sales_proposal' => {
  return isEnergyAidCompany(companyId, companyUuid, companyName) 
    ? 'assessment' 
    : 'sales_proposal';
};

/**
 * Get the upload label based on company
 */
export const getUploadLabelForCompany = (
  companyId?: number | string | null,
  companyUuid?: string | null,
  companyName?: string | null
): string => {
  return isEnergyAidCompany(companyId, companyUuid, companyName)
    ? 'Assessment Upload'
    : 'Sales Proposal';
};

export { ENERGYAID_COMPANY_ID, ENERGYAID_COMPANY_UUID, ENERGYAID_COMPANY_NAME };
```

---

### Task 2: Update ProjectInformationForm.js

**File:** `src/components/project/ProjectInformationForm.js`

#### 2a. Add imports (near top of file, ~line 9)

```javascript
import { isEnergyAidCompany, getDocumentTypeForCompany, getUploadLabelForCompany } from '../../utils/companyUtils';
```

#### 2b. Add state for EnergyAid detection (after other useState declarations, ~line 100)

```javascript
// EnergyAid detection
const [isEnergyAid, setIsEnergyAid] = useState(false);
```

#### 2c. Detect EnergyAid in useEffect (add to existing initializeForm, ~line 143)

Inside the `initializeForm` async function, after getting company data:

```javascript
// Check if EnergyAid company
const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
const energyAidDetected = isEnergyAidCompany(companyData.id, companyData.uuid, companyData.name);
setIsEnergyAid(energyAidDetected);

if (energyAidDetected) {
  logger.log('Project', '🔋 EnergyAid company detected - using assessment upload mode');
}
```

#### 2d. Update the upload function (handleUploadProposal, ~line 437)

Change the automation API call to use dynamic document_type:

```javascript
// Determine document type based on company
const documentType = getDocumentTypeForCompany(companyId, null, companyData.name);

const automationResponse = await axios.post('/automation/upload', {
  company_id: companyId,
  user_id: userData.id,
  file_url: s3Url,
  document_type: documentType,  // ← Dynamic based on company
  company_name: companyData.name || 'Unknown'  // ← For intelligence engine
});
```

#### 2e. Handle equipment data in response (~line 460-475)

After the existing form autofill, add equipment handling:

```javascript
if (jobResult.status === 'success' && jobResult.project_data) {
  const data = jobResult.project_data;
  logger.log('Project', 'Autofill data received:', data);

  // Existing customer/address autofill
  const nameParts = (data.customer_name || '').split(' ');
  setFormData(prev => ({
    ...prev,
    firstName: nameParts[0] || prev.firstName,
    lastName: nameParts.slice(1).join(' ') || prev.lastName,
    address: data.address_street || prev.address,
    city: data.address_city || prev.city,
    state: data.address_state || prev.state,
    zip: data.address_zip || prev.zip,
  }));

  // NEW: Store equipment data for later use (after project creation)
  if (data.panel_make || data.inverter_make || data.battery_make) {
    const equipmentData = {
      panel_make: data.panel_make,
      panel_model: data.panel_model,
      panel_quantity: data.panel_quantity,
      inverter_make: data.inverter_make,
      inverter_model: data.inverter_model,
      battery_make: data.battery_make,
      battery_model: data.battery_model,
      battery_quantity: data.battery_quantity,
    };
    
    // Store in sessionStorage for use after project creation
    sessionStorage.setItem('pendingEquipmentData', JSON.stringify(equipmentData));
    logger.log('Project', '⚡ Equipment data stored for auto-population:', equipmentData);
    
    toast.info('Equipment data extracted! Will be auto-filled after project creation.', {
      position: 'top-right',
      autoClose: 4000,
    });
  }

  // Expand relevant sections
  setProjectInfoExpanded(true);
  setCustomerExpanded(true);
  setLocationExpanded(true);

  toast.success('Form autofilled from proposal! Review and create project.', {
    position: 'top-right',
    autoClose: 5000,
  });

  setSalesProposal(null);
}
```

#### 2f. Update UI labels (in the JSX, find "Sales Proposal" text)

Find the EquipmentRow or section header that says "Sales Proposal" and make it dynamic:

```jsx
<EquipmentRow
  label={isEnergyAid ? "Assessment Upload" : "Sales Proposal"}
  // ... rest of props
>
```

Also update any tooltips or helper text:

```jsx
<p className={styles.uploadHint}>
  {isEnergyAid 
    ? "Upload an EnergyAid assessment PDF to auto-fill project details and equipment"
    : "Upload a sales proposal PDF to auto-fill project details"
  }
</p>
```

---

### Task 3: Auto-populate Equipment After Project Creation (Optional Enhancement)

**File:** `src/components/project/EquipmentForm.js` (or wherever equipment is first loaded)

After project creation, check for pending equipment data and auto-populate:

```javascript
useEffect(() => {
  // Check for pending equipment data from assessment scraper
  const pendingEquipment = sessionStorage.getItem('pendingEquipmentData');
  
  if (pendingEquipment && projectUuid) {
    try {
      const equipment = JSON.parse(pendingEquipment);
      logger.log('Equipment', 'Auto-populating from assessment:', equipment);
      
      // Auto-fill sys1 equipment fields
      if (equipment.panel_make) {
        setFormData(prev => ({
          ...prev,
          sys1_solar_panel_make: equipment.panel_make,
          sys1_solar_panel_model: equipment.panel_model,
          sys1_solar_panel_qty: equipment.panel_quantity,
        }));
      }
      
      if (equipment.inverter_make) {
        setFormData(prev => ({
          ...prev,
          sys1_micro_inverter_make: equipment.inverter_make,
          sys1_micro_inverter_model: equipment.inverter_model,
        }));
      }
      
      if (equipment.battery_make) {
        setFormData(prev => ({
          ...prev,
          sys1_battery_1_make: equipment.battery_make,
          sys1_battery_1_model: equipment.battery_model,
          sys1_battery_1_qty: equipment.battery_quantity,
        }));
      }
      
      // Clear the pending data
      sessionStorage.removeItem('pendingEquipmentData');
      
      toast.success('Equipment auto-populated from assessment!', {
        position: 'top-right',
        autoClose: 3000,
      });
      
    } catch (error) {
      logger.error('Equipment', 'Failed to auto-populate equipment:', error);
    }
  }
}, [projectUuid]);
```

---

## Testing Checklist

1. **EnergyAid User Login:**
   - [ ] Log in as EnergyAid user (company_id: 5)
   - [ ] Verify "Assessment Upload" label appears (not "Sales Proposal")
   - [ ] Upload an assessment PDF
   - [ ] Verify form auto-fills with customer/address
   - [ ] Verify equipment data is extracted and stored
   - [ ] Create project and verify equipment auto-populates

2. **Non-EnergyAid User Login:**
   - [ ] Log in as different company user
   - [ ] Verify "Sales Proposal" label appears
   - [ ] Upload a sales proposal PDF
   - [ ] Verify existing flow works unchanged

3. **Admin User:**
   - [ ] Log in as admin
   - [ ] Select EnergyAid from installer dropdown
   - [ ] Verify it switches to "Assessment Upload" mode

---

## File Summary

| File | Action | Changes |
|------|--------|---------|
| `src/utils/companyUtils.ts` | CREATE | EnergyAid detection utilities |
| `src/components/project/ProjectInformationForm.js` | MODIFY | Add detection, dynamic labels, equipment handling |
| `src/components/project/EquipmentForm.js` | MODIFY | Auto-populate equipment from sessionStorage |

---

## Important Notes

- **Backend is ready** - No server changes needed
- **EnergyAid company_id is 5** - This is hardcoded in the backend config
- **Document type 'assessment'** triggers photo extraction on the server
- **Equipment data** comes back in the same response as customer/address data
- **Follow existing patterns** - Use the same toast notifications, logger calls, and error handling as existing code
