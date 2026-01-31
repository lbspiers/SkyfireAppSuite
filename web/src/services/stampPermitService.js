import axios from '../config/axios';
import logger from './devLogger';

const ORDER_TYPE_LABELS = {
  structural_pe_stamp: 'Structural PE Stamp',
  electrical_pe_stamp: 'Electrical PE Stamp',
  building_permit: 'Building Permit',
  interconnection_application: 'Interconnection Application'
};

/**
 * Get order status for all 4 order types for a project
 * @param {string} projectUuid
 * @returns {Object} { structural_pe_stamp: { ordered, ordered_at, ordered_by }, ... }
 */
export const getStampPermitOrders = async (projectUuid) => {
  try {
    const response = await axios.get(`/api/stamp-permit-orders/${projectUuid}`);
    return response.data?.data || null;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    logger.error('StampPermit', 'Error fetching orders:', error);
    throw error;
  }
};

/**
 * Create orders for selected types
 * @param {Object} orderData
 * @param {string} orderData.projectUuid
 * @param {string[]} orderData.orderTypes - Array of order type keys
 * @param {Object} orderData.address - { address, city, state, zip_code }
 */
export const createStampPermitOrders = async (orderData) => {
  try {
    const payload = {
      project_uuid: orderData.projectUuid,
      order_types: orderData.orderTypes,
      address: orderData.address?.address || '',
      city: orderData.address?.city || '',
      state: orderData.address?.state || '',
      zip_code: orderData.address?.zip_code || ''
    };

    const response = await axios.post('/api/stamp-permit-orders', payload);
    logger.success('StampPermit', 'Orders created successfully');
    return response.data;
  } catch (error) {
    logger.error('StampPermit', 'Error creating orders:', error);
    throw error;
  }
};

/**
 * Cancel an order
 * @param {string} orderUuid
 */
export const cancelStampPermitOrder = async (orderUuid) => {
  try {
    const response = await axios.delete(`/api/stamp-permit-orders/${orderUuid}`);
    return response.data;
  } catch (error) {
    logger.error('StampPermit', 'Error cancelling order:', error);
    throw error;
  }
};

/**
 * Format order timestamp for display
 * @param {Object} order - Order object with ordered_at and ordered_by
 * @returns {string} Formatted string like "Ordered 1/4/2026 @ 2:30pm by John Smith"
 */
export const formatOrderInfo = (order) => {
  if (!order?.ordered_at) return '';

  const date = new Date(order.ordered_at);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `Ordered ${dateStr} @ ${timeStr} by ${order.ordered_by || 'Unknown'}`;
};

export { ORDER_TYPE_LABELS };
