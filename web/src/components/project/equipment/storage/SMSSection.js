import React, { useState, useEffect } from 'react';
import Toggle from '../../../common/Toggle';
import { Tooltip } from '../../../ui';
import styles from '../../../../styles/ProjectAdd.module.css';
import componentStyles from './SMSSection.module.css';
import logger from '../../../../services/devLogger';
import {
  getSMSManufacturers,
  getSMSModels,
} from '../../../../services/equipmentService';
import flameIcon from '../../../../assets/images/Skyfire Flame Icon.png';

/**
 * Storage Management System (SMS) Section
 * Handles SMS equipment selection with optional breaker overrides
 */
const SMSSection = ({ formData, onChange }) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModelData, setSelectedModelData] = useState(null);

  // Breaker override states
  const [editPVBreaker, setEditPVBreaker] = useState(false);
  const [editESSBreaker, setEditESSBreaker] = useState(false);
  const [editTieInBreaker, setEditTieInBreaker] = useState(false);

  // Breaker options
  const breakerOptions = ['15', '20', '25', '30', '35', '40', '45', '50', '60', '70', '80', '90', '100', '110', '125', '150', '175', '200', '225', '250'];

  // Load manufacturers on mount
  useEffect(() => {
    loadManufacturers();
  }, []);

  // Load models when manufacturer changes
  useEffect(() => {
    if (formData.sms_make) {
      loadModels(formData.sms_make);
    } else {
      setModels([]);
      setSelectedModelData(null);
    }
  }, [formData.sms_make]);

  // Set default breaker rating to MLO on mount
  useEffect(() => {
    if (!formData.sms_breaker_rating) {
      onChange('sms_breaker_rating', 'MLO');
    }
  }, []);

  const loadManufacturers = async () => {
    setLoadingMakes(true);
    try {
      const response = await getSMSManufacturers();
      // Add "No SMS" option
      setManufacturers(['No SMS', ...(response.data || [])]);
    } catch (error) {
      logger.error('Equipment', 'Failed to load SMS manufacturers:', error);
    } finally {
      setLoadingMakes(false);
    }
  };

  const loadModels = async (manufacturer) => {
    if (manufacturer === 'No SMS') {
      setModels([]);
      setSelectedModelData(null);
      return;
    }

    setLoadingModels(true);
    try {
      const response = await getSMSModels(manufacturer);
      const modelsData = response.data || [];
      setModels(modelsData);

      // If current model is selected, find its data
      if (formData.sms_model) {
        const modelData = modelsData.find(m => m.model_number === formData.sms_model);
        if (modelData) {
          setSelectedModelData(modelData);
          // Store model ID for future reference
          if (modelData.id) {
            onChange('sms_model_id', modelData.id);
          }
        }
      }
    } catch (error) {
      logger.error('Equipment', 'Failed to load SMS models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleToggle = (isNew) => {
    onChange('sms_existing', !isNew);
  };

  const handleManufacturerChange = (e) => {
    const value = e.target.value;
    onChange('sms_make', value);
    onChange('sms_model', ''); // Clear model when manufacturer changes
    setSelectedModelData(null);

    // Clear breaker rating if "No SMS" is selected
    if (value === 'No SMS') {
      onChange('sms_breaker_rating', '');
    }
  };

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    onChange('sms_model', newModel);

    // Find model data
    const modelData = models.find(m => m.model_number === newModel);
    if (modelData) {
      setSelectedModelData(modelData);
      // Store model ID for future reference
      if (modelData.id) {
        onChange('sms_model_id', modelData.id);
      }
    }
  };

  const handleClearBreaker = (field, setEditState) => {
    onChange(field, '');
    setEditState(false);
  };

  const isNoSMS = formData.sms_make === 'No SMS';

  return (
    <>
      <Toggle
        isNew={formData.sms_existing !== true}
        onToggle={handleToggle}
      />

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Manufacturer</label>
          <select
            value={formData.sms_make || ''}
            onChange={handleManufacturerChange}
            className={`${styles.select} ${formData.sms_make ? componentStyles.selectFilled : componentStyles.selectEmpty}`}
            disabled={loadingMakes}
          >
            <option value="">{loadingMakes ? 'Loading...' : 'Select manufacturer...'}</option>
            {manufacturers.map((manufacturer) => (
              <option key={manufacturer} value={manufacturer}>
                {manufacturer}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Model</label>
          <select
            value={formData.sms_model || ''}
            onChange={handleModelChange}
            className={`${styles.select} ${formData.sms_model ? componentStyles.selectFilled : componentStyles.selectEmpty}`}
            disabled={!formData.sms_make || isNoSMS || loadingModels}
          >
            <option value="">
              {loadingModels ? 'Loading...' : formData.sms_make ? (isNoSMS ? 'N/A' : 'Select model') : 'Select manufacturer'}
            </option>
            {models.map((model) => (
              <option key={model.model_number} value={model.model_number}>
                {model.model_number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RSD Toggle */}
      {!isNoSMS && (
        <div className={styles.formGroup}>
          <label className={styles.label}>RSD (Rapid Shutdown)</label>
          <div className={componentStyles.rsdButtonGroup}>
            <button
              type="button"
              className={`${styles.inactiveButton} ${formData.sms_rsd_enabled ? styles.activeButton : ''} ${componentStyles.rsdButton}`}
              onClick={() => onChange('sms_rsd_enabled', true)}
            >
              Yes
            </button>
            <button
              type="button"
              className={`${styles.inactiveButton} ${formData.sms_rsd_enabled === false ? styles.activeButton : ''} ${componentStyles.rsdButton}`}
              onClick={() => onChange('sms_rsd_enabled', false)}
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* Main Breaker - defaults to MLO */}
      {!isNoSMS && (
        <div className={styles.formGroup}>
          <label className={styles.label}>Main Breaker</label>
          <select
            value={formData.sms_breaker_rating || 'MLO'}
            onChange={(e) => onChange('sms_breaker_rating', e.target.value)}
            className={`${styles.select} ${formData.sms_breaker_rating ? componentStyles.selectFilled : componentStyles.selectEmpty}`}
          >
            <option value="MLO">MLO</option>
            {breakerOptions.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* PV Breaker Override */}
      {!isNoSMS && (
        <div className={styles.formGroup}>
          <div className={componentStyles.breakerHeader}>
            <label className={styles.label}>PV Breaker</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-tight)' }}>
              <button
                type="button"
                onClick={() => editPVBreaker ? handleClearBreaker('sms_pv_breaker_rating_override', setEditPVBreaker) : setEditPVBreaker(true)}
                className={editPVBreaker ? componentStyles.clearButton : componentStyles.editButton}
              >
                {editPVBreaker ? 'Clear' : 'Custom'}
              </button>
              {!editPVBreaker && (
                <div style={{ display: 'inline-flex' }}>
                  <Tooltip
                    content={
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                        A minimum PV Breaker will be added in the SMS PV input and will be rated to protect the total PV max continuous output current.
                      </div>
                    }
                    position="bottom"
                    className="alertTooltip"
                  >
                    <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'help' }} />
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
          {editPVBreaker && (
            <select
              value={formData.sms_pv_breaker_rating_override || ''}
              onChange={(e) => onChange('sms_pv_breaker_rating_override', e.target.value)}
              className={`${styles.select} ${formData.sms_pv_breaker_rating_override ? componentStyles.selectFilled : componentStyles.selectEmpty}`}
            >
              <option value="">Select rating...</option>
              {breakerOptions.map((rating) => (
                <option key={rating} value={rating}>
                  {rating}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* ESS Breaker Override */}
      {!isNoSMS && (
        <div className={styles.formGroup}>
          <div className={componentStyles.breakerHeader}>
            <label className={styles.label}>ESS Breaker</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-tight)' }}>
              <button
                type="button"
                onClick={() => editESSBreaker ? handleClearBreaker('sms_ess_breaker_rating_override', setEditESSBreaker) : setEditESSBreaker(true)}
                className={editESSBreaker ? componentStyles.clearButton : componentStyles.editButton}
              >
                {editESSBreaker ? 'Clear' : 'Custom'}
              </button>
              {!editESSBreaker && (
                <div style={{ display: 'inline-flex' }}>
                  <Tooltip
                    content={
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                        A minimum Battery Breaker will be added in the SMS Battery input and will be rated to protect the total Battery max continuous output current.
                      </div>
                    }
                    position="bottom"
                    className="alertTooltip"
                  >
                    <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'help' }} />
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
          {editESSBreaker && (
            <select
              value={formData.sms_ess_breaker_rating_override || ''}
              onChange={(e) => onChange('sms_ess_breaker_rating_override', e.target.value)}
              className={`${styles.select} ${formData.sms_ess_breaker_rating_override ? componentStyles.selectFilled : componentStyles.selectEmpty}`}
            >
              <option value="">Select rating...</option>
              {breakerOptions.map((rating) => (
                <option key={rating} value={rating}>
                  {rating}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Tie-in Breaker Override */}
      {!isNoSMS && (
        <div className={styles.formGroup}>
          <div className={componentStyles.breakerHeader}>
            <label className={styles.label}>Tie-in Breaker</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-tight)' }}>
              <button
                type="button"
                onClick={() => editTieInBreaker ? handleClearBreaker('sms_tie_in_breaker_rating_override', setEditTieInBreaker) : setEditTieInBreaker(true)}
                className={editTieInBreaker ? componentStyles.clearButton : componentStyles.editButton}
              >
                {editTieInBreaker ? 'Clear' : 'Custom'}
              </button>
              {!editTieInBreaker && (
                <div style={{ display: 'inline-flex' }}>
                  <Tooltip
                    content={
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                        A minimum SMS Tie-in Breaker will be added in Main Panel (A). The breaker will auto size based on backup option selected.
                      </div>
                    }
                    position="bottom"
                    className="alertTooltip"
                  >
                    <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'help' }} />
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
          {editTieInBreaker && (
            <select
              value={formData.sms_tie_in_breaker_rating_override || ''}
              onChange={(e) => onChange('sms_tie_in_breaker_rating_override', e.target.value)}
              className={`${styles.select} ${formData.sms_tie_in_breaker_rating_override ? componentStyles.selectFilled : componentStyles.selectEmpty}`}
            >
              <option value="">Select rating...</option>
              {breakerOptions.map((rating) => (
                <option key={rating} value={rating}>
                  {rating}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </>
  );
};

export default SMSSection;
