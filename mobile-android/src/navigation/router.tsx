// src/navigation/router.tsx - UPDATED FOR EDGE-TO-EDGE DISPLAY

import React, { useEffect, useState } from "react";
import { Image, StatusBar, BackHandler } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer, DefaultTheme, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Auth + Onboarding
import AuthGuard from "../api/authguard";
import LoginScreen from "../screens/auth/Login";
import Registration from "../screens/auth/Registration";
import RedeemInviteCodeScreen from "../screens/auth/RedeemInviteCodeScreen";
import PasswordResetEmailScreen from "../screens/auth/PasswordResetEmailScreen";
import PasswordResetCodeScreen from "../screens/auth/PasswordResetCodeScreen";
import PasswordResetNewPasswordScreen from "../screens/auth/PasswordResetNewPasswordScreen";
import PasswordResetSuccessScreen from "../screens/auth/PasswordResetSuccessScreen";
import ChangePassword from "../screens/auth/ChangePassword";
import OtpScreen from "../screens/auth/Otp";
import SuccessScreen from "../screens/auth/Success";
import WelcomeScreen from "../screens/auth/Welcome";

// 3-Step Registration Screens
import TellUsAboutYourselfScreen from "../screens/auth/TellUsAboutYourselfScreen";
import CreatePasswordScreen from "../screens/auth/CreatePasswordScreen";
import BookDemoScreen from "../screens/auth/BookDemoScreen";
import BookingConfirmationScreen from "../screens/auth/BookingConfirmationScreen";
import CompanyAddress from "../screens/intro/CompanyAddress";
import UploadLogo from "../screens/intro/UploadLogo";
import Inventory from "../screens/intro/Inventory";
import AddInventory from "../screens/intro/AddInventory";
import InventoryCategory from "../screens/intro/InventoryCategory";
import ServiceTerritory from "../screens/intro/ServiceTerritory";
import TerritoryDetails from "../screens/auth/TerritoryDetails";
// TODO: Custom keyboard disabled - using hardware keyboard
// import { GlobalKeyboardProvider } from "../components/CustomKeyboard/GlobalKeyboardProvider";

// Core App
import DashboardScreenOptimized from "../screens/app/home/DashboardScreenOptimized";
import DrawerScreen from "../components/Drawer";
import ReviewPage from "../screens/ReviewPage";
import SandboxScreen from "../screens/app/SandboxScreen";
import AccountScreen from "../screens/app/account/AccountScreen";
import AdminPanel from "../screens/admin/AdminPanel";
import InventoryScreen from "../screens/app/inventory/InventoryScreen";
import EquipmentCategoryScreen from "../screens/app/inventory/EquipmentCategoryScreen";

// Support Screens
import SupportTicketScreen from "../screens/support/SupportTicketScreen";
import MyTicketsScreen from "../screens/support/MyTicketsScreen";
import TicketDetailsScreen from "../screens/support/TicketDetailsScreen";

// Project Steps
import ProjectInformation from "../screens/Project/ProjectInformation";
import Submitted from "../screens/Project/Submitted";
import GeneratePage from "../screens/GeneratePage";
import EquipmentDetails_sys1 from "../screens/Project/SystemDetails/components/EquipmentDetails";
import BalanceOfSystem from "../screens/Project/BalanceOfSystem/BalanceOfSystem";

// Photo Gallery
import PhotoGalleryScreen from "../screens/Project/Photos/PhotoGalleryScreen";

// Electrical
import LoadCalcs from "../screens/Project/electrical/LoadCalcs";
import LoadCalculationsScreen from "../screens/Project/LoadCalculations";

// Context
import { PhotoCaptureProvider } from "../context/PhotoCaptureContext";

// Extracted navigator
import TabNavigator from "../components/Navigation/TabNavigator";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Force all screens to start at absolute top
const ForceTopTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent",
  },
};

// Force screens to start at y=0 (no status bar offset)
const forceTopScreenOptions = {
  headerShown: false,
  contentStyle: {
    backgroundColor: "transparent",
    paddingTop: 0,
    marginTop: 0,
  },
  // Remove all automatic spacing
  safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
};

