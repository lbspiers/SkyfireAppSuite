import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ChevronDown, ChevronUp, Check, X, Trash2 } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import SearchableDropdown from '../ui/SearchableDropdown';
import {
  getPendingReviewItems,
  getApprovedAliases,
  getRejectedItems,
  approveItem,
  rejectItem,
  getReviewStats,
  getManufacturers,
  getModelsForManufacturer,
  bulkApprove,
  removeApprovedAlias,
} from '../../services/equipmentReviewService';
import styles from './EquipmentReviewPanel.module.css';

const EquipmentReviewPanel = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState(null);
  const [pendingItems, setPendingItems] = useState([]);
  const [approvedAliases, setApprovedAliases] = useState({});
  const [rejectedItems, setRejectedItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [manufacturers, setManufacturers] = useState([]);
  const [customSelections, setCustomSelections] = useState({});
  const [modelsCache, setModelsCache] = useState({});

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [statsData, pending, approved, rejected, mfrs] = await Promise.all([
        getReviewStats(),
        getPendingReviewItems(),
        getApprovedAliases(),
        getRejectedItems(),
        getManufacturers(),
      ]);

      setStats(statsData);
      setPendingItems(pending);
      setApprovedAliases(approved);
      setRejectedItems(rejected);
      setManufacturers(mfrs);
    } catch (error) {
      toast.error('Failed to load equipment review data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleApprove = async (item, useCustom = false) => {
    try {
      const custom = customSelections[item.id];
      const manufacturer = useCustom && custom?.manufacturer ? custom.manufacturer : item.suggested_manufacturer;
      const model = useCustom && custom?.model ? custom.model : item.suggested_model;

      await approveItem(item.original, manufacturer, model);
      toast.success(`Approved: ${item.original} → ${manufacturer}`);

      // Remove from pending
      setPendingItems(prev => prev.filter(i => i.id !== item.id));
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });

      // Refresh stats
      const statsData = await getReviewStats();
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to approve item');
      console.error(error);
    }
  };

  const handleReject = async (item) => {
    try {
      await rejectItem(item.original, 'Rejected via UI');
      toast.success(`Rejected: ${item.original}`);

      // Remove from pending
      setPendingItems(prev => prev.filter(i => i.id !== item.id));
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });

      // Refresh stats
      const statsData = await getReviewStats();
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to reject item');
      console.error(error);
    }
  };

  const handleBulkApprove = async () => {
    const highConfidenceItems = pendingItems.filter(item => item.confidence >= 0.95);
    if (highConfidenceItems.length === 0) {
      toast.info('No high-confidence items to bulk approve');
      return;
    }

    try {
      await bulkApprove(highConfidenceItems);
      toast.success(`Bulk approved ${highConfidenceItems.length} items`);

      // Remove from pending
      const highConfidenceIds = new Set(highConfidenceItems.map(i => i.id));
      setPendingItems(prev => prev.filter(i => !highConfidenceIds.has(i.id)));

      // Refresh stats
      const statsData = await getReviewStats();
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to bulk approve items');
      console.error(error);
    }
  };

  const handleRemoveAlias = async (originalPattern) => {
    try {
      await removeApprovedAlias(originalPattern);
      toast.success(`Removed alias: ${originalPattern}`);

      // Remove from approved
      setApprovedAliases(prev => {
        const newAliases = { ...prev };
        delete newAliases[originalPattern];
        return newAliases;
      });

      // Refresh stats
      const statsData = await getReviewStats();
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to remove alias');
      console.error(error);
    }
  };

  const handleManufacturerChange = async (itemId, manufacturer) => {
    setCustomSelections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        manufacturer,
        model: null, // Reset model when manufacturer changes
      },
    }));

    // Load models for this manufacturer
    if (manufacturer && !modelsCache[manufacturer]) {
      try {
        const models = await getModelsForManufacturer(manufacturer);
        setModelsCache(prev => ({
          ...prev,
          [manufacturer]: models,
        }));
      } catch (error) {
        console.error('Failed to load models:', error);
      }
    }
  };

  const handleModelChange = (itemId, model) => {
    setCustomSelections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        model,
      },
    }));
  };

  const getConfidenceBadgeClass = (confidence) => {
    if (confidence >= 0.95) return styles.confidenceHigh;
    if (confidence >= 0.85) return styles.confidenceMedium;
    return styles.confidenceLow;
  };

  const manufacturerOptions = manufacturers.map(mfr => ({
    value: mfr,
    label: mfr,
  }));

  const getModelOptions = (itemId) => {
    const manufacturer = customSelections[itemId]?.manufacturer;
    if (!manufacturer || !modelsCache[manufacturer]) return [];
    return modelsCache[manufacturer].map(model => ({
      value: model.model,
      label: model.details ? `${model.model} (${model.details})` : model.model,
    }));
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Equipment Learning Review</h2>
          <p className={styles.subtitle}>Review and approve AI-suggested equipment matches</p>
        </div>
      </div>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.pending_count}</div>
            <div className={styles.statLabel}>Pending Review</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.approved_count}</div>
            <div className={styles.statLabel}>Approved Aliases</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.rejected_count}</div>
            <div className={styles.statLabel}>Rejected</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.auto_learned_count}</div>
            <div className={styles.statLabel}>Auto-Learned</div>
          </div>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'pending' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingItems.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'approved' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved ({Object.keys(approvedAliases).length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'rejected' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected ({rejectedItems.length})
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'pending' && (
          <>
            {stats && stats.high_confidence_pending > 0 && (
              <div className={styles.bulkActions}>
                <button className={styles.bulkApproveBtn} onClick={handleBulkApprove}>
                  <Check size={16} />
                  Bulk Approve {stats.high_confidence_pending} High-Confidence Items (95%+)
                </button>
              </div>
            )}

            {pendingItems.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No pending items to review</p>
              </div>
            ) : (
              <div className={styles.itemList}>
                {pendingItems.map(item => (
                  <div key={item.id} className={styles.reviewCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardHeaderLeft}>
                        <span className={styles.equipmentTypeBadge}>{item.equipment_type}</span>
                        <span className={`${styles.confidenceBadge} ${getConfidenceBadgeClass(item.confidence)}`}>
                          {(item.confidence * 100).toFixed(0)}% confidence
                        </span>
                        {item.seen_count > 1 && (
                          <span className={styles.seenBadge}>Seen {item.seen_count}x</span>
                        )}
                      </div>
                      <div className={styles.cardHeaderRight}>
                        <button
                          className={styles.quickActionBtn}
                          onClick={() => handleApprove(item, false)}
                          title="Approve suggestion"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          className={`${styles.quickActionBtn} ${styles.rejectBtn}`}
                          onClick={() => handleReject(item)}
                          title="Reject"
                        >
                          <X size={18} />
                        </button>
                        <button
                          className={styles.expandBtn}
                          onClick={() => toggleExpand(item.id)}
                          title="Expand for custom selection"
                        >
                          {expandedItems.has(item.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>Scraped from PDF:</span>
                        <span className={styles.fieldValue}>
                          {item.original_manufacturer} {item.original_model}
                        </span>
                      </div>
                      <div className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>AI Suggested Match:</span>
                        <span className={styles.fieldValue}>
                          {item.suggested_manufacturer} {item.suggested_model}
                        </span>
                      </div>
                      <div className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>Source:</span>
                        <span className={styles.fieldValueMuted}>{item.source_file}</span>
                      </div>
                    </div>

                    {expandedItems.has(item.id) && (
                      <div className={styles.expandedSection}>
                        <div className={styles.customSelectionHeader}>
                          <h4>Custom Selection</h4>
                        </div>
                        <div className={styles.dropdownRow}>
                          <SearchableDropdown
                            label="Manufacturer"
                            value={customSelections[item.id]?.manufacturer || ''}
                            onChange={(value) => handleManufacturerChange(item.id, value)}
                            options={manufacturerOptions}
                            placeholder="Select manufacturer..."
                            clearable
                          />
                        </div>
                        {customSelections[item.id]?.manufacturer && (
                          <div className={styles.dropdownRow}>
                            <SearchableDropdown
                              label="Model"
                              value={customSelections[item.id]?.model || ''}
                              onChange={(value) => handleModelChange(item.id, value)}
                              options={getModelOptions(item.id)}
                              placeholder="Select model..."
                              clearable
                            />
                          </div>
                        )}
                        <div className={styles.customActions}>
                          <button
                            className={styles.approveCustomBtn}
                            onClick={() => handleApprove(item, true)}
                            disabled={!customSelections[item.id]?.manufacturer}
                          >
                            <Check size={16} />
                            Approve Custom Selection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'approved' && (
          <>
            {Object.keys(approvedAliases).length === 0 ? (
              <div className={styles.emptyState}>
                <p>No approved aliases yet</p>
              </div>
            ) : (
              <div className={styles.approvedTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableHeaderCell}>Original Pattern</div>
                  <div className={styles.tableHeaderCell}>Canonical Manufacturer</div>
                  <div className={styles.tableHeaderCell}>Actions</div>
                </div>
                {Object.entries(approvedAliases).map(([original, canonical]) => (
                  <div key={original} className={styles.tableRow}>
                    <div className={styles.tableCell}>{original}</div>
                    <div className={styles.tableCell}>{canonical}</div>
                    <div className={styles.tableCell}>
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemoveAlias(original)}
                        title="Remove alias"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'rejected' && (
          <>
            {rejectedItems.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No rejected items</p>
              </div>
            ) : (
              <div className={styles.rejectedList}>
                {rejectedItems.map((item, index) => (
                  <div key={index} className={styles.rejectedCard}>
                    <div className={styles.rejectedHeader}>
                      <span className={styles.rejectedOriginal}>{item.original}</span>
                      <span className={`${styles.confidenceBadge} ${styles.confidenceLow}`}>
                        {(item.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    {item.rejection_reason && (
                      <div className={styles.rejectedReason}>
                        Reason: {item.rejection_reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EquipmentReviewPanel;
