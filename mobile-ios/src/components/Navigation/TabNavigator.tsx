import React, { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsive } from "../../utils/responsive";

// Screens (Main Tabs)
import SiteInformation from "../../screens/Project/Site";
import Equipment from "../../screens/Project/Equipment";
import StructuralScreen from "../../screens/Project/sturctural/StructuralScreen";
import Electrical from "../../screens/Project/electrical/Electrical";
import ReviewPage from "../../screens/ReviewPage";
import Home from "../../screens/app/home/Home";

// Screens (Hidden Tabs — use tab bar but not shown in nav)
import EquipmentDetails from "../../screens/Project/SystemDetails/components/EquipmentDetails";
import PhotoGalleryScreen from "../../screens/Project/Photos/PhotoGalleryScreen";
import BOS from "../../screens/Project/BalanceOfSystem/BOS";
import CombineBOS from "../../screens/Project/CombineBOS";

// Gradient Styles
import { ORANGE_TB, BLUE_MD_TB, BLUE_2C_BT } from "../../styles/gradient";

const Tab = createBottomTabNavigator();

// Gallery Tab Component - Navigates to PhotoGallery
const GalleryTabComponent: React.FC = () => {
  const navigation = useNavigation<any>();
  const currentProject = useSelector(
    (state: any) => state?.project?.currentProject || null
  );

  useEffect(() => {
    // Navigate to PhotoGallery immediately when this tab is focused
    const unsubscribe = navigation.addListener("focus", () => {
      try {
        // Get project ID from current project with defensive checks
        const projectId = currentProject?.uuid || currentProject?.id;

        if (typeof __DEV__ !== 'undefined' && __DEV__ && !projectId) {
          console.log(
            "[TabNavigator] No project ID available for PhotoGallery navigation"
          );
        }

        // Navigate to PhotoGalleryScreen with project context
        if (navigation && navigation.navigate) {
          navigation.navigate("PhotoGalleryScreen", {
            projectId: projectId || undefined,
            fromScreen: "Gallery",
          });
        }
      } catch (error) {
        console.error(
          "[TabNavigator] Failed to navigate to PhotoGallery:",
          error
        );
      }
    });

    return unsubscribe;
  }, [navigation, currentProject]);

  // Return null as we don't want to render anything
  // The navigation happens via the focus event listener
  return null;
};

// Responsive configuration function
const getTabConfig = () => {
  const { width, height } = Dimensions.get("window");
  const isTablet = width >= 768 || height >= 1024;
  const isAndroid = Platform.OS === 'android';
  
  // Android-specific adjustments
  const androidExtraHeight = isAndroid ? 20 : 0;
  
  // Tablets
  if (isTablet) {
    return {
      tabHeight: 80 + androidExtraHeight,
      iconSize: 64,  // Increased from 56
      fontSize: 16,
      iconScale: { standard: 0.65, gallery: 0.54, structural: 0.75 },
      iconTopOffset: isAndroid ? -8 : 0
    };
  }
  // Small phones (< 375px)
  else if (width < 375) {
    return {
      tabHeight: 55 + androidExtraHeight,
      iconSize: 44,  // Increased from 38
      fontSize: 10,
      iconScale: { standard: 0.55, gallery: 0.48, structural: 0.65 },
      iconTopOffset: isAndroid ? -6 : 0
    };
  }
  // Large phones (> 414px)
  else if (width > 414) {
    return {
      tabHeight: 70 + androidExtraHeight,
      iconSize: 56,  // Increased from 48
      fontSize: 14,
      iconScale: { standard: 0.62, gallery: 0.52, structural: 0.72 },
      iconTopOffset: isAndroid ? -8 : 0
    };
  }
  // Standard phones (375-414px)
  else {
    return {
      tabHeight: 65 + androidExtraHeight,
      iconSize: 52,  // Increased from 45
      fontSize: 12,
      iconScale: { standard: 0.6, gallery: 0.51, structural: 0.7 },
      iconTopOffset: isAndroid ? -7 : 0
    };
  }
};

