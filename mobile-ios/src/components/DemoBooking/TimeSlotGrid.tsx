import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Text from "../Text";
import { ORANGE_TB } from "../../styles/gradient";

interface TimeSlot {
  date: string;
  time: string;
  displayTime: string;
  arizonaDateTime: string;
  available: boolean;
}

interface Props {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
}

const TimeSlotGrid: React.FC<Props> = ({
  slots,
  selectedSlot,
  onSlotSelect,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.grid}>
        {slots.map((slot) => {
          const isSelected = selectedSlot?.time === slot.time;
          const isAvailable = slot.available;
          
          if (isSelected && isAvailable) {
            // Render gradient button for selected slot
            return (
              <TouchableOpacity
                key={`${slot.date}-${slot.time}`}
                style={styles.timeSlotWrapper}
                onPress={() => onSlotSelect(slot)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  {...ORANGE_TB}
                  style={styles.gradientSlot}
                >
                  <Text style={styles.selectedText}>
                    {slot.displayTime}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }
          
          // Regular button for unselected/unavailable slots
          return (
            <TouchableOpacity
              key={`${slot.date}-${slot.time}`}
              style={[
                styles.timeSlot,
                !isAvailable && styles.unavailableSlot,
              ]}
              onPress={() => onSlotSelect(slot)}
              disabled={!isAvailable}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.timeText,
                !isAvailable && styles.unavailableText,
              ]}>
                {slot.displayTime}
              </Text>
              {!isAvailable && (
                <Text style={styles.bookedText}>Booked</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
    marginHorizontal: 20,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  timeSlotWrapper: {
    width: "31%",
    marginBottom: 10,
  },
  timeSlot: {
    width: "31%",
    paddingVertical: 15,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    marginBottom: 10,
  },
  gradientSlot: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unavailableSlot: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderColor: "rgba(255, 255, 255, 0.05)",
    opacity: 0.5,
  },
  timeText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  selectedText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  unavailableText: {
    color: "rgba(255, 255, 255, 0.3)",
  },
  bookedText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.3)",
    marginTop: 2,
  },
});

export default TimeSlotGrid;