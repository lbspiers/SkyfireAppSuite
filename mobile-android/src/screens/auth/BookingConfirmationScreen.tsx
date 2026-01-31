import React, { useState } from "react";
import {
  View,
  SafeAreaView,
  ScrollView,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import moment from "moment-timezone";
import { BLUE_TC_TB, ORANGE_TB } from "../../styles/gradient";

import Button from "../../components/Button";
import Text from "../../components/Text";
import { HeaderLogoComponent } from "../../components/Header";
import { styles } from "../../styles/registrationStyle";

type RouteParams = {
  BookingConfirmationScreen: {
    registrationData: {
      companyName: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    bookingData: {
      date: string;
      displayTime: string;
      arizonaDateTime: string;
    };
    confirmationNumber: string;
    userId: string;
  };
};

const BookingConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, "BookingConfirmationScreen">>();
  const { registrationData, bookingData, confirmationNumber } = route.params;

  // Get user's timezone
  const [userTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Phoenix";
    } catch (error) {
      return "America/Phoenix";
    }
  });

  const timezoneAbbr = moment.tz.zone(userTimezone)?.abbr(Date.now()) || userTimezone;
  const formattedDate = moment(bookingData.date).format("MMMM D, YYYY");

  const handleBackToLogin = () => {
    // Navigate back to login screen
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <LinearGradient
      colors={BLUE_TC_TB.colors}
      start={BLUE_TC_TB.start}
      end={BLUE_TC_TB.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <HeaderLogoComponent
              isTitle={false}
              back={false}
              applogo={true}
              onIconPress={() => {}}
            />
          </View>

          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <View style={styles.successCircle}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
          </View>

          {/* Confirmation Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.confirmationTitle}>
              Registration Complete!
            </Text>
            <Text style={styles.confirmationSubtitle}>
              Your demo has been scheduled successfully
            </Text>
            <Text style={[styles.confirmationSubtitle, { marginTop: 15, fontSize: 14 }]}>
              ✅ Our team has been notified and will prepare for your demo
            </Text>
            <Text style={[styles.confirmationSubtitle, { marginTop: 8, fontSize: 14 }]}>
              🔐 Your account is currently under review
            </Text>
            <Text style={[styles.confirmationSubtitle, { marginTop: 8, fontSize: 14 }]}>
              📧 You'll receive login access after approval
            </Text>
          </View>

          {/* Confirmation Details */}
          <View style={styles.confirmationCard}>
            <LinearGradient
              colors={ORANGE_TB.colors}
              start={ORANGE_TB.start}
              end={ORANGE_TB.end}
              style={styles.confirmationHeader}
            >
              <Text style={styles.confirmationNumber}>
                Confirmation #{confirmationNumber}
              </Text>
            </LinearGradient>

            <View style={styles.confirmationBody}>
              {/* User Info */}
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>
                  {registrationData.firstName} {registrationData.lastName}
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Company</Text>
                <Text style={styles.infoValue}>
                  {registrationData.companyName}
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>
                  {registrationData.email}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Demo Details */}
              <View style={styles.demoSection}>
                <Text style={styles.demoTitle}>Demo Appointment</Text>
                
                <View style={styles.demoDateTime}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateIcon}>📅</Text>
                    <Text style={styles.dateText}>{formattedDate}</Text>
                  </View>
                  
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeIcon}>🕐</Text>
                    <Text style={styles.timeText}>
                      {bookingData.displayTime} ({timezoneAbbr})
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Next Steps */}
          <View style={styles.nextStepsContainer}>
            <Text style={styles.nextStepsTitle}>What's Next?</Text>
            <View style={styles.nextStepsList}>
              <View style={styles.nextStepItem}>
                <LinearGradient
                  colors={ORANGE_TB.colors}
                  start={ORANGE_TB.start}
                  end={ORANGE_TB.end}
                  style={styles.nextStepNumber}
                >
                  <Text style={styles.nextStepNumberText}>1</Text>
                </LinearGradient>
                <Text style={styles.nextStepText}>
                  Save your confirmation number and demo details for your records
                </Text>
              </View>
              <View style={styles.nextStepItem}>
                <LinearGradient
                  colors={ORANGE_TB.colors}
                  start={ORANGE_TB.start}
                  end={ORANGE_TB.end}
                  style={styles.nextStepNumber}
                >
                  <Text style={styles.nextStepNumberText}>2</Text>
                </LinearGradient>
                <Text style={styles.nextStepText}>
                  Mark your calendar for the scheduled demo time
                </Text>
              </View>
              <View style={styles.nextStepItem}>
                <LinearGradient
                  colors={ORANGE_TB.colors}
                  start={ORANGE_TB.start}
                  end={ORANGE_TB.end}
                  style={styles.nextStepNumber}
                >
                  <Text style={styles.nextStepNumberText}>3</Text>
                </LinearGradient>
                <Text style={styles.nextStepText}>
                  Prepare any questions about solar solutions for your business
                </Text>
              </View>
            </View>
          </View>

          {/* Reminders */}
          <View style={styles.reminderContainer}>
            <Text style={styles.reminderTitle}>📱 Important Reminders</Text>
            <Text style={styles.reminderText}>
              • Your demo will be conducted via video call
              {"\n"}• Please ensure you have a stable internet connection
              {"\n"}• The session will last approximately 30-45 minutes
              {"\n"}• Access will be granted to the app during demo
            </Text>
          </View>

          {/* Back Button */}
          <View style={styles.backButtonContainer}>
            <Button
              title="Back"
              onPress={handleBackToLogin}
              selected={true}
              style={styles.backButton}
            />
          </View>

          {/* Support Info */}
          <View style={styles.supportContainer}>
            <Text style={styles.supportText}>
              Need to reschedule? Contact us at
            </Text>
            <Text style={styles.supportEmail}>Designs@SkyfireSD.com</Text>
            <Text style={styles.supportPhone}>(480) 759-3473</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default BookingConfirmationScreen;