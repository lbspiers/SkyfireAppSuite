import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { moderateScale } from "../../utils/responsive";
import EquipmentBox, { EquipmentType } from "./EquipmentBox";

interface Connection {
  from: string;
  to: string;
  type: "ac_couple" | "sms_connection" | "combine" | "direct";
}

interface ElectricalDiagramProps {
  systemLandings: Record<string, string>;
  activeSystems: number[];
  connections: Connection[];
  systemData?: any;
}

interface EquipmentItem {
  id: string;
  type: EquipmentType;
  label: string;
  make?: string;
  model?: string;
  systemNumber: number;
  x: number;
  y: number;
  isShared?: boolean;
  column: number; // Logical column position (0=solar, 1=inverter, 2=battery, etc.)
}

interface ConnectionLine {
  fromId: string;
  toId: string;
  color: string;
}

const ElectricalDiagram: React.FC<ElectricalDiagramProps> = ({
  systemLandings,
  activeSystems,
  connections,
  systemData,
}) => {
  // Layout constants - all boxes are square and tightly spaced
  const BOX_SIZE = moderateScale(70); // Square boxes - larger for text
  const VERTICAL_GAP = moderateScale(12); // Gap between systems
  const HORIZONTAL_GAP = moderateScale(8); // Extra tight horizontal spacing
  const START_X = moderateScale(16);
  const START_Y = moderateScale(16);

  // Build equipment list and connections
  const { equipmentItems, connectionLines } = useMemo(() => {
    const items: EquipmentItem[] = [];
    const lines: ConnectionLine[] = [];
    let currentY = START_Y;

    // Define column positions (left to right flow)
    const COLUMN_POSITIONS = {
      SOLAR: 0,
      INVERTER: 1,
      BATTERY: 2,
      SMS: 3,
      BACKUP_GATEWAY: 4,
      BOS_1: 5,
      BOS_2: 6,
      BOS_3: 7,
      COMBINER: 8,
      SUB_PANEL: 9,
      MAIN_PANEL: 10,
    };

    // ========================================================================
    // STEP 1: Build equipment for each system
    // ========================================================================
    activeSystems.forEach((sysNum) => {
      const prefix = `sys${sysNum}_`;
      const systemY = currentY;

      // Get system type
      const systemType = systemData?.[`${prefix}selectedsystem`];
      const isBatteryOnly = systemData?.[`${prefix}batteryonly`] === true;
      const isInverter = systemType === "inverter";
      const isMicroinverter = systemType === "microinverter";

      let lastEquipmentId: string | null = null;
      let equipmentColumn = 0;

      // ──────────────────────────────────────────────────────────────────
      // Column 0: Solar Panels (skip if battery-only)
      // ──────────────────────────────────────────────────────────────────
      if (!isBatteryOnly) {
        const solarMake = systemData?.[`${prefix}solar_panel_make`];
        const solarModel = systemData?.[`${prefix}solar_panel_model`];
        const solarQty = systemData?.[`${prefix}solar_panel_qty`];

        if (solarMake || solarModel || solarQty) {
          const solarId = `sys${sysNum}_solar`;
          items.push({
            id: solarId,
            type: "solar_panel",
            label: "Solar Panels",
            make: solarMake,
            model: solarQty ? `${solarModel} (${solarQty})` : solarModel,
            systemNumber: sysNum,
            x: START_X + COLUMN_POSITIONS.SOLAR * (BOX_SIZE + HORIZONTAL_GAP),
            y: systemY,
            column: COLUMN_POSITIONS.SOLAR,
          });
          lastEquipmentId = solarId;
          equipmentColumn = COLUMN_POSITIONS.SOLAR;
        }
      }

      // ──────────────────────────────────────────────────────────────────
      // Column 1: Inverter/Microinverter
      // ──────────────────────────────────────────────────────────────────
      const inverterMake = systemData?.[`${prefix}micro_inverter_make`];
      const inverterModel = systemData?.[`${prefix}micro_inverter_model`];
      const inverterQty = systemData?.[`${prefix}micro_inverter_qty`];

      if (inverterMake || inverterModel) {
        const inverterId = `sys${sysNum}_inverter`;
        items.push({
          id: inverterId,
          type: isMicroinverter ? "microinverter" : "inverter",
          label: isMicroinverter ? "Microinverter" : "Inverter",
          make: inverterMake,
          model: inverterQty ? `${inverterModel} (${inverterQty})` : inverterModel,
          systemNumber: sysNum,
          x: START_X + COLUMN_POSITIONS.INVERTER * (BOX_SIZE + HORIZONTAL_GAP),
          y: systemY,
          column: COLUMN_POSITIONS.INVERTER,
        });

        // Connect solar to inverter
        if (lastEquipmentId) {
          lines.push({
            fromId: lastEquipmentId,
            toId: inverterId,
            color: "#3B82F6", // Blue
          });
        }

        lastEquipmentId = inverterId;
        equipmentColumn = COLUMN_POSITIONS.INVERTER;
      }

      // ──────────────────────────────────────────────────────────────────
      // Column 2: Battery
      // ──────────────────────────────────────────────────────────────────
      const batteryMake = systemData?.[`${prefix}battery_make`];
      const batteryModel = systemData?.[`${prefix}battery_model`];
      const batteryQty = systemData?.[`${prefix}battery_quantity`];

      if (batteryMake || batteryModel) {
        const batteryId = `sys${sysNum}_battery`;
        items.push({
          id: batteryId,
          type: "battery",
          label: "Battery",
          make: batteryMake,
          model: batteryQty ? `${batteryModel} (${batteryQty})` : batteryModel,
          systemNumber: sysNum,
          x: START_X + COLUMN_POSITIONS.BATTERY * (BOX_SIZE + HORIZONTAL_GAP),
          y: systemY,
          column: COLUMN_POSITIONS.BATTERY,
        });

        // Connect inverter to battery
        if (lastEquipmentId) {
          lines.push({
            fromId: lastEquipmentId,
            toId: batteryId,
            color: "#10B981", // Green
          });
        }

        lastEquipmentId = batteryId;
        equipmentColumn = COLUMN_POSITIONS.BATTERY;
      }

      // ──────────────────────────────────────────────────────────────────
      // Column 3: Storage Management System (SMS)
      // ──────────────────────────────────────────────────────────────────
      const smsMake = systemData?.[`${prefix}sms_make`];
      const smsModel = systemData?.[`${prefix}sms_model`];

      if (smsMake || smsModel) {
        const smsId = `sys${sysNum}_sms`;
        items.push({
          id: smsId,
          type: "sms",
          label: "SMS",
          make: smsMake,
          model: smsModel,
          systemNumber: sysNum,
          x: START_X + COLUMN_POSITIONS.SMS * (BOX_SIZE + HORIZONTAL_GAP),
          y: systemY,
          column: COLUMN_POSITIONS.SMS,
        });

        // Connect battery to SMS
        if (lastEquipmentId) {
          lines.push({
            fromId: lastEquipmentId,
            toId: smsId,
            color: "#8B5CF6", // Purple
          });
        }

        lastEquipmentId = smsId;
        equipmentColumn = COLUMN_POSITIONS.SMS;
      }

      // ──────────────────────────────────────────────────────────────────
      // Column 4: Backup Gateway/Switch (for PowerWall systems)
      // ──────────────────────────────────────────────────────────────────
      const backupGatewayModel = systemData?.[`${prefix}backup_gateway_model`];

      // Check if this is a PowerWall system (Backup Gateway, Backup Switch, Gateway 3)
      const isPowerWallSystem = inverterModel && (
        String(inverterModel).toLowerCase().includes("powerwall") ||
        String(inverterModel).toLowerCase().includes("backup gateway") ||
        String(inverterModel).toLowerCase().includes("backup switch") ||
        String(inverterModel).toLowerCase().includes("gateway 3")
      );

      if (backupGatewayModel || isPowerWallSystem) {
        const backupGatewayId = `sys${sysNum}_backup_gateway`;

        // Determine the label based on model
        let gatewayLabel = "Backup Gateway";
        if (backupGatewayModel) {
          const modelStr = String(backupGatewayModel).toLowerCase();
          if (modelStr.includes("gateway 3")) {
            gatewayLabel = "Gateway 3";
          } else if (modelStr.includes("backup switch")) {
            gatewayLabel = "Backup Switch";
          }
        }

        items.push({
          id: backupGatewayId,
          type: "backup_gateway",
          label: gatewayLabel,
          model: backupGatewayModel,
          systemNumber: sysNum,
          x: START_X + COLUMN_POSITIONS.BACKUP_GATEWAY * (BOX_SIZE + HORIZONTAL_GAP),
          y: systemY,
          column: COLUMN_POSITIONS.BACKUP_GATEWAY,
        });

        // Connect last equipment to backup gateway
        if (lastEquipmentId) {
          lines.push({
            fromId: lastEquipmentId,
            toId: backupGatewayId,
            color: "#22C55E", // Emerald
          });
        }

        lastEquipmentId = backupGatewayId;
        equipmentColumn = COLUMN_POSITIONS.BACKUP_GATEWAY;
      }

      // ──────────────────────────────────────────────────────────────────
      // Columns 5, 6, 7: BOS Equipment (Type 1, 2, 3) - all inline
      // ──────────────────────────────────────────────────────────────────
      const bosPrefix = `bos_${prefix}`;

      for (let bosType = 1; bosType <= 3; bosType++) {
        const bosEquipmentType = systemData?.[`${bosPrefix}type${bosType}_equipment_type`];
        const bosActive = systemData?.[`${bosPrefix}type${bosType}_active`];
        const showBos = systemData?.[`${bosPrefix}show_type${bosType}`];

        if (bosEquipmentType && (bosActive || showBos)) {
          const bosId = `sys${sysNum}_bos_type${bosType}`;
          const bosColumn = bosType === 1 ? COLUMN_POSITIONS.BOS_1 :
                           bosType === 2 ? COLUMN_POSITIONS.BOS_2 :
                           COLUMN_POSITIONS.BOS_3;

          items.push({
            id: bosId,
            type: "bos_equipment",
            label: bosEquipmentType,
            systemNumber: sysNum,
            x: START_X + bosColumn * (BOX_SIZE + HORIZONTAL_GAP),
            y: systemY,
            column: bosColumn,
          });

          // Connect last equipment to first BOS
          if (lastEquipmentId && bosType === 1) {
            lines.push({
              fromId: lastEquipmentId,
              toId: bosId,
              color: "#EC4899", // Pink
            });
          }

          // Connect BOS types in sequence (1→2→3)
          if (bosType > 1) {
            const prevBosId = `sys${sysNum}_bos_type${bosType - 1}`;
            if (items.find(item => item.id === prevBosId)) {
              lines.push({
                fromId: prevBosId,
                toId: bosId,
                color: "#EC4899", // Pink
              });
            }
          }

          lastEquipmentId = bosId;
          equipmentColumn = bosColumn;
        }
      }

      // Move Y position down for next system (each system on its own row)
      currentY += BOX_SIZE + VERTICAL_GAP;
    });

    // ========================================================================
    // STEP 2: Add shared equipment (Combiner Panels, Sub Panels)
    // ========================================================================
    const combinerSystems = activeSystems.filter((sysNum) => {
      const landing = systemLandings[`system${sysNum}`];
      return landing?.includes("Combiner Panel");
    });

    if (combinerSystems.length > 0) {
      // Find vertical center of combiner systems
      const combinerItems = items.filter(item =>
        combinerSystems.includes(item.systemNumber)
      );

      if (combinerItems.length > 0) {
        const minY = Math.min(...combinerItems.map(item => item.y));
        const maxY = Math.max(...combinerItems.map(item => item.y));
        const centerY = (minY + maxY) / 2 - BOX_SIZE / 2;

        const combinerId = "combiner_panel";
        items.push({
          id: combinerId,
          type: "combiner_panel",
          label: "Combiner Panel",
          systemNumber: 0,
          x: START_X + COLUMN_POSITIONS.COMBINER * (BOX_SIZE + HORIZONTAL_GAP),
          y: centerY,
          isShared: true,
          column: COLUMN_POSITIONS.COMBINER,
        });

        // Connect systems to combiner
        combinerSystems.forEach((sysNum) => {
          const lastEquipment = items
            .filter(item => item.systemNumber === sysNum)
            .sort((a, b) => b.column - a.column)[0];

          if (lastEquipment) {
            lines.push({
              fromId: lastEquipment.id,
              toId: combinerId,
              color: "#EF4444", // Red
            });
          }
        });
      }
    }

    // ========================================================================
    // STEP 3: Add Sub Panel B (if used)
    // ========================================================================
    const subPanelSystems = activeSystems.filter((sysNum) => {
      const landing = systemLandings[`system${sysNum}`];
      return landing?.includes("Sub Panel B");
    });

    if (subPanelSystems.length > 0) {
      const subPanelItems = items.filter(item =>
        subPanelSystems.includes(item.systemNumber)
      );

      if (subPanelItems.length > 0) {
        const minY = Math.min(...subPanelItems.map(item => item.y));
        const maxY = Math.max(...subPanelItems.map(item => item.y));
        const centerY = (minY + maxY) / 2 - BOX_SIZE / 2;

        const subPanelId = "sub_panel_b";
        items.push({
          id: subPanelId,
          type: "sub_panel",
          label: "Sub Panel B",
          systemNumber: 0,
          x: START_X + COLUMN_POSITIONS.SUB_PANEL * (BOX_SIZE + HORIZONTAL_GAP),
          y: centerY,
          isShared: subPanelSystems.length > 1,
          column: COLUMN_POSITIONS.SUB_PANEL,
        });

        // Connect systems to sub panel
        subPanelSystems.forEach((sysNum) => {
          const lastEquipment = items
            .filter(item => item.systemNumber === sysNum)
            .sort((a, b) => b.column - a.column)[0];

          if (lastEquipment) {
            lines.push({
              fromId: lastEquipment.id,
              toId: subPanelId,
              color: "#EF4444", // Red
            });
          }
        });
      }
    }

    // ========================================================================
    // STEP 4: Add Main Panel A (always present)
    // ========================================================================
    let centerY = START_Y; // Default position

    if (items.length > 0) {
      const allItemsY = items.map(item => item.y);
      const minY = Math.min(...allItemsY);
      const maxY = Math.max(...allItemsY.map(y => y + BOX_SIZE));
      centerY = (minY + maxY) / 2 - BOX_SIZE / 2;
    }

    const mainPanelId = "main_panel_a";
    items.push({
      id: mainPanelId,
      type: "main_panel",
      label: "Main Panel A",
      systemNumber: 0,
      x: START_X + COLUMN_POSITIONS.MAIN_PANEL * (BOX_SIZE + HORIZONTAL_GAP),
      y: centerY,
      column: COLUMN_POSITIONS.MAIN_PANEL,
    });

    // Connect everything that doesn't have another destination to Main Panel
    activeSystems.forEach((sysNum) => {
      const landing = systemLandings[`system${sysNum}`];

      // If goes directly to main panel or combiner/sub panel that goes to main
      if (!landing || landing.includes("Main Panel")) {
        const lastEquipment = items
          .filter(item => item.systemNumber === sysNum)
          .sort((a, b) => b.column - a.column)[0];

        if (lastEquipment) {
          lines.push({
            fromId: lastEquipment.id,
            toId: mainPanelId,
            color: "#FD7332", // Orange
          });
        }
      }
    });

    // Connect combiner panel to main panel
    if (combinerSystems.length > 0) {
      lines.push({
        fromId: "combiner_panel",
        toId: mainPanelId,
        color: "#FD7332", // Orange
      });
    }

    // Connect sub panel to main panel
    if (subPanelSystems.length > 0) {
      lines.push({
        fromId: "sub_panel_b",
        toId: mainPanelId,
        color: "#FD7332", // Orange
      });
    }

    return {
      equipmentItems: items,
      connectionLines: lines,
    };
  }, [systemLandings, activeSystems, systemData]);

  // Calculate canvas dimensions
  const canvasWidth = moderateScale(800);
  const canvasHeight = Math.max(
    moderateScale(200),
    ...equipmentItems.map(item => {
      return item.y + BOX_SIZE + moderateScale(20);
    })
  );

  // Render connection arrow
  const renderArrow = (line: ConnectionLine, index: number) => {
    const fromItem = equipmentItems.find(item => item.id === line.fromId);
    const toItem = equipmentItems.find(item => item.id === line.toId);

    if (!fromItem || !toItem) return null;

    // Calculate connection points (from right edge to left edge) - all boxes are square
    const fromX = fromItem.x + BOX_SIZE;
    const fromY = fromItem.y + BOX_SIZE / 2;
    const toX = toItem.x;
    const toY = toItem.y + BOX_SIZE / 2;

    const midX = (fromX + toX) / 2;

    return (
      <View key={`arrow-${index}`} style={styles.arrowContainer}>
        {/* Horizontal line from equipment */}
        <View
          style={[
            styles.arrowLine,
            {
              position: "absolute",
              left: fromX,
              top: fromY - 1,
              width: midX - fromX,
              backgroundColor: line.color,
            },
          ]}
        />

        {/* Vertical line */}
        {fromY !== toY && (
          <View
            style={[
              styles.arrowLine,
              {
                position: "absolute",
                left: midX - 1,
                top: Math.min(fromY, toY),
                width: 2,
                height: Math.abs(toY - fromY),
                backgroundColor: line.color,
              },
            ]}
          />
        )}

        {/* Horizontal line to equipment */}
        <View
          style={[
            styles.arrowLine,
            {
              position: "absolute",
              left: midX,
              top: toY - 1,
              width: toX - midX - moderateScale(4),
              backgroundColor: line.color,
            },
          ]}
        />

        {/* Arrow head */}
        <View
          style={[
            styles.arrowHead,
            {
              position: "absolute",
              left: toX - moderateScale(4),
              top: toY - moderateScale(3),
              borderLeftColor: line.color,
            },
          ]}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={[styles.diagramCanvas, { width: canvasWidth, height: canvasHeight }]}>
          {/* Render all connection lines first (behind equipment) */}
          {connectionLines.map((line, index) => renderArrow(line, index))}

          {/* Render all equipment boxes */}
          {equipmentItems.map((item) => (
            <EquipmentBox
              key={item.id}
              type={item.type}
              label={item.label}
              make={item.make}
              model={item.model}
              x={item.x}
              y={item.y}
              systemNumber={item.systemNumber || undefined}
              isShared={item.isShared}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  diagramCanvas: {
    position: "relative",
  },
  arrowContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  arrowLine: {
    height: 2,
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: moderateScale(4),
    borderRightWidth: 0,
    borderTopWidth: moderateScale(3),
    borderBottomWidth: moderateScale(3),
    borderRightColor: "transparent",
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
});

export default ElectricalDiagram;
