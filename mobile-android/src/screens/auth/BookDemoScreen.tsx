import React, { useState, useEffect } from "react";
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import moment from "moment-timezone";

import Button from "../../components/Button";
import Text from "../../components/Text";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import { styles } from "../../styles/registrationStyle";
import { BLUE_TC_TB } from "../../styles/gradient";
import DemoCalendar from "../../components/DemoBooking/DemoCalendar";
import TimeSlotGrid from "../../components/DemoBooking/TimeSlotGrid";
import axiosInstance from "../../api/axiosInstance";
import apiEndpoints from "../../config/apiEndPoint";
import { register } from "../../api/auth.service";

type RouteParams = {
  BookDemoScreen: {
    userInfo: {
      companyName: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    passwordInfo: {
      password: string;
    };
  };
};

interface TimeSlot {
  date: string;
  time: string;
  displayTime: string;
  arizonaDateTime: string;
  available: boolean;
}

const BookDemoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, "BookDemoScreen">>();
  const { userInfo, passwordInfo } = route.params;

  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedSlots, setHasLoadedSlots] = useState(false);
  const [conflictedSlots, setConflictedSlots] = useState<Set<string>>(new Set());
  const [timeSlotsCollapsed, setTimeSlotsCollapsed] = useState(false);
  // Get user's timezone using JavaScript's built-in Intl API
  const [userTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Phoenix";
    } catch (error) {
      return "America/Phoenix";
    }
  });

  // Generate next 14 days
  const getAvailableDates = () => {
    const dates = [];
    const startDate = moment.tz("America/Phoenix").add(2, "days");
    
    for (let i = 0; i < 14; i++) {
      const date = startDate.clone().add(i, "days");
      dates.push({
        date: date.format("YYYY-MM-DD"),
        displayDate: date.format("MMM DD"),
        dayName: date.format("ddd"),
        fullDate: date.format("MMMM D, YYYY"),
      });
    }
    
    return dates;
  };

  const availableDates = getAvailableDates();

  // Get minimum booking time (24 hours from now in Arizona time)
  const getMinimumBookingTime = () => {
    return moment.tz("America/Phoenix").add(24, "hours");
  };

  // Generate time slots for selected date
  const generateTimeSlots = (date: string): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const selectedDay = moment.tz(date, "America/Phoenix");
    const minimumTime = getMinimumBookingTime();
    
    // Generate slots from 9 AM to 9 PM (30-minute increments)
    for (let hour = 9; hour < 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = selectedDay.clone().hour(hour).minute(minute).second(0);
        
        // Only include slots that are at least 24 hours from now
        if (slotTime.isAfter(minimumTime)) {
          // Convert Arizona time to user's local time for display
          const localTime = slotTime.clone().tz(userTimezone);
          
          slots.push({
            date: date,
            time: slotTime.format("HH:mm:ss"),
            displayTime: localTime.format("h:mm A"),
            arizonaDateTime: slotTime.format("YYYY-MM-DD HH:mm:ss"),
            available: true,
          });
        }
      }
    }
    
    return slots;
  };

  // Fetch available slots from backend
  const fetchAvailableSlots = async (date: string) => {
    // Prevent duplicate calls
    if (refreshing) {
      console.log('⏳ [DEMO] Already fetching slots, skipping...');
      return;
    }

    console.log('📅 [DEMO] Fetching slots for date:', date);
    setRefreshing(true);
    try {
      // Check with backend for actual availability
      const response = await axiosInstance.get(
        `${apiEndpoints.BASE_URL}${apiEndpoints.DEMO.AVAILABLE_SLOTS}`,
        {
          params: {
            date,
            timezone: "America/Phoenix",
          },
        }
      );
      
      // Use slots from backend response
      const slots = response.data.slots || [];
      
      // Mark conflicted slots as unavailable
      const updatedSlots = slots.map((slot: TimeSlot) => {
        const slotKey = `${slot.date}_${slot.time}`;
        if (conflictedSlots.has(slotKey)) {
          return { ...slot, available: false, reason: "Recently booked" };
        }
        return slot;
      });
      
      setAvailableSlots(updatedSlots);
      setHasLoadedSlots(true);
    } catch (error) {
      console.error("Error fetching slots:", error);
      // Use local generation as fallback
      setAvailableSlots(generateTimeSlots(date));
      setHasLoadedSlots(true);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setHasLoadedSlots(false);
    // Fetch will happen in useEffect
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (slot.available) {
      setSelectedTimeSlot(slot);
      setTimeSlotsCollapsed(true); // Auto-collapse after selection
    }
  };

  // Complete registration and book demo
  const handleSubmit = async () => {
    if (!selectedTimeSlot) {
      Alert.alert("Please select a time", "You must select a date and time for your demo.");
      return;
    }

    setLoading(true);

    try {
      // First check if slot is still available
      const checkResponse = await axiosInstance.post(
        `${apiEndpoints.BASE_URL}${apiEndpoints.DEMO.CHECK_AVAILABILITY}`,
        {
          date: selectedTimeSlot.date,
          time: selectedTimeSlot.time,
        }
      );

      if (!checkResponse.data.available) {
        // Slot was taken - show conflict message
        Alert.alert(
          "Time Slot Unavailable",
          "Sorry, this time slot was just booked by someone else. Please select another available time.",
          [
            {
              text: "OK",
              onPress: () => {
                // Mark this slot as conflicted
                const slotKey = `${selectedTimeSlot.date}_${selectedTimeSlot.time}`;
                setConflictedSlots(prev => new Set(prev).add(slotKey));
                
                // Update the slots to show this one as unavailable
                setAvailableSlots(prevSlots => 
                  prevSlots.map(slot => {
                    if (slot.date === selectedTimeSlot.date && slot.time === selectedTimeSlot.time) {
                      return { ...slot, available: false, reason: "Recently booked" };
                    }
                    return slot;
                  })
                );
                
                // Clear selection
                setSelectedTimeSlot(null);
              },
            },
          ]
        );
        setLoading(false);
        return;
      }

      // Slot is available - proceed with registration
      const registrationData = {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userInfo.email,
        phone: userInfo.phone, // Backend expects 'phone', not 'phoneNo'
        companyName: userInfo.companyName,
        password: passwordInfo.password,
        demoBooking: {
          date: selectedTimeSlot.date,
          time: selectedTimeSlot.time,
          timezone: "America/Phoenix",
        },
      };

      console.log('📤 [DEMO] Sending registration data:', {
        ...registrationData,
        password: '***hidden***', // Don't log password
      });

      // Complete registration with demo booking
      const response = await axiosInstance.post(
        `${apiEndpoints.BASE_URL}${apiEndpoints.AUTH.REGISTER_COMPLETE}`,
        registrationData
      );

      console.log('✅ [DEMO] Registration successful:', response.data);

      // Navigate to confirmation screen
      navigation.navigate("BookingConfirmationScreen", {
        registrationData: {
          ...userInfo,
          ...passwordInfo,
        },
        bookingData: {
          ...selectedTimeSlot,
          userTimezone: userTimezone,
        },
        confirmationNumber: response.data.confirmationNumber,
        userId: response.data.userId,
      });
    } catch (error: any) {
      console.error('❌ [DEMO] Registration failed:', error.response?.data);

      let errorMessage = "An error occurred during registration. Please try again.";

      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Backend returned validation errors array
        errorMessage = error.response.data.errors.join('\n');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("Registration Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load slots when date changes
  useEffect(() => {
    if (selectedDate && !hasLoadedSlots && !refreshing) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, hasLoadedSlots, refreshing]);

  // Select first available date by default
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0].date);
    }
  }, []);

  return (
    <LinearGradient
      {...BLUE_TC_TB}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header with back button */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate("CreatePasswordScreen", { userInfo })}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
              <Text style={styles.backButtonLabel}>Back</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <Image
              source={require("../../assets/Images/appIcon.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: "100%" }]} />
            </View>
            <Text style={styles.progressText}>Step 3 of 3</Text>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Schedule Your Demo</Text>
            <Text style={styles.subtitle}>
              Select a convenient time for your personalized Skyfire Solar demo
            </Text>
          </View>

          {/* Important Notice */}
          <View style={styles.noticeContainer}>
            <Text style={styles.noticeTitle}>📅 Important Notice</Text>
            <Text style={styles.noticeText}>
              • All times shown are in your local timezone ({moment.tz.zone(userTimezone)?.abbr(Date.now()) || userTimezone})
              {"\n"}• Appointments must be booked at least 24 hours in advance
              {"\n"}• Demo sessions typically last 30-45 minutes
            </Text>
          </View>

          {/* Calendar */}
          <DemoCalendar
            availableDates={availableDates}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />

          {/* Time Slots */}
          {selectedDate && (
            <>
              <View style={styles.timeSlotsHeader}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.timeSlotsTitle}>
                      Available Times for {availableDates.find(d => d.date === selectedDate)?.fullDate}
                    </Text>
                    <Text style={styles.timeSlotsSubtitle}>
                      Times shown in {moment.tz.zone(userTimezone)?.abbr(Date.now()) || userTimezone} ({userTimezone})
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    {selectedTimeSlot && (
                      <TouchableOpacity
                        onPress={() => setTimeSlotsCollapsed(!timeSlotsCollapsed)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 15,
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        <Text style={{ color: "#FD7332", fontSize: 12, fontWeight: "600" }}>
                          {timeSlotsCollapsed ? "Change Time" : "Collapse"}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {!refreshing && (
                      <TouchableOpacity
                        onPress={() => {
                          setHasLoadedSlots(false);
                          // Will trigger reload via useEffect
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 15,
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        <Text style={{ color: "#FD7332", fontSize: 12, fontWeight: "600" }}>
                          Refresh
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {!timeSlotsCollapsed ? (
                refreshing ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator />
                  </View>
                ) : availableSlots.length > 0 ? (
                  <TimeSlotGrid
                    slots={availableSlots}
                    selectedSlot={selectedTimeSlot}
                    onSlotSelect={handleTimeSlotSelect}
                  />
                ) : (
                  <View style={styles.noSlotsContainer}>
                    <Text style={styles.noSlotsText}>
                      No available time slots for this date.
                      {"\n"}Please select another date.
                    </Text>
                  </View>
                )
              ) : null}
            </>
          )}

          {/* Selected Time Summary - Always visible when slot selected */}
          {selectedTimeSlot && (
            <View style={[styles.summaryContainer, { marginTop: timeSlotsCollapsed ? 10 : 20 }]}>
              <Text style={styles.summaryTitle}>✓ Selected Appointment</Text>
              <Text style={styles.summaryText}>
                {availableDates.find(d => d.date === selectedTimeSlot.date)?.fullDate}
              </Text>
              <Text style={styles.summaryText}>
                {selectedTimeSlot.displayTime} (Arizona Time)
              </Text>
              {userTimezone !== "America/Phoenix" && (
                <Text style={styles.summaryText}>
                  {(() => {
                    const arizonaMoment = moment.tz(
                      `${selectedTimeSlot.date} ${selectedTimeSlot.time}`,
                      "America/Phoenix"
                    );
                    const localMoment = arizonaMoment.clone().tz(userTimezone);
                    return `${localMoment.format("h:mm A")} (Your Local Time)`;
                  })()}
                </Text>
              )}
            </View>
          )}

          {/* Complete Registration Button */}
          <View style={{ marginTop: 20, marginBottom: 60, paddingHorizontal: 20 }}>
            <Button
              title={loading ? "Processing..." : "Complete Registration & Book Demo"}
              onPress={handleSubmit}
              selected={!!selectedDate && !!selectedTimeSlot}
              disabled={loading || !selectedDate || !selectedTimeSlot}
              width="100%"
              height={50}
              rounded={25}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      {loading && <ActivityIndicator />}
    </LinearGradient>
  );
};

export default BookDemoScreen;