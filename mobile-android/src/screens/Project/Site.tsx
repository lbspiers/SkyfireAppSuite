// src/screens/Project/Site.tsx (Enhanced with Street View and AHJ automation)
import React, { useEffect, useRef, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Modal,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { Formik, FormikProps } from "formik";
import * as Yup from "yup";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import {
  DrawerActions,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";

import {
  SaveProjectSiteInfo,
  GetProjectDetails,
  getUtilities,
} from "../../api/project.service";
import {
  saveSystemDetails,
  fetchSystemDetails,
} from "../../api/systemDetails.service";
import { fetchUtilityRequirements } from "../../api/utility.service"; // 🔥 TEST: COMMENT OUT LATER
import { triggerPlanAutomation } from "../../api/apiModules/triggerPlanAutomation";
import { setProject } from "../../store/slices/projectSlice";
import { useAhjPolling } from "../../hooks/useAhjPolling";
import { useProjectContext } from "../../hooks/useProjectContext";
import { usePhotoCapture } from "../../hooks/usePhotoCapture";
// TODO: Disabled Street View analytics - needs backend endpoint implementation
// import { useStreetViewCaptureSimple } from "../../hooks/useStreetViewCapture";
// TODO: Custom keyboard disabled - using hardware keyboard
// import { useGlobalKeyboard } from "../../components/CustomKeyboard/GlobalKeyboardProvider";
// import { streetViewAnalyticsService } from "../../services/streetViewAnalytics.service";
import {
  APP_LOCAL_TRIGGER_SECRET,
  APP_TRIGGER_COMPUTER_NAME,
  GOOGLE_MAPS_API_KEY,
} from "@env";

// Fallback API key - only used if environment variable fails to load
const FALLBACK_API_KEY = "AIzaSyBTIEUeUnP1QWoLBzmdWE1x0R_N4UlN4dQ";

import LargeHeader from "../../components/Header/LargeHeader";
import TextInput from "../../components/TextInput";
import Dropdown from "../../components/Dropdown";
import JurisdictionInput from "../../components/JurisdictionInput";
import MapScreen from "../../components/Modals/MapScreen";
import NumericKeypad from "../../components/NumericKeypad";

import { moderateScale, verticalScale } from "../../utils/responsive";
import { BLUE_MD_TB } from "../../styles/gradient";

const mapIcon = require("../../assets/Images/icons/map_icon_white.png");
const cameraIcon = require("../../assets/Images/icons/camera.png");

interface FormValues {
  jurisdiction: string;
  utility: string;
  houseSqFt: string;
  apn: string;
}

export default function SiteInformation() {
  const formikRef = useRef<FormikProps<FormValues>>(null);
  const dispatch = useDispatch();
  const navigation: any = useNavigation();

  const projectInfo = useSelector((s: any) => s.project.currentProject);
  const companyProfile = useSelector((s: any) => s.profile.profile);

  // Defensive checks for project data structure
  const site = projectInfo?.site || {};
  const details = projectInfo?.details || {};
  const companyUuid = projectInfo?.company?.uuid;

  // Show loading state if critical project data is missing
  if (!projectInfo || !projectInfo.uuid) {
    return (
      <LinearGradient {...BLUE_MD_TB} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FD7332" />
            <Text style={{ color: '#FFFFFF', marginTop: 20, fontSize: 16 }}>
              Loading project data...
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [siteNote, setSiteNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);

  // Single edit mode for ALL header fields (name, address, city/state/zip, project ID)
  const [isEditingAll, setIsEditingAll] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>("");
  const [editedStreet, setEditedStreet] = useState<string>("");
  const [editedCityStateZip, setEditedCityStateZip] = useState<string>("");
  const [editedProjectId, setEditedProjectId] = useState<string>("");

  // Numeric keypad state for House Sq. Ft.
  const [numericKeypadVisible, setNumericKeypadVisible] = useState(false);
  const [numericKeypadValue, setNumericKeypadValue] = useState("");

  // Track current form values to preserve during AHJ refresh
  const currentFormValuesRef = useRef<FormValues>({
    jurisdiction: "",
    utility: "",
    houseSqFt: "",
    apn: "",
  });

  // Street View states
  const [streetViewUri, setStreetViewUri] = useState("");
  const [satelliteViewUri, setSatelliteViewUri] = useState("");
  const [streetViewLoading, setStreetViewLoading] = useState(false);
  const [streetViewAvailable, setStreetViewAvailable] = useState(true);
  const [optimalHeading, setOptimalHeading] = useState(0);
  const [houseCoordinates, setHouseCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // AHJ polling hook
  const { ahjStatus, startAhjPolling, resetAhjStatus } = useAhjPolling();
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();

  // Street View analytics hooks - TODO: Disabled - needs backend endpoint implementation
  // const { captureAnalytics, isCapturing: isAnalyticsCapturing } =
  //   useStreetViewCaptureSimple();

  // TODO: Custom keyboard disabled - using hardware keyboard
  // Get custom keyboard visibility state
  // const globalKeyboard = useGlobalKeyboard();
  // const customKeyboardVisible = globalKeyboard.isVisible;

  // Debug: log when custom keyboard state changes
  // console.log("Custom keyboard visible:", customKeyboardVisible);

  // raw utilities from API (string[])
  const [utilities, setUtilities] = useState<string[]>([]);
  const [utilLoading, setUtilLoading] = useState(false);
  const [utilErr, setUtilErr] = useState<string | null>(null);

  // 🔥 TEST: Utility requirements (combination field) - COMMENT OUT LATER
  const [utilityRequirements, setUtilityRequirements] = useState<any>(null);

  // house_sqft from system-details API
  const [houseSqFt, setHouseSqFt] = useState<number | null>(null);
  const [houseSqFtLoading, setHouseSqFtLoading] = useState(false);

  // adapt to Dropdown: [{label, value}]
  const utilityOptions = useMemo(
    () => utilities.map((u) => ({ label: u, value: u })),
    [utilities]
  );

  const isCalifornia = site.state === "CA";

  // Merge database values with any unsaved form values (to preserve data during AHJ refresh)
  const initialValues: FormValues = {
    jurisdiction: currentFormValuesRef.current.jurisdiction || site.ahj || "",
    utility: currentFormValuesRef.current.utility || site.utility || "",
    houseSqFt: currentFormValuesRef.current.houseSqFt || (houseSqFt ? String(houseSqFt) : ""),
    apn: currentFormValuesRef.current.apn || site.apn || "",
  };

  console.log(
    "🏠 Site data loaded - house_sqft from system-details:",
    houseSqFt,
    "converted to form:",
    houseSqFt ? String(houseSqFt) : ""
  );
  console.log("🏠 Full site object for debugging:", site);

  // Enhanced Street View URL builder with smart heading detection
  const buildStreetViewUrl = (
    address: string,
    options: {
      size?: string;
      fov?: number;
      heading?: number;
      pitch?: number;
    } = {}
  ) => {
    const {
      size = "400x200",
      fov = 90,
      heading = optimalHeading,
      pitch = 0,
    } = options;

    const location = encodeURIComponent(address);
    const apiKey = FALLBACK_API_KEY;

    return (
      `https://maps.googleapis.com/maps/api/streetview` +
      `?location=${location}` +
      `&size=${size}` +
      `&fov=${fov}` +
      `&heading=${heading}` +
      `&pitch=${pitch}` +
      `&key=${apiKey}`
    );
  };

  // Advanced house-facing detection using multiple data sources
  const determineOptimalHeading = async (address: string): Promise<number> => {
    try {
      const apiKey = FALLBACK_API_KEY;

      // Step 1: Get detailed geocoding information
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`;
      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const houseLocation = result.geometry.location;

        // ADD THIS LINE - Store coordinates for MapScreen
        setHouseCoordinates({ lat: houseLocation.lat, lng: houseLocation.lng });

        // Step 2: Get Street View metadata to find camera position
        const svMetadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${houseLocation.lat},${houseLocation.lng}&key=${apiKey}`;
        const svResponse = await fetch(svMetadataUrl);
        const svData = await svResponse.json();

        if (svData.status === "OK" && svData.location) {
          const cameraLocation = svData.location;

          // Step 3: Calculate bearing from camera to house
          const bearing = calculateBearing(
            cameraLocation.lat,
            cameraLocation.lng,
            houseLocation.lat,
            houseLocation.lng
          );

          console.log("🏠 House location:", houseLocation);
          console.log("📷 Camera location:", cameraLocation);
          console.log("🧭 Calculated bearing to house:", bearing + "°");

          return Math.round(bearing);
        }

        // Fallback to advanced heuristics if metadata fails
        return await fallbackHeadingDetection(address, result);
      }

      return 180; // Default south-facing
    } catch (error) {
      console.log("Error in advanced heading detection:", error);
      return 180;
    }
  };

  // Calculate bearing between two geographic points
  const calculateBearing = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360
  };

  // Enhanced fallback detection using multiple heuristics
  const fallbackHeadingDetection = async (
    address: string,
    geocodeResult: any
  ): Promise<number> => {
    const addressComponents = geocodeResult.address_components;
    const streetNumber = addressComponents.find((comp: any) =>
      comp.types.includes("street_number")
    );
    const route = addressComponents.find((comp: any) =>
      comp.types.includes("route")
    );

    if (streetNumber && route) {
      const number = parseInt(streetNumber.long_name);
      const streetName = route.long_name.toLowerCase();

      if (!isNaN(number)) {
        // Use nearby addresses to determine street orientation
        const nearbyAddresses = await getNearbyAddresses(
          geocodeResult.geometry.location,
          streetName
        );
        const streetOrientation = analyzeStreetOrientation(nearbyAddresses);

        console.log("🛣️ Detected street orientation:", streetOrientation);

        // Determine which side of street based on orientation and address patterns
        if (streetOrientation === "north-south") {
          // For north-south streets, determine east/west positioning
          const side = await determineStreetSide(
            geocodeResult.geometry.location,
            streetName,
            "east-west"
          );
          return side === "east" ? 270 : 90; // Face west or east
        } else if (streetOrientation === "east-west") {
          // For east-west streets, determine north/south positioning
          const side = await determineStreetSide(
            geocodeResult.geometry.location,
            streetName,
            "north-south"
          );
          return side === "north" ? 180 : 0; // Face south or north
        }

        // Regional fallback patterns
        return getRegionalPattern(address, number, streetName);
      }
    }

    return 180; // Final fallback
  };

  // Analyze nearby addresses to determine street orientation
  const analyzeStreetOrientation = (
    nearbyAddresses: any[]
  ): "north-south" | "east-west" | "unknown" => {
    if (nearbyAddresses.length < 2) return "unknown";

    const latRange =
      Math.max(...nearbyAddresses.map((addr) => addr.lat)) -
      Math.min(...nearbyAddresses.map((addr) => addr.lat));
    const lngRange =
      Math.max(...nearbyAddresses.map((addr) => addr.lng)) -
      Math.min(...nearbyAddresses.map((addr) => addr.lng));

    // If longitude spread is greater, street runs east-west
    // If latitude spread is greater, street runs north-south
    return lngRange > latRange ? "east-west" : "north-south";
  };

  // Get nearby addresses on the same street for analysis
  const getNearbyAddresses = async (
    location: any,
    streetName: string
  ): Promise<any[]> => {
    try {
      const apiKey = FALLBACK_API_KEY;
      const addresses = [];

      // Sample nearby address numbers (simplified approach)
      // In a real implementation, you'd query multiple addresses
      for (let offset of [-2, -1, 1, 2]) {
        // This is a simplified example - you'd need more sophisticated nearby address detection
        const testAddress = `${streetName}`;
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          testAddress
        )}&key=${apiKey}`;

        try {
          const response = await fetch(geocodeUrl);
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            addresses.push(data.results[0].geometry.location);
          }
        } catch (e) {
          // Skip failed requests
        }
      }

      return addresses;
    } catch (error) {
      return [location]; // Fallback to just the original location
    }
  };

  // Determine which side of the street the address is on
  const determineStreetSide = async (
    location: any,
    streetName: string,
    crossDirection: "north-south" | "east-west"
  ): Promise<"north" | "south" | "east" | "west"> => {
    // This would need more sophisticated logic in practice
    // For now, return a reasonable default based on common patterns
    if (crossDirection === "north-south") {
      return "north"; // Assume north side for now
    } else {
      return "west"; // Assume west side for now
    }
  };

  // Regional patterns for different areas (US-focused)
  const getRegionalPattern = (
    address: string,
    number: number,
    streetName: string
  ): number => {
    const addressUpper = address.toUpperCase();

    // Phoenix/Arizona specific patterns
    if (addressUpper.includes("PHOENIX") || addressUpper.includes("AZ")) {
      // In Phoenix grid system:
      // - Even numbers typically on north/east sides
      // - Odd numbers typically on south/west sides
      if (streetName.includes("street") || streetName.includes("st")) {
        return number % 2 === 0 ? 0 : 180; // Even face north, odd face south
      } else if (
        streetName.includes("avenue") ||
        streetName.includes("ave") ||
        streetName.includes("drive") ||
        streetName.includes("dr")
      ) {
        return number % 2 === 0 ? 90 : 270; // Even face east, odd face west
      }
    }

    // California patterns
    if (addressUpper.includes("CA") || addressUpper.includes("CALIFORNIA")) {
      // Many CA developments have houses face south for solar optimization
      return 180;
    }

    // Default US pattern: face south (most common)
    return 180;
  };

  // Enhanced metadata checking with rich information extraction
  const [streetViewMetadata, setStreetViewMetadata] = useState<any>(null);

  const checkStreetViewAvailability = async (
    address: string
  ): Promise<boolean> => {
    try {
      const apiKey = FALLBACK_API_KEY;
      const location = encodeURIComponent(address);

      // Use Street View Metadata API for comprehensive information
      const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${location}&key=${apiKey}`;

      const response = await fetch(metadataUrl);

      if (response.ok) {
        const data = await response.json();
        console.log("📍 Street View metadata response:", data);

        // Store metadata for potential use
        setStreetViewMetadata(data);

        // Enhanced logging of available metadata
        if (data.status === "OK") {
          console.log("✅ Street View available:");
          console.log("  📍 Exact location:", data.location);
          console.log("  🆔 Panorama ID:", data.pano_id);
          console.log("  📅 Photo date:", data.date || "Unknown");
          console.log("  ©️ Copyright:", data.copyright);
          if (data.heading !== undefined) {
            console.log("  🧭 Original heading:", data.heading + "°");
          }
        } else {
          console.log("❌ Street View not available:", data.status);
        }

        // Check if status is OK and we have a valid pano_id
        return data.status === "OK" && data.pano_id;
      }

      return false;
    } catch (error) {
      console.log("Error checking Street View availability:", error);
      // Fallback to old method if metadata fails
      try {
        const apiKey = FALLBACK_API_KEY;
        const location = encodeURIComponent(address);
        const testUrl = `https://maps.googleapis.com/maps/api/streetview?location=${location}&size=1x1&key=${apiKey}`;
        const response = await fetch(testUrl);
        return response.ok && response.headers.get("content-length") !== "0";
      } catch (fallbackError) {
        console.log("Fallback availability check also failed:", fallbackError);
        return false;
      }
    }
  };

  // Multiple view generator for Street View modal
  const generateMultipleViews = (address: string) => {
    const views = [
      { name: "Front View", heading: optimalHeading, pitch: 0 },
      { name: "Left Side", heading: (optimalHeading + 270) % 360, pitch: 0 },
      { name: "Right Side", heading: (optimalHeading + 90) % 360, pitch: 0 },
      { name: "Wide Angle", heading: optimalHeading, pitch: 0, fov: 120 },
    ];

    return views.map((view) => ({
      ...view,
      url: buildStreetViewUrl(address, {
        heading: view.heading,
        pitch: view.pitch,
        fov: view.fov || 90,
        size: "600x400",
      }),
    }));
  };

  useFocusEffect(
    React.useCallback(() => {
      // Preserve current form values over database values to prevent data loss during AHJ lookup
      // Only reset if we don't have current form values (first load)
      const hasCurrentValues =
        currentFormValuesRef.current.jurisdiction ||
        currentFormValuesRef.current.utility ||
        currentFormValuesRef.current.houseSqFt ||
        currentFormValuesRef.current.apn;

      const currentInitialValues: FormValues = {
        // Prioritize current form values over database values
        jurisdiction: currentFormValuesRef.current.jurisdiction || site.ahj || "",
        utility: currentFormValuesRef.current.utility || site.utility || "",
        houseSqFt: currentFormValuesRef.current.houseSqFt || (houseSqFt ? String(houseSqFt) : ""),
        apn: currentFormValuesRef.current.apn || site.apn || "",
      };

      // Only reset form if it's the first load (no current values)
      // This prevents wiping user input during AHJ lookup
      if (!hasCurrentValues) {
        formikRef.current?.resetForm({
          values: currentInitialValues,
        });
      }
    }, [site.ahj, site.utility, houseSqFt, site.apn])
  );

  // Check for AHJ status on mount and when project changes
  useEffect(() => {
    if (!projectInfo?.uuid) return;

    // If we already have AHJ info, no need to poll
    if (site.ahj && site.ahj.trim() !== "") {
      return;
    }

    // If no AHJ info and we have a ZIP code, start background polling
    // in case there's an ongoing automation
    if (site.zip_code) {
      console.log(
        "No AHJ found, starting background polling for ongoing automation..."
      );
      startAhjPolling(projectInfo.uuid, {
        maxAttempts: 30, // Poll for up to 90 seconds (30 * 3000ms)
        intervalMs: 3000,
        showToasts: false, // Silent background polling
        onSuccess: async (ahjName: string) => {
          // Update the form when AHJ is found
          formikRef.current?.setFieldValue("jurisdiction", ahjName);

          // Log current form state for debugging utility loss
          console.log(`[Site] AHJ found: "${ahjName}", current form values:`, {
            jurisdiction: formikRef.current?.values?.jurisdiction,
            utility: formikRef.current?.values?.utility,
            houseSqFt: formikRef.current?.values?.houseSqFt,
            apn: formikRef.current?.values?.apn,
          });
          console.log(`[Site] currentFormValuesRef state:`, currentFormValuesRef.current);

          // Save all current form data including the new AHJ
          // This preserves any user-entered values for utility, APN, and house sq ft
          await formikRef.current?.submitForm();

          console.log(`AHJ found via background polling: ${ahjName} - form saved without refresh`);
        },
      });
    }
  }, [projectInfo?.uuid, site.ahj, site.zip_code, startAhjPolling]);

  const schema = Yup.object<FormValues>().shape({
    jurisdiction: Yup.string().required("Jurisdiction is required"),
    utility: Yup.string().required("Utility is required"),
    houseSqFt: isCalifornia
      ? Yup.number()
          .typeError("Must be a number")
          .required("House Sq. Ft. is required")
      : Yup.number().typeError("Must be a number").notRequired(),
  });

  // fetch utilities by ZIP
  useEffect(() => {
    const zip = site?.zip_code?.toString()?.trim();
    if (!zip || zip.length < 5) {
      setUtilities([]);
      setUtilErr(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setUtilLoading(true);
        setUtilErr(null);
        const resp = await getUtilities(zip);
        const list: string[] = Array.isArray(resp?.data) ? resp.data : [];
        const uniqueSorted = Array.from(new Set(list)).sort((a, b) =>
          a.localeCompare(b)
        );

        if (!cancelled) {
          setUtilities(uniqueSorted);

          // auto-select when one option and none chosen
          const current = formikRef.current?.values?.utility;
          if (uniqueSorted.length === 1 && !current) {
            const onlyOne = uniqueSorted[0];
            console.log(`[Site] Auto-selecting single utility: "${onlyOne}"`);

            // ✅ FIX: Update ref immediately to prevent loss during AHJ completion
            currentFormValuesRef.current = {
              ...currentFormValuesRef.current,
              utility: onlyOne,
            };

            formikRef.current?.setFieldValue("utility", onlyOne);
            setTimeout(() => formikRef.current?.submitForm(), 0);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setUtilities([]);
          setUtilErr(e?.message || "Failed to load utilities");
        }
      } finally {
        if (!cancelled) setUtilLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [site?.zip_code]);

  // 🔥 TEST: Fetch utility requirements when utility is selected - COMMENT OUT LATER
  useEffect(() => {
    const selectedUtility = site?.utility; // Use site.utility from Redux instead of formikRef
    const state = site?.state;
    const token = companyProfile?.token;

    if (!selectedUtility || !state || !token) {
      console.log("🔥 TEST: Clearing utility requirements - missing data:", {
        selectedUtility: !!selectedUtility,
        state: !!state,
        token: !!token,
      });
      setUtilityRequirements(null);
      return;
    }

    console.log("🔥 TEST: Fetching utility requirements for:", selectedUtility, "in state:", state);

    fetchUtilityRequirements(state, selectedUtility, token)
      .then((data) => {
        console.log("🔥 TEST: Utility requirements fetched successfully:", data);
        console.log("🔥 TEST: Combination field value:", data?.combination);
        setUtilityRequirements(data);
      })
      .catch((error) => {
        console.error("🔥 TEST: Failed to fetch utility requirements:", error);
        setUtilityRequirements(null);
      });
  }, [site?.utility, site?.state, companyProfile?.token]);

  // Load house_sqft from system-details API
  useEffect(() => {
    if (!projectInfo?.uuid) {
      setHouseSqFt(null);
      return;
    }

    let cancelled = false;
    setHouseSqFtLoading(true);

    fetchSystemDetails(projectInfo.uuid)
      .then((systemData) => {
        if (!cancelled) {
          const houseSqFtValue = systemData?.house_sqft ?? null;
          setHouseSqFt(houseSqFtValue);
          console.log(
            "🏠 Loaded house_sqft from system-details:",
            houseSqFtValue
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn("Failed to load house_sqft from system-details:", error);
          setHouseSqFt(null);
        }
      })
      .finally(() => {
        if (!cancelled) setHouseSqFtLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectInfo?.uuid]);

  // Enhanced Street View and Satellite preview setup
  useEffect(() => {
    const hasAddress = Boolean(
      site.address?.trim() || site.city?.trim() || site.state?.trim()
    );

    if (!hasAddress) {
      setStreetViewUri("");
      setSatelliteViewUri("");
      setStreetViewLoading(false);
      return;
    }

    const apiKey = FALLBACK_API_KEY;

    if (!apiKey) {
      setStreetViewUri("");
      setSatelliteViewUri("");
      setStreetViewLoading(false);
      return;
    }

    setStreetViewLoading(true);

    const addressParts = [site.address || "", site.city || "", site.state || ""]
      .filter(Boolean)
      .join(", ");

    // Build satellite view URL as fallback
    const satelliteUrl =
      `https://maps.googleapis.com/maps/api/staticmap` +
      `?center=${encodeURIComponent(addressParts)}` +
      `&zoom=16` +
      `&size=400x200` +
      `&maptype=satellite` +
      `&markers=color:red%7C${encodeURIComponent(addressParts)}` +
      `&key=${apiKey}`;

    setSatelliteViewUri(satelliteUrl);

    // Determine optimal heading and check Street View availability
    Promise.all([
      determineOptimalHeading(addressParts),
      checkStreetViewAvailability(addressParts),
    ])
      .then(([heading, available]) => {
        setOptimalHeading(heading);
        setStreetViewAvailable(available);

        if (available) {
          const streetViewUrl = buildStreetViewUrl(addressParts, { heading });
          setStreetViewUri(streetViewUrl);
        } else {
          setStreetViewUri("");
          console.log(
            "Street View not available for this location, using satellite view"
          );
        }

        setStreetViewLoading(false);
      })
      .catch((error) => {
        console.error("Error setting up Street View:", error);
        setStreetViewAvailable(false);
        setStreetViewUri("");
        setStreetViewLoading(false);
      });
  }, [site.address, site.city, site.state]);

  // Handle manual AHJ lookup retry
  const handleAhjRetry = async () => {
    if (!projectInfo?.uuid || !site.zip_code) {
      Toast.show({
        text1: "Cannot perform AHJ lookup",
        text2: "Missing project ID or ZIP code",
        type: "error",
      });
      return;
    }

    try {
      // First clear the jurisdiction field in both form and database
      formikRef.current?.setFieldValue("jurisdiction", "");

      const clearPayload: any = {
        companyId: companyProfile?.company?.uuid, // Use user's company for authorization
        address: site.address,
        city: site.city,
        state: site.state,
        zipCode: site.zip_code,
        apn: site.apn, // Preserve existing APN
        ahj: "", // Clear ONLY the AHJ field
        utility: site.utility, // Preserve existing utility
        // house_sqft no longer needed here - it's in system-details API
      };

      // Save cleared AHJ to database (keeping all other fields intact)
      await SaveProjectSiteInfo(projectInfo.uuid, clearPayload);

      const automationOptions = {
        computerName: APP_TRIGGER_COMPUTER_NAME,
        companyUuid: companyProfile.company?.uuid,
        userUuid: companyProfile.user?.uuid,
        clientVersion: "1.0.7",
      };

      console.log(
        "Manually triggering AHJ Lookup for project:",
        projectInfo.uuid
      );

      await triggerPlanAutomation(
        projectInfo.uuid,
        APP_LOCAL_TRIGGER_SECRET,
        "AHJLookup",
        [],
        automationOptions
      );

      // Start polling for results
      startAhjPolling(projectInfo.uuid, {
        maxAttempts: 40, // Poll for up to 80 seconds (40 * 2000ms)
        intervalMs: 2000,
        showToasts: true,
        onSuccess: async (ahjName: string) => {
          // Update the form when AHJ is found
          formikRef.current?.setFieldValue("jurisdiction", ahjName);

          // Save all current form data including the new AHJ
          // This preserves any user-entered values for utility, APN, and house sq ft
          await formikRef.current?.submitForm();

          console.log(`Manual AHJ lookup successful: ${ahjName} - form saved without refresh`);
        },
      });
    } catch (error) {
      console.error("Failed to trigger AHJ lookup:", error);
      Toast.show({
        text1: "Failed to start AHJ lookup",
        text2: "Please try again later",
        type: "error",
      });
    }
  };

  const submitSite = async (values: FormValues) => {
    const sitePayload: any = {
      companyId: companyProfile?.company?.uuid, // Use user's company for authorization
      address: site.address,
      city: site.city,
      state: site.state,
      zipCode: site.zip_code,
      apn: values.apn,
      ahj: values.jurisdiction, // This saves the ahj_name to the project
      utility: values.utility,
      // house_sqft removed - now goes to system-details API
    };

    // Convert houseSqFt to number or null
    const houseSqFtValue = values.houseSqFt && String(values.houseSqFt).trim()
      ? Number(values.houseSqFt)
      : null;

    const systemDetailsPayload = {
      house_sqft: houseSqFtValue,
    };

    console.log(
      "💾 Saving house_sqft to system-details:",
      systemDetailsPayload.house_sqft,
      "from form value:",
      values.houseSqFt,
      "typeof:",
      typeof systemDetailsPayload.house_sqft,
      "is null?",
      systemDetailsPayload.house_sqft === null,
      "full payload:",
      JSON.stringify(systemDetailsPayload)
    );

    try {
      // Save site info (without house_sqft)
      const siteResp = await SaveProjectSiteInfo(projectInfo.uuid, sitePayload);

      // Save house_sqft to system-details API
      const systemResp = await saveSystemDetails(
        projectInfo.uuid,
        systemDetailsPayload
      );

      if (siteResp?.status === 200 && systemResp) {
        // Update Redux with the saved values without full refresh
        // This prevents clearing form fields during normal saves
        dispatch(
          setProject({
            ...projectInfo,
            site: {
              ...projectInfo.site,
              ...sitePayload,
            },
          })
        );

        // Update houseSqFt state to reflect saved value
        setHouseSqFt(systemDetailsPayload.house_sqft);

        // DO NOT clear currentFormValuesRef here - it should always reflect current form state
        // The useEffect at line 1292 keeps it synchronized with form values automatically
        // Clearing it causes data loss when jurisdiction loads asynchronously after user input
        // See: Data loss bug investigation report for full details

        // Toast removed per user request
        // Trigger Street View analytics capture with smart caching
        // triggerSmartAnalyticsCapture(); // TODO: Disabled - needs backend endpoint implementation
      } else {
        throw new Error(
          `Site status: ${siteResp?.status}, System status: ${
            systemResp ? "success" : "failed"
          }`
        );
      }
    } catch {
      Toast.show({ text1: "Error saving site info", type: "error" });
    }
  };

  // TODO: Disabled - Smart analytics capture function using backend cache-first approach
  // const triggerSmartAnalyticsCapture = async () => {
  //   // Only trigger if we have sufficient address information
  //   if (!site.address || !companyUuid || !projectInfo?.uuid) {
  //     return;
  //   }
  //
  //   try {
  //     // Build full address for backend
  //     const fullAddress = [site.address, site.city, site.state, site.zip_code]
  //       .filter(Boolean)
  //       .join(", ");
  //
  //     // Use backend conditional capture - implements cache-first approach
  //     const result =
  //       await streetViewAnalyticsService.conditionalStreetViewCapture(
  //         projectInfo.uuid,
  //         companyUuid,
  //         fullAddress,
  //         false // forceRefresh = false for normal operation
  //       );
  //
  //     if (!result.success) {
  //       console.log("Backend analytics capture failed:", result.error);
  //     } else if (result.cached) {
  //       console.log("Analytics data served from backend cache");
  //     } else {
  //       console.log("Fresh analytics data captured from backend");
  //     }
  //   } catch (error) {
  //     // Silent failure for background analytics - don't interrupt user workflow
  //     console.log("Backend analytics capture failed:", error);
  //   }
  // };

  const fullName =
    details.customer_last_name && details.customer_first_name
      ? `${details.customer_last_name}, ${details.customer_first_name}`
      : undefined;
  const street = site.address || "";
  const cityStateZip = [site.city, site.state, site.zip_code]
    .filter(Boolean)
    .join(", ");

  const onViewSite = () => setMapModalVisible(true);

  // Load photo count for this section
  useEffect(() => {
    if (projectId) {
      photoCapture.getPhotoCount("Site").then(setPhotoCount);
    }
  }, [projectId, photoCapture.refreshTrigger]);

  const handleCameraPress = () => {
    if (!photoCapture.hasProjectContext) {
      console.warn("Missing project context for photo capture");
      return;
    }

    photoCapture.openForSection({
      section: "Site",
      tagOptions: [],
      initialNote: siteNote,
      onNotesSaved: (note) => {
        setSiteNote(note);
        console.log(`Notes saved for Site:`, note);
      },
      onPhotoAdded: () => {
        console.log(`Photo added to Site`);
        // Photo count will be updated automatically via useEffect
      },
    });
  };

  // Track which address field is currently focused
  const [currentAddressField, setCurrentAddressField] = useState<number>(0);

  // Handle when user focuses on an address field
  const handleAddressFocus = (lineIndex: number) => {
    setCurrentAddressField(lineIndex);

    // TODO: Custom keyboard disabled - using hardware keyboard
    // Update keyboard handlers for the new field
    // globalKeyboard.showKeyboard({
    //   fieldId: `address-line-${lineIndex}`,
    //   onKeyPress: (key: string) => {
    //     // Add character to appropriate field
    //     if (lineIndex === 0) {
    //       setEditedStreet((prev) => prev + key);
    //     } else {
    //       setEditedCityStateZip((prev) => prev + key);
    //     }
    //   },
    //   onBackspace: () => {
    //     // Remove last character from appropriate field
    //     if (lineIndex === 0) {
    //       setEditedStreet((prev) => prev.slice(0, -1));
    //     } else {
    //       setEditedCityStateZip((prev) => prev.slice(0, -1));
    //     }
    //   },
    //   autoCapitalize: 'words',
    //   returnKeyType: 'done',
    // });
  };

  // Handle edit mode - activates ALL fields (name, address, city/state/zip, project ID)
  const handleEditAll = () => {
    setIsEditingAll(true);

    // Initialize all edited values
    setEditedName(fullName || "");
    setEditedStreet(street);
    setEditedCityStateZip(cityStateZip);
    setEditedProjectId(details.installer_project_id || "");
  };

  // Handle save ALL - saves name, address, city/state/zip, and project ID
  const handleSaveAll = async () => {
    console.log("🔧 [SAVE ALL] Starting save operation...");
    setIsEditingAll(false);

    try {
      // Parse the name (expected format: "Last, First")
      const nameParts = editedName.split(",").map((p) => p.trim());
      const lastName = nameParts[0] || "";
      const firstName = nameParts[1] || "";

      console.log("🔧 [SAVE ALL] Parsed name:", { lastName, firstName, original: editedName });

      // Parse city, state, zip from second address line
      const addressParts = editedCityStateZip.split(",").map((p) => p.trim());
      console.log("🔧 [SAVE ALL] Parsed address parts:", addressParts);

      // Prepare project update payload
      const projectPayload = {
        customer_last_name: lastName,
        customer_first_name: firstName,
        installer_project_id: editedProjectId,
      };

      const projectUrl = `${process.env.REACT_APP_API_URL || ""}/api/projects/${projectInfo.uuid}`;

      console.log("🔧 [SAVE ALL] Project API Request:", {
        url: projectUrl,
        method: "PATCH",
        payload: projectPayload,
        hasToken: !!companyProfile?.token,
        tokenPrefix: companyProfile?.token ? companyProfile.token.substring(0, 20) + "..." : "MISSING",
      });

      // Update project details (name and project ID)
      const projectResponse = await fetch(projectUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${companyProfile?.token}`,
        },
        body: JSON.stringify(projectPayload),
      });

      console.log("🔧 [SAVE ALL] Project API Response:", {
        status: projectResponse.status,
        ok: projectResponse.ok,
        statusText: projectResponse.statusText,
      });

      // Try to parse response body for more details
      let projectResponseData;
      try {
        projectResponseData = await projectResponse.clone().json();
        console.log("🔧 [SAVE ALL] Project response data:", projectResponseData);
      } catch (e) {
        console.log("🔧 [SAVE ALL] Could not parse project response as JSON");
      }

      // Update site info (address)
      const sitePayload: any = {
        companyId: companyProfile?.company?.uuid,
        address: editedStreet,
        city: addressParts[0] || site.city,
        state: addressParts[1] || site.state,
        zipCode: addressParts[2] || site.zip_code,
        apn: site.apn || "",
        ahj: site.ahj || "",
        utility: site.utility || "",
      };

      console.log("🔧 [SAVE ALL] Site API Request:", {
        projectUuid: projectInfo.uuid,
        payload: sitePayload,
      });

      const siteResponse = await SaveProjectSiteInfo(projectInfo.uuid, sitePayload);

      console.log("🔧 [SAVE ALL] Site API Response:", {
        status: siteResponse?.status,
        data: siteResponse?.data,
      });

      if (projectResponse.ok && siteResponse?.status === 200) {
        console.log("🔧 [SAVE ALL] Both APIs succeeded, refreshing project data...");

        // Refresh project data
        const detail = await GetProjectDetails(projectInfo.uuid, companyUuid);
        if (detail?.status === 200 && detail?.data?.data) {
          dispatch(setProject(detail.data.data));
          console.log("🔧 [SAVE ALL] Project data refreshed successfully");
        }

        Toast.show({
          text1: "Site Information Updated",
          type: "success",
          position: "top",
          visibilityTime: 1500,
        });
      } else {
        const errorMsg = `Save failed - Project: ${projectResponse.status}, Site: ${siteResponse?.status}`;
        console.error("🔧 [SAVE ALL] " + errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("🔧 [SAVE ALL] Error caught:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        fullError: error,
      });

      Toast.show({
        text1: "Error saving site information",
        text2: error.message || "Network request failed",
        type: "error",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  // Text change handlers
  const handleNameChange = (value: string) => {
    setEditedName(value);
  };

  const handleAddressChange = (lineIndex: number, value: string) => {
    if (lineIndex === 0) {
      setEditedStreet(value);
    } else {
      setEditedCityStateZip(value);
    }
  };

  const handleProjectIdChange = (value: string) => {
    setEditedProjectId(value);
  };

  // Clear all form fields and save empty values to DB
  const handleClearAll = async () => {
    const emptySitePayload = {
      companyId: companyProfile?.company?.uuid, // Use user's company for authorization
      address: site.address,
      city: site.city,
      state: site.state,
      zipCode: site.zip_code,
      apn: "",
      ahj: "",
      utility: "",
      // house_sqft removed - now goes to system-details API
    };

    const emptySystemPayload = {
      house_sqft: null,
    };

    try {
      // Clear form values
      formikRef.current?.setFieldValue("jurisdiction", "");
      formikRef.current?.setFieldValue("utility", "");
      formikRef.current?.setFieldValue("houseSqFt", "");
      formikRef.current?.setFieldValue("apn", "");

      // Save cleared values to both APIs
      const siteResp = await SaveProjectSiteInfo(
        projectInfo.uuid,
        emptySitePayload
      );
      const systemResp = await saveSystemDetails(
        projectInfo.uuid,
        emptySystemPayload
      );

      if (siteResp?.status === 200 && systemResp) {
        const detail = await GetProjectDetails(projectInfo.uuid, companyUuid);
        if (detail?.status === 200 && detail?.data?.data) {
          dispatch(setProject(detail.data.data));
        }
        Toast.show({
          text1: "Fields Cleared",
          type: "success",
          position: "top",
          visibilityTime: 1500,
        });
      } else {
        throw new Error(
          `Site status: ${siteResp?.status}, System status: ${
            systemResp ? "success" : "failed"
          }`
        );
      }
    } catch {
      Toast.show({ text1: "Error clearing fields", type: "error" });
    }
  };

  // helper below dropdown (since placeholder is controlled inside the component)
  const utilityHelper = (() => {
    if (!site?.zip_code) return "Enter ZIP to load utilities";
    if (utilLoading) return "Loading utilities…";
    if (utilErr) return utilErr;
    if (!utilities.length) return `No utilities for ${site.zip_code}`;
  })();

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <Modal
        visible={mapModalVisible}
        animationType="slide"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <MapScreen
          address={street}
          city={site.city}
          state={site.state}
          onClose={() => setMapModalVisible(false)}
        />
      </Modal>

      <LinearGradient {...BLUE_MD_TB} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            extraHeight={200}
            extraScrollHeight={200}
            contentContainerStyle={[
              styles.formContainer,
              {
                paddingTop: headerHeight,
                paddingBottom: moderateScale(1000),
              },
            ]}
          >
            {/* Add spacing above map */}
            <View style={{ height: verticalScale(16) }} />

            {/* Street View Preview */}
            <View style={styles.mapPreviewContainer}>
              <TouchableOpacity
                style={styles.mapPreviewTouchable}
                onPress={onViewSite}
                activeOpacity={0.8}
              >
                {(streetViewUri && streetViewAvailable) || satelliteViewUri ? (
                  <>
                    <Image
                      source={{
                        uri:
                          streetViewUri && streetViewAvailable
                            ? streetViewUri
                            : satelliteViewUri,
                      }}
                      style={styles.mapPreviewImage}
                      onLoadStart={() => setStreetViewLoading(true)}
                      onLoadEnd={() => setStreetViewLoading(false)}
                      onError={() => {
                        setStreetViewLoading(false);
                        if (streetViewAvailable) {
                          // If Street View fails, fall back to satellite
                          setStreetViewAvailable(false);
                        }
                      }}
                      resizeMode="cover"
                    />
                    {streetViewLoading && (
                      <View style={styles.mapLoadingOverlay}>
                        <ActivityIndicator size="large" color="#FFF" />
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.mapPlaceholder}>
                    <Image
                      source={require("../../assets/Images/icons/googlemap.png")}
                      style={styles.mapPlaceholderIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.mapPlaceholderText}>
                      {site.address || site.city || site.state
                        ? `Loading ${
                            streetViewAvailable ? "street" : "satellite"
                          } view...`
                        : "No address available"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Camera button */}
            <View style={styles.buttonRow}>
              <View style={styles.rightButtonsContainer}>
                <TouchableOpacity
                  style={styles.cameraWrapper}
                  onPress={handleCameraPress}
                >
                  <Image
                    source={cameraIcon}
                    style={[
                      styles.cameraIcon,
                      { tintColor: photoCount > 0 ? "#FD7332" : "#FFFFFF" },
                    ]}
                    resizeMode="contain"
                  />
                  <Text style={styles.photoCountText}>
                    {photoCount > 99 ? "99+" : photoCount}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Formik
              innerRef={formikRef}
              initialValues={initialValues}
              enableReinitialize
              validationSchema={schema}
              onSubmit={submitSite}
            >
              {({
                handleChange,
                handleBlur,
                values,
                errors,
                touched,
                setFieldValue,
                submitForm,
              }) => {
                // Update ref whenever form values change (preserves data during AHJ refresh)
                React.useEffect(() => {
                  currentFormValuesRef.current = values;
                }, [values]);

                return (
                <View style={styles.form}>
                  <JurisdictionInput
                    projectId={projectInfo?.uuid || ""}
                    companyId={companyUuid || ""}
                    zipCode={site?.zip_code}
                    state={site?.state}
                    value={values.jurisdiction}
                    onChangeText={(text) => {
                      setFieldValue("jurisdiction", text);
                      // Update ref immediately to preserve during AHJ refresh
                      currentFormValuesRef.current = {
                        ...currentFormValuesRef.current,
                        jurisdiction: text,
                      };
                      setTimeout(() => submitForm(), 0);
                    }}
                    onBlur={() => {
                      handleBlur("jurisdiction");
                      submitForm();
                    }}
                    onRetry={handleAhjRetry}
                    errorText={errors.jurisdiction}
                    touched={touched.jurisdiction}
                  />

                  {/* Utility dropdown — now conforms to Dropdown API */}
                  <View style={{ marginTop: verticalScale(-2) }}>
                    <Dropdown
                      label="Utility*"
                      data={utilityOptions}
                      value={values.utility}
                      loading={utilLoading}
                      disabled={
                        !site?.zip_code || utilLoading || !utilityOptions.length
                      }
                      onChange={(val: string) => {
                        setFieldValue("utility", val);
                        // Update ref immediately to preserve during AHJ refresh
                        currentFormValuesRef.current = {
                          ...currentFormValuesRef.current,
                          utility: val,
                        };
                        setTimeout(() => submitForm(), 0);
                      }}
                      errorText={touched.utility ? errors.utility : undefined}
                      bottomSpacing={4}
                    />
                  </View>
                  {utilityHelper ? (
                    <Text style={styles.helperText}>{utilityHelper}</Text>
                  ) : null}

                  {/* 🔥 TEST: Display utility requirements combination field - COMMENT OUT LATER */}
                  {utilityRequirements && (
                    <View style={{
                      backgroundColor: '#FFF3CD',
                      padding: moderateScale(12),
                      marginTop: verticalScale(8),
                      marginBottom: verticalScale(8),
                      borderRadius: moderateScale(4),
                      borderWidth: 1,
                      borderColor: '#FFC107',
                    }}>
                      <Text style={{
                        color: '#856404',
                        fontSize: moderateScale(14),
                        fontWeight: '700',
                        marginBottom: verticalScale(6),
                      }}>
                        🔥 TEST - Utility Requirements API Response
                      </Text>
                      <Text style={{
                        color: '#856404',
                        fontSize: moderateScale(12),
                        fontWeight: '600',
                        marginBottom: verticalScale(2),
                      }}>
                        Utility: {utilityRequirements.utility || 'N/A'}
                      </Text>
                      <Text style={{
                        color: '#856404',
                        fontSize: moderateScale(12),
                        fontWeight: '600',
                        marginBottom: verticalScale(2),
                      }}>
                        Abbreviation: {utilityRequirements.abbrev || 'N/A'}
                      </Text>
                      <Text style={{
                        color: '#856404',
                        fontSize: moderateScale(12),
                        fontWeight: '600',
                        marginBottom: verticalScale(4),
                      }}>
                        Official: {utilityRequirements.official || 'N/A'}
                      </Text>

                      {/* BOS Fields */}
                      {(utilityRequirements.bos_1 || utilityRequirements.bos_2 || utilityRequirements.bos_3 ||
                        utilityRequirements.bos_4 || utilityRequirements.bos_5 || utilityRequirements.bos_6) && (
                        <View style={{
                          borderTopWidth: 1,
                          borderTopColor: '#FFC107',
                          paddingTop: verticalScale(6),
                          marginTop: verticalScale(4),
                          marginBottom: verticalScale(4),
                        }}>
                          <Text style={{
                            color: '#856404',
                            fontSize: moderateScale(13),
                            fontWeight: '700',
                            marginBottom: verticalScale(4),
                          }}>
                            BOS FIELDS:
                          </Text>
                          {utilityRequirements.bos_1 && (
                            <Text style={{ color: '#856404', fontSize: moderateScale(11) }}>
                              BOS 1: {utilityRequirements.bos_1}
                            </Text>
                          )}
                          {utilityRequirements.bos_2 && (
                            <Text style={{ color: '#856404', fontSize: moderateScale(11) }}>
                              BOS 2: {utilityRequirements.bos_2}
                            </Text>
                          )}
                          {utilityRequirements.bos_3 && (
                            <Text style={{ color: '#856404', fontSize: moderateScale(11) }}>
                              BOS 3: {utilityRequirements.bos_3}
                            </Text>
                          )}
                          {utilityRequirements.bos_4 && (
                            <Text style={{ color: '#856404', fontSize: moderateScale(11) }}>
                              BOS 4: {utilityRequirements.bos_4}
                            </Text>
                          )}
                          {utilityRequirements.bos_5 && (
                            <Text style={{ color: '#856404', fontSize: moderateScale(11) }}>
                              BOS 5: {utilityRequirements.bos_5}
                            </Text>
                          )}
                          {utilityRequirements.bos_6 && (
                            <Text style={{ color: '#856404', fontSize: moderateScale(11) }}>
                              BOS 6: {utilityRequirements.bos_6}
                            </Text>
                          )}
                        </View>
                      )}

                      <View style={{
                        borderTopWidth: 1,
                        borderTopColor: '#FFC107',
                        paddingTop: verticalScale(6),
                        marginTop: verticalScale(4),
                      }}>
                        <Text style={{
                          color: '#856404',
                          fontSize: moderateScale(13),
                          fontWeight: '700',
                          marginBottom: verticalScale(4),
                        }}>
                          COMBINATION FIELD:
                        </Text>
                        <Text style={{
                          color: '#856404',
                          fontSize: moderateScale(12),
                          lineHeight: moderateScale(18),
                          fontWeight: '600',
                        }}>
                          {utilityRequirements.combination || 'No combination data'}
                        </Text>
                      </View>
                    </View>
                  )}
                  {/* 🔥 END TEST SECTION */}

                  <View style={{ marginTop: verticalScale(-2) }}>
                    <TextInput
                      label="APN"
                      placeholder="e.g. 123-456-789"
                      value={values.apn}
                      onChangeText={(text) => {
                        handleChange("apn")(text);
                        // Update ref immediately to preserve during AHJ refresh
                        currentFormValuesRef.current = {
                          ...currentFormValuesRef.current,
                          apn: text,
                        };
                      }}
                      onBlur={() => {
                        handleBlur("apn");
                        submitForm();
                      }}
                      errorText={touched.apn ? errors.apn : undefined}
                    />
                  </View>

                  <View style={{ marginTop: verticalScale(-2) }}>
                    <TextInput
                      label={`House Sq. Ft.${isCalifornia ? "*" : ""}`}
                      placeholder="e.g. 2000"
                      keyboardType="numeric"
                      showNumericKeypad={true}
                      onNumericKeypadOpen={() => {
                        setNumericKeypadValue(values.houseSqFt || "");
                        setNumericKeypadVisible(true);
                      }}
                      value={values.houseSqFt}
                      onChangeText={(text) => {
                        handleChange("houseSqFt")(text);
                        // Update ref immediately to preserve during AHJ refresh
                        currentFormValuesRef.current = {
                          ...currentFormValuesRef.current,
                          houseSqFt: text,
                        };
                      }}
                      onBlur={() => {
                        handleBlur("houseSqFt");
                        submitForm();
                      }}
                      errorText={
                        touched.houseSqFt ? errors.houseSqFt : undefined
                      }
                    />
                  </View>

                  {/* Dynamic scrolling buffer */}
                  <View
                    style={{
                      height: verticalScale(60),
                    }}
                  />
                </View>
                );
              }}
            </Formik>
          </KeyboardAwareScrollView>
        </SafeAreaView>

        <View
          style={styles.headerWrap}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          <LargeHeader
            title="Site"
            name={fullName}
            addressLines={[street, cityStateZip]}
            projectId={details.installer_project_id}
            onDrawerPress={() =>
              navigation.dispatch(DrawerActions.openDrawer())
            }
            editableAddress={true}
            onEditAddress={handleEditAll}
            onAddressFocus={handleAddressFocus}
            isEditingAddress={[isEditingAll, isEditingAll]}
            onSaveAddress={handleSaveAll}
            editedAddressLines={[editedStreet, editedCityStateZip]}
            onAddressChange={handleAddressChange}
            editableName={true}
            isEditingName={isEditingAll}
            onEditName={handleEditAll}
            onSaveName={handleSaveAll}
            editedName={editedName}
            onNameChange={handleNameChange}
            editableProjectId={true}
            isEditingProjectId={isEditingAll}
            onEditProjectId={handleEditAll}
            onSaveProjectId={handleSaveAll}
            editedProjectId={editedProjectId}
            onProjectIdChange={handleProjectIdChange}
          />
        </View>

        {/* Numeric Keypad for House Sq. Ft. */}
        <NumericKeypad
          isVisible={numericKeypadVisible}
          currentValue={numericKeypadValue}
          onNumberPress={(num) => {
            const newValue = numericKeypadValue + num;
            setNumericKeypadValue(newValue);
            formikRef.current?.setFieldValue("houseSqFt", newValue);
          }}
          onBackspace={() => {
            const newValue = numericKeypadValue.slice(0, -1);
            setNumericKeypadValue(newValue);
            formikRef.current?.setFieldValue("houseSqFt", newValue);
          }}
          onClose={() => {
            setNumericKeypadVisible(false);
            // Save on close
            setTimeout(() => formikRef.current?.submitForm(), 100);
          }}
          title="House Sq. Ft."
        />
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  formContainer: { paddingHorizontal: moderateScale(24) },

  // Map Preview Styles
  mapPreviewContainer: {
    width: "100%",
    height: verticalScale(200),
    marginBottom: verticalScale(14),
    borderRadius: moderateScale(12),
    overflow: "hidden",
  },
  mapPreviewTouchable: {
    flex: 1,
    position: "relative",
  },
  mapPreviewImage: {
    width: "100%",
    height: "100%",
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#1D2A4F",
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    tintColor: "#666",
    marginBottom: verticalScale(8),
  },
  mapPlaceholderText: {
    color: "#AAA",
    fontSize: moderateScale(14),
    textAlign: "center",
    marginBottom: verticalScale(8),
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: verticalScale(4),
  },
  viewMapButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  mapIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    marginRight: moderateScale(6),
  },
  viewMapText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "500",
    fontFamily: "Lato-Medium",
  },
  analyticsIndicator: {
    position: "absolute",
    top: moderateScale(-4),
    right: moderateScale(-4),
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(2),
    paddingVertical: moderateScale(1),
  },
  analyticsIndicatorText: {
    fontSize: moderateScale(10),
  },
  rightButtonsContainer: {
    flexDirection: "row",
    alignSelf: "flex-end",
    alignItems: "center",
    gap: moderateScale(8),
    marginRight: moderateScale(-8), // Shift everything left to align with refresh button
  },
  cameraWrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(8),
  },
  cameraIcon: {
    width: moderateScale(34),
    height: moderateScale(34),
    marginRight: moderateScale(6),
  },
  photoCountText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: moderateScale(20),
    letterSpacing: 0.15,
  },
  form: {
    flex: 1,
    marginTop: 0,
    marginLeft: moderateScale(-8),
  },
  helperText: {
    color: "#C6D0E2",
    fontSize: moderateScale(12),
    marginTop: verticalScale(0),
    marginBottom: verticalScale(0),
  },
  headerWrap: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
});
