// src/components/Account/TeamManagement.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useResponsive } from "../../utils/responsive";
import { ORANGE_TB } from "../../styles/gradient";
import AddUserModal from "./AddUserModal";
import DeleteUserModal from "./DeleteUserModal";
import {
  getCompanyUsers,
  deleteCompanyUser,
  resendInviteCode,
  CompanyUser,
} from "../../services/teamAPI";

interface TeamManagementProps {
  disabled?: boolean;
}

export default function TeamManagement({ disabled = false }: TeamManagementProps) {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addUserModalVisible, setAddUserModalVisible] = useState(false);
  const [deleteUserModalVisible, setDeleteUserModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<CompanyUser | null>(null);

  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  console.log("🔧 [TeamManagement] Component rendered");

  const loadUsers = async (isRefresh = false, silent = false) => {
    console.log("📡 [TeamManagement] loadUsers called - isRefresh:", isRefresh, "silent:", silent);

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log("📡 [TeamManagement] Calling getCompanyUsers API...");
      const result = await getCompanyUsers();
      console.log("📡 [TeamManagement] API response received:", {
        status: result.status,
        dataLength: result.data?.length || 0,
        data: result.data
      });

      if (result.status === "SUCCESS" && result.data) {
        console.log(`✅ [TeamManagement] Setting ${result.data.length} users to state`);
        setUsers(result.data);
      } else {
        // Don't show alert on initial load or silent refresh, just log
        console.warn("⚠️ [TeamManagement] Non-success response:", result.message);
        if (isRefresh && !silent) {
          Alert.alert("Error", result.message || "Failed to load team members");
        }
      }
    } catch (error: any) {
      console.error("❌ [TeamManagement] Error loading users:", error);
      console.error("❌ [TeamManagement] Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      // Only show alert if user initiated refresh and not silent
      if (isRefresh && !silent) {
        Alert.alert("Error", error?.message || "Unable to load team members");
      }
    } finally {
      console.log("🏁 [TeamManagement] loadUsers complete - setting loading states to false");
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log("🎬 [TeamManagement] useEffect triggered - calling loadUsers()");
    loadUsers();
  }, []);

  const handleUserAdded = () => {
    setAddUserModalVisible(false);
    // Silent refresh - don't show error alert if backend list fetch fails
    // User was already notified of successful addition
    loadUsers(true, true);
  };

  const handleDeleteUser = (user: CompanyUser) => {
    console.log("🗑️ [TeamManagement] handleDeleteUser called for:", {
      uuid: user.uuid,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`
    });

    setUserToDelete(user);
    setDeleteUserModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    console.log("🗑️ [TeamManagement] User confirmed removal, calling deleteCompanyUser API...");
    try {
      const result = await deleteCompanyUser(userToDelete.uuid);
      console.log("🗑️ [TeamManagement] Delete result:", result);

      if (result.status === "SUCCESS") {
        console.log("✅ [TeamManagement] User deleted successfully");
        Alert.alert("Success", "Team member removed successfully");
        setDeleteUserModalVisible(false);
        setUserToDelete(null);
        loadUsers(true);
      } else {
        console.warn("⚠️ [TeamManagement] Delete failed:", result.message);
        Alert.alert("Error", result.message || "Failed to remove team member");
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("❌ [TeamManagement] Delete error:", error);
      Alert.alert("Error", error?.message || "Failed to remove team member");
      throw error;
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteUserModalVisible(false);
    setUserToDelete(null);
  };

  const handleResendInvite = (user: CompanyUser) => {
    Alert.alert(
      "Resend Invite Code",
      `Send a new invite code to ${user.first_name} ${user.last_name}?\n\nEmail: ${user.email}\n\nThe new code will expire in 24 hours.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resend",
          onPress: async () => {
            try {
              const result = await resendInviteCode(user.email);
              if (result.status === "SUCCESS") {
                Alert.alert(
                  "Invite Sent! 📧",
                  `A new invite code has been sent to ${user.email}. The code expires in 24 hours.`
                );
              } else {
                Alert.alert("Error", result.message || "Failed to resend invite");
              }
            } catch (error: any) {
              console.error("Resend invite error:", error);
              Alert.alert("Error", error?.message || "Failed to resend invite. Please try again.");
            }
          },
        },
      ]
    );
  };

  const renderUserCard = ({ item }: { item: CompanyUser }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        {item.phone && <Text style={styles.userPhone}>📞 {item.phone}</Text>}
        <Text style={styles.userDate}>
          Added {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.resendButton}
          onPress={() => handleResendInvite(item)}
          disabled={disabled}
        >
          <Text style={styles.resendButtonText}>Resend Invite</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteUser(item)}
          disabled={disabled}
        >
          <Text style={styles.deleteButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Team Management</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FD7332" />
          <Text style={styles.loadingText}>Loading team members...</Text>
        </View>
      </View>
    );
  }

  console.log("🎨 [TeamManagement] Rendering - users.length:", users.length, "loading:", loading, "refreshing:", refreshing);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Team Management</Text>
          <Text style={styles.subtitle}>
            Manage your company's team members
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setAddUserModalVisible(true)}
          disabled={disabled}
        >
          <LinearGradient
            colors={ORANGE_TB.colors}
            start={ORANGE_TB.start}
            end={ORANGE_TB.end}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Add User</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No team members yet</Text>
          <Text style={styles.emptySubtext}>
            Add users to collaborate with your team
          </Text>
        </View>
      ) : (
        <View style={styles.listWrapper}>
          <FlatList
            data={users}
            renderItem={renderUserCard}
            keyExtractor={(item) => item.uuid}
            contentContainerStyle={styles.listContent}
            style={styles.listContainer}
            refreshing={refreshing}
            onRefresh={() => loadUsers(true)}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          />
          {/* Fade overlay at bottom when there are more than 5 users */}
          {users.length > 5 && (
            <LinearGradient
              colors={["transparent", "#1D2A4F"]}
              style={styles.fadeOverlay}
              pointerEvents="none"
            />
          )}
        </View>
      )}

      {/* Orange divider line */}
      <LinearGradient
        colors={["#FD7332", "#EF3826"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.dividerLine}
      />

      <AddUserModal
        visible={addUserModalVisible}
        onClose={() => setAddUserModalVisible(false)}
        onUserAdded={handleUserAdded}
      />

      <DeleteUserModal
        visible={deleteUserModalVisible}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        userName={userToDelete ? `${userToDelete.first_name} ${userToDelete.last_name}` : ""}
        userEmail={userToDelete?.email || ""}
      />
    </View>
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
    container: {
      marginHorizontal: moderateScale(20),
      marginTop: verticalScale(20),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: verticalScale(16),
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: font(22),
      fontWeight: "700",
      color: "#FFF",
      marginBottom: verticalScale(4),
    },
    subtitle: {
      fontSize: font(14),
      color: "#FFF",
      opacity: 0.7,
    },
    addButton: {
      paddingVertical: verticalScale(10),
      paddingHorizontal: moderateScale(16),
      borderRadius: moderateScale(8),
    },
    addButtonText: {
      fontSize: font(14),
      fontWeight: "600",
      color: "#FFF",
    },
    loadingContainer: {
      paddingVertical: verticalScale(40),
      alignItems: "center",
    },
    loadingText: {
      marginTop: verticalScale(12),
      fontSize: font(16),
      color: "#FFF",
      opacity: 0.7,
    },
    emptyContainer: {
      paddingVertical: verticalScale(60),
      alignItems: "center",
    },
    emptyIcon: {
      fontSize: font(60),
      marginBottom: verticalScale(16),
    },
    emptyText: {
      fontSize: font(18),
      fontWeight: "600",
      color: "#FFF",
      marginBottom: verticalScale(8),
    },
    emptySubtext: {
      fontSize: font(14),
      color: "#FFF",
      opacity: 0.7,
      textAlign: "center",
    },
    listWrapper: {
      position: "relative",
    },
    listContainer: {
      // Each card: padding(16*2) + content(~80) + marginBottom(12) ≈ 124
      // 5 cards * 124 ≈ 620 scaled units
      maxHeight: verticalScale(620),
    },
    listContent: {
      paddingBottom: verticalScale(20),
    },
    fadeOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: verticalScale(80),
    },
    dividerLine: {
      height: verticalScale(2),
      marginHorizontal: moderateScale(20),
      marginTop: verticalScale(20),
      marginBottom: 0,
    },
    userCard: {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: moderateScale(12),
      padding: moderateScale(16),
      marginBottom: verticalScale(12),
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    userInfo: {
      flex: 1,
      marginRight: moderateScale(12),
    },
    userName: {
      fontSize: font(18),
      fontWeight: "600",
      color: "#FFF",
      marginBottom: verticalScale(4),
    },
    userEmail: {
      fontSize: font(14),
      color: "#FFF",
      opacity: 0.8,
      marginBottom: verticalScale(2),
    },
    userPhone: {
      fontSize: font(13),
      color: "#FFF",
      opacity: 0.7,
      marginBottom: verticalScale(2),
    },
    userDate: {
      fontSize: font(12),
      color: "#FFF",
      opacity: 0.5,
      marginTop: verticalScale(4),
    },
    actionButtons: {
      flexDirection: "column",
      gap: verticalScale(8),
    },
    resendButton: {
      paddingVertical: verticalScale(8),
      paddingHorizontal: moderateScale(12),
      borderRadius: moderateScale(6),
      borderWidth: 1.5,
      borderColor: "#FD7332",
      backgroundColor: "rgba(253, 115, 50, 0.1)",
    },
    resendButtonText: {
      fontSize: font(13),
      fontWeight: "600",
      color: "#FD7332",
      textAlign: "center",
    },
    deleteButton: {
      paddingVertical: verticalScale(8),
      paddingHorizontal: moderateScale(12),
      borderRadius: moderateScale(6),
      borderWidth: 1.5,
      borderColor: "#FF6B6B",
      backgroundColor: "rgba(255, 107, 107, 0.1)",
    },
    deleteButtonText: {
      fontSize: font(13),
      fontWeight: "600",
      color: "#FF6B6B",
      textAlign: "center",
    },
  });
