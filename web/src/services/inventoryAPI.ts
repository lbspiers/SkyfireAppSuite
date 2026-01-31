// src/services/inventoryAPI.ts

import axiosInstance from '../api/axiosInstance';
import apiEndpoints from '../config/apiEndpoints';

/** URL-encode helper for query/path fragments */
const enc = encodeURIComponent;

// ============================================
// Type Definitions
// ============================================

export interface InventoryItem {
  uuid: string;
  company_id: string;
  equipment_type: string;
  manufacturer: string;
  model: string;
  quantity_available: number;
  quantity_reserved: number;
  unit_cost?: number;
  location?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInventoryItemRequest {
  companyId: string;
  equipmentType: string;
  manufacturer: string;
  model: string;
  quantityAvailable: number;
  unitCost?: number;
  location?: string;
  notes?: string;
}

export interface UpdateInventoryItemRequest {
  quantityAvailable?: number;
  quantityReserved?: number;
  unitCost?: number;
  location?: string;
  notes?: string;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  total?: number;
}

export interface InventoryFilters {
  equipmentType?: string;
  manufacturer?: string;
  model?: string;
  minQuantity?: number;
}

// ============================================
// Inventory CRUD Operations
// ============================================

/**
 * List inventory items for a company with optional filters
 */
export const listInventory = async (
  companyId: string,
  filters?: InventoryFilters
): Promise<InventoryListResponse> => {
  try {
    let url = `/inventory?companyId=${enc(companyId)}`;

    // Add filter parameters
    if (filters?.equipmentType) {
      url += `&equipmentType=${enc(filters.equipmentType)}`;
    }
    if (filters?.manufacturer) {
      url += `&manufacturer=${enc(filters.manufacturer)}`;
    }
    if (filters?.model) {
      url += `&model=${enc(filters.model)}`;
    }
    if (filters?.minQuantity !== undefined) {
      url += `&minQuantity=${filters.minQuantity}`;
    }

    console.debug('[inventoryAPI] listInventory URL:', url);
    const response = await axiosInstance.get(url);

    if (response.data.status === 'SUCCESS' || response.data.success || response.data.items) {
      return {
        items: response.data.items || response.data.data?.items || [],
        total: response.data.total || response.data.data?.total,
      };
    } else {
      throw new Error(response.data.message || 'Failed to fetch inventory');
    }
  } catch (error: any) {
    console.error('[inventoryAPI] listInventory error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to fetch inventory. Please try again.');
  }
};

/**
 * Get inventory item details by UUID
 */
export const getInventoryItem = async (itemUuid: string): Promise<InventoryItem> => {
  try {
    const url = `/inventory/${itemUuid}`;
    const response = await axiosInstance.get(url);

    if (response.data.status === 'SUCCESS' || response.data.success || response.data.data) {
      return response.data.data || response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch inventory item');
    }
  } catch (error: any) {
    console.error('[inventoryAPI] getInventoryItem error:', error?.response?.data || error?.message);

    if (error?.response?.status === 404) {
      throw new Error('Inventory item not found');
    }

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to fetch inventory item.');
  }
};

/**
 * Create a new inventory item
 */
export const createInventoryItem = async (data: CreateInventoryItemRequest): Promise<InventoryItem> => {
  try {
    const response = await axiosInstance.post('/inventory', data);

    if (response.data.status === 'SUCCESS' || response.data.success) {
      return response.data.data || response.data;
    } else {
      throw new Error(response.data.message || 'Failed to create inventory item');
    }
  } catch (error: any) {
    console.error('[inventoryAPI] createInventoryItem error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to create inventory item. Please try again.');
  }
};

/**
 * Update an existing inventory item
 */
export const updateInventoryItem = async (
  itemUuid: string,
  data: UpdateInventoryItemRequest
): Promise<InventoryItem> => {
  try {
    const url = `/inventory/${itemUuid}`;
    const response = await axiosInstance.patch(url, data);

    if (response.data.status === 'SUCCESS' || response.data.success) {
      return response.data.data || response.data;
    } else {
      throw new Error(response.data.message || 'Failed to update inventory item');
    }
  } catch (error: any) {
    console.error('[inventoryAPI] updateInventoryItem error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to update inventory item. Please try again.');
  }
};

/**
 * Delete an inventory item
 */
export const deleteInventoryItem = async (itemUuid: string): Promise<void> => {
  try {
    const url = `/inventory/${itemUuid}`;
    const response = await axiosInstance.delete(url);

    if (!(response.data.status === 'SUCCESS' || response.data.success)) {
      throw new Error(response.data.message || 'Failed to delete inventory item');
    }
  } catch (error: any) {
    console.error('[inventoryAPI] deleteInventoryItem error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to delete inventory item. Please try again.');
  }
};

// ============================================
// Inventory Quantity Operations
// ============================================

/**
 * Reserve inventory quantity for a project
 */
export const reserveInventory = async (
  itemUuid: string,
  quantity: number,
  projectUuid?: string
): Promise<InventoryItem> => {
  try {
    const url = `/inventory/${itemUuid}/reserve`;
    const response = await axiosInstance.post(url, {
      quantity,
      projectUuid,
    });

    if (response.data.status === 'SUCCESS' || response.data.success) {
      return response.data.data || response.data;
    } else {
      throw new Error(response.data.message || 'Failed to reserve inventory');
    }
  } catch (error: any) {
    console.error('[inventoryAPI] reserveInventory error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to reserve inventory. Please try again.');
  }
};

/**
 * Release reserved inventory quantity
 */
export const releaseInventory = async (
  itemUuid: string,
  quantity: number,
  projectUuid?: string
): Promise<InventoryItem> => {
  try {
    const url = `/inventory/${itemUuid}/release`;
    const response = await axiosInstance.post(url, {
      quantity,
      projectUuid,
    });

    if (response.data.status === 'SUCCESS' || response.data.success) {
      return response.data.data || response.data;
    } else {
      throw new Error(response.data.message || 'Failed to release inventory');
    }
  } catch (error: any) {
    console.error('[inventoryAPI] releaseInventory error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to release inventory. Please try again.');
  }
};

/**
 * Allocate inventory (move from reserved to allocated/used)
 */
export const allocateInventory = async (
  itemUuid: string,
  quantity: number,
  projectUuid?: string
): Promise<InventoryItem> => {
  try {
    const url = `/inventory/${itemUuid}/allocate`;
    const response = await axiosInstance.post(url, {
      quantity,
      projectUuid,
    });

    if (response.data.status === 'SUCCESS' || response.data.success) {
      return response.data.data || response.data;
    } else {
      throw new Error(response.data.message || 'Failed to allocate inventory');
    }
  } catch (error: any) {
    console.error('[inventoryAPI] allocateInventory error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to allocate inventory. Please try again.');
  }
};

// ============================================
// Inventory Availability Checks
// ============================================

/**
 * Check if sufficient inventory is available
 */
export const checkInventoryAvailability = async (
  companyId: string,
  equipmentType: string,
  manufacturer: string,
  model: string,
  requiredQuantity: number
): Promise<{ available: boolean; availableQuantity: number; item?: InventoryItem }> => {
  try {
    const url = `/inventory/check-availability?companyId=${enc(companyId)}&equipmentType=${enc(
      equipmentType
    )}&manufacturer=${enc(manufacturer)}&model=${enc(model)}&quantity=${requiredQuantity}`;

    const response = await axiosInstance.get(url);

    if (response.data.status === 'SUCCESS' || response.data.success || response.data.available !== undefined) {
      return {
        available: response.data.available || response.data.data?.available || false,
        availableQuantity: response.data.availableQuantity || response.data.data?.availableQuantity || 0,
        item: response.data.item || response.data.data?.item,
      };
    } else {
      throw new Error(response.data.message || 'Failed to check availability');
    }
  } catch (error: any) {
    console.error('[inventoryAPI] checkInventoryAvailability error:', error?.response?.data || error?.message);

    // If endpoint doesn't exist, fall back to manual check
    if (error?.response?.status === 404) {
      try {
        const inventoryList = await listInventory(companyId, {
          equipmentType,
          manufacturer,
          model,
        });

        if (inventoryList.items.length > 0) {
          const item = inventoryList.items[0];
          const availableQty = item.quantity_available - item.quantity_reserved;
          return {
            available: availableQty >= requiredQuantity,
            availableQuantity: availableQty,
            item,
          };
        }

        return { available: false, availableQuantity: 0 };
      } catch {
        return { available: false, availableQuantity: 0 };
      }
    }

    throw new Error(error?.message || 'Unable to check inventory availability.');
  }
};

// ============================================
// Batch Operations
// ============================================

/**
 * Bulk update inventory quantities
 */
export const bulkUpdateInventory = async (
  updates: Array<{ itemUuid: string; quantityAvailable?: number; quantityReserved?: number }>
): Promise<void> => {
  try {
    const url = '/inventory/bulk-update';
    const response = await axiosInstance.post(url, { updates });

    if (!(response.data.status === 'SUCCESS' || response.data.success)) {
      throw new Error(response.data.message || 'Failed to bulk update inventory');
    }
  } catch (error: any) {
    console.error('[inventoryAPI] bulkUpdateInventory error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to bulk update inventory. Please try again.');
  }
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get available quantity (total - reserved)
 */
export const getAvailableQuantity = (item: InventoryItem): number => {
  return Math.max(0, item.quantity_available - item.quantity_reserved);
};

/**
 * Check if item is low stock (less than threshold)
 */
export const isLowStock = (item: InventoryItem, threshold: number = 10): boolean => {
  return getAvailableQuantity(item) < threshold;
};

/**
 * Check if item is out of stock
 */
export const isOutOfStock = (item: InventoryItem): boolean => {
  return getAvailableQuantity(item) === 0;
};