const ProtectedScreens = () => (
  <AuthGuard redirectTo="Login">
    <Stack.Navigator screenOptions={forceTopScreenOptions}>
      <Stack.Screen
        name="Home"
        component={DashboardScreenOptimized}
        options={forceTopScreenOptions}
      />
      <Stack.Screen
        name="Project"
        component={ProjectInformation}
        options={forceTopScreenOptions}
      />
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={forceTopScreenOptions}
      />
      <Stack.Screen
        name="GeneratePage"
        component={GeneratePage}
        options={{
          headerShown: true,
          title: "Generate",
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
          contentStyle: { paddingTop: 0, marginTop: 0 },
        }}
      />
      <Stack.Screen
        name="EquipmentDetails_sys1"
        component={EquipmentDetails_sys1}
        options={forceTopScreenOptions}
      />
      <Stack.Screen
        name="BalanceOfSystem"
        component={BalanceOfSystem}
        options={forceTopScreenOptions}
      />
      <Stack.Screen
        name="PhotoGallery"
        component={PhotoGalleryScreen}
        options={{
          ...forceTopScreenOptions,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="LoadCalcs"
        component={LoadCalcs}
        options={forceTopScreenOptions}
      />
      <Stack.Screen
        name="LoadCalculations"
        component={LoadCalculationsScreen}
        options={forceTopScreenOptions}
      />
      <Stack.Screen
        name="SupportTicket"
        component={SupportTicketScreen}
        options={forceTopScreenOptions}
      />
      <Stack.Screen
        name="MyTickets"
        component={MyTicketsScreen}
        options={forceTopScreenOptions}
      />
      <Stack.Screen
        name="TicketDetails"
        component={TicketDetailsScreen}
        options={forceTopScreenOptions}
      />
      <Stack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={forceTopScreenOptions}
      />
      <Stack.Screen
        name="EquipmentCategory"
        component={EquipmentCategoryScreen}
        options={forceTopScreenOptions}
      />
    </Stack.Navigator>
  </AuthGuard>
);

const IntroScreens = () => (
  <Stack.Navigator
    initialRouteName="WelcomeScreen"
    screenOptions={forceTopScreenOptions}
  >
    <Stack.Screen
      name="WelcomeScreen"
      component={WelcomeScreen}
      options={forceTopScreenOptions}
    />
    <Stack.Screen
      name="CompanyAddress"
      component={CompanyAddress}
      options={forceTopScreenOptions}
    />
    <Stack.Screen
      name="UploadLogo"
      component={UploadLogo}
      options={forceTopScreenOptions}
    />
    <Stack.Screen
      name="Inventory"
      component={Inventory}
      options={forceTopScreenOptions}
    />
    <Stack.Screen
      name="AddInventory"
      component={AddInventory}
      options={forceTopScreenOptions}
    />
    <Stack.Screen
      name="serviceTerritory"
      component={ServiceTerritory}
      options={forceTopScreenOptions}
    />
    <Stack.Screen
      name="TerritoryDetails"
      component={TerritoryDetails}
      options={forceTopScreenOptions}
    />
    <Stack.Screen
      name="InventoryCategory"
      component={InventoryCategory}
      options={forceTopScreenOptions}
    />
  </Stack.Navigator>
);

const Router: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState("Login");
  const isAuthenticated = useSelector(
    (state: any) => state?.auth?.isAuthenticated
  );
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const determineInitialRoute = async () => {
      try {
        // Add defensive check for AsyncStorage availability
        if (!AsyncStorage || typeof AsyncStorage.getItem !== "function") {
          console.warn("AsyncStorage not available, defaulting to Login");
          setInitialRoute("Login");
          return;
        }

        const token = await AsyncStorage.getItem("accessToken");
        // More explicit route determination
        if (token && token.length > 0) {
          setInitialRoute("Protected");
        } else if (isAuthenticated) {
          setInitialRoute("Protected");
        } else {
          setInitialRoute("Login");
        }
      } catch (error) {
        console.error("Error fetching token from AsyncStorage:", error);
        // Safe fallback to Login screen
        setInitialRoute("Login");
      }
    };

    // Add small delay to ensure AsyncStorage is initialized
    const timeoutId = setTimeout(() => {
      determineInitialRoute();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated]);

  // Global Android hardware back button handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true; // Prevent default behavior (app exit)
      }
      return false; // Allow default behavior (app exit) if no navigation history
    });

    return () => backHandler.remove();
  }, [navigationRef]);

  return (
    // TODO: Custom keyboard disabled - using hardware keyboard
    // <GlobalKeyboardProvider>
      <NavigationContainer ref={navigationRef} theme={ForceTopTheme}>
        <PhotoCaptureProvider>
        <Drawer.Navigator
          drawerContent={() => <DrawerScreen />}
          screenOptions={{
            headerShown: false,
            drawerPosition: "right",
            drawerStyle: { width: "100%" },
            drawerType: "slide",
            // Force drawer content to start at top
            sceneContainerStyle: {
              backgroundColor: "transparent",
              paddingTop: 0,
              marginTop: 0,
            },
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="IntroScreens"
            component={IntroScreens}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="Home"
            component={DashboardScreenOptimized}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="Registration"
            component={Registration}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="RedeemInviteCode"
            component={RedeemInviteCodeScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="TellUsAboutYourselfScreen"
            component={TellUsAboutYourselfScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="CreatePasswordScreen"
            component={CreatePasswordScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="BookDemoScreen"
            component={BookDemoScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="BookingConfirmationScreen"
            component={BookingConfirmationScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="PasswordResetEmailScreen"
            component={PasswordResetEmailScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="PasswordResetCodeScreen"
            component={PasswordResetCodeScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="PasswordResetNewPasswordScreen"
            component={PasswordResetNewPasswordScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="PasswordResetSuccessScreen"
            component={PasswordResetSuccessScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="SuccessScreen"
            component={SuccessScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="Protected"
            component={ProtectedScreens}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePassword}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="OtpScreen"
            component={OtpScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="Submitted"
            component={Submitted}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="Sandbox"
            component={SandboxScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="Review"
            component={ReviewPage}
            options={{
              headerShown: true,
              headerTitle: "Review",
              headerTransparent: true,
              headerStyle: { backgroundColor: "transparent" },
              contentStyle: { paddingTop: 0, marginTop: 0 },
              headerRight: () => (
                <Image
                  source={require("../assets/Images/appIcon.png")}
                  style={{ marginRight: 10, height: 30, width: 30 }}
                  resizeMode="contain"
                />
              ),
            }}
          />
          <Stack.Screen
            name="PhotoGallery"
            component={PhotoGalleryScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="Account"
            component={AccountScreen}
            options={forceTopScreenOptions}
          />
          <Stack.Screen
            name="AdminPanel"
            component={AdminPanel}
            options={forceTopScreenOptions}
          />
        </Drawer.Navigator>
        </PhotoCaptureProvider>
      </NavigationContainer>
    // </GlobalKeyboardProvider>
  );
};

export default Router;
