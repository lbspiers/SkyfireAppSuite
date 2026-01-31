// src/components/Drawer/index.tsx

import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
  Text,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  CommonActions,
  DrawerActions,
  useNavigation,
} from "@react-navigation/native";
import { useDrawerStatus } from "@react-navigation/drawer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { setTokens } from "../../store/slices/authSlice";
import { adminAPI } from "../../services/adminAPI";
import FlameToggleButton from "../FlameToggleButton";
import Button from "../Button";

const DrawerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const auth = useSelector((state: any) => state.auth);
  const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === "open";
  const [pressedButton, setPressedButton] = React.useState<string | null>(null);

  // Component mount logging
  React.useEffect(() => {
    console.log("📱 [DRAWER] Component mounted");

    return () => {
      console.log("📱 [DRAWER] Component unmounting");
    };
  }, []);

  // User state logging
  React.useEffect(() => {
    console.log("👤 [USER STATE] Auth state changed:", {
      isAuthenticated: auth?.isAuthenticated,
      hasAccessToken: !!auth?.accessToken,
      hasRefreshToken: !!auth?.refreshToken,
      timestamp: new Date().toISOString(),
    });
  }, [auth]);

  // Navigation state logging
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("state", (e) => {
      console.log(
        "🧭 [NAVIGATION] State changed:",
        e.data?.state?.routeNames || "Unknown"
      );
    });

    return unsubscribe;
  }, [navigation]);

  React.useEffect(() => {
    const checkSuperAdminStatus = async () => {
      console.log("🔍 [ADMIN CHECK] Starting super admin verification...");
      console.log("🔍 [ADMIN CHECK] Current auth state:", {
        isAuthenticated: auth?.isAuthenticated,
        hasToken: !!auth?.accessToken,
      });

      try => {
        console.log("🔍 [ADMIN CHECK] Calling /org/verify-access endpoint...");
        const response = await adminAPI.verifyAdminAccess();

        console.log("✅ [ADMIN CHECK] API Response:", response);
        console.log("✅ [ADMIN CHECK] Admin status:", response.data?.isAdmin);

        if (response.status === "SUCCESS" && response.data?.isAdmin) {
          console.log("✅ [ADMIN CHECK] User verified as super admin");
          setIsSuperAdmin(true);
        } else {
          console.log("❌ [ADMIN CHECK] User is not a super admin");
          setIsSuperAdmin(false);
        }
      } catch (error: any) {
        console.log("❌ [ADMIN CHECK] Admin verification failed:", error);
        console.log("❌ [ADMIN CHECK] Error details:", {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });
        setIsSuperAdmin(false);
      }
    };

    if (auth?.isAuthenticated && auth?.accessToken) {
      checkSuperAdminStatus();
    } else {
      console.log(
        "⚠️ [ADMIN CHECK] User not authenticated, skipping admin verification"
      );
      setIsSuperAdmin(false);
    }
  }, [auth?.isAuthenticated, auth?.accessToken]);

  async function logOutUser() {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");

    dispatch(setTokens({ accessToken: "", refreshToken: "" }));

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  }

  const navButton = (label: string, onPress: () => void) => {
    const isPressed = pressedButton === label;

    return (
      <Button
        title={label}
        onPress={() => {
          setPressedButton(label);
          // Reset after a short delay to show the press effect
          setTimeout(() => setPressedButton(null), 200);
          onPress();
        }}
        selected={isPressed}
        width="100%"
        height={45}
        rounded={40}
        style={styles.buttonTouchable}
      />
    );
  };

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header container - matches SmallHeader structure exactly */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }} />
            <View style={styles.flameContainer}>
              <FlameToggleButton top={0} right={0} />
            </View>
          </View>
        </View>

        {/* Navigation buttons */}
        <View style={styles.buttonsContainer}>
          {navButton("Projects", () => navigation.navigate("Home"))}
          {navButton("Inventory", () => navigation.navigate("Inventory"))}
          {navButton("Account", () => navigation.navigate("Account"))}
          {(() => {
            console.log("🎯 [DRAWER RENDER] isSuperAdmin:", isSuperAdmin);
            console.log(
              "🎯 [DRAWER RENDER] Will show admin panel:",
              isSuperAdmin
            );
            if (isSuperAdmin) {
              console.log("🎯 [DRAWER RENDER] Rendering Admin Panel button");
              return navButton("Admin Panel", () => {
                console.log("🎯 [NAVIGATION] Admin Panel button tapped");
                navigation.navigate("AdminPanel");
              });
            }
            return null;
          })()}
          {navButton("Support", () => {
            console.log("🎫 [NAVIGATION] Support button tapped");
            navigation.navigate("Protected", {
              screen: "SupportTicket",
            });
          })}
          {navButton("Log Out", logOutUser)}
        </View>

        {/* Version info - bottom right */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>v2.1.31 (34)</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default DrawerScreen;

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  headerContainer: {
    width: "100%",
    paddingTop: StatusBar.currentHeight || 35,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  flameContainer: {
    width: 58,
    height: 58,
    position: "relative",
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    rowGap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  buttonTouchable: {
    marginBottom: 12,
  },
  versionContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  versionText: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 10,
    fontFamily: "monospace",
  },
});
