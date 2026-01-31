/**
 * PreferredEquipmentModal - Quick selection from company's preferred equipment
 *
 * Shows a simple list of preferred equipment for quick selection.
 * User clicks an item → modal closes and returns selected make/model.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { getPreferredEquipment } from '../../services/preferredEquipmentService';
import styles from './PreferredEquipmentModal.module.css';

const PreferredEquipmentModal = ({
  isOpen,
  onClose,
  onSelect,      // Called with { make, model, wattage? } when user selects
  onSelectOther, // Called when user wants to use full catalog instead
  equipmentType, // 'solar-panels', 'inverters', 'micro-inverters', 'batteries', etc.
  title,         // e.g., "Select Solar Panel"
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get company ID from session
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const companyId = userData?.company?.uuid;

  useEffect(() => {
    if (isOpen && companyId && equipmentType) {
      loadPreferredEquipment();
    }
  }, [isOpen, companyId, equipmentType]);

  const loadPreferredEquipment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPreferredEquipment(companyId, equipmentType);
      const items = Array.isArray(data) ? data : data?.data || [];
      setEquipment(items);
    } catch (err) {
      console.error('[PreferredEquipmentModal] Error loading equipment:', err);
      setError('Failed to load preferred equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    onSelect({
      make: item.make,
      model: item.model,
      wattage: item.wattage || null,
      isDefault: item.is_default,
    });
    onClose();
  };

  const handleSelectOther = () => {
    if (onSelectOther) {
      onSelectOther();
    }
    onClose();
  };

  const handleGoToInventory = () => {
    // Save current project location for return navigation
    sessionStorage.setItem('returnToProject', location.pathname);
    onClose();
    navigate('/account', { state: { openInventory: true } });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Select Preferred Equipment'}
      size="md"
      contained={true}
    >
      <div className={styles.modalContent}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading preferred equipment...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <Button variant="ghost" size="sm" onClick={loadPreferredEquipment}>
              Retry
            </Button>
          </div>
        ) : equipment.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No Preferred Equipment</p>
            <p className={styles.emptyHint}>
              You haven't added any preferred equipment yet.
            </p>
            <div className={styles.emptyActions}>
              <Button variant="secondary" onClick={handleGoToInventory}>
                Go to Inventory
              </Button>
              <Button variant="primary" onClick={handleSelectOther}>
                Select from Full Catalog
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className={styles.instruction}>
              Click to select, or choose "Other" to browse full catalog.
            </p>

            <div className={styles.equipmentList}>
              {equipment.map((item) => (
                <button
                  key={item.uuid}
                  className={`${styles.equipmentItem} ${item.is_default ? styles.defaultItem : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  <div className={styles.equipmentInfo}>
                    <span className={styles.make}>{item.make}</span>
                    <span className={styles.model}>{item.model}</span>
                  </div>
                  {item.is_default && (
                    <span className={styles.defaultBadge}>Default</span>
                  )}
                </button>
              ))}
            </div>

            <div className={styles.footer}>
              <Button variant="ghost" onClick={handleSelectOther}>
                Other (Full Catalog)
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PreferredEquipmentModal;
