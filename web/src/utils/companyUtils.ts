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
