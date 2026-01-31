import React, { useState } from "react";
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { spacing, radii, shadows, typography } from "../../theme/theme";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface Props {
  visible: boolean;
  initial: { city: string; state: string; zip: string };
  onApply: (vals: { city: string; state: string; zip: string }) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function FilterModal({
  visible,
  initial,
  onApply,
  onReset,
  onClose,
}: Props) {
  const [city, setCity] = useState(initial.city);
  const [state, setState] = useState(initial.state);
  const [zip, setZip] = useState(initial.zip);

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.sheet}>
          <Text style={[typography.h2, { marginBottom: spacing.sm }]}>
            Advanced Filters
          </Text>
          <TextInput
            placeholder="City"
            value={city}
            onChangeText={setCity}
            style={modalStyles.input}
          />
          <TextInput
            placeholder="State"
            value={state}
            onChangeText={setState}
            style={modalStyles.input}
          />
          <TextInput
            placeholder="Zip"
            value={zip}
            onChangeText={setZip}
            style={modalStyles.input}
            keyboardType="numeric"
          />
          <View style={modalStyles.buttons}>
            <TouchableOpacity
              onPress={() => {
                setCity("");
                setState("");
                setZip("");
                onReset();
              }}
              style={modalStyles.btn}
            >
              <Text>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onApply({ city, state, zip })}
              style={[modalStyles.btn, modalStyles.applyBtn]}
            >
              <Text style={{ color: "#fff" }}>Apply</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onClose} style={modalStyles.close}>
            <Text>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    backgroundColor: "#fff",
    padding: spacing.md,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  input: {
    borderWidth: moderateScale(1),
    borderColor: "#ccc",
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.sm,
    alignItems: "center",
    marginHorizontal: spacing.xs,
    borderWidth: moderateScale(1),
    borderColor: "#ccc",
  },
  applyBtn: {
    backgroundColor: "#EF622B",
    borderColor: "#EF622B",
  },
  close: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
  },
});
