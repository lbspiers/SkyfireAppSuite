# Optimized Field-Specific API Functions Usage Guide

## Overview
Based on the comprehensive field usage audit, we've created optimized API functions that only fetch the fields required for each screen. This reduces:
- **Network payload** by up to 90% (from ~804 fields to ~10-30 fields)
- **Memory usage** by fetching only needed data
- **Parse time** by processing smaller JSON responses
- **API response time** through reduced database queries

## API Functions

### 1. `getProjectInfoFields(projectId, companyId?)`
**Purpose**: Fetch only fields needed for ProjectInfo screen  
**Fields fetched**: 6 fields
- companyName
- installerProjectId
- customerFirstName
- customerLastName
- projectNotes
- siteSurveyDate

**Usage Example**:
```typescript
// In ProjectInfo.tsx
import { getProjectInfoFields } from '../../api/project.service';

const loadProjectInfo = async () => {
  const response = await getProjectInfoFields(projectId, companyId);
  if (response?.status === 200) {
    const data = response.data.data;
    // Data is already transformed to UI field names
    setFormData({
      companyName: data.companyName,
      installerProjectId: data.installerProjectId,
      customerFirstName: data.customerFirstName,
      customerLastName: data.customerLastName,
      projectNotes: data.projectNotes || '',
      siteSurveyDate: data.siteSurveyDate || ''
    });
  }
};
```

### 2. `getSiteInfoFields(projectId)`
**Purpose**: Fetch only fields needed for SiteInfo screen  
**Fields fetched**: 7 fields
- address
- city
- state
- zip
- apn
- jurisdiction
- utility

**Usage Example**:
```typescript
// In SiteInfo.tsx
import { getSiteInfoFields } from '../../api/project.service';

useEffect(() => {
  const loadSiteInfo = async () => {
    setLoading(true);
    const response = await getSiteInfoFields(projectId);
    if (response?.status === 200) {
      const data = response.data.data;
      // Data is already transformed to UI field names
      setSiteData({
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        apn: data.apn || '',
        jurisdiction: data.jurisdiction || '',
        utility: data.utility || ''
      });
    }
    setLoading(false);
  };
  
  loadSiteInfo();
}, [projectId]);
```

### 3. `getSystemEquipmentFields(projectId, systemNumber)`
**Purpose**: Fetch only fields for a specific system (1-4)  
**Fields fetched**: ~24 fields per system (instead of 96+ for all systems)
- All sys{N}_* fields for the specified system only

**Usage Example**:
```typescript
// In EquipmentDetailsScreen.tsx
import { getSystemEquipmentFields } from '../../api/project.service';

const loadSystemData = async (systemNum: 1 | 2 | 3 | 4) => {
  setLoading(true);
  const response = await getSystemEquipmentFields(projectId, systemNum);
  
  if (response?.status === 200) {
    const data = response.data.data;
    const prefix = `sys${systemNum}_`;
    
    // Extract system-specific data
    setEquipmentData({
      solarPanelQuantity: data[`${prefix}solar_panel_quantity`],
      solarPanelManufacturer: data[`${prefix}solar_panel_manufacturer`],
      solarPanelModel: data[`${prefix}solar_panel_model`],
      inverterManufacturer: data[`${prefix}inverter_manufacturer`],
      inverterModel: data[`${prefix}inverter_model`],
      // ... other fields
    });
  }
  setLoading(false);
};

// Usage for System 1
loadSystemData(1);

// Usage for System 2
loadSystemData(2);
```

### 4. `getElectricalFields(projectId, companyId?)`
**Purpose**: Fetch only electrical configuration fields  
**Fields fetched**: ~22 fields
- service_entrance_type, mcb_count
- mpa_* fields (Main Panel A)
- spb_* fields (Sub Panel B)
- poi_* fields (Point of Interconnection)

**Usage Example**:
```typescript
// In ElectricalDetailsScreen.tsx
import { getElectricalFields } from '../../api/project.service';

const loadElectricalData = async () => {
  const response = await getElectricalFields(projectId, companyId);
  
  if (response?.status === 200) {
    const data = response.data.data;
    
    setElectricalConfig({
      // Service Entrance
      serviceEntranceType: data.service_entrance_type,
      mcbCount: data.mcb_count,
      
      // Main Panel A
      mpaType: data.mpa_type,
      mpaBus: data.mpa_bus,
      mpaMain: data.mpa_main,
      mpaFeeder: data.mpa_feeder,
      
      // Sub Panel B (conditional)
      showSubPanelB: data.show_sub_panel_b || 
                     !!(data.spb_type || data.spb_bus),
      spbType: data.spb_type,
      spbBus: data.spb_bus,
      spbMain: data.spb_main,
      
      // Point of Interconnection
      poiType: data.poi_type,
      poiBreaker: data.poi_breaker,
      poiDisconnect: data.poi_disconnect
    });
  }
};
```

### 5. `getBOSFields(projectId)`
**Purpose**: Fetch Balance of System fields for all BOS types  
**Fields fetched**: ~83 fields (8 fields × 10 types + 3 general)
- All bos_type_{1-10}_* fields
- General BOS metadata

