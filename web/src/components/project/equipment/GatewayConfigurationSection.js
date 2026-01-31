import React, { useState } from 'react';
import { MAIN_CIRCUIT_BREAKER_RATINGS } from '../../../utils/constants';
import { Alert, TableDropdown, FormFieldRow, TableRowButton } from '../../ui';
import formStyles from '../../../styles/FormSections.module.css';

/**
 * Gateway Configuration Section
 * Tesla Gateway (Backup Gateway 2 or Gateway 3) specific configuration
 */
const GatewayConfigurationSection = ({ formData, onChange }) => {
  const [editPVBreaker, setEditPVBreaker] = useState(false);
  const [editESSBreaker, setEditESSBreaker] = useState(false);
  const [editTieInBreaker, setEditTieInBreaker] = useState(false);
  const gatewayIsNew = formData.gatewayConfigIsNew !== undefined ? formData.gatewayConfigIsNew : true;
  const mainBreaker = formData.gatewayConfigMainBreaker || '';
  const backupPanel = formData.gatewayConfigBackupPanel || '';
  const activatePCS = formData.gatewayConfigActivatePCS || false;
  const pvBreaker = formData.gatewayConfigPVBreaker || '';
  const essBreaker = formData.gatewayConfigESSBreaker || '';
  const tieInBreaker = formData.gatewayConfigTieInBreaker || '';

  // Tie-in breaker options (15-250 amps in increments of 5)
  const tieInBreakerOptions = Array.from({ length: 48 }, (_, i) => {
    const value = 15 + i * 5;
    return { label: `${value} Amps`, value: value.toString() };
  });

  return (
    <div className={formStyles.sectionColumn}>
      {/* Main Breaker */}
      <TableDropdown
        label="Main Breaker*"
        value={mainBreaker}
        onChange={(value) => onChange('gatewayConfigMainBreaker', value)}
        options={MAIN_CIRCUIT_BREAKER_RATINGS}
        placeholder="Select breaker..."
      />

      {/* Backup Panel */}
      <TableDropdown
        label="Backup Panel*"
        value={backupPanel}
        onChange={(value) => onChange('gatewayConfigBackupPanel', value)}
        options={MAIN_CIRCUIT_BREAKER_RATINGS}
        placeholder="Select breaker..."
      />

      {/* Activate PCS Toggle */}
      <FormFieldRow label="Activate PCS (Power Control System)">
        <TableRowButton
          label={activatePCS ? 'PCS Activated' : 'Activate PCS'}
          variant="outline"
          active={activatePCS}
          onClick={() => onChange('gatewayConfigActivatePCS', !activatePCS)}
        />
      </FormFieldRow>

      {/* PV Breaker Rating Override */}
      <FormFieldRow
        label="PV Breaker Rating (Override)"
        showEditToggle={true}
        isEditing={editPVBreaker}
        onEditToggle={(editing) => {
          if (!editing) {
            onChange('gatewayConfigPVBreaker', '');
          }
          setEditPVBreaker(editing);
        }}
      >
        {!editPVBreaker ? (
          <Alert variant="info">
            A PV Breaker will be added in the Gateway PV input and will be rated to protect the total PV max continuous output current.
          </Alert>
        ) : (
          <TableDropdown
            label=""
            value={pvBreaker}
            onChange={(value) => onChange('gatewayConfigPVBreaker', value)}
            options={MAIN_CIRCUIT_BREAKER_RATINGS.filter(opt => opt.value !== 'MLO')}
            placeholder="Select breaker..."
          />
        )}
      </FormFieldRow>

      {/* ESS Breaker Rating Override */}
      <FormFieldRow
        label="ESS Breaker Rating (Override)"
        showEditToggle={true}
        isEditing={editESSBreaker}
        onEditToggle={(editing) => {
          if (!editing) {
            onChange('gatewayConfigESSBreaker', '');
          }
          setEditESSBreaker(editing);
        }}
      >
        {!editESSBreaker ? (
          <Alert variant="info">
            An ESS Breaker will be added in the Gateway battery input and will be rated to protect the total Battery max continuous output current.
          </Alert>
        ) : (
          <TableDropdown
            label=""
            value={essBreaker}
            onChange={(value) => onChange('gatewayConfigESSBreaker', value)}
            options={MAIN_CIRCUIT_BREAKER_RATINGS.filter(opt => opt.value !== 'MLO')}
            placeholder="Select breaker..."
          />
        )}
      </FormFieldRow>

      {/* Tie-in Breaker Rating Override */}
      <FormFieldRow
        label="Tie-in Breaker Rating (Override)"
        showEditToggle={true}
        isEditing={editTieInBreaker}
        onEditToggle={(editing) => {
          if (!editing) {
            onChange('gatewayConfigTieInBreaker', '');
          }
          setEditTieInBreaker(editing);
        }}
      >
        {!editTieInBreaker ? (
          <Alert variant="info">
            A Tie-in Breaker will be added in the Main Panel (A) and will be rated to protect the total Gateway max continuous output current landed in this Gateway.
            <br /><br />
            You can change the Tie-in Location in the Electrical Section.
          </Alert>
        ) : (
          <TableDropdown
            label=""
            value={tieInBreaker}
            onChange={(value) => onChange('gatewayConfigTieInBreaker', value)}
            options={tieInBreakerOptions}
            placeholder="Select breaker..."
          />
        )}
      </FormFieldRow>
    </div>
  );
};

export default React.memo(GatewayConfigurationSection);
