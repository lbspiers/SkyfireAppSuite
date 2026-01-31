// src/components/Modals/StatusModal.tsx

import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import DropdownComponent from "../Dropdown";
import { UpdateProjectStatus } from "../../api/project.service";
import { moderateScale, verticalScale } from "../../utils/responsive";

const STATUS_OPTIONS = [
  { label: "Sales", value: 0 },
  { label: "Site Survey", value: 1 },
  { label: "Design", value: 2 },
  { label: "Revisions", value: 3 },
  { label: "Permits", value: 4 },
  { label: "Install", value: 5 },
  { label: "Commissioning", value: 6 },
  { label: "Inspection", value: 7 },
  { label: "PTO", value: 8 },
  { label: "Canceled", value: 9 },
  { label: "On Hold", value: 10 },
];

const LIGHT = "#2E4161";
const MID = "#1D2A4F";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (newStatus: number) => void;
  currentStatus: number;
  projectUuid: string;
  companyId: string;
};

export default function StatusModal({
  visible,
  onClose,
  onConfirm,
  currentStatus,
  projectUuid,
  companyId,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      console.debug("[StatusModal] opened, resetting selection");
      setSelected(null);
    }
  }, [visible]);

  const handleConfirm = async () => {
    // only proceed if they've picked something new
    if (selected !== null && selected !== currentStatus) {
      console.debug(
        "[StatusModal] PATCHing completed_step →",
        selected,
        "for project",
        projectUuid
      );
      try {
        const resp = await UpdateProjectStatus(
          projectUuid,
          companyId,
          selected
        );
        console.debug("[StatusModal] response status:", resp.status);
        console.debug("[StatusModal] response data:", resp.data);
        if (resp.status === 200) {
          console.debug(
            "[StatusModal] status update succeeded, calling onConfirm"
          );
          onConfirm(selected);
        } else {
          console.warn(
            "[StatusModal] unexpected HTTP status:",
            resp.status,
            resp.data
          );
        }
      } catch (err: any) {
        console.error("[StatusModal] error calling UpdateProjectStatus:", err);
      }
    } else {
      console.debug(
        "[StatusModal] no change (selected:",
        selected,
        "current:",
        currentStatus,
        "), skipping API"
      );
    }
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient colors={[LIGHT, MID]} style={styles.container}>
          <Text style={styles.title}>Update Project Status</Text>

          <View style={styles.labelRow}>
            <Text style={styles.label}>Current Status:</Text>
            <Text style={styles.value}>
              {STATUS_OPTIONS.find((s) => s.value === currentStatus)?.label}
            </Text>
          </View>

          <DropdownComponent
            label="New Status"
            data={STATUS_OPTIONS}
            value={selected}
            onChange={(v) => {
              console.debug("[StatusModal] selected new status:", v);
              setSelected(v);
            }}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleConfirm}>
              <LinearGradient
                colors={["#FD7332", "#B92011"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.confirm}
              >
                <Text style={styles.confirmText}>Confirm</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(20),
  },
  container: {
    width: "100%",
    borderRadius: moderateScale(8),
    padding: moderateScale(20),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: "700",
    color: "#fff",
    marginBottom: verticalScale(20),
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(20),
  },
  label: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#aaa",
  },
  value: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: verticalScale(30),
  },
  cancel: {
    padding: moderateScale(12),
  },
  cancelText: {
    color: "#FFF",
    fontSize: moderateScale(16),
  },
  confirm: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(24),
    borderRadius: moderateScale(6),
  },
  confirmText: {
    color: "#FFF",
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
});