**Usage Example**:
```typescript
// In BOS.tsx
import { getBOSFields } from '../../api/project.service';

const loadBOSData = async () => {
  const response = await getBOSFields(projectId);
  
  if (response?.status === 200) {
    const data = response.data.data;
    const bosTypes = [];
    
    // Process each BOS type
    for (let i = 1; i <= 10; i++) {
      const prefix = `bos_type_${i}_`;
      if (data[`${prefix}active`] || data[`${prefix}equipment_type`]) {
        bosTypes.push({
          typeNumber: i,
          equipmentType: data[`${prefix}equipment_type`],
          make: data[`${prefix}make`],
          model: data[`${prefix}model`],
          ampRating: data[`${prefix}amp_rating`],
          isNew: data[`${prefix}is_new`],
          panelNote: data[`${prefix}panel_note`],
          photoCount: data[`${prefix}photo_count`]
        });
      }
    }
    
    setBosData({
      types: bosTypes,
      activeCount: data._computed_active_bos_types,
      notes: data.bos_notes
    });
  }
};
```

### 6. `getProjectSummaryFields(projectId, companyId?)`
**Purpose**: Fetch minimal fields for Dashboard/List views  
**Fields fetched**: 11 fields
- Basic identification and status fields only

**Usage Example**:
```typescript
// In DashboardScreen.tsx
import { getProjectSummaryFields } from '../../api/project.service';

const loadProjectList = async () => {
  const projectIds = ['proj1', 'proj2', 'proj3'];
  
  // Fetch summaries in parallel for performance
  const summaries = await Promise.all(
    projectIds.map(id => getProjectSummaryFields(id, companyId))
  );
  
  const projectCards = summaries
    .filter(r => r?.status === 200)
    .map(r => ({
      id: r.data.data.uuid,
      displayId: r.data.data.installer_project_id,
      customerName: `${r.data.data.customer_first_name} ${r.data.data.customer_last_name}`,
      address: `${r.data.data.address}, ${r.data.data.city}, ${r.data.data.state}`,
      status: r.data.data.project_status,
      step: r.data.data.completed_step
    }));
  
  setProjects(projectCards);
};
```

## Migration Guide

### Before (Fetching all 804 fields):
```typescript
// Old approach - fetches EVERYTHING
const response = await getSystemDetails(projectId);
// Response contains 804+ fields, most unused
```

### After (Fetching only needed fields):
```typescript
// New approach - fetch only what's needed
const response = await getSystemEquipmentFields(projectId, 1);
// Response contains only ~24 fields for System 1
```

## Performance Comparison

| Screen | Old Approach | New Approach | Reduction |
|--------|-------------|--------------|-----------|
| ProjectInfo | 804 fields | 6 fields | 99.3% |
| SiteInfo | 804 fields | 7 fields | 99.1% |
| System 1 Equipment | 804 fields | 24 fields | 97.0% |
| Electrical | 804 fields | 22 fields | 97.3% |
| BOS | 804 fields | 83 fields | 89.7% |
| Dashboard (per project) | 804 fields | 11 fields | 98.6% |

## Fallback Strategy

If the API doesn't support field selection, use the utility function:

```typescript
import { getFieldsWithFallback, getProjectInfoFields, getSystemDetails } from '../../api/project.service';

const loadData = async () => {
  const response = await getFieldsWithFallback(
    // Try optimized function first
    () => getProjectInfoFields(projectId, companyId),
    // Fall back to full fetch if needed
    () => getSystemDetails(projectId)
  );
  
  // Handle response...
};
```

## Best Practices

1. **Always use field-specific functions** when loading data for a specific screen
2. **Batch requests** when loading data for multiple entities (use Promise.all)
3. **Cache responses** when data doesn't change frequently
4. **Monitor performance** to ensure field selection is working
5. **Update functions** when adding new fields to screens

## Testing

Test that field selection is working:

```typescript
// Add to your test suite
describe('Optimized API Functions', () => {
  it('should fetch only required fields', async () => {
    const response = await getProjectInfoFields('test-id');
    const fields = Object.keys(response.data.data);
    
    expect(fields).toHaveLength(6);
    expect(fields).toContain('companyName');
    expect(fields).not.toContain('sys1_solar_panel_quantity');
  });
});
```

## Monitoring

Add logging to verify optimization:

```typescript
// In your API interceptor
axiosInstance.interceptors.response.use(response => {
  if (response.config.url?.includes('fields=')) {
    const fieldCount = Object.keys(response.data?.data || {}).length;
    console.log(`[API] Optimized request returned ${fieldCount} fields`);
  }
  return response;
});
```

## Next Steps

1. **Update all screens** to use these optimized functions
2. **Remove calls** to getSystemDetails() where not needed
3. **Add caching layer** for frequently accessed data
4. **Monitor API performance** metrics
5. **Create similar functions** for other endpoints as needed

---

**Note**: If the backend doesn't yet support field selection via query parameters, these functions will still work but won't provide the optimization benefits. Work with the backend team to implement field selection support for maximum performance gains.