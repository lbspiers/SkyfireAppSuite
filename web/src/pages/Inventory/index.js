/**
 * Inventory Management - 30/70 Split Panel Layout
 * Left: Category navigation + Add form (30%)
 * Right: Equipment display grid for selected category (70%)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Trash2, ArrowLeft } from 'lucide-react';
import { isCurrentUserAdminAsync } from '../../utils/adminUtils';
import { EQUIPMENT_CATEGORIES, isModelOptional, getEquipmentTypeForCategory } from '../../constants/equipmentCategories';
import {
  getPreferredEquipment,
  createPreferredEquipment,
  updatePreferredEquipment,
  deletePreferredEquipment,
  getEquipmentManufacturers,
  getEquipmentModels,
  getAllCompanies,
} from '../../services/preferredEquipmentService';
import CollapsibleSection from '../../components/ui/CollapsibleSection';
import AddEquipmentForm from './AddEquipmentForm';
import styles from './Inventory.module.css';

const Inventory = () => {
  console.log('[Inventory] ✅ NEW 30/70 SPLIT LAYOUT - src/pages/Inventory/index.js');

  const navigate = useNavigate();
  const location = useLocation();

  // Get user data from session storage
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const currentUserCompanyId = userData?.company?.uuid;
  const currentUserCompanyName = userData?.company?.name || '';
  const userId = userData?.uuid || userData?.id;

  // Check if we have a return project path
  const returnToProjectPath = sessionStorage.getItem('returnToProject');

  // Selected category for 30/70 split (NEW)
  const [selectedCategory, setSelectedCategory] = useState('solar-panels');

  // Super user state
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(currentUserCompanyId);
  const [selectedCompanyName, setSelectedCompanyName] = useState(currentUserCompanyName);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Inventory state - all equipment for all categories
  const [inventory, setInventory] = useState({
    'solar-panels': [],
    'inverters': [],
    'micro-inverters': [],
    'batteries': [],
    'storage-management': [],
    'ac-disconnects': [],
    'pv-meters': [],
    'load-centers': [],
    'rails': [],
    'attachments': [],
    'ev-chargers': [],
  });

  // Expand/collapse state - Solar Panels and Inverters expanded by default
  const [expandedSections, setExpandedSections] = useState({
    'solar-panels': true,
    'inverters': true,
    'micro-inverters': false,
    'batteries': false,
    'storage-management': false,
    'ac-disconnects': false,
    'pv-meters': false,
    'load-centers': false,
    'rails': false,
    'attachments': false,
    'ev-chargers': false,
  });

  // Dropdown state for each category
  const [dropdownState, setDropdownState] = useState({});

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingEquipment, setSavingEquipment] = useState({});

  // Wattage filter (solar panels only)
  const [watts, setWatts] = useState('');

  // Delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);

  // Add equipment modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalCategory, setAddModalCategory] = useState(null);

  // Check admin status on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      const isAdmin = await isCurrentUserAdminAsync();
      setIsSuperUser(isAdmin);
    };
    checkAdminStatus();
  }, []);

  // Fetch companies for super users
  useEffect(() => {
    if (isSuperUser) {
      fetchCompanies();
    }
  }, [isSuperUser]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await getAllCompanies();

      if (response?.data) {
        // Filter for APPROVED companies only
        const approvedCompanies = response.data
          .filter((item) => {
            const approved = item.user?.approved ?? item.approved ?? item.company?.approved;
            return approved === true || approved === 1;
          })
          .map((item) => ({
            uuid: item.company?.uuid || item.uuid,
            name: item.company?.name || item.name,
            email: item.user?.email,
          }));

        console.log(`[Inventory] Loaded ${approvedCompanies.length} approved companies`);
        setCompanies(approvedCompanies);

        // Default to current user's company if available
        const currentCompany = approvedCompanies.find(c => c.uuid === currentUserCompanyId);
        if (currentCompany) {
          setSelectedCompanyId(currentCompany.uuid);
          setSelectedCompanyName(currentCompany.name);
        } else if (approvedCompanies.length > 0) {
          setSelectedCompanyId(approvedCompanies[0].uuid);
          setSelectedCompanyName(approvedCompanies[0].name);
        }
      }
    } catch (error) {
      console.error('[Inventory] Error fetching companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Get active company ID
  const getActiveCompanyId = useCallback(() => {
    if (isSuperUser && selectedCompanyId) {
      return selectedCompanyId;
    }
    return currentUserCompanyId;
  }, [isSuperUser, selectedCompanyId, currentUserCompanyId]);

  // Load ALL equipment for ALL categories
  const loadAllEquipment = useCallback(async (companyIdOverride) => {
    const activeCompanyId = companyIdOverride || getActiveCompanyId();
    if (!activeCompanyId) {
      console.warn('[Inventory] No company ID available');
      setLoading(false);
      return;
    }

    console.log(`[Inventory] Loading all equipment for company: ${activeCompanyId}`);
    setLoading(true);

    try {
      const newInventory = { ...inventory };

      // Load equipment for each category
      for (const category of EQUIPMENT_CATEGORIES) {
        if (category.disabled) {
          newInventory[category.id] = [];
          continue;
        }

        try {
          const data = await getPreferredEquipment(activeCompanyId, category.id);
          const equipment = Array.isArray(data) ? data : data?.data || [];
          newInventory[category.id] = equipment;
        } catch (error) {
          console.error(`[Inventory] Error loading ${category.id}:`, error);
          newInventory[category.id] = [];
        }
      }

      console.log('[Inventory] All equipment loaded:', newInventory);
      setInventory(newInventory);
    } finally {
      setLoading(false);
    }
  }, [getActiveCompanyId]);

  // Load manufacturers for a category
  const loadManufacturers = useCallback(async (categoryId) => {
    try {
      const equipmentType = getEquipmentTypeForCategory(categoryId);
      const data = await getEquipmentManufacturers(equipmentType);

      const manufacturers = data?.data || data || [];
      const formatted = manufacturers.map((m) => {
        if (typeof m === 'string') return { label: m, value: m };
        return {
          label: m.manufacturer || m.manufacturerName || m.name || m.label,
          value: m.manufacturer || m.manufacturerName || m.name || m.value,
        };
      });

      setDropdownState(prev => ({
        ...prev,
        [categoryId]: {
          ...prev[categoryId],
          makes: formatted,
        },
      }));
    } catch (error) {
      console.error(`[Inventory] Error loading manufacturers for ${categoryId}:`, error);
    }
  }, []);

  // Load models for a category
  const loadModels = useCallback(async (categoryId, make) => {
    if (!make) return;

    try {
      const equipmentType = getEquipmentTypeForCategory(categoryId);
      const isSolarPanel = categoryId === 'solar-panels';
      const pmax = isSolarPanel && watts ? parseInt(watts) : null;

      const data = await getEquipmentModels(equipmentType, make, pmax);

      const modelsList = data?.data || data || [];
      const formatted = modelsList.map((m) => {
        if (typeof m === 'string') return { label: m, value: m };
        return {
          label: m.model || m.modelNumber || m.name || m.label,
          value: m.model || m.modelNumber || m.name || m.value,
        };
      });

      setDropdownState(prev => ({
        ...prev,
        [categoryId]: {
          ...prev[categoryId],
          models: formatted,
        },
      }));
    } catch (error) {
      console.error(`[Inventory] Error loading models for ${categoryId}:`, error);
    }
  }, [watts]);

  // Load on mount and when company changes
  useEffect(() => {
    if (selectedCompanyId || currentUserCompanyId) {
      loadAllEquipment();
    }
  }, [selectedCompanyId, loadAllEquipment]);

  // Load manufacturers when category changes (for 30/70 split layout)
  useEffect(() => {
    if (selectedCategory && !dropdownState[selectedCategory]?.makes) {
      loadManufacturers(selectedCategory);
    }
  }, [selectedCategory, dropdownState, loadManufacturers]);

  // Handle company change (super users)
  const handleCompanyChange = async (e) => {
    const companyUuid = e.target.value;
    const company = companies.find(c => c.uuid === companyUuid);
    if (!company) return;

    console.log(`[Inventory] Switching to company: ${company.name}`);

    // Clear current inventory
    setInventory({
      'solar-panels': [],
      'inverters': [],
      'micro-inverters': [],
      'batteries': [],
      'storage-management': [],
      'ac-disconnects': [],
      'pv-meters': [],
      'load-centers': [],
      'rails': [],
      'attachments': [],
      'ev-chargers': [],
    });
    setSelectedCompanyId(companyUuid);
    setSelectedCompanyName(company.name);

    toast.info(`Now managing: ${company.name}`, { autoClose: 2000 });

    await loadAllEquipment(companyUuid);
  };

  // Toggle section expand/collapse
  const toggleSection = (categoryId) => {
    setExpandedSections(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));

    // Load manufacturers when expanding if not already loaded
    if (!expandedSections[categoryId] && !dropdownState[categoryId]?.makes) {
      loadManufacturers(categoryId);
    }
  };

  // Handle manufacturer change
  const handleMakeChange = (categoryId, value) => {
    setDropdownState(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        make: value,
        model: '', // Reset model when make changes
        models: [], // Clear models
      },
    }));

    // Load models for selected make
    if (value) {
      loadModels(categoryId, value);
    }
  };

  // Handle model change
  const handleModelChange = (categoryId, value) => {
    setDropdownState(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        model: value,
      },
    }));
  };

  // Handle quantity change (NEW for 30/70 split)
  const handleQuantityChange = (categoryId, value) => {
    setDropdownState(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        quantity: value,
      },
    }));
  };

  // Open add equipment form
  const handleOpenAddModal = (category) => {
    setAddModalCategory(category);
    setAddModalOpen(true);
  };

  // Add equipment from modal
  const handleAddFromModal = async ({ categoryId, make, model, quantity }) => {
    const modelOptional = isModelOptional(categoryId);

    if (!make) {
      toast.warning('Please select a manufacturer');
      return;
    }

    if (!modelOptional && !model) {
      toast.warning('Please select a model');
      return;
    }

    // Check for duplicates
    const isDuplicate = inventory[categoryId].some(
      (eq) => eq.make === make && eq.model === model
    );

    if (isDuplicate) {
      toast.warning('This equipment is already in your preferred list');
      return;
    }

    try {
      const activeCompanyId = getActiveCompanyId();
      await createPreferredEquipment({
        equipmentType: categoryId,
        make: make,
        model: model || '',
        companyId: activeCompanyId,
        createdBy: userId,
        isDefault: inventory[categoryId].length === 0, // First one is default
      });

      toast.success('Equipment added successfully');

      // Reload equipment for this category
      const data = await getPreferredEquipment(activeCompanyId, categoryId);
      const equipment = Array.isArray(data) ? data : data?.data || [];
      setInventory(prev => ({
        ...prev,
        [categoryId]: equipment,
      }));
    } catch (error) {
      console.error('[Inventory] Error adding equipment:', error);
      toast.error('Failed to add equipment');
      throw error; // Re-throw so modal can handle it
    }
  };

  // Delete equipment (show confirmation)
  const handleDeleteClick = (categoryId, equipment) => {
    setEquipmentToDelete({ categoryId, equipment });
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!equipmentToDelete) return;

    const { categoryId, equipment } = equipmentToDelete;

    try {
      await deletePreferredEquipment(equipment.uuid);
      toast.success('Equipment removed');
      setShowDeleteConfirm(false);
      setEquipmentToDelete(null);

      // Reload equipment for this category
      const activeCompanyId = getActiveCompanyId();
      const data = await getPreferredEquipment(activeCompanyId, categoryId);
      const equipmentList = Array.isArray(data) ? data : data?.data || [];
      setInventory(prev => ({
        ...prev,
        [categoryId]: equipmentList,
      }));
    } catch (error) {
      console.error('[Inventory] Error deleting equipment:', error);
      toast.error('Failed to remove equipment');
    }
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setEquipmentToDelete(null);
  };

  // Set as default
  const handleSetDefault = async (categoryId, equipment) => {
    try {
      await updatePreferredEquipment(equipment.uuid, { is_default: true });
      toast.success(`${equipment.make} set as default`);

      // Reload equipment for this category
      const activeCompanyId = getActiveCompanyId();
      const data = await getPreferredEquipment(activeCompanyId, categoryId);
      const equipmentList = Array.isArray(data) ? data : data?.data || [];
      setInventory(prev => ({
        ...prev,
        [categoryId]: equipmentList,
      }));
    } catch (error) {
      console.error('[Inventory] Error setting default:', error);
      toast.error('Failed to set as default');
    }
  };

  const handleBackToProject = () => {
    if (returnToProjectPath) {
      sessionStorage.removeItem('returnToProject'); // Clear after use
      navigate(returnToProjectPath);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>Inventory Management</h1>
            <p>Manage your preferred equipment for each category</p>
          </div>
          {returnToProjectPath && (
            <button onClick={handleBackToProject} className={styles.backToProjectButton}>
              <ArrowLeft size={18} />
              <span>Back to Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Super User Company Selector */}
      {isSuperUser && companies.length > 0 && (
        <div className={styles.companySelectorContainer}>
          <label className={styles.companySelectorLabel}>
            Managing Equipment For:
          </label>
          <select
            value={selectedCompanyId || ''}
            onChange={handleCompanyChange}
            className={styles.companySelect}
            disabled={loadingCompanies}
          >
            {companies.map((company) => (
              <option key={company.uuid} value={company.uuid}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Loading equipment...</p>
        </div>
      ) : (
        /* 30/70 Split Layout */
        <div className={styles.splitLayout}>
          {/* LEFT PANEL: Category Navigation OR Add Form (30%) */}
          <div className={styles.categoryPanel}>
            {addModalOpen && addModalCategory ? (
              // INLINE ADD FORM
              <AddEquipmentForm
                onClose={() => {
                  setAddModalOpen(false);
                  setAddModalCategory(null);
                }}
                onAdd={handleAddFromModal}
                categoryId={addModalCategory.id}
                categoryLabel={addModalCategory.label}
                isSolarPanel={addModalCategory.id === 'solar-panels'}
              />
            ) : (
              // CATEGORY LIST
              <>
                <h3 className={styles.categoryPanelTitle}>Equipment Categories</h3>

                <div className={styles.categoryList}>
                  {EQUIPMENT_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      className={`${styles.categoryItem} ${selectedCategory === category.id ? styles.categoryItemSelected : ''}`}
                      onClick={() => setSelectedCategory(category.id)}
                      disabled={category.disabled}
                    >
                      <span className={styles.categoryName}>{category.label}</span>
                      <div className={styles.categoryRight}>
                        {!category.disabled && !category.comingSoon && (
                          <button
                            className={styles.addCategoryButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAddModal(category);
                            }}
                            title={`Add ${category.label}`}
                          >
                            + Add
                          </button>
                        )}
                        {!category.comingSoon && (
                          <span className={styles.categoryBadge}>
                            {inventory[category.id]?.length || 0}
                          </span>
                        )}
                        {category.comingSoon && (
                          <span className={styles.comingSoonBadge}>Soon</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* RIGHT PANEL: Equipment Display Grid (70%) */}
          <div className={styles.displayPanel}>
            <h3 className={styles.displayPanelTitle}>
              {EQUIPMENT_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Equipment'}
            </h3>

            {(inventory[selectedCategory] || []).length === 0 ? (
              <div className={styles.emptyState}>
                <p>
                  No preferred {EQUIPMENT_CATEGORIES.find(c => c.id === selectedCategory)?.label?.toLowerCase() || 'equipment'} added yet.
                </p>
                <p className={styles.emptyHint}>Use the form on the left to add equipment.</p>
              </div>
            ) : (
              <div className={styles.equipmentGrid}>
                {(inventory[selectedCategory] || []).map((equipment) => (
                  <div key={equipment.uuid} className={styles.equipmentCard}>
                    <div className={styles.equipmentInfo}>
                      <div className={styles.equipmentHeader}>
                        <span className={styles.equipmentMake}>{equipment.make}</span>
                        {equipment.is_default && (
                          <span className={styles.defaultBadge}>Default</span>
                        )}
                      </div>
                      {equipment.model && (
                        <span className={styles.equipmentModel}>{equipment.model}</span>
                      )}

                      {/* Quantity on Hand Display (NEW) */}
                      <div className={styles.qtyOnHand}>
                        <span className={styles.qtyLabel}>In Stock:</span>
                        <span className={styles.qtyValue}>
                          {equipment.quantity_on_hand || 0}
                        </span>
                      </div>
                    </div>

                    <div className={styles.equipmentActions}>
                      {!equipment.is_default && (
                        <button
                          className={styles.setDefaultButton}
                          onClick={() => handleSetDefault(selectedCategory, equipment)}
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteClick(selectedCategory, equipment)}
                        aria-label="Delete equipment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && equipmentToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Remove Equipment?</h3>
            <p>
              Are you sure you want to remove{' '}
              <strong>{equipmentToDelete.equipment.make}</strong>
              {equipmentToDelete.equipment.model && (
                <> - {equipmentToDelete.equipment.model}</>
              )}{' '}
              from your preferred list?
            </p>
            <div className={styles.modalButtons}>
              <button className={styles.cancelButton} onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button className={styles.confirmDeleteButton} onClick={handleDeleteConfirm}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
