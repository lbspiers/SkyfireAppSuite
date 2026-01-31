// src/screens/app/home/DashboardComponent.tsx
// MIGRATED TO RESPONSIVE SYSTEM - 2025-10-15

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import dayjs from "dayjs";
import { useResponsive } from "../../../utils/responsive-v2";

// Replace these with your actual icon paths:
const pencilIcon = require("../../../assets/Images/icons/pencil_icon_white.png");
const chevronIcon = require("../../../assets/Images/icons/chevron_down_white.png");

// Map your status → color here:
const STATUS_COLORS: Record<string, string> = {
  Survey: "#FF9500",
  Design: "#FD7332",
  Revision: "#EF3826",
  Permit: "#8FC3E0",
  Installed: "#5CADDB",
};

export const DashboardComponent = ({
  item,
  handleEdit,
}: {
  item: any;
  handleEdit: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const statusColor = STATUS_COLORS[item.type] || "#737E91";

  // Use responsive utilities
  const r = useResponsive();

  // Create responsive styles
  const styles = StyleSheet.create({
    wrapper: {
      width: "100%",
      marginBottom: 0,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: r.spacing.sm,
    },
    statusStrip: {
      width: r.moderateScale(32),
      justifyContent: "center",
      alignItems: "center",
      height: "100%",
    },
    statusText: {
      color: "#FFF",
      fontSize: r.fontSize(14),
      fontWeight: "700",
      transform: [{ rotate: "-90deg" }],
      textAlign: "center",
    },
    content: {
      flex: 1,
      paddingHorizontal: r.spacing.sm,
    },
    name: {
      color: "#FFF",
      fontSize: r.fontSize(18),
      fontWeight: "700",
    },
    address: {
      color: "#FFF",
      fontSize: r.fontSize(16),
      marginTop: r.spacing.xs,
    },
    projectId: {
      color: "#FFF",
      fontSize: r.fontSize(14),
      marginTop: r.spacing.xs,
      opacity: 0.7,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      paddingRight: r.spacing.sm,
    },
    iconBtn: {
      padding: r.spacing.sm,
    },
    icon: {
      width: r.moderateScale(24),
      height: r.moderateScale(24),
      tintColor: "#FFF",
    },
    expanded: {
      paddingHorizontal: r.spacing.sm,
      paddingVertical: r.spacing.sm,
    },
    expandedText: {
      color: "#FFF",
      fontSize: r.fontSize(14),
      marginBottom: r.spacing.xs,
    },
  });

  return (
    <View style={styles.wrapper}>
      <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.row}>
        {/* ← Vertical status strip */}
        <View style={[styles.statusStrip, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{item.type}</Text>
        </View>

        {/* ← Main info */}
        <View style={styles.content}>
          <Text style={styles.name}>
            {item.details.customer_first_name} {item.details.customer_last_name}
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            {item.company.address}, {item.company.city}, {item.company.state}{" "}
            {item.company.zip_code}
          </Text>
          <Text style={styles.projectId}>
            {item.details.installer_project_id}
          </Text>
        </View>

        {/* ← Action icons */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleEdit} style={styles.iconBtn}>
            <Image source={pencilIcon} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setExpanded((e) => !e)}
            style={styles.iconBtn}
          >
            <Image
              source={chevronIcon}
              style={[
                styles.icon,
                expanded && { transform: [{ rotate: "180deg" }] },
              ]}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ← Expanded detail panel */}
      {expanded && (
        <LinearGradient
          colors={["#0C1F3F", "transparent"]}
          style={styles.expanded}
        >
          <Text style={styles.expandedText}>
            Created: {dayjs(item._created_at).format("DD-MM-YYYY HH:mm")}
          </Text>
          <Text style={styles.expandedText}>{item.description}</Text>
        </LinearGradient>
      )}
    </View>
  );
};
