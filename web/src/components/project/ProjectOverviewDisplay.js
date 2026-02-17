import React, { useMemo } from 'react';
import styles from './ProjectOverviewDisplay.module.css';

/**
 * ProjectOverviewDisplay - Clean read-only display of all project fields
 * Organized into sections: Customer/Site, System 1-4, Electrical, Structural
 * Shows field name : value pairs in a tight table format
 *
 * @param {object} projectData - Full project data object
 * @param {object} systemDetails - System details from useSystemDetails hook
 * @param {function} onUtilityClick - Optional callback when utility field is clicked (if empty)
 * @param {function} onHouseSqFtClick - Optional callback when house sq ft field is clicked (if empty)
 */
const ProjectOverviewDisplay = ({ projectData, systemDetails, onUtilityClick, onHouseSqFtClick }) => {
  // Organize data into sections
  const sections = useMemo(() => {
    const allSections = [];

    if (!projectData && !systemDetails) return allSections;

    const site = projectData?.site || {};
    const details = projectData?.details || {};

    // Helper to add field if value exists
    const addField = (sectionFields, label, value, specialClass = null) => {
      if (value !== null && value !== undefined && value !== '' && value !== '-' && value !== false) {
        sectionFields.push({ label, value: String(value), specialClass });
      }
    };

    // Helper to check if field exists (for inverter type display)
    const fieldExists = (value) => {
      return value !== null && value !== undefined && value !== '' && value !== '-' && value !== false;
    };

    // ===== CUSTOMER & SITE SECTION =====
    const customerSiteFields = [];
    if (details.customer_first_name) addField(customerSiteFields, 'First Name', details.customer_first_name);
    if (details.customer_last_name) addField(customerSiteFields, 'Last Name', details.customer_last_name);
    if (details.customer_email) addField(customerSiteFields, 'Email', details.customer_email);
    if (details.customer_phone) addField(customerSiteFields, 'Phone', details.customer_phone);
    if (site.address) addField(customerSiteFields, 'Address', site.address);
    if (site.city) addField(customerSiteFields, 'City', site.city);
    if (site.state) addField(customerSiteFields, 'State', site.state);
    if (site.zip_code) addField(customerSiteFields, 'ZIP Code', site.zip_code);
    if (site.ahj) addField(customerSiteFields, 'Jurisdiction', site.ahj);
    // Always show utility field (even if empty) - mark as special if empty
    if (site.utility) {
      addField(customerSiteFields, 'Utility', site.utility);
    } else {
      addField(customerSiteFields, 'Utility', 'Not Selected', 'utilityMissing');
    }
    if (site.apn) addField(customerSiteFields, 'APN', site.apn);
    // Always show House Sq Ft field (even if empty) - mark as special if empty
    // House Sq Ft is stored in systemDetails, not site
    if (systemDetails?.house_sqft) {
      addField(customerSiteFields, 'House Sq Ft', systemDetails.house_sqft);
    } else {
      addField(customerSiteFields, 'House Sq Ft', 'Please Add', 'houseSqFtMissing');
    }

    if (customerSiteFields.length > 0) {
      allSections.push({ title: 'Customer & Site', fields: customerSiteFields });
    }

    // ===== SYSTEM 1, 2, 3, 4 SECTIONS =====
    if (systemDetails) {
      [1, 2, 3, 4].forEach(sysNum => {
        const systemFields = [];
        const prefix = `sys${sysNum}_`;

        // Solar Panels
        if (systemDetails[`${prefix}solar_panel_make`]) {
          addField(systemFields, 'Solar Panel Make', systemDetails[`${prefix}solar_panel_make`]);
          addField(systemFields, 'Solar Panel Model', systemDetails[`${prefix}solar_panel_model`]);
          addField(systemFields, 'Solar Panel Qty', systemDetails[`${prefix}solar_panel_qty`]);
          addField(systemFields, 'Solar Panel Wattage', systemDetails[`${prefix}solar_panel_wattage`]);
          const isNew = !systemDetails[`${prefix}solar_panel_existing`];
          addField(systemFields, 'Solar Panel Status', isNew ? 'New' : 'Existing');
        }

        // Solar Panel Type 2 (if exists)
        if (systemDetails[`${prefix}show_solar_panel_2`] && systemDetails[`${prefix}solar_panel_type2_manufacturer`]) {
          addField(systemFields, 'Solar Panel 2 Make', systemDetails[`${prefix}solar_panel_type2_manufacturer`]);
          addField(systemFields, 'Solar Panel 2 Model', systemDetails[`${prefix}solar_panel_type2_model`]);
          addField(systemFields, 'Solar Panel 2 Qty', systemDetails[`${prefix}solar_panel_type2_quantity`]);
          addField(systemFields, 'Solar Panel 2 Wattage', systemDetails[`${prefix}solar_panel_type2_wattage`]);
          const isNew = systemDetails[`${prefix}solar_panel_type2_is_new`];
          addField(systemFields, 'Solar Panel 2 Status', isNew ? 'New' : 'Existing');
        }

        // Inverter/Microinverter
        if (systemDetails[`${prefix}micro_inverter_make`]) {
          const inverterType = systemDetails[`${prefix}inverter_type`] || systemDetails[`${prefix}selectedsystem`] || 'Inverter';
          const typeLabel = inverterType === 'microinverter' ? 'Microinverter' : 'Inverter';
          addField(systemFields, `${typeLabel} Make`, systemDetails[`${prefix}micro_inverter_make`]);
          addField(systemFields, `${typeLabel} Model`, systemDetails[`${prefix}micro_inverter_model`]);
          addField(systemFields, `${typeLabel} Qty`, systemDetails[`${prefix}micro_inverter_qty`]);
          const isNew = !systemDetails[`${prefix}micro_inverter_existing`];
          addField(systemFields, `${typeLabel} Status`, isNew ? 'New' : 'Existing');
          if (fieldExists(systemDetails[`${prefix}inv_max_continuous_output`])) {
            addField(systemFields, `${typeLabel} Max Output`, `${systemDetails[`${prefix}inv_max_continuous_output`]} A`);
          }
        }

        // Optimizers
        if (systemDetails[`${prefix}optimizer_make`]) {
          addField(systemFields, 'Optimizer Make', systemDetails[`${prefix}optimizer_make`]);
          addField(systemFields, 'Optimizer Model', systemDetails[`${prefix}optimizer_model`]);
          addField(systemFields, 'Optimizer Qty', systemDetails[`${prefix}optimizer_qty`]);
          const isNew = !systemDetails[`${prefix}optimizer_existing`];
          addField(systemFields, 'Optimizer Status', isNew ? 'New' : 'Existing');
        }

        // Battery
        if (systemDetails[`${prefix}battery_1_make`]) {
          addField(systemFields, 'Battery Make', systemDetails[`${prefix}battery_1_make`]);
          addField(systemFields, 'Battery Model', systemDetails[`${prefix}battery_1_model`]);
          addField(systemFields, 'Battery Qty', systemDetails[`${prefix}battery_1_qty`]);
          const isNew = !systemDetails[`${prefix}battery_1_existing`];
          addField(systemFields, 'Battery Status', isNew ? 'New' : 'Existing');
          if (fieldExists(systemDetails[`${prefix}battery_1_max_continuous_output`])) {
            addField(systemFields, 'Battery Max Output', `${systemDetails[`${prefix}battery_1_max_continuous_output`]} A`);
          }
        }

        // SMS (Storage Management System)
        if (systemDetails[`${prefix}sms_make`]) {
          addField(systemFields, 'SMS Make', systemDetails[`${prefix}sms_make`]);
          addField(systemFields, 'SMS Model', systemDetails[`${prefix}sms_model`]);
          const isNew = !systemDetails[`${prefix}sms_existing`];
          addField(systemFields, 'SMS Status', isNew ? 'New' : 'Existing');
        }

        // Backup Load Sub Panel
        const backupMake = sysNum === 1
          ? systemDetails.bls1_backup_load_sub_panel_make
          : systemDetails[`${prefix}backuploadsubpanel_make`];
        if (backupMake) {
          const backupModel = sysNum === 1
            ? systemDetails.bls1_backup_load_sub_panel_model
            : systemDetails[`${prefix}backuploadsubpanel_model`];
          const backupBus = sysNum === 1
            ? systemDetails.bls1_backuploader_bus_bar_rating
            : systemDetails[`${prefix}backuploadsubpanel_bus_rating`];
          const backupExisting = sysNum === 1
            ? systemDetails.bls1_backuploader_existing
            : systemDetails[`${prefix}backuploadsubpanel_existing`];

          addField(systemFields, 'Backup Panel Make', backupMake);
          addField(systemFields, 'Backup Panel Model', backupModel);
          if (fieldExists(backupBus)) {
            addField(systemFields, 'Backup Panel Bus Rating', `${backupBus} A`);
          }
          const isNew = !backupExisting;
          addField(systemFields, 'Backup Panel Status', isNew ? 'New' : 'Existing');

          const backupOption = systemDetails[`${prefix}backup_option`];
          if (backupOption) {
            addField(systemFields, 'Backup Option', backupOption);
          }
        }

        // String Combiner
        if (systemDetails[`${prefix}string_combiner_make`]) {
          addField(systemFields, 'Combiner Make', systemDetails[`${prefix}string_combiner_make`]);
          addField(systemFields, 'Combiner Model', systemDetails[`${prefix}string_combiner_model`]);
          if (fieldExists(systemDetails[`${prefix}string_combiner_bus_rating`])) {
            addField(systemFields, 'Combiner Bus Rating', `${systemDetails[`${prefix}string_combiner_bus_rating`]} A`);
          }
          if (fieldExists(systemDetails[`${prefix}string_combiner_main_breaker_rating`])) {
            addField(systemFields, 'Combiner Main Breaker', `${systemDetails[`${prefix}string_combiner_main_breaker_rating`]} A`);
          }
          const isNew = !systemDetails[`${prefix}string_combiner_existing`];
          addField(systemFields, 'Combiner Status', isNew ? 'New' : 'Existing');
        }

        // EV Charger
        if (systemDetails[`${prefix}ev_charger_make`]) {
          addField(systemFields, 'EV Charger Make', systemDetails[`${prefix}ev_charger_make`]);
          addField(systemFields, 'EV Charger Model', systemDetails[`${prefix}ev_charger_model`]);
          const isNew = !systemDetails[`${prefix}ev_charger_existing`];
          addField(systemFields, 'EV Charger Status', isNew ? 'New' : 'Existing');
        }

        // Battery Only Mode
        const batteryOnly = sysNum === 1 ? systemDetails.batteryonly : systemDetails[`${prefix}batteryonly`];
        if (batteryOnly) {
          addField(systemFields, 'Battery Only Mode', 'Yes');
        }

        if (systemFields.length > 0) {
          allSections.push({ title: `System ${sysNum}`, fields: systemFields });
        }
      });
    }

    // ===== ELECTRICAL SETUP SECTION =====
    if (systemDetails) {
      const electricalFields = [];

      // Service Entrance
      if (systemDetails.ele_ses_type) addField(electricalFields, 'Service Type', systemDetails.ele_ses_type);
      if (systemDetails.ele_bus_bar_rating) addField(electricalFields, 'Bus Bar Rating', `${systemDetails.ele_bus_bar_rating} A`);
      if (systemDetails.ele_main_circuit_breaker_rating) addField(electricalFields, 'Main Breaker Rating', `${systemDetails.ele_main_circuit_breaker_rating} A`);
      if (systemDetails.ele_main_circuit_breakers_qty) addField(electricalFields, 'Main Breakers Qty', systemDetails.ele_main_circuit_breakers_qty);
      if (systemDetails.ele_feeder_location_on_bus_bar) addField(electricalFields, 'Feeder Location', systemDetails.ele_feeder_location_on_bus_bar);

      // Main Panel A
      if (fieldExists(systemDetails.mpa_bus_bar_existing)) {
        addField(electricalFields, 'MPA Bus Bar', systemDetails.mpa_bus_bar_existing ? 'Existing' : 'New/MPU');
      }
      if (fieldExists(systemDetails.mpa_main_circuit_breaker_existing)) {
        addField(electricalFields, 'MPA Main Breaker', systemDetails.mpa_main_circuit_breaker_existing ? 'Existing' : 'New');
      }
      if (systemDetails.el_mpa_derated) {
        addField(electricalFields, 'MPA Derated', 'Yes');
      }

      // Sub-Panels
      if (systemDetails.ele_subpanel_b_bus_rating) {
        addField(electricalFields, 'Sub-Panel B Bus Rating', `${systemDetails.ele_subpanel_b_bus_rating} A`);
        if (systemDetails.ele_subpanel_b_main_breaker) {
          addField(electricalFields, 'Sub-Panel B Main Breaker', `${systemDetails.ele_subpanel_b_main_breaker} A`);
        }
        if (systemDetails.ele_subpanel_b_upstream_breaker) {
          addField(electricalFields, 'Sub-Panel B Upstream Breaker', `${systemDetails.ele_subpanel_b_upstream_breaker} A`);
        }
      }

      if (systemDetails.ele_subpanel_c_bus_rating) {
        addField(electricalFields, 'Sub-Panel C Bus Rating', `${systemDetails.ele_subpanel_c_bus_rating} A`);
        if (systemDetails.ele_subpanel_c_main_breaker) {
          addField(electricalFields, 'Sub-Panel C Main Breaker', `${systemDetails.ele_subpanel_c_main_breaker} A`);
        }
        if (systemDetails.ele_subpanel_c_upstream_breaker) {
          addField(electricalFields, 'Sub-Panel C Upstream Breaker', `${systemDetails.ele_subpanel_c_upstream_breaker} A`);
        }
      }

      if (systemDetails.ele_subpanel_d_bus_rating) {
        addField(electricalFields, 'Sub-Panel D Bus Rating', `${systemDetails.ele_subpanel_d_bus_rating} A`);
        if (systemDetails.ele_subpanel_d_main_breaker) {
          addField(electricalFields, 'Sub-Panel D Main Breaker', `${systemDetails.ele_subpanel_d_main_breaker} A`);
        }
        if (systemDetails.ele_subpanel_d_upstream_breaker) {
          addField(electricalFields, 'Sub-Panel D Upstream Breaker', `${systemDetails.ele_subpanel_d_upstream_breaker} A`);
        }
      }

      // Multi-System Combine
      if (systemDetails.ele_combine_systems) {
        addField(electricalFields, 'Combined Systems', systemDetails.ele_combine_systems);
      }
      if (systemDetails.ele_combine_positions) {
        try {
          const positions = JSON.parse(systemDetails.ele_combine_positions);
          if (positions.method) {
            addField(electricalFields, 'Combine Method', positions.method);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Point of Interconnection
      if (systemDetails.ele_method_of_interconnection) {
        addField(electricalFields, 'Interconnection Method', systemDetails.ele_method_of_interconnection);
      }

      if (electricalFields.length > 0) {
        allSections.push({ title: 'Electrical Setup', fields: electricalFields });
      }
    }

    // ===== STRUCTURAL SECTION =====
    if (systemDetails) {
      const structuralFields = [];

      if (systemDetails.st_manufactured_home) {
        addField(structuralFields, 'Manufactured Home', 'Yes');
      }

      // Roofing Types
      if (systemDetails.st_roof_a_framing_type) {
        addField(structuralFields, 'Roof A Type', systemDetails.st_roof_a_framing_type);
        if (systemDetails.st_roof_a_area_sqft) {
          addField(structuralFields, 'Roof A Area', `${systemDetails.st_roof_a_area_sqft} sqft`);
        }
      }

      if (systemDetails.st_roof_b_framing_type) {
        addField(structuralFields, 'Roof B Type', systemDetails.st_roof_b_framing_type);
        if (systemDetails.st_roof_b_area_sqft) {
          addField(structuralFields, 'Roof B Area', `${systemDetails.st_roof_b_area_sqft} sqft`);
        }
      }

      // Mounting Hardware
      if (systemDetails.st_rail_manufacturer) {
        addField(structuralFields, 'Rail Manufacturer', systemDetails.st_rail_manufacturer);
        if (systemDetails.st_rail_model) {
          addField(structuralFields, 'Rail Model', systemDetails.st_rail_model);
        }
        if (systemDetails.st_rail_length) {
          addField(structuralFields, 'Rail Length', systemDetails.st_rail_length);
        }
      }

      // Mounting Planes (1-10)
      for (let mp = 1; mp <= 10; mp++) {
        const prefix = `mp${mp}_`;
        const panelCount = systemDetails[`panel_count_${prefix.replace('_', '')}`]; // panel_count_mp1, panel_count_mp2, etc.

        // Only show mounting plane if it has both azimuth AND pitch
        if (systemDetails[`${prefix}azimuth`] && systemDetails[`${prefix}pitch`]) {
          if (systemDetails[`${prefix}roof_type`]) {
            addField(structuralFields, `MP${mp} Roof Type`, systemDetails[`${prefix}roof_type`]);
          }
          if (panelCount) {
            addField(structuralFields, `MP${mp} Panel Count`, panelCount);
          }
          if (systemDetails[`${prefix}pitch`]) {
            addField(structuralFields, `MP${mp} Pitch`, `${systemDetails[`${prefix}pitch`]}°`);
          }
          if (systemDetails[`${prefix}azimuth`]) {
            addField(structuralFields, `MP${mp} Azimuth`, `${systemDetails[`${prefix}azimuth`]}°`);
          }
          if (systemDetails[`${prefix}stories`]) {
            addField(structuralFields, `MP${mp} Stories`, systemDetails[`${prefix}stories`]);
          }
          if (systemDetails[`${prefix}tilt_mount_pitch`]) {
            addField(structuralFields, `MP${mp} Tilt Mount Pitch`, `${systemDetails[`${prefix}tilt_mount_pitch`]}°`);
          }
          if (systemDetails[`${prefix}tilt_mount_azimuth`]) {
            addField(structuralFields, `MP${mp} Tilt Mount Azimuth`, `${systemDetails[`${prefix}tilt_mount_azimuth`]}°`);
          }

          // st_mp mode (last field - add orange divider)
          const mode = systemDetails[`st_${prefix}mode`];
          if (mode) {
            addField(structuralFields, `MP${mp} Mode`, mode, 'mountingPlaneDivider');
          }
        }
      }

      if (structuralFields.length > 0) {
        allSections.push({ title: 'Structural', fields: structuralFields });
      }
    }

    return allSections;
  }, [projectData, systemDetails]);

  if (sections.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📋</div>
        <div className={styles.emptyTitle}>No Project Data</div>
        <div className={styles.emptyText}>
          No fields have been filled in yet
        </div>
      </div>
    );
  }

  // Debug: Log when component renders

  return (
    <div className={styles.overviewDisplay}>
      {sections.map((section, sectionIndex) => {
        // Debug log for Customer & Site section
        if (section.title === 'Customer & Site') {
        }

        return (
          <div key={sectionIndex}>
            {/* Section Header */}
            <div className={styles.sectionHeader}>{section.title}</div>

            {/* Section Fields */}
            {section.fields.map((field, fieldIndex) => {
              const isUtilityMissing = field.specialClass === 'utilityMissing';
              const isHouseSqFtMissing = field.specialClass === 'houseSqFtMissing';
              const isMountingPlaneDivider = field.specialClass === 'mountingPlaneDivider';

              const handleClick = () => {
                if (isUtilityMissing && onUtilityClick) {
                  onUtilityClick();
                } else if (isHouseSqFtMissing && onHouseSqFtClick) {
                  onHouseSqFtClick();
                }
              };

              const isClickable = (isUtilityMissing && onUtilityClick) || (isHouseSqFtMissing && onHouseSqFtClick);
              const isMissing = isUtilityMissing || isHouseSqFtMissing;

              return (
                <div
                  key={fieldIndex}
                  className={isMountingPlaneDivider ? styles.fieldRowMountingPlaneDivider : styles.fieldRow}
                >
                  <div className={styles.fieldLabel}>{field.label}</div>
                  <div
                    className={isMissing ? `${styles.fieldValue} ${styles.fieldValueMissing}` : styles.fieldValue}
                    onClick={isClickable ? handleClick : undefined}
                    style={isClickable ? { cursor: 'pointer' } : undefined}
                    title={isUtilityMissing && onUtilityClick ? 'Click to select utility' : isHouseSqFtMissing && onHouseSqFtClick ? 'Click to add house square footage' : undefined}
                  >
                    {field.value}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default ProjectOverviewDisplay;
