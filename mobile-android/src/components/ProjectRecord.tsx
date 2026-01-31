import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";

// icons
const pencilIcon = require("../assets/Images/icons/pencil_icon_white.png");
const chevronIcon = require("../assets/Images/icons/chevron_down_white.png");

const STATUS_COLORS: Record<string, string> = {
  Sales: "#FF9500",
  "Site Survey": "#FFD700",
  Design: "#FD7332",
  Revisions: "#EF3826",
  Permits: "#8FC3E0",
  Install: "#5CADDB",
  Commissioning: "#39CCCC",
  Inspection: "#3D9970",
  PTO: "#2ECC40",
  Canceled: "#B22222",
  "On Hold": "#AAAAAA",
};

export interface ProjectRecordProps {
  name: string;
  streetAddress: string;
  cityStateZip: string;
  projectId: string;
  status: string;
  onEdit: () => void;
  onToggleDetails: () => void;
  onStatusPress?: () => void; // 👈 added hook
}

export default function ProjectRecord({
  name,
  streetAddress,
  cityStateZip,
  projectId,
  status,
  onEdit,
  onToggleDetails,
  onStatusPress,
}: ProjectRecordProps) {
  const [expanded, setExpanded] = useState(false);
  const stripColor = STATUS_COLORS[status] || "#737E91";

  return (
    <View style={styles.wrapper}>
      {/* 1) Gradient separator */}
      <LinearGradient
        colors={["#FD7332", "#B92011"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.separator}
      />

      {/* 2) Main row */}
      <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.row}>
        {/* 2a) Touchable status strip */}
        <TouchableOpacity
          style={[styles.statusStrip, { backgroundColor: stripColor }]}
          onPress={onStatusPress}
        >
          <Text style={styles.statusText} numberOfLines={1}>
            {status}
          </Text>
        </TouchableOpacity>

        {/* 2b) Info block */}
        <View style={styles.content}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.line}>{streetAddress}</Text>
          <Text style={styles.line}>{cityStateZip}</Text>
          <Text style={styles.projectId}>{projectId}</Text>
        </View>

        {/* 2c) Icon controls */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
            <Image source={pencilIcon} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setExpanded((e) => !e);
              onToggleDetails();
            }}
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

      {/* 3) Expanded area */}
      {expanded && (
        <LinearGradient
          colors={["#0C1F3F", "transparent"]}
          style={styles.expanded}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: 0,
  },
  separator: {
    height: 2,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    height: 120,
  },
  statusStrip: {
    width: 30,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    transform: [{ rotate: "-90deg" }],
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingLeft: 12,
    paddingTop: 12,
  },
  name: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  line: {
    color: "#FFF",
    fontSize: 16,
    marginTop: 2,
  },
  projectId: {
    color: "#FFF",
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  actions: {
    paddingTop: 12,
    paddingRight: 12,
    justifyContent: "flex-start",
  },
  iconBtn: {
    padding: 4,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: "#FFF",
  },
  expanded: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
