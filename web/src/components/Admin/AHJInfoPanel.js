import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../config/api';
import apiEndpoints from '../../config/apiEndpoints';
import styles from './AHJInfoPanel.module.css';

const AHJInfoPanel = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    enriched: 0,
    not_enriched: 0,
    high_confidence: 0,
    medium_confidence: 0,
    low_confidence: 0,
    by_state: {}
  });
  const [loading, setLoading] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedConfidence, setSelectedConfidence] = useState('');
  const [enrichedFilter, setEnrichedFilter] = useState('enriched'); // Default to enriched only
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedState) params.append('state', selectedState);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedConfidence) params.append('confidence', selectedConfidence);
      if (enrichedFilter === 'enriched') params.append('enriched', 'true');
      if (enrichedFilter === 'not_enriched') params.append('enriched', 'false');
      params.append('limit', '10000'); // Get all records

      const response = await apiClient.get(`${apiEndpoints.ADMIN.AHJ_CODE_YEARS}?${params.toString()}`);
      if (response.data?.status === 'SUCCESS') {
        setRecords(response.data.data.records);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch AHJ code years:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedState, debouncedSearch, selectedConfidence, enrichedFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRowClick = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Sort records by jurisdiction name
  const sortedRecords = [...records].sort((a, b) => {
    const nameA = a.jurisdiction.toLowerCase();
    const nameB = b.jurisdiction.toLowerCase();
    if (sortOrder === 'asc') {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Not verified';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getConfidenceBadgeClass = (confidence) => {
    switch (confidence) {
      case 'high': return styles.confidenceBadgeHigh;
      case 'medium': return styles.confidenceBadgeMedium;
      case 'low': return styles.confidenceBadgeLow;
      case 'on_hold': return styles.confidenceBadgeOnHold;
      default: return styles.confidenceBadge;
    }
  };

  const stateOptions = Object.keys(stats.by_state || {}).sort();
  const enrichedPercentage = stats.total > 0 ? ((stats.enriched / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className={styles.container}>
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total AHJs</div>
          <div className={styles.statValue}>{stats.total.toLocaleString()}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Enriched</div>
          <div className={styles.statValue}>{enrichedPercentage}%</div>
          <div className={styles.statSubtext}>{stats.enriched.toLocaleString()} records</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>High Confidence</div>
          <div className={styles.statValue}>{stats.high_confidence.toLocaleString()}</div>
          <div className={styles.statSubtext}>
            Medium: {stats.medium_confidence} · Low: {stats.low_confidence}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>States Covered</div>
          <div className={styles.statValue}>{stateOptions.length}</div>
        </div>
      </div>

      {/* Filters Row */}
      <div className={styles.filtersRow}>
        <input
          type="text"
          placeholder="Search jurisdiction..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className={styles.selectFilter}
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
        >
          <option value="">All States</option>
          {stateOptions.map(state => (
            <option key={state} value={state}>
              {state} ({stats.by_state[state]})
            </option>
          ))}
        </select>

        <select
          className={styles.selectFilter}
          value={selectedConfidence}
          onChange={(e) => setSelectedConfidence(e.target.value)}
        >
          <option value="">All Confidence</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="on_hold">On Hold</option>
        </select>

        <select
          className={styles.selectFilter}
          value={enrichedFilter}
          onChange={(e) => setEnrichedFilter(e.target.value)}
        >
          <option value="all">All Records</option>
          <option value="enriched">Enriched Only</option>
          <option value="not_enriched">Not Enriched</option>
        </select>

        <button
          className={styles.sortButton}
          onClick={toggleSortOrder}
          title={sortOrder === 'asc' ? 'Sort Z-A' : 'Sort A-Z'}
        >
          Sort {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.loadingState}>Loading AHJ data...</div>
      ) : records.length === 0 ? (
        <div className={styles.emptyState}>No AHJs found matching your filters</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeader}>
                <th>Jurisdiction</th>
                <th>State</th>
                <th>NEC</th>
                <th>IBC</th>
                <th>IRC</th>
                <th>IECC</th>
                <th>Confidence</th>
                <th>Verified</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((record) => (
                <React.Fragment key={record.id}>
                  <tr
                    className={styles.tableRow}
                    onClick={() => handleRowClick(record.id)}
                  >
                    <td>{record.jurisdiction}</td>
                    <td>{record.state}</td>
                    <td className={styles.codeYearCell}>{record.nec_year || '—'}</td>
                    <td className={styles.codeYearCell}>{record.ibc_year || '—'}</td>
                    <td className={styles.codeYearCell}>{record.irc_year || '—'}</td>
                    <td className={styles.codeYearCell}>{record.iecc_year || '—'}</td>
                    <td>
                      <span className={`${styles.confidenceBadge} ${getConfidenceBadgeClass(record.confidence)}`}>
                        {record.confidence || 'N/A'}
                      </span>
                    </td>
                    <td className={styles.verifiedCell}>{formatDate(record.last_verified_at)}</td>
                  </tr>
                  {expandedRowId === record.id && (
                    <tr>
                      <td colSpan="8" className={styles.expandedRow}>
                        <div className={styles.expandedContent}>
                          {/* Four Column Layout */}
                          <div className={styles.expandedGrid}>
                            {/* Building Codes */}
                            <div className={styles.detailSection}>
                              <h4 className={styles.detailSectionTitle}>Building Codes</h4>
                              <div className={styles.codesList}>
                                <div className={styles.codeItem}>
                                  <span className={styles.codeLabel}>NEC</span>
                                  <span className={styles.codeValue}>{record.nec_year || '—'}</span>
                                </div>
                                <div className={styles.codeItem}>
                                  <span className={styles.codeLabel}>IBC</span>
                                  <span className={styles.codeValue}>{record.ibc_year || '—'}</span>
                                </div>
                                <div className={styles.codeItem}>
                                  <span className={styles.codeLabel}>IRC</span>
                                  <span className={styles.codeValue}>{record.irc_year || '—'}</span>
                                </div>
                                <div className={styles.codeItem}>
                                  <span className={styles.codeLabel}>IFC</span>
                                  <span className={styles.codeValue}>{record.ifc_year || '—'}</span>
                                </div>
                                <div className={styles.codeItem}>
                                  <span className={styles.codeLabel}>IECC</span>
                                  <span className={styles.codeValue}>{record.iecc_year || '—'}</span>
                                </div>
                                <div className={styles.codeItem}>
                                  <span className={styles.codeLabel}>IEBC</span>
                                  <span className={styles.codeValue}>{record.iebc_year || '—'}</span>
                                </div>
                                <div className={styles.codeItem}>
                                  <span className={styles.codeLabel}>ASCE 7</span>
                                  <span className={styles.codeValue}>{record.asce_7_year || '—'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Structural Data */}
                            <div className={styles.detailSection}>
                              <h4 className={styles.detailSectionTitle}>Structural Data</h4>
                              <div className={styles.detailList}>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>Wind Speed</span>
                                  <span className={styles.detailValue}>{record.wind_speed_mph ? `${record.wind_speed_mph} mph` : 'Not specified'}</span>
                                </div>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>Snow Load</span>
                                  <span className={styles.detailValue}>{record.snow_load_psf ? `${record.snow_load_psf} psf` : 'Not specified'}</span>
                                </div>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>Ground Snow Load</span>
                                  <span className={styles.detailValue}>{record.ground_snow_load_psf ? `${record.ground_snow_load_psf} psf` : 'Not specified'}</span>
                                </div>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>Frost Depth</span>
                                  <span className={styles.detailValue}>{record.frost_depth_inches ? `${record.frost_depth_inches} inches` : 'Not specified'}</span>
                                </div>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>Seismic Category</span>
                                  <span className={styles.detailValue}>{record.seismic_design_category || 'Not specified'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Solar Requirements */}
                            <div className={styles.detailSection}>
                              <h4 className={styles.detailSectionTitle}>Solar Requirements</h4>
                              <div className={styles.detailList}>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>Rapid Shutdown</span>
                                  <span className={styles.detailValue}>{record.rapid_shutdown_required ? 'Required' : 'Not required'}</span>
                                </div>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>Solar Ready</span>
                                  <span className={styles.detailValue}>{record.solar_ready_required ? 'Required' : 'Not required'}</span>
                                </div>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>ESS Requirements</span>
                                  <span className={styles.detailValue}>{record.ess_requirements || 'Not specified'}</span>
                                </div>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>Fire Setback</span>
                                  <span className={styles.detailValue}>{record.fire_setback_rules || 'Not specified'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Source & Metadata */}
                            <div className={styles.detailSection}>
                              <h4 className={styles.detailSectionTitle}>Source & Metadata</h4>
                              <div className={styles.detailList}>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>Lookup Method</span>
                                  <span className={styles.detailValue}>{record.lookup_method || 'N/A'}</span>
                                </div>
                                <div className={styles.detailRow}>
                                  <span className={styles.detailLabel}>Confidence</span>
                                  <span className={styles.detailValue}>{record.confidence || 'N/A'}</span>
                                </div>
                                {record.source_url && (
                                  <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Source</span>
                                    <a
                                      href={record.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={styles.sourceLink}
                                    >
                                      View Source
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Full Width Sections */}
                          {record.notes && (
                            <div className={styles.detailSection}>
                              <h4 className={styles.detailSectionTitle}>Notes</h4>
                              <p className={styles.textContent}>{record.notes}</p>
                            </div>
                          )}

                          {record.local_amendments && (
                            <div className={styles.detailSection}>
                              <h4 className={styles.detailSectionTitle}>Local Amendments</h4>
                              <p className={styles.textContent}>{record.local_amendments}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AHJInfoPanel;
