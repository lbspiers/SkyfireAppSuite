import React from 'react';
import { EquipmentRow, FormFieldRow, TableRowButton, Alert } from '../../ui';
import { IQ_COMBINER_6C_METER_COLLAR_LOCATIONS } from '../../../utils/constants';
import styles from './BackupLoadSubPanelSection.module.css';

/**
 * IQ Meter Collar Section
 * Shown only when:
 * - Enphase IQ Combiner 6C is selected
 * - Backup option is "Whole Home" OR "Partial Home"
 */
const IQMeterCollarSection = ({ formData, onChange }) => {
  const meterCollarLocation = formData.meter_collar_location || '';
  const backupOption = formData.backup_option || '';

  // Partial Home ONLY supports Stand Alone Meter
  const isPartialHome = backupOption === 'Partial Home';

  const handleLocationChange = (value) => {
    onChange('meter_collar_location', value);
  };

  return (
    <div className={styles.sectionWrapper}>
      <EquipmentRow
        title="IQ Meter Collar"
        subtitle={meterCollarLocation ? IQ_COMBINER_6C_METER_COLLAR_LOCATIONS.find(loc => loc.value === meterCollarLocation)?.label || '' : ''}
        showNewExistingToggle={false}
        onDelete={null}
      >
        <FormFieldRow label="Installation Location">
          <TableRowButton
            label="Behind Utility Meter"
            variant="outline"
            active={meterCollarLocation === 'behind_utility_meter'}
            onClick={() => handleLocationChange('behind_utility_meter')}
            disabled={isPartialHome}
          />
          <TableRowButton
            label="Stand Alone Meter"
            variant="outline"
            active={meterCollarLocation === 'discrete_meter_pan'}
            onClick={() => handleLocationChange('discrete_meter_pan')}
          />
        </FormFieldRow>

        {/* Alert for Behind Utility Meter */}
        {meterCollarLocation === 'behind_utility_meter' && !isPartialHome && (
          <Alert variant="warning" collapsible={false}>
            <strong>Utility Authorization Required:</strong> Installing the IQ Meter Collar behind the utility meter requires approval from the utility company. Verify authorization before proceeding.
          </Alert>
        )}
      </EquipmentRow>
    </div>
  );
};

export default React.memo(IQMeterCollarSection);
