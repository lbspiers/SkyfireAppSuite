// src/screens/app/account/AccountScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  DrawerActions,
  CommonActions,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { setTokens } from "../../../store/slices/authSlice";
import SmallHeader from "../../../components/Header/SmallHeader";
import CompanyLogoUpload from "../../../components/Account/CompanyLogoUpload";
import AccountInfoForm from "../../../components/Account/AccountInfoForm";
import TeamManagement from "../../../components/Account/TeamManagement";
import DeleteAccountModal from "../../../components/Account/DeleteAccountModal";
import { UserProfile, getUserProfile } from "../../../services/accountAPI";
import { useResponsive } from "../../../utils/responsive";

const LIGHT = "#2E4161";
const MID = "#1D2A4F";

export default function AccountScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  const handleDrawerPress = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");

    dispatch(setTokens({ accessToken: "", refreshToken: "" }));

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  };

  const loadUserProfile = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await getUserProfile();
      if (result.status === "SUCCESS" && result.data) {
        setUserProfile(result.data);
      } else {
        Alert.alert("Error", result.message || "Failed to load profile data");
      }
    } catch (error: any) {
      console.error("Profile loading error:", error);
      const errorMessage =
        error?.message ||
        "Unable to load profile. Please check your connection.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  const handleLogoUpdated = (logoUrl?: string) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        profilePhotoUrl: logoUrl,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleAccountDeleted = () => {
    Alert.alert(
      "Account Deleted",
      "Your account has been permanently deleted. You will now be logged out.",
      [{ text: "OK", onPress: handleLogout }]
    );
  };

  // const handleChangePassword = () => {
  //   Alert.alert(
  //     "Change Password",
  //     "Password change functionality will be implemented in a future update.",
  //     [{ text: "OK" }]
  //   );
  // };

  if (loading && !userProfile) {
    return (
      <LinearGradient
        colors={[LIGHT, MID]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top }]}
      >
        <SmallHeader title="Account" onDrawerPress={handleDrawerPress} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!userProfile) {
    return (
      <LinearGradient
        colors={[LIGHT, MID]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top }]}
      >
        <SmallHeader title="Account" onDrawerPress={handleDrawerPress} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load profile</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadUserProfile()}
          >
            <LinearGradient
              colors={["#FD7332", "#EF3826"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryButtonGradient}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[LIGHT, MID]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.gradient, { paddingTop: insets.top }]}
    >
      <SmallHeader title="Account" onDrawerPress={handleDrawerPress} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadUserProfile(true)}
            tintColor="#FD7332"
            colors={["#FD7332"]}
          />
        }
      >
        {/* Company Logo Section */}
        <CompanyLogoUpload
          currentLogoUrl={userProfile.profilePhotoUrl}
          onLogoUpdated={handleLogoUpdated}
          disabled={refreshing}
        />

        {/* Account Information Form */}
        <AccountInfoForm
          userProfile={userProfile}
          onProfileUpdated={handleProfileUpdated}
          disabled={refreshing}
        />

        {/* Team Management Section */}
        <TeamManagement disabled={refreshing} />

        {/* Danger Zone - Moved to bottom */}

        {/* Account Details */}
        <View style={styles.accountDetailsContainer}>
          <LinearGradient
            colors={["#FD7332", "#B92011"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.accountDetailsGradientBorder}
          >
            <View style={styles.accountDetails}>
              <Text style={styles.detailsTitle}>Account Details</Text>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>User ID:</Text>
                <Text style={styles.detailValue}>
                  {(() => {
                    if (userProfile.uuid && userProfile.uuid.length >= 6) {
                      return `...${userProfile.uuid.slice(-6)}`;
                    }
                    return userProfile.id || "N/A";
                  })()}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Member since:</Text>
                <Text style={styles.detailValue}>
                  {(() => {
                    try {
                      // Check for both field names: created_at (from backend) and createdAt (camelCase)
                      const dateString =
                        userProfile.created_at || userProfile.createdAt;

                      if (
                        dateString &&
                        dateString !== "null" &&
                        dateString !== "undefined" &&
                        typeof dateString === "string" &&
                        dateString.trim() !== ""
                      ) {
                        const date = new Date(dateString);
                        if (
                          !isNaN(date.getTime()) &&
                          date.getFullYear() > 1970
                        ) {
                          // Format as "August 13, 2024"
                          return date.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          });
                        }
                      }
                      return "N/A";
                    } catch (e) {
                      return "N/A";
                    }
                  })()}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Last updated:</Text>
                <Text style={styles.detailValue}>N/A</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Danger Zone - Bottom section for destructive actions */}
        <View style={styles.dangerZoneSection}>
          <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
          <Text style={styles.dangerZoneSubtitle}>
            Permanent actions that cannot be undone
          </Text>

          <View style={styles.dangerZoneCard}>
            <View style={styles.dangerActionInfo}>
              <Text style={styles.dangerActionTitle}>Delete Account</Text>
              <Text style={styles.dangerActionDescription}>
                Permanently delete your account and remove all personal data
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={() => setDeleteModalVisible(true)}
              disabled={refreshing}
            >
              <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onAccountDeleted={handleAccountDeleted}
        userEmail={userProfile.email}
      />
    </LinearGradient>
  );
}

