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

### Current Code Structure (VERIFIED)

**File:** `src/components/project/ProjectInformationForm.js`

**Key locations:**
- **Line 77-90**: Component state definitions (add `isEnergyAid` state here)
- **Line 143-163**: `initializeForm` useEffect - company data loaded from sessionStorage (add EnergyAid detection here)
- **Line 398-399**: Company data retrieved: `const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}')`
- **Line 437-442**: Automation API call with `document_type: 'sales_proposal'` (change this dynamically)
- **Line 460-487**: Response handling where form is autofilled (add equipment data handling here)
- **Line 732-733**: EquipmentRow title `"Upload Sales Proposal"` (make this dynamic)
- **Line 777**: Button text `"Autofill from Proposal"` (make this dynamic)

**Current automation API call (line 437-442):**
```javascript
const automationResponse = await axios.post('/automation/upload', {
  company_id: companyId,
  user_id: userData.id,
  file_url: s3Url,
  document_type: 'sales_proposal'  // ← Change to 'assessment' for EnergyAid
});
```

**Current response handling (line 460-487):**
```javascript
if (jobResult.status === 'success' && jobResult.project_data) {
  const data = jobResult.project_data;
  // ... autofill customer/address
  // NEED TO ADD: equipment data handling
}
```

**The API response already includes equipment data:**
```javascript
{
  status: 'success',
  project_data: {
    customer_name: 'John Smith',
    address_street: '123 Main St',
    address_city: 'Phoenix',
    address_state: 'AZ',
    address_zip: '85001',
    // Equipment fields come back in same object:
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

**File:** `src/components/project/ProjectInformationForm.js` (1051 lines total)

#### 2a. Add imports (line 11, after existing imports)

```javascript
import { isEnergyAidCompany, getDocumentTypeForCompany, getUploadLabelForCompany } from '../../utils/companyUtils';
```

#### 2b. Add state for EnergyAid detection (line 112, after `const [pendingZipCode, setPendingZipCode]`)

```javascript
// EnergyAid company detection
const [isEnergyAid, setIsEnergyAid] = useState(false);
```

#### 2c. Detect EnergyAid in useEffect (inside `initializeForm` function, around line 155)

Find the existing code at line 155:
```javascript
// For regular users, set their company as installer
const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
if (companyData.name) {
  setFormData(prev => ({ ...prev, installer: companyData.name }));
}
```

Add EnergyAid detection right after that:
```javascript
// Check if EnergyAid company (for assessment upload mode)
const energyAidDetected = isEnergyAidCompany(companyData.id, companyData.uuid, companyData.name);
setIsEnergyAid(energyAidDetected);

if (energyAidDetected) {
  logger.log('Project', '🔋 EnergyAid company detected - using assessment upload mode');
}
```

**ALSO** add EnergyAid detection for admin users in the `handleUploadProposal` function. Around line 404-415, after the admin selects an installer, check if that selected company is EnergyAid:

```javascript
// For admin users, check if selected installer is EnergyAid
if (isAdmin && formData.installer) {
  const selectedCompany = installersList.find(c => c.value === formData.installer);
  if (selectedCompany?.id) {
    companyId = selectedCompany.id;
    // Check if selected company is EnergyAid
    const selectedIsEnergyAid = isEnergyAidCompany(selectedCompany.id, selectedCompany.uuid, selectedCompany.label);
    // Use this for document_type determination below
  }
}
```

#### 2d. Update the upload function (handleUploadProposal, line 437-442)

Replace the existing API call:
```javascript
const automationResponse = await axios.post('/automation/upload', {
  company_id: companyId,
  user_id: userData.id,
  file_url: s3Url,
  document_type: 'sales_proposal'
});
```

With this dynamic version:
```javascript
// Determine document type - EnergyAid uses 'assessment', others use 'sales_proposal'
const selectedCompany = isAdmin 
  ? installersList.find(c => c.value === formData.installer)
  : null;
const effectiveCompanyId = selectedCompany?.id || companyId;
const effectiveCompanyName = selectedCompany?.label || companyData.name;
const documentType = isEnergyAid || isEnergyAidCompany(effectiveCompanyId, null, effectiveCompanyName)
  ? 'assessment' 
  : 'sales_proposal';

logger.log('Project', `Using document_type: ${documentType} for company: ${effectiveCompanyName}`);

const automationResponse = await axios.post('/automation/upload', {
  company_id: effectiveCompanyId,
  user_id: userData.id,
  file_url: s3Url,
  document_type: documentType,
  company_name: effectiveCompanyName || 'Unknown'
});
```

#### 2e. Handle equipment data in response (line 460-487)

Find the existing success handler:
```javascript
if (jobResult.status === 'success' && jobResult.project_data) {
  // Step 5: Populate form with scraped data
  const data = jobResult.project_data;
  logger.log('Project', 'Autofill data received:', data);

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

Replace it with this enhanced version that handles equipment:
```javascript
if (jobResult.status === 'success' && jobResult.project_data) {
  // Step 5: Populate form with scraped data
  const data = jobResult.project_data;
  logger.log('Project', 'Autofill data received:', data);

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
  // Equipment comes back in project_data for assessments
  if (data.panel_make || data.inverter_make || data.battery_make) {
    const equipmentData = {
      panel_make: data.panel_make || null,
      panel_model: data.panel_model || null,
      panel_quantity: data.panel_quantity || null,
      inverter_make: data.inverter_make || null,
      inverter_model: data.inverter_model || null,
      battery_make: data.battery_make || null,
      battery_model: data.battery_model || null,
      battery_quantity: data.battery_quantity || null,
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

  const successMessage = documentType === 'assessment'
    ? 'Form autofilled from assessment! Review and create project.'
    : 'Form autofilled from proposal! Review and create project.';
    
  toast.success(successMessage, {
    position: 'top-right',
    autoClose: 5000,
  });

  setSalesProposal(null);
}
```

#### 2f. Update UI labels (lines 732-733 and 777)

**Change the EquipmentRow title (line 732-733):**

Find:
```jsx
<EquipmentRow
  title="Upload Sales Proposal"
  subtitle={getProposalSubtitle()}
```

Replace with:
```jsx
<EquipmentRow
  title={isEnergyAid ? "Upload Assessment" : "Upload Sales Proposal"}
  subtitle={getProposalSubtitle()}
```

**Change the button text (line 777):**

Find:
```jsx
<Button
  variant={salesProposal ? 'primary' : 'secondary'}
  onClick={handleUploadProposal}
  disabled={!salesProposal || uploadingProposal}
  loading={uploadingProposal}
>
  Autofill from Proposal
</Button>
```

Replace with:
```jsx
<Button
  variant={salesProposal ? 'primary' : 'secondary'}
  onClick={handleUploadProposal}
  disabled={!salesProposal || uploadingProposal}
  loading={uploadingProposal}
>
  {isEnergyAid ? 'Autofill from Assessment' : 'Autofill from Proposal'}
</Button>
```

**Change the loading text (line 783):**

Find:
```jsx
<span className={styles.loadingText}>Scraping proposal data...</span>
```

Replace with:
```jsx
<span className={styles.loadingText}>
  {isEnergyAid ? 'Scraping assessment data...' : 'Scraping proposal data...'}
</span>
```

**Update toast messages in handleUploadProposal (lines 424, 432, 449):**

Line 424:
```javascript
toast.info(isEnergyAid ? 'Uploading assessment to S3...' : 'Uploading proposal to S3...', {
```

Line 432:
```javascript
toast.info(isEnergyAid ? 'Processing assessment with AI...' : 'Processing proposal with AI...', {
```

Line 449:
```javascript
toast.info(isEnergyAid ? 'Scraping assessment data... This may take up to 2 minutes.' : 'Scraping proposal data... This may take up to 2 minutes.', {
```

---

### Task 3: Auto-populate Equipment After Project Creation

**File:** `src/components/project/EquipmentForm.js` (3733 lines)

**Where to add:** Around line 876, after the existing `useEffect` that loads equipment data (line 850-872).

Add a new useEffect to check for pending equipment data from the assessment scraper:

```javascript
// Auto-populate equipment from assessment scraper (EnergyAid)
// This runs once when the component mounts with a valid projectUuid
useEffect(() => {
  const pendingEquipment = sessionStorage.getItem('pendingEquipmentData');
  
  if (!pendingEquipment || !projectUuid) return;
  
  try {
    const equipment = JSON.parse(pendingEquipment);
    logger.log('EquipmentForm', '⚡ Auto-populating from assessment:', equipment);
    
    const updates = {};
    
    // Map assessment equipment to sys1 fields
    if (equipment.panel_make) {
      updates.solar_panel_make = equipment.panel_make;
    }
    if (equipment.panel_model) {
      updates.solar_panel_model = equipment.panel_model;
    }
    if (equipment.panel_quantity) {
      updates.solar_panel_qty = equipment.panel_quantity;
    }
    if (equipment.inverter_make) {
      updates.inverter_make = equipment.inverter_make;
    }
    if (equipment.inverter_model) {
      updates.inverter_model = equipment.inverter_model;
    }
    if (equipment.battery_make) {
      updates.battery1_make = equipment.battery_make;
    }
    if (equipment.battery_model) {
      updates.battery1_model = equipment.battery_model;
    }
    if (equipment.battery_quantity) {
      updates.battery1_quantity = equipment.battery_quantity;
    }
    
    // Apply updates if we have any
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...updates,
      }));
      
      // Also persist to database
      updateFields(updates);
      
      toast.success('Equipment auto-populated from assessment!', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
    
    // Clear the pending data so it doesn't run again
    sessionStorage.removeItem('pendingEquipmentData');
    
  } catch (error) {
    logger.error('EquipmentForm', 'Failed to auto-populate equipment:', error);
    sessionStorage.removeItem('pendingEquipmentData');
  }
}, [projectUuid]); // Only run when projectUuid is available
```

**Note:** The `updateFields` function is already available from the `useSystemDetails` hook (line 120). The field names (`solar_panel_make`, `inverter_make`, etc.) match the existing form field naming convention used throughout EquipmentForm.

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
