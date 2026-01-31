import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";
import { ORANGE_TB, ORANGE_LR, BLUE_2C_BT } from "../../styles/gradient";

interface EquipmentCardProps {
  systemNumber: number;
  systemData: any;
  isConfigured?: boolean;
  isActive?: boolean;
  isDeactivated?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  utilityRequirements?: any; // Utility BOS requirements for showing *Required indicator
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({
  systemNumber,
  systemData,
  isConfigured = false,
  isActive = false,
  isDeactivated = false,
  onPress,
  onEdit,
  utilityRequirements,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const prefix = `sys${systemNumber}_`;

  // ==== Determine system type and visibility ====
  const systemType = systemData?.[`${prefix}selectedsystem`] || "";
  const isMicro = systemType === "microinverter";
  const isInverter = systemType === "inverter";
  const isBatteryOnly = systemData?.[`${prefix}batteryonly`] === true;
  const backupOption = systemData?.[`${prefix}backup_option`] || "";

  // Visibility logic (mirrors useEquipmentDetails.ts logic)
  const hasBackupChoice = backupOption === "Whole Home" || backupOption === "Partial Home" || backupOption === "No Backup";
  const smsEnabled = backupOption === "Whole Home" || backupOption === "Partial Home";
  const backupSubpanelEnabled = backupOption === "Partial Home";

  // ==== Solar Panels (Always visible) ====
  const solarPanelQty = systemData?.[`${prefix}solar_panel_qty`] || systemData?.[`${prefix}solar_panel_quantity`] || "";
  const solarPanelMake = systemData?.[`${prefix}solar_panel_make`] || systemData?.[`${prefix}solar_panel_manufacturer`] || "";
  const solarPanelModel = systemData?.[`${prefix}solar_panel_model`] || "";
  const solarPanelExisting = systemData?.[`${prefix}solar_panel_existing`];
  const hasSolarPanels = !!(solarPanelQty || solarPanelMake || solarPanelModel);

  // Solar Panel Type 2
  const solarPanel2Qty = systemData?.[`${prefix}solar_panel_type2_quantity`] || "";
  const solarPanel2Make = systemData?.[`${prefix}solar_panel_type2_manufacturer`] || "";
  const solarPanel2Model = systemData?.[`${prefix}solar_panel_type2_model`] || "";
  const solarPanel2Existing = systemData?.[`${prefix}solar_panel_type2_existing`];
  const hasSolarPanel2 = !!(solarPanel2Qty || solarPanel2Make || solarPanel2Model);

  // ==== Microinverter Path ====
  const microMake = systemData?.[`${prefix}micro_inverter_make`] || "";
  const microModel = systemData?.[`${prefix}micro_inverter_model`] || "";
  const microQty = systemData?.[`${prefix}micro_inverter_qty`] || "";
  const microExisting = systemData?.[`${prefix}micro_inverter_existing`];
  const hasMicroinverter = isMicro && !!(microMake || microModel || microQty);

  // String Combiner Panel
  const combinerMake = systemData?.[`${prefix}combiner_panel_make`] || "";
  const combinerModel = systemData?.[`${prefix}combiner_panel_model`] || "";
  const combinerBusRating = systemData?.[`${prefix}combinerpanel_bus_rating`] || "";
  const combinerMainBreaker = systemData?.[`${prefix}combinerpanel_main_breaker_rating`] || "";
  const combinerExisting = systemData?.[`${prefix}combiner_existing`];
  const hasCombiner = isMicro && !!(combinerMake || combinerModel || combinerBusRating || combinerMainBreaker);

  // ==== Inverter Path ====
  // NOTE: Database uses micro_inverter_ prefix for BOTH microinverters and regular inverters
  const inverterMake = systemData?.[`${prefix}inverter_make`] || systemData?.[`${prefix}micro_inverter_make`] || "";
  const inverterModel = systemData?.[`${prefix}inverter_model`] || systemData?.[`${prefix}micro_inverter_model`] || "";
  const inverterQty = systemData?.[`${prefix}inverter_qty`] || systemData?.[`${prefix}micro_inverter_qty`] || "";
  const inverterExisting = systemData?.[`${prefix}inverter_existing`] ?? systemData?.[`${prefix}micro_inverter_existing`];
  const hasInverter = isInverter && !!(inverterMake || inverterModel);

  // Check if Tesla PowerWall
  const isTesla = inverterMake?.toLowerCase().includes('tesla');
  const modelLower = inverterModel?.toLowerCase() || "";
  const isPowerWall3 = modelLower.includes('powerwall 3') || modelLower.includes('powerwall3');
  const isPowerWallPlus = modelLower.includes('powerwall+') || modelLower.includes('powerwall +');
  const isPowerWall = isPowerWall3 || isPowerWallPlus;

  // Tesla Gateway & Extensions
  const teslaGatewayType = systemData?.[`${prefix}teslagatewaytype`] || "";
  const gateway = systemData?.[`${prefix}gateway`] || "";
  const teslaExtensions = systemData?.[`${prefix}tesla_extensions`] || "";
  const backupSwitchLocation = systemData?.[`${prefix}backupswitch_location`] || "";
  const hasTeslaGateway = isInverter && isTesla && isPowerWall && !!(teslaGatewayType || gateway);
  const hasTeslaExtensions = isInverter && isTesla && isPowerWall && !!teslaExtensions;
  const hasBackupSwitchLocation = isInverter && isTesla && isPowerWall && !!backupSwitchLocation;

  // Gateway Configuration (ESS fields for Tesla)
  const essExisting = systemData?.[`${prefix}ess_existing`];
  const essMainBreakerRating = systemData?.[`${prefix}ess_main_breaker_rating`] || "";
  const essUpstreamBreakerRating = systemData?.[`${prefix}ess_upstream_breaker_rating`] || "";
  const essBackupSubpanelMainBreaker = systemData?.[`${prefix}ess_backup_subpanel_main_breaker_rating`] || "";
  const hasTeslaGatewayConfig = isInverter && isTesla && isPowerWall &&
                                 (gateway === "backup_gateway_2" || gateway === "gateway_3") &&
                                 (essExisting !== undefined || essMainBreakerRating || essUpstreamBreakerRating);

  // Optimizer (integrated into Inverter section)
  const optimizerMake = systemData?.[`${prefix}optimizer_make`] || "";
  const optimizerModel = systemData?.[`${prefix}optimizer_model`] || "";
  const hasOptimizer = isInverter && !isTesla && !!(optimizerMake || optimizerModel);

  // ==== Energy Storage (SMS, Batteries, Backup Panel) ====
  const smsMake = systemData?.[`${prefix}sms_make`] || "";
  const smsModel = systemData?.[`${prefix}sms_model`] || "";
  const smsBreakerRating = systemData?.[`${prefix}sms_breaker_rating`] || "";
  const smsQty = systemData?.[`${prefix}sms_qty`] || systemData?.[`${prefix}sms_quantity`] || "";
  const smsExisting = systemData?.[`${prefix}sms_existing`];
  const hasSMS = smsEnabled && !!(smsMake || smsModel || smsBreakerRating);

  // Battery Type 1
  const battery1Make = systemData?.[`${prefix}battery_1_make`] || "";
  const battery1Model = systemData?.[`${prefix}battery_1_model`] || "";
  const battery1Qty = systemData?.[`${prefix}battery_1_qty`] || "";
  const battery1Existing = systemData?.[`${prefix}battery_1_existing`];
  const hasBattery1 = hasBackupChoice && !!(battery1Make || battery1Model || battery1Qty);

  // Battery Type 2
  const battery2Make = systemData?.[`${prefix}battery_2_make`] || "";
  const battery2Model = systemData?.[`${prefix}battery_2_model`] || "";
  const battery2Qty = systemData?.[`${prefix}battery_2_qty`] || "";
  const battery2Existing = systemData?.[`${prefix}battery_2_existing`];
  const hasBattery2 = hasBackupChoice && !!(battery2Make || battery2Model || battery2Qty);

  // Battery Combiner Panel / ESS (for non-Tesla systems)
  const essMake = systemData?.[`${prefix}ess_make`] || "";
  const essModel = systemData?.[`${prefix}ess_model`] || "";
  const essQty = systemData?.[`${prefix}ess_qty`] || systemData?.[`${prefix}ess_quantity`] || "";
  // essExisting already declared above (line 104)
  const hasESS = isMicro && hasBackupChoice && !!(essMake || essModel || essMainBreakerRating);

  // Backup Load Sub Panel
  const backupSubpanelMake = systemData?.[`${prefix}backup_subpanel_make`] || "";
  const backupSubpanelModel = systemData?.[`${prefix}backup_subpanel_model`] || "";
  const backupSubpanelBusRating = systemData?.[`${prefix}backup_subpanel_bus_rating`] || "";
  const backupSubpanelMainBreaker = systemData?.[`${prefix}backup_subpanel_main_breaker_rating`] || "";
  const backupSubpanelQty = systemData?.[`${prefix}backup_subpanel_qty`] || systemData?.[`${prefix}backup_subpanel_quantity`] || "";
  const backupSubpanelExisting = systemData?.[`${prefix}backupsubpanel_existing`];
  const hasBackupSubpanel = backupSubpanelEnabled && !!(backupSubpanelMake || backupSubpanelModel || backupSubpanelBusRating || backupSubpanelMainBreaker);

  // ==== BOS Equipment (Both Inverter and Microinverter paths) ====
  // Check both show_type flags and active flags, and also check if data exists
  const bos1EquipmentType = systemData?.[`bos_${prefix}type1_equipment_type`] || "";
  const bos1Make = systemData?.[`bos_${prefix}type1_make`] || "";
  const bos1Model = systemData?.[`bos_${prefix}type1_model`] || "";
  const bos1AmpRating = systemData?.[`bos_${prefix}type1_amp_rating`] || "";
  const bos1IsNew = systemData?.[`bos_${prefix}type1_is_new`];
  const bos1Show = systemData?.[`bos_${prefix}show_type1`] === true;
  const bos1HasData = !!(bos1Make && bos1Model); // Only show if both make AND model exist
  const hasBOS1 = bos1HasData; // Show only when there's actual equipment data

  const bos2EquipmentType = systemData?.[`bos_${prefix}type2_equipment_type`] || "";
  const bos2Make = systemData?.[`bos_${prefix}type2_make`] || "";
  const bos2Model = systemData?.[`bos_${prefix}type2_model`] || "";
  const bos2AmpRating = systemData?.[`bos_${prefix}type2_amp_rating`] || "";
  const bos2IsNew = systemData?.[`bos_${prefix}type2_is_new`];
  const bos2Show = systemData?.[`bos_${prefix}show_type2`] === true;
  const bos2HasData = !!(bos2Make && bos2Model); // Only show if both make AND model exist
  const hasBOS2 = bos2HasData; // Show only when there's actual equipment data

  const bos3EquipmentType = systemData?.[`bos_${prefix}type3_equipment_type`] || "";
  const bos3Make = systemData?.[`bos_${prefix}type3_make`] || "";
  const bos3Model = systemData?.[`bos_${prefix}type3_model`] || "";
  const bos3AmpRating = systemData?.[`bos_${prefix}type3_amp_rating`] || "";
  const bos3IsNew = systemData?.[`bos_${prefix}type3_is_new`];
  const bos3Show = systemData?.[`bos_${prefix}show_type3`] === true;
  const bos3HasData = !!(bos3Make && bos3Model); // Only show if both make AND model exist
  const hasBOS3 = bos3HasData; // Show only when there's actual equipment data

  // Load BOS triggers to determine which BOS are battery-triggered
  const bos1Trigger = systemData?.[`bos_${prefix}type1_trigger`] || "";
  const bos2Trigger = systemData?.[`bos_${prefix}type2_trigger`] || "";
  const bos3Trigger = systemData?.[`bos_${prefix}type3_trigger`] || "";
  const bos4Trigger = systemData?.[`bos_${prefix}type4_trigger`] || "";
  const bos5Trigger = systemData?.[`bos_${prefix}type5_trigger`] || "";
  const bos6Trigger = systemData?.[`bos_${prefix}type6_trigger`] || "";

  // Determine if BOS is battery-triggered (for storage section display)
  const isBOS1BatteryTriggered = bos1Trigger?.includes('battery');
  const isBOS2BatteryTriggered = bos2Trigger?.includes('battery');
  const isBOS3BatteryTriggered = bos3Trigger?.includes('battery');

  // Load additional BOS types (4, 5, 6) for battery-triggered display
  const bos4EquipmentType = systemData?.[`bos_${prefix}type4_equipment_type`] || "";
  const bos4Make = systemData?.[`bos_${prefix}type4_make`] || "";
  const bos4Model = systemData?.[`bos_${prefix}type4_model`] || "";
  const bos4AmpRating = systemData?.[`bos_${prefix}type4_amp_rating`] || "";
  const bos4IsNew = systemData?.[`bos_${prefix}type4_is_new`];
  const bos4HasData = !!(bos4Make && bos4Model);
  const isBOS4BatteryTriggered = bos4Trigger?.includes('battery');

  const bos5EquipmentType = systemData?.[`bos_${prefix}type5_equipment_type`] || "";
  const bos5Make = systemData?.[`bos_${prefix}type5_make`] || "";
  const bos5Model = systemData?.[`bos_${prefix}type5_model`] || "";
  const bos5AmpRating = systemData?.[`bos_${prefix}type5_amp_rating`] || "";
  const bos5IsNew = systemData?.[`bos_${prefix}type5_is_new`];
  const bos5HasData = !!(bos5Make && bos5Model);
  const isBOS5BatteryTriggered = bos5Trigger?.includes('battery');

  const bos6EquipmentType = systemData?.[`bos_${prefix}type6_equipment_type`] || "";
  const bos6Make = systemData?.[`bos_${prefix}type6_make`] || "";
  const bos6Model = systemData?.[`bos_${prefix}type6_model`] || "";
  const bos6AmpRating = systemData?.[`bos_${prefix}type6_amp_rating`] || "";
  const bos6IsNew = systemData?.[`bos_${prefix}type6_is_new`];
  const bos6HasData = !!(bos6Make && bos6Model);
  const isBOS6BatteryTriggered = bos6Trigger?.includes('battery');

  // ==== Post SMS BOS Equipment (Equipment AFTER SMS, for storage section) ====
  // NOTE: These are stored as bos_{prefix}_backup_type{N}_* in the database
  const postSMSBOS1EquipmentType = systemData?.[`bos_${prefix}_backup_type1_equipment_type`] || "";
  const postSMSBOS1Make = systemData?.[`bos_${prefix}_backup_type1_make`] || "";
  const postSMSBOS1Model = systemData?.[`bos_${prefix}_backup_type1_model`] || "";
  const postSMSBOS1AmpRating = systemData?.[`bos_${prefix}_backup_type1_amp_rating`] || "";
  const postSMSBOS1IsNew = systemData?.[`bos_${prefix}_backup_type1_is_new`];
  const hasPostSMSBOS1 = !!(postSMSBOS1Make && postSMSBOS1Model);

  const postSMSBOS2EquipmentType = systemData?.[`bos_${prefix}_backup_type2_equipment_type`] || "";
  const postSMSBOS2Make = systemData?.[`bos_${prefix}_backup_type2_make`] || "";
  const postSMSBOS2Model = systemData?.[`bos_${prefix}_backup_type2_model`] || "";
  const postSMSBOS2AmpRating = systemData?.[`bos_${prefix}_backup_type2_amp_rating`] || "";
  const postSMSBOS2IsNew = systemData?.[`bos_${prefix}_backup_type2_is_new`];
  const hasPostSMSBOS2 = !!(postSMSBOS2Make && postSMSBOS2Model);

  const postSMSBOS3EquipmentType = systemData?.[`bos_${prefix}_backup_type3_equipment_type`] || "";
  const postSMSBOS3Make = systemData?.[`bos_${prefix}_backup_type3_make`] || "";
  const postSMSBOS3Model = systemData?.[`bos_${prefix}_backup_type3_model`] || "";
  const postSMSBOS3AmpRating = systemData?.[`bos_${prefix}_backup_type3_amp_rating`] || "";
  const postSMSBOS3IsNew = systemData?.[`bos_${prefix}_backup_type3_is_new`];
  const hasPostSMSBOS3 = !!(postSMSBOS3Make && postSMSBOS3Model);

  // ==== Overall Equipment Check ====
  const hasEquipment = hasSolarPanels || hasSolarPanel2 || hasMicroinverter || hasCombiner ||
                       hasInverter || hasOptimizer || hasTeslaGateway || hasTeslaExtensions ||
                       hasTeslaGatewayConfig || hasSMS || hasBattery1 || hasBattery2 ||
                       hasESS || hasBackupSubpanel || hasBOS1 || hasBOS2 || hasBOS3 || isBatteryOnly;

  // ==== Utility BOS Requirements Check ====
  const isBOSRequired = (equipmentType: string): boolean => {
    if (!utilityRequirements || !equipmentType) return false;
    const { bos_1, bos_2, bos_3, bos_4, bos_5, bos_6 } = utilityRequirements;
    const requiredTypes = [bos_1, bos_2, bos_3, bos_4, bos_5, bos_6].filter(Boolean);
    return requiredTypes.some(req => req.toLowerCase() === equipmentType.toLowerCase());
  };

  // Helper function to format equipment display with quantity and (N)/(E) indicator
  const formatEquipmentValue = (make: string, model: string, qty: string | number, existing?: boolean): string => {
    const parts: string[] = [];

    // Add quantity and (N)/(E) indicator if quantity exists
    if (qty) {
      const indicator = existing === true ? '(E)' : existing === false ? '(N)' : '';
      parts.push(`${qty} ${indicator}`.trim());
    }

    // Add make and model
    if (make) parts.push(make);
    if (model) parts.push(model);

    return parts.filter(Boolean).join(' ');
  };

  const handlePress = () => {
    if (onPress && !isDeactivated) onPress();
  };

  const handleEditPress = () => {
    if (onEdit && !isDeactivated) onEdit();
  };

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const BORDER_RADIUS = moderateScale(24); // Pill shape (matches SystemButton)
  const BORDER_WIDTH = moderateScale(1);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: isDeactivated ? 0.6 : 1,
        },
      ]}
    >
      {/* System Header Button */}
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.88}
        disabled={isDeactivated}
        style={styles.touchable}
      >
        {isActive ? (
          <LinearGradient
            {...ORANGE_TB}
            style={[styles.headerGradient, { borderRadius: BORDER_RADIUS }]}
          >
            <View style={styles.headerContent}>
              <Text style={styles.activeText}>System {systemNumber}</Text>
            </View>
            <TouchableOpacity
              onPress={handleEditPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                source={require("../../assets/Images/icons/pencil_icon_white.png")}
                style={styles.editIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </LinearGradient>
        ) : isDeactivated ? (
          <View style={[styles.headerWrapper, { borderRadius: BORDER_RADIUS }]}>
            <View
              style={[
                styles.deactivatedHeader,
                { borderRadius: BORDER_RADIUS, borderWidth: BORDER_WIDTH },
              ]}
            >
              <LinearGradient
                {...BLUE_2C_BT}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.headerContent}>
                <Text style={[styles.inactiveText, { opacity: 0.6 }]}>
                  Add System {systemNumber}
                </Text>
              </View>
              <Image
                source={require("../../assets/Images/icons/plus_icon_orange_fd7332.png")}
                style={[styles.editIcon, { opacity: 0.6 }]}
                resizeMode="contain"
              />
            </View>
          </View>
        ) : (
          <View style={[styles.headerWrapper, { borderRadius: BORDER_RADIUS }]}>
            <LinearGradient
              {...ORANGE_LR}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              style={[
                styles.inactiveHeaderInner,
                {
                  margin: BORDER_WIDTH,
                  borderRadius: BORDER_RADIUS - BORDER_WIDTH,
                },
              ]}
            >
              <LinearGradient
                {...BLUE_2C_BT}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.headerContent}>
                <Text style={styles.inactiveText}>System {systemNumber}</Text>
              </View>
              <TouchableOpacity
                onPress={handleEditPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Image
                  source={require("../../assets/Images/icons/plus_icon_orange_fd7332.png")}
                  style={styles.editIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Equipment Details Section - Mirrors SystemDetails rendering logic */}
      {hasEquipment && !isDeactivated && (
        <View style={styles.detailsContainer}>
          {/* Battery Only Badge - Shown at top instead of solar panels */}
          {isBatteryOnly && (
            <View style={styles.detailRow}>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabel, { color: "#10B981" }]}>
                  Battery-Only System
                </Text>
              </View>
            </View>
          )}

          {/* Solar Panel Type 1 (Always visible if configured) */}
          {hasSolarPanels && (
            <View style={styles.detailRow}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>
                  Solar Panel {systemNumber}{hasSolarPanel2 ? " - Type 1" : ""}
                </Text>
                <Text style={styles.detailValue}>
                  {formatEquipmentValue(solarPanelMake, solarPanelModel, solarPanelQty, solarPanelExisting)}
                </Text>
              </View>
            </View>
          )}

          {/* Solar Panel Type 2 */}
          {hasSolarPanel2 && (
            <View style={styles.detailRow}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Solar Panel {systemNumber} - Type 2</Text>
                <Text style={styles.detailValue}>
                  {formatEquipmentValue(solarPanel2Make, solarPanel2Model, solarPanel2Qty, solarPanel2Existing)}
                </Text>
              </View>
            </View>
          )}

          {/* === MICROINVERTER PATH === */}
          {hasMicroinverter && (
            <View style={styles.detailRow}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Microinverter {systemNumber}</Text>
                <Text style={styles.detailValue}>
                  {formatEquipmentValue(microMake, microModel, microQty, microExisting)}
                </Text>
              </View>
            </View>
          )}

          {hasCombiner && (
            <View style={styles.detailRow}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>String Combiner Panel {systemNumber}</Text>
                <Text style={styles.detailValue}>
                  {formatEquipmentValue(combinerMake, combinerModel, 1, combinerExisting)}
                </Text>
              </View>
            </View>
          )}

          {/* === BOS EQUIPMENT (After String Combiner for Microinverter path) === */}
          {isMicro && hasBOS1 && bos1EquipmentType !== 'SMS' && (
            <View style={styles.detailRow}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>
                  {bos1EquipmentType || "BOS Equipment 1"}
                  {isBOSRequired(bos1EquipmentType) && " *Required"}
                </Text>
                <Text style={styles.detailValue}>
                  {formatEquipmentValue(
                    bos1Make,
                    bos1Model + (bos1AmpRating ? ` ${bos1AmpRating}A` : ''),
                    1,
                    bos1IsNew === false
                  ) || "Configured"}
                </Text>
              </View>
            </View>
          )}

          {isMicro && hasBOS2 && bos2EquipmentType !== 'SMS' && (
            <View style={styles.detailRow}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>
                  {bos2EquipmentType || "BOS Equipment 2"}
                  {isBOSRequired(bos2EquipmentType) && " *Required"}
                </Text>
                <Text style={styles.detailValue}>
                  {formatEquipmentValue(
                    bos2Make,
                    bos2Model + (bos2AmpRating ? ` ${bos2AmpRating}A` : ''),
                    1,
                    bos2IsNew === false
                  ) || "Configured"}
                </Text>
              </View>
            </View>
          )}

          {isMicro && hasBOS3 && bos3EquipmentType !== 'SMS' && (
            <View style={styles.detailRow}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>
                  {bos3EquipmentType || "BOS Equipment 3"}
                  {isBOSRequired(bos3EquipmentType) && " *Required"}
                </Text>
                <Text style={styles.detailValue}>
                  {formatEquipmentValue(
                    bos3Make,
                    bos3Model + (bos3AmpRating ? ` ${bos3AmpRating}A` : ''),
                    1,
                    bos3IsNew === false
                  ) || "Configured"}
                </Text>
              </View>
            </View>
          )}

          {/* === INVERTER PATH === */}
          {hasInverter && (
            <View style={styles.detailRow}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Inverter {systemNumber}</Text>
                <Text style={styles.detailValue}>
                  {formatEquipmentValue(inverterMake, inverterModel, inverterQty, inverterExisting)}
                </Text>
              </View>
            </View>
          )}

          {/* Optimizer (for non-Tesla inverters) */}
          {hasOptimizer && (
            <View style={styles.detailRow}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Optimizer</Text>
                <Text style={styles.detailValue}>
                  {[optimizerMake, optimizerModel].filter(Boolean).join(" ")}
                </Text>
              </View>
            </View>
          )}

          {/* === BOS EQUIPMENT (After batteries/backup for Inverter path) === */}
          {isInverter && hasBOS1 && bos1EquipmentType !== 'SMS' && (
            <View style={styles.detailRow}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>
                  {bos1EquipmentType || "BOS Equipment 1"}
                  {isBOSRequired(bos1EquipmentType) && " *Required"}
                </Text>
                <Text style={styles.detailValue}>
                  {formatEquipmentValue(
                    bos1Make,
                    bos1Model + (bos1AmpRating ? ` ${bos1AmpRating}A` : ''),
                    1,
                    bos1IsNew === false
                  ) || "Configured"}
                </Text>
              </View>
            </View>
          )}

          {isInverter && hasBOS2 && bos2EquipmentType !== 'SMS' && (
            <View style={styles.detailRow}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>
                  {bos2EquipmentType || "BOS Equipment 2"}
                  {isBOSRequired(bos2EquipmentType) && " *Required"}
                </Text>
                <Text style={styles.detailValue}>
                  {formatEquipmentValue(
                    bos2Make,
                    bos2Model + (bos2AmpRating ? ` ${bos2AmpRating}A` : ''),
                    1,
                    bos2IsNew === false
                  ) || "Configured"}
                </Text>
              </View>
            </View>
          )}

          {isInverter && hasBOS3 && bos3EquipmentType !== 'SMS' && (
            <View style={styles.detailRow}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>
                  {bos3EquipmentType || "BOS Equipment 3"}
                  {isBOSRequired(bos3EquipmentType) && " *Required"}
                </Text>
                <Text style={styles.detailValue}>
                  {formatEquipmentValue(
                    bos3Make,
                    bos3Model + (bos3AmpRating ? ` ${bos3AmpRating}A` : ''),
                    1,
                    bos3IsNew === false
                  ) || "Configured"}
                </Text>
              </View>
            </View>
          )}

          {/* === STORAGE EQUIPMENT SECTION === */}
          {(hasTeslaGateway || hasTeslaExtensions || hasBackupSwitchLocation || hasTeslaGatewayConfig ||
            hasSMS || hasBattery1 || hasBattery2 || hasESS || hasBackupSubpanel) && (
            <>
              {/* Storage Equipment Label */}
              <View style={styles.storageLabelContainer}>
                <Text style={styles.storageLabel}>Storage Equipment</Text>
              </View>

              {/* Separator Line */}
              <View style={styles.storageSeparator} />

              {/* Tesla PowerWall Configuration */}
              {hasTeslaGateway && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Gateway</Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue('', gateway || teslaGatewayType, 1, inverterExisting)}
                    </Text>
                  </View>
                </View>
              )}

              {hasTeslaExtensions && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Tesla Expansions</Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue('', 'Tesla Expansions', teslaExtensions, inverterExisting)}
                    </Text>
                  </View>
                </View>
              )}

              {hasBackupSwitchLocation && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Backup Switch Location</Text>
                    <Text style={styles.detailValue}>{backupSwitchLocation}</Text>
                  </View>
                </View>
              )}

              {hasTeslaGatewayConfig && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Gateway Configuration</Text>
                    <Text style={styles.detailValue}>
                      {[
                        essMainBreakerRating && `Main: ${essMainBreakerRating}A`,
                        essUpstreamBreakerRating && `Upstream: ${essUpstreamBreakerRating}A`,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Configured"}
                    </Text>
                  </View>
                </View>
              )}

              {/* Storage Management System */}
              {hasSMS && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Storage Management System</Text>
                    <Text style={styles.detailValue}>
                      {(() => {
                        const indicator = smsExisting === true ? '(E)' : smsExisting === false ? '(N)' : '';
                        const parts = [indicator, smsMake, smsModel].filter(Boolean);
                        return parts.join(' ');
                      })()}
                    </Text>
                  </View>
                </View>
              )}

              {hasBattery1 && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Battery Type 1</Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue(battery1Make, battery1Model, battery1Qty, battery1Existing)}
                    </Text>
                  </View>
                </View>
              )}

              {hasBattery2 && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Battery Type 2</Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue(battery2Make, battery2Model, battery2Qty, battery2Existing)}
                    </Text>
                  </View>
                </View>
              )}

              {hasESS && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Battery Combiner Panel</Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue(essMake, essModel, essQty, essExisting)}
                    </Text>
                  </View>
                </View>
              )}

              {hasBackupSubpanel && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Backup Load Sub Panel</Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue(backupSubpanelMake, backupSubpanelModel, backupSubpanelQty, backupSubpanelExisting)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Battery-Triggered BOS Equipment */}
              {hasBOS1 && isBOS1BatteryTriggered && bos1EquipmentType !== 'SMS' && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>
                      {bos1EquipmentType || "BOS Equipment 1"}
                    </Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue(
                        bos1Make,
                        bos1Model,
                        bos1AmpRating ? `${bos1AmpRating}A` : "",
                        bos1IsNew
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {hasBOS2 && isBOS2BatteryTriggered && bos2EquipmentType !== 'SMS' && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>
                      {bos2EquipmentType || "BOS Equipment 2"}
                    </Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue(
                        bos2Make,
                        bos2Model,
                        bos2AmpRating ? `${bos2AmpRating}A` : "",
                        bos2IsNew
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {hasBOS3 && isBOS3BatteryTriggered && bos3EquipmentType !== 'SMS' && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>
                      {bos3EquipmentType || "BOS Equipment 3"}
                    </Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue(
                        bos3Make,
                        bos3Model,
                        bos3AmpRating ? `${bos3AmpRating}A` : "",
                        bos3IsNew
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {bos4HasData && isBOS4BatteryTriggered && bos4EquipmentType !== 'SMS' && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>
                      {bos4EquipmentType || "BOS Equipment 4"}
                    </Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue(
                        bos4Make,
                        bos4Model,
                        bos4AmpRating ? `${bos4AmpRating}A` : "",
                        bos4IsNew
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {bos5HasData && isBOS5BatteryTriggered && bos5EquipmentType !== 'SMS' && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>
                      {bos5EquipmentType || "BOS Equipment 5"}
                    </Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue(
                        bos5Make,
                        bos5Model,
                        bos5AmpRating ? `${bos5AmpRating}A` : "",
                        bos5IsNew
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {bos6HasData && isBOS6BatteryTriggered && bos6EquipmentType !== 'SMS' && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>
                      {bos6EquipmentType || "BOS Equipment 6"}
                    </Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue(
                        bos6Make,
                        bos6Model,
                        bos6AmpRating ? `${bos6AmpRating}A` : "",
                        bos6IsNew
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {/* Post SMS BOS Equipment */}
              {hasPostSMSBOS1 && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>
                      {postSMSBOS1EquipmentType || "Post SMS BOS Equipment 1"}
                    </Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue(
                        postSMSBOS1Make,
                        postSMSBOS1Model,
                        postSMSBOS1AmpRating ? `${postSMSBOS1AmpRating}A` : "",
                        postSMSBOS1IsNew
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {hasPostSMSBOS2 && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>
                      {postSMSBOS2EquipmentType || "Post SMS BOS Equipment 2"}
                    </Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue(
                        postSMSBOS2Make,
                        postSMSBOS2Model,
                        postSMSBOS2AmpRating ? `${postSMSBOS2AmpRating}A` : "",
                        postSMSBOS2IsNew
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {hasPostSMSBOS3 && (
                <View style={styles.detailRow}>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>
                      {postSMSBOS3EquipmentType || "Post SMS BOS Equipment 3"}
                    </Text>
                    <Text style={styles.detailValue}>
                      {formatEquipmentValue(
                        postSMSBOS3Make,
                        postSMSBOS3Model,
                        postSMSBOS3AmpRating ? `${postSMSBOS3AmpRating}A` : "",
                        postSMSBOS3IsNew
                      )}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: moderateScale(0),
  },
  touchable: {
    width: "100%",
  },
  headerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
    height: moderateScale(40),
  },
  headerWrapper: {
    overflow: "hidden",
    height: moderateScale(40),
  },
  deactivatedHeader: {
    borderColor: "#808080",
    overflow: "hidden",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
  },
  inactiveHeaderInner: {
    overflow: "hidden",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activeText: {
    fontFamily: "Lato-Bold",
    fontWeight: "700",
    fontSize: moderateScale(24),
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  inactiveText: {
    fontFamily: "Lato-Regular",
    fontWeight: "400",
    fontSize: moderateScale(24),
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  editIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
  },
  detailsContainer: {
    backgroundColor: "rgba(12, 31, 63, 0.5)",
    borderBottomLeftRadius: moderateScale(8),
    borderBottomRightRadius: moderateScale(8),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    borderLeftWidth: moderateScale(2),
    borderRightWidth: moderateScale(2),
    borderBottomWidth: moderateScale(2),
    borderColor: "rgba(253, 115, 50, 0.3)",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: moderateScale(6),
    paddingLeft: moderateScale(8),
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#A0AEC0",
    marginBottom: moderateScale(2),
  },
  detailValue: {
    fontSize: moderateScale(16),
    fontWeight: "400",
    color: "#FFFFFF",
  },
  storageSeparator: {
    height: 1,
    backgroundColor: "#4A5568",
    marginTop: moderateScale(4),
    marginBottom: moderateScale(12),
    marginHorizontal: moderateScale(8),
  },
  storageLabelContainer: {
    marginTop: moderateScale(12),
    marginBottom: moderateScale(4),
    paddingLeft: moderateScale(8),
  },
  storageLabel: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#A0AEC0",
    textAlign: "left",
  },
});

export default EquipmentCard;
