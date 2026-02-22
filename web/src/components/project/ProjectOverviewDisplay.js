import React, { useMemo } from 'react';
import styles from './ProjectOverviewDisplay.module.css';

const ProjectOverviewDisplay = ({ projectData, systemDetails, onUtilityClick }) => {

  const fieldExists = (value) => {
    return value !== null && value !== undefined && value !== '' && value !== '-' && value !== false;
  };

  const customerSite = useMemo(() => {
    if (!projectData) return null;
    const site = projectData?.site || {};
    const details = projectData?.details || {};

    const name = [details.customer_first_name, details.customer_last_name].filter(Boolean).join(' ');
    const addressLine1 = site.address || '';
    const addressLine2 = [site.city, site.state].filter(Boolean).join(', ');
    const addressLine2Full = [addressLine2, site.zip_code].filter(Boolean).join(' ');

    return {
      name: name || null,
      email: details.customer_email || null,
      phone: details.customer_phone || null,
      addressLine1,
      addressLine2: addressLine2Full,
      hasAddress: !!(addressLine1 || addressLine2Full),
      jurisdiction: site.ahj || null,
      utility: site.utility || null,
      apn: site.apn || null,
      sqft: site.house_sqft || (systemDetails?.house_sqft) || null,
    };
  }, [projectData, systemDetails]);

  const systems = useMemo(() => {
    if (!systemDetails) return [];
    var result = [];

    [1, 2, 3, 4].forEach(function(sysNum) {
      var prefix = 'sys' + sysNum + '_';
      var equipment = [];

      if (systemDetails[prefix + 'solar_panel_make']) {
        var isNew = !systemDetails[prefix + 'solar_panel_existing'];
        var qty = systemDetails[prefix + 'solar_panel_qty'];
        var make = systemDetails[prefix + 'solar_panel_make'];
        var model = systemDetails[prefix + 'solar_panel_model'];
        var wattage = systemDetails[prefix + 'solar_panel_wattage'];
        var detail = [qty ? qty + ' \u00d7' : null, make, model, wattage || null].filter(Boolean).join(' ');
        equipment.push({ label: 'Solar Panel', detail: detail, isNew: isNew });
      }

      if (systemDetails[prefix + 'show_solar_panel_2'] && systemDetails[prefix + 'solar_panel_type2_manufacturer']) {
        var isNew2 = systemDetails[prefix + 'solar_panel_type2_is_new'];
        var qty2 = systemDetails[prefix + 'solar_panel_type2_quantity'];
        var make2 = systemDetails[prefix + 'solar_panel_type2_manufacturer'];
        var model2 = systemDetails[prefix + 'solar_panel_type2_model'];
        var detail2 = [qty2 ? qty2 + ' \u00d7' : null, make2, model2].filter(Boolean).join(' ');
        equipment.push({ label: 'Solar Panel 2', detail: detail2, isNew: isNew2 });
      }

      if (systemDetails[prefix + 'micro_inverter_make']) {
        var invType = systemDetails[prefix + 'inverter_type'] || systemDetails[prefix + 'selectedsystem'] || 'Inverter';
        var typeLabel = invType === 'microinverter' ? 'Micro' : 'Inverter';
        var isNewInv = !systemDetails[prefix + 'micro_inverter_existing'];
        var qtyInv = systemDetails[prefix + 'micro_inverter_qty'];
        var makeInv = systemDetails[prefix + 'micro_inverter_make'];
        var modelInv = systemDetails[prefix + 'micro_inverter_model'];
        var detailInv = [qtyInv ? qtyInv + ' \u00d7' : null, makeInv, modelInv].filter(Boolean).join(' ');
        equipment.push({ label: typeLabel, detail: detailInv, isNew: isNewInv });
      }

      if (systemDetails[prefix + 'optimizer_make']) {
        var isNewOpt = !systemDetails[prefix + 'optimizer_existing'];
        var makeOpt = systemDetails[prefix + 'optimizer_make'];
        var modelOpt = systemDetails[prefix + 'optimizer_model'];
        equipment.push({ label: 'Optimizer', detail: [makeOpt, modelOpt].filter(Boolean).join(' '), isNew: isNewOpt });
      }

      if (systemDetails[prefix + 'battery_1_make']) {
        var isNewBat = !systemDetails[prefix + 'battery_1_existing'];
        var qtyBat = systemDetails[prefix + 'battery_1_qty'];
        var makeBat = systemDetails[prefix + 'battery_1_make'];
        var modelBat = systemDetails[prefix + 'battery_1_model'];
        var detailBat = [qtyBat ? qtyBat + ' \u00d7' : null, makeBat, modelBat].filter(Boolean).join(' ');
        equipment.push({ label: 'Battery', detail: detailBat, isNew: isNewBat });
      }

      if (systemDetails[prefix + 'sms_make']) {
        var isNewSms = !systemDetails[prefix + 'sms_existing'];
        var makeSms = systemDetails[prefix + 'sms_make'];
        var modelSms = systemDetails[prefix + 'sms_model'];
        equipment.push({ label: 'SMS', detail: [makeSms, modelSms].filter(Boolean).join(' '), isNew: isNewSms });
      }

      var backupMake = sysNum === 1
        ? systemDetails.bls1_backup_load_sub_panel_make
        : systemDetails[prefix + 'backuploadsubpanel_make'];
      if (backupMake) {
        var backupModel = sysNum === 1
          ? systemDetails.bls1_backup_load_sub_panel_model
          : systemDetails[prefix + 'backuploadsubpanel_model'];
        var backupBus = sysNum === 1
          ? systemDetails.bls1_backuploader_bus_bar_rating
          : systemDetails[prefix + 'backuploadsubpanel_bus_rating'];
        var backupExisting = sysNum === 1
          ? systemDetails.bls1_backuploader_existing
          : systemDetails[prefix + 'backuploadsubpanel_existing'];
        var isNewBackup = !backupExisting;
        var bParts = [backupMake, backupModel];
        if (fieldExists(backupBus) && backupModel && !String(backupModel).includes(String(backupBus))) {
          bParts.push(backupBus + ' Amps');
        }
        equipment.push({ label: 'Backup Panel', detail: bParts.filter(Boolean).join(' '), isNew: isNewBackup });
      }

      if (systemDetails[prefix + 'string_combiner_make']) {
        var isNewComb = !systemDetails[prefix + 'string_combiner_existing'];
        var makeComb = systemDetails[prefix + 'string_combiner_make'];
        var modelComb = systemDetails[prefix + 'string_combiner_model'];
        equipment.push({ label: 'Combiner', detail: [makeComb, modelComb].filter(Boolean).join(' '), isNew: isNewComb });
      }

      if (systemDetails[prefix + 'ev_charger_make']) {
        var isNewEv = !systemDetails[prefix + 'ev_charger_existing'];
        var makeEv = systemDetails[prefix + 'ev_charger_make'];
        var modelEv = systemDetails[prefix + 'ev_charger_model'];
        equipment.push({ label: 'EV Charger', detail: [makeEv, modelEv].filter(Boolean).join(' '), isNew: isNewEv });
      }

      if (equipment.length > 0) {
        result.push({ sysNum: sysNum, equipment: equipment });
      }
    });

    return result;
  }, [systemDetails]);

  var electrical = useMemo(function() {
    if (!systemDetails) return [];
    var rows = [];

    if (systemDetails.ele_ses_type || systemDetails.ele_bus_bar_rating || systemDetails.ele_main_circuit_breaker_rating) {
      var parts = [];
      if (systemDetails.ele_ses_type) parts.push(systemDetails.ele_ses_type);
      if (systemDetails.ele_bus_bar_rating) parts.push(systemDetails.ele_bus_bar_rating + 'A bus');
      if (systemDetails.ele_main_circuit_breaker_rating) parts.push(systemDetails.ele_main_circuit_breaker_rating + 'A main');
      rows.push({ label: 'Service', value: parts.join(' \u00b7 ') });
    }

    if (systemDetails.ele_main_circuit_breakers_qty) {
      rows.push({ label: 'Main Breakers', value: '' + systemDetails.ele_main_circuit_breakers_qty });
    }

    if (systemDetails.ele_feeder_location_on_bus_bar) {
      rows.push({ label: 'Feeder Location', value: systemDetails.ele_feeder_location_on_bus_bar });
    }

    var mpaItems = [];
    if (fieldExists(systemDetails.mpa_bus_bar_existing)) {
      mpaItems.push('Bus: ' + (systemDetails.mpa_bus_bar_existing ? 'Existing' : 'New/MPU'));
    }
    if (fieldExists(systemDetails.mpa_main_circuit_breaker_existing)) {
      mpaItems.push('MCB: ' + (systemDetails.mpa_main_circuit_breaker_existing ? 'Existing' : 'New'));
    }
    if (systemDetails.el_mpa_derated) mpaItems.push('Derated');
    if (mpaItems.length > 0) {
      rows.push({ label: 'MPA', value: mpaItems.join(' \u00b7 ') });
    }

    var subPanels = [
      { key: 'b', busField: 'ele_subpanel_b_bus_rating', mcbField: 'ele_subpanel_b_main_breaker', upField: 'ele_subpanel_b_upstream_breaker', busFallback: 'spb_bus_bar_rating', mcbFallback: 'spb_main_breaker_rating', upFallback: 'spb_upstream_breaker_rating' },
      { key: 'c', busField: 'ele_subpanel_c_bus_rating', mcbField: 'ele_subpanel_c_main_breaker', upField: 'ele_subpanel_c_upstream_breaker', busFallback: 'el_spc_bus_rating', mcbFallback: 'el_spc_main_breaker_rating', upFallback: 'el_spc_upstream_breaker_rating' },
      { key: 'd', busField: 'ele_subpanel_d_bus_rating', mcbField: 'ele_subpanel_d_main_breaker', upField: 'ele_subpanel_d_upstream_breaker', busFallback: 'el_spd_bus_rating', mcbFallback: 'el_spd_main_breaker_rating', upFallback: 'el_spd_upstream_breaker_rating' },
    ];

    subPanels.forEach(function(sp) {
      var bus = systemDetails[sp.busField] || systemDetails[sp.busFallback];
      var mcb = systemDetails[sp.mcbField] || systemDetails[sp.mcbFallback];
      var up = systemDetails[sp.upField] || systemDetails[sp.upFallback];
      if (bus || mcb || up) {
        var spParts = [];
        if (bus) spParts.push(bus + 'A bus');
        if (mcb) spParts.push(mcb + 'A main');
        if (up) spParts.push(up + 'A upstream');
        rows.push({ label: 'SP ' + sp.key.toUpperCase(), value: spParts.join(' \u00b7 ') });
      }
    });

    if (systemDetails.ele_combine_systems) {
      rows.push({ label: 'Combined', value: String(systemDetails.ele_combine_systems) });
    }

    if (systemDetails.ele_method_of_interconnection) {
      rows.push({ label: 'POI', value: systemDetails.ele_method_of_interconnection });
    }

    return rows;
  }, [systemDetails]);

  var structural = useMemo(function() {
    if (!systemDetails) return [];
    var rows = [];

    if (systemDetails.st_roof_a_framing_type) {
      var areaA = systemDetails.st_roof_a_area_sqft ? ' \u00b7 ' + systemDetails.st_roof_a_area_sqft + ' sqft' : '';
      rows.push({ label: 'Roof A', value: systemDetails.st_roof_a_framing_type + areaA });
    }
    if (systemDetails.st_roof_b_framing_type) {
      var areaB = systemDetails.st_roof_b_area_sqft ? ' \u00b7 ' + systemDetails.st_roof_b_area_sqft + ' sqft' : '';
      rows.push({ label: 'Roof B', value: systemDetails.st_roof_b_framing_type + areaB });
    }

    if (systemDetails.rta_rail_make || systemDetails.st_rail_manufacturer) {
      var railMake = systemDetails.rta_rail_make || systemDetails.st_rail_manufacturer || '';
      var railModel = systemDetails.rta_rail_model || systemDetails.st_rail_model || '';
      rows.push({ label: 'Rails', value: [railMake, railModel].filter(Boolean).join(' ') });
    }

    if (systemDetails.rta_attachment_make) {
      rows.push({ label: 'Attachments', value: [systemDetails.rta_attachment_make, systemDetails.rta_attachment_model].filter(Boolean).join(' ') });
    }

    for (var mp = 1; mp <= 10; mp++) {
      var mpPrefix = 'mp' + mp + '_';
      var azimuth = systemDetails[mpPrefix + 'azimuth'];
      var pitch = systemDetails[mpPrefix + 'pitch'];

      if (azimuth && pitch) {
        var mpParts = [];
        if (systemDetails[mpPrefix + 'roof_type']) mpParts.push(systemDetails[mpPrefix + 'roof_type']);
        mpParts.push(pitch + '\u00b0');
        mpParts.push(azimuth + '\u00b0');
        if (systemDetails[mpPrefix + 'stories']) mpParts.push(systemDetails[mpPrefix + 'stories'] + 'st');
        var panelCount = systemDetails['panel_count_mp' + mp];
        if (panelCount) mpParts.push(panelCount + ' panels');
        rows.push({ label: 'MP' + mp, value: mpParts.join(' \u00b7 ') });
      }
    }

    return rows;
  }, [systemDetails]);

  if (!customerSite && systems.length === 0 && electrical.length === 0 && structural.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>{'\uD83D\uDCCB'}</div>
        <div className={styles.emptyTitle}>No Project Data</div>
        <div className={styles.emptyText}>No fields have been filled in yet</div>
      </div>
    );
  }

  return (
    <div className={styles.overviewDisplay}>

      {customerSite && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>Customer & Site</div>

          {customerSite.name && (
            <div className={styles.row}>
              <div className={styles.labelCol}>Name</div>
              <div className={styles.valueCol}>{customerSite.name}</div>
            </div>
          )}

          {customerSite.hasAddress && (
            <div className={styles.row}>
              <div className={styles.labelCol}>Address</div>
              <div className={styles.addressValue}>
                {customerSite.addressLine1 && <div>{customerSite.addressLine1}</div>}
                {customerSite.addressLine2 && <div>{customerSite.addressLine2}</div>}
              </div>
            </div>
          )}

          {customerSite.email && (
            <div className={styles.row}>
              <div className={styles.labelCol}>Email</div>
              <div className={styles.valueCol}>{customerSite.email}</div>
            </div>
          )}

          {customerSite.phone && (
            <div className={styles.row}>
              <div className={styles.labelCol}>Phone</div>
              <div className={styles.valueCol}>{customerSite.phone}</div>
            </div>
          )}

          {customerSite.jurisdiction && (
            <div className={styles.row}>
              <div className={styles.labelCol}>Jurisdiction</div>
              <div className={styles.valueCol}>{customerSite.jurisdiction}</div>
            </div>
          )}

          <div className={styles.row}>
            <div className={styles.labelCol}>Utility</div>
            {customerSite.utility ? (
              <div className={styles.valueCol}>{customerSite.utility}</div>
            ) : (
              <div
                className={styles.valueCol + ' ' + styles.fieldValueMissing}
                onClick={onUtilityClick || undefined}
                title={onUtilityClick ? 'Click to select utility' : undefined}
              >
                Not Selected
              </div>
            )}
          </div>

          {customerSite.apn && (
            <div className={styles.row}>
              <div className={styles.labelCol}>APN</div>
              <div className={styles.valueCol}>{customerSite.apn}</div>
            </div>
          )}

          {customerSite.sqft && (
            <div className={styles.row}>
              <div className={styles.labelCol}>Sq Ft</div>
              <div className={styles.valueCol}>{customerSite.sqft}</div>
            </div>
          )}
        </div>
      )}

      {systems.map(function(sys) {
        return (
          <div key={sys.sysNum} className={styles.section}>
            <div className={styles.sectionHeader}>System {sys.sysNum}</div>
            {sys.equipment.map(function(item, idx) {
              return (
                <div key={idx} className={styles.row}>
                  <div className={styles.labelCol}>
                    {item.label}
                    <span className={item.isNew ? styles.badgeNew : styles.badgeExisting}>
                      {item.isNew ? 'New' : 'Exs'}
                    </span>
                  </div>
                  <div className={styles.valueCol}>{item.detail}</div>
                </div>
              );
            })}
          </div>
        );
      })}

      {electrical.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>Electrical</div>
          {electrical.map(function(row, idx) {
            return (
              <div key={idx} className={styles.row}>
                <div className={styles.labelCol}>{row.label}</div>
                <div className={styles.valueCol}>{row.value}</div>
              </div>
            );
          })}
        </div>
      )}

      {structural.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>Structural</div>
          {structural.map(function(row, idx) {
            return (
              <div key={idx} className={styles.row}>
                <div className={styles.labelCol}>{row.label}</div>
                <div className={styles.valueCol}>{row.value}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectOverviewDisplay;


