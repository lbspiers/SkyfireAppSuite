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

interface DateInfo {
  date: string;
  displayDate: string;
  dayName: string;
  fullDate: string;
}

interface Props {
  availableDates: DateInfo[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const DemoCalendar: React.FC<Props> = ({
  availableDates,
  selectedDate,
  onDateSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Date</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {availableDates.map((dateInfo) => {
          const isSelected = dateInfo.date === selectedDate;
          
          if (isSelected) {
            return (
              <TouchableOpacity
                key={dateInfo.date}
                style={styles.dateCardWrapper}
                onPress={() => onDateSelect(dateInfo.date)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  {...ORANGE_TB}
                  style={styles.selectedGradientCard}
                >
                  <Text style={styles.selectedText}>
                    {dateInfo.dayName}
                  </Text>
                  <Text style={styles.selectedDateNumber}>
                    {dateInfo.displayDate}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }
          
          return (
            <TouchableOpacity
              key={dateInfo.date}
              style={styles.dateCard}
              onPress={() => onDateSelect(dateInfo.date)}
              activeOpacity={0.7}
            >
              <Text style={styles.dayName}>
                {dateInfo.dayName}
              </Text>
              <Text style={styles.dateNumber}>
                {dateInfo.displayDate}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 15,
    gap: 10,
  },
  dateCardWrapper: {
    width: 75,
    height: 90,
    marginHorizontal: 5,
  },
  dateCard: {
    width: 75,
    height: 90,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  selectedGradientCard: {
    width: 75,
    height: 90,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayName: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 5,
    fontWeight: "500",
  },
  dateNumber: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  selectedText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  selectedDateNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
export default DemoCalendar;