const TabNavigator: React.FC = () => {
  const { widthPercentageToDP, verticalScale } = useResponsive();
  const insets = useSafeAreaInsets();

  // Device dimensions and responsive config
  const SCREEN_HEIGHT = Dimensions.get("window").height;
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const tabConfig = getTabConfig();

  // Platform-specific bottom offset
  const bottomOffset = Platform.OS === "android" 
    ? Math.max(insets.bottom, 20) // Android: minimum 20pt above system bar
    : insets.bottom; // iOS: just above home indicator

  // Responsive constants
  const TAB_BAR_HEIGHT = tabConfig.tabHeight;
  const ICON_CONTAINER_SIZE = tabConfig.iconSize;
  const ICON_RADIUS = ICON_CONTAINER_SIZE / 2;

  const ICON_IMAGE_TINT = {
    selected: "#FFFFFF",
    unselected: "#FD7332",
  };

  const ICON_SCALE = tabConfig.iconScale;

  const icons: Record<string, any> = {
    Site: require("../../assets/Images/icons/House_Icon_White.png"),
    Equipment: require("../../assets/Images/icons/tab2.png"),
    Electrical: require("../../assets/Images/icons/tab3.png"),
    Structural: require("../../assets/Images/icons/tab4.png"),
    Review: require("../../assets/Images/icons/tab5.png"),
    Gallery: require("../../assets/Images/icons/photo_gallery_white.png"),
  };

  const CustomTabBarBackground: React.FC = () => (
    <LinearGradient
      {...BLUE_MD_TB}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[
        StyleSheet.absoluteFillObject,
        {
          // Extend height to cover bottom area + safe areas, and extend top slightly to cover any gaps
          height: TAB_BAR_HEIGHT + bottomOffset + 50,
          top: -2, // Extend 2px upward to cover white line
          borderTopLeftRadius: TAB_BAR_HEIGHT / 2,
          borderTopRightRadius: TAB_BAR_HEIGHT / 2,
        },
      ]}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0C1F3F' }}>
      <Tab.Navigator
        initialRouteName="Site"
        sceneContainerStyle={{
          paddingBottom: TAB_BAR_HEIGHT + bottomOffset,
          backgroundColor: 'transparent',
          marginTop: 0,
          paddingTop: 0
        }}
        screenOptions={({ route, navigation }) => {
          // Get the currently focused route name
          const state = navigation.getState();
          const currentRoute = state?.routes[state.index];
          const focusedRouteName = currentRoute?.name;

          // Check if we're on a child screen of Equipment
          const equipmentChildScreens = ['EquipmentDetails'];
          const isOnEquipmentChild = equipmentChildScreens.includes(focusedRouteName || '');

          // Determine if this tab should be highlighted
          const shouldHighlight = route.name === focusedRouteName ||
                                 (route.name === 'Equipment' && isOnEquipmentChild);

          let iconScale = ICON_SCALE.standard;
          if (route.name === "Gallery") iconScale = ICON_SCALE.gallery;
          if (route.name === "Structural") iconScale = ICON_SCALE.structural;

          return {
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: {
              position: "absolute",
              bottom: 0, // Always stick to bottom
              height: TAB_BAR_HEIGHT + bottomOffset, // Include safe area in height
              borderTopLeftRadius: TAB_BAR_HEIGHT / 2,
              borderTopRightRadius: TAB_BAR_HEIGHT / 2,
              backgroundColor: "#0C1F3F", // Match the screen background to prevent white line
              paddingHorizontal: widthPercentageToDP("2%"),
              paddingBottom: bottomOffset, // Add padding for safe area
              elevation: Platform.OS === "android" ? 8 : 0,
              shadowColor: Platform.OS === "ios" ? "#000" : undefined,
              shadowOffset: Platform.OS === "ios" ? { width: 0, height: -3 } : undefined,
              shadowOpacity: Platform.OS === "ios" ? 0.1 : undefined,
              shadowRadius: Platform.OS === "ios" ? 3 : undefined,
            },
            tabBarBackground: () => <CustomTabBarBackground />,
            tabBarIcon: ({ focused }) => {
              // Use shouldHighlight instead of focused for Equipment tab
              const isHighlighted = shouldHighlight;

              const iconSource = icons[route.name];
              const tintColor = isHighlighted
                ? ICON_IMAGE_TINT.selected
                : ICON_IMAGE_TINT.unselected;
              const gradient = isHighlighted ? ORANGE_TB : BLUE_2C_BT;

              return (
                <View style={[styles.iconWrapper, { marginTop: tabConfig.iconTopOffset }]}>
                  <LinearGradient
                    {...gradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{
                      width: ICON_CONTAINER_SIZE,
                      height: ICON_CONTAINER_SIZE,
                      borderRadius: ICON_RADIUS,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Image
                      source={iconSource}
                      style={{
                        width: ICON_CONTAINER_SIZE * iconScale,
                        height: ICON_CONTAINER_SIZE * iconScale,
                        tintColor,
                        resizeMode: "contain",
                      }}
                    />
                  </LinearGradient>
                </View>
              );
            },
          };
        }}
      >
        {/* 🌟 VISIBLE SCREENS */}
        <Tab.Screen name="Site" component={SiteInformation} />
        <Tab.Screen name="Equipment" component={Equipment} />
        <Tab.Screen name="Electrical" component={Electrical} />
        <Tab.Screen name="Structural" component={StructuralScreen} />
        <Tab.Screen name="Review" component={ReviewPage} />
        <Tab.Screen name="Gallery" component={GalleryTabComponent} />

        {/* 🔒 HIDDEN SCREENS (footer still shows) */}
        <Tab.Screen
          name="EquipmentDetails"
          component={EquipmentDetails}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="PhotoGalleryScreen"
          component={PhotoGalleryScreen}
          options={{ tabBarButton: () => null }}
        />

        <Tab.Screen
          name="BOS"
          component={BOS}
          options={{ tabBarButton: () => null }}
        />

        <Tab.Screen
          name="CombineBOS"
          component={CombineBOS}
          options={{ tabBarButton: () => null }}
        />

        {/* 🔜 Add more hidden tabs below like this
        <Tab.Screen
          name="SystemDetails_sys2"
          component={SystemDetails_sys2}
          options={{ tabBarButton: () => null }}
        />
        */}
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
});

export default TabNavigator;