const makeStyles = ({
  moderateScale,
  verticalScale,
  font,
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
  font: (n: number) => number;
}) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: verticalScale(20),
      paddingBottom: verticalScale(30),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: font(18),
      color: "#FFF",
      opacity: 0.7,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: moderateScale(20),
    },
    errorText: {
      fontSize: font(20),
      color: "#FFF",
      marginBottom: verticalScale(20),
      textAlign: "center",
    },
    retryButton: {
      // No flex styles needed
    },
    retryButtonGradient: {
      paddingVertical: verticalScale(12),
      paddingHorizontal: moderateScale(24),
      borderRadius: moderateScale(8),
      alignItems: "center",
    },
    retryButtonText: {
      fontSize: font(18),
      fontWeight: "600",
      color: "#FFF",
    },
    dangerZoneSection: {
      paddingHorizontal: moderateScale(20),
      paddingVertical: verticalScale(30),
      marginTop: verticalScale(20),
    },
    dangerZoneTitle: {
      fontSize: font(22),
      fontWeight: "700",
      color: "#FF6B6B",
      marginBottom: verticalScale(8),
      textAlign: "center",
    },
    dangerZoneSubtitle: {
      fontSize: font(16),
      color: "#FFF",
      opacity: 0.7,
      textAlign: "center",
      marginBottom: verticalScale(20),
    },
    dangerZoneCard: {
      backgroundColor: "rgba(255, 107, 107, 0.1)",
      borderRadius: moderateScale(12),
      padding: moderateScale(20),
      borderWidth: 1,
      borderColor: "rgba(255, 107, 107, 0.3)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dangerActionInfo: {
      flex: 1,
      marginRight: moderateScale(16),
    },
    dangerActionTitle: {
      fontSize: font(18),
      fontWeight: "600",
      color: "#FF6B6B",
      marginBottom: verticalScale(4),
    },
    dangerActionDescription: {
      fontSize: font(14),
      color: "#FFF",
      opacity: 0.8,
      lineHeight: font(18),
    },
    deleteAccountButton: {
      paddingVertical: verticalScale(10),
      paddingHorizontal: moderateScale(20),
      borderRadius: moderateScale(8),
      borderWidth: 2,
      borderColor: "#FF6B6B",
      backgroundColor: "rgba(255, 107, 107, 0.2)",
    },
    deleteAccountButtonText: {
      fontSize: font(16),
      fontWeight: "600",
      color: "#FF6B6B",
      textAlign: "center",
    },
    accountDetailsContainer: {
      marginHorizontal: moderateScale(20),
    },
    accountDetailsGradientBorder: {
      borderRadius: moderateScale(8),
      padding: moderateScale(1.5), // This creates the border width
    },
    accountDetails: {
      paddingHorizontal: moderateScale(20),
      paddingVertical: verticalScale(20),
      backgroundColor: "#1D2A4F", // Solid background like the TextInput
      borderRadius: moderateScale(6.5), // Slightly smaller to account for gradient border
    },
    detailsTitle: {
      fontSize: font(20),
      fontWeight: "600",
      color: "#FFF",
      marginBottom: verticalScale(16),
      textAlign: "center",
    },
    detailItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: verticalScale(8),
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    detailLabel: {
      fontSize: font(16),
      color: "#FFF",
      opacity: 0.7,
    },
    detailValue: {
      fontSize: font(16),
      color: "#FFF",
      fontWeight: "500",
    },
  });
