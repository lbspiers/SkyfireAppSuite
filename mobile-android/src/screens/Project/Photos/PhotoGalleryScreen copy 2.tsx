import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  LayoutChangeEvent,
  TouchableOpacity,
  Text,
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation, RouteProp, useFocusEffect, DrawerActions } from "@react-navigation/native";
import { useSelector } from "react-redux";
import LinearGradient from "react-native-linear-gradient";

import CollapsibleSection from "../../../components/UI/CollapsibleSection";
import { usePhotoCapture } from "../../../hooks/usePhotoCapture";
import { useProjectContext } from "../../../hooks/useProjectContext";
import { DEFAULT_PANEL_PHOTO_TAGS } from "../../../utils/constants";
import LargeHeader from "../../../components/Header/LargeHeader";
import { BLUE_MD_TB, ORANGE_TB, BLUE_2C_BT } from "../../../styles/gradient";
import { verticalScale, useResponsive } from "../../../utils/responsive";
import { Image, Dimensions } from "react-native";

import { fetchProjectPhotos, deletePhotos } from "./services/galleryservice";
import type { PhotoItem } from "./types";
import ThumbnailGrid from "./components/ThumbnailGrid";
import FullScreenViewer from "./components/FullScreenViewer";

type SectionMap = Record<string, PhotoItem[]>;
type SystemMap = Record<string, SectionMap>;

const groupBySection = (items: PhotoItem[]): SectionMap => {
  const acc: SectionMap = {};
  for (const p of items) {
    (acc[p.section] ||= []).push(p);
  }
  // most recent first inside each section
  Object.keys(acc).forEach((k) =>
    acc[k].sort((a, b) =>
      (a.capturedAt || "") < (b.capturedAt || "") ? 1 : -1
    )
  );
  return acc;
};

// Group sections by system number
const groupBySystem = (sections: SectionMap): SystemMap => {
  const systems: SystemMap = {};
  
  for (const [sectionName, items] of Object.entries(sections)) {
    // Extract system number from section name if it exists
    // Look for patterns like "System 1", "System1", "S1", etc.
    let systemName = "System 1"; // Default to System 1
    
    const sectionLower = sectionName.toLowerCase();
    const systemMatch = sectionLower.match(/system\s*(\d+)|s(\d+)/i);
    
    if (systemMatch) {
      const systemNum = systemMatch[1] || systemMatch[2];
      systemName = `System ${systemNum}`;
    } else {
      // If no system number found, assign to System 1 by default
      // You can enhance this logic based on your actual data
      systemName = "System 1";
    }
    
    if (!systems[systemName]) {
      systems[systemName] = {};
    }
    systems[systemName][sectionName] = items;
  }
  
  // Sort systems by number
  const sortedSystems: SystemMap = {};
  Object.keys(systems)
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    })
    .forEach(key => {
      sortedSystems[key] = systems[key];
    });
  
  return sortedSystems;
};

// ---- Route typing (keep loose if you don’t have a central type) ----
type ParamList = {
  PhotoGallery: {
    projectId: string;
    initialSection?: string;
    fromScreen?: string;
    initialTag?: string;
  };
};

export default function PhotoGalleryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, "PhotoGallery">>();
  const { projectId, initialSection, fromScreen, initialTag } = route.params || {};

  // Project header info
  const project = useSelector((s: any) => s.project?.currentProject);
  
  // Use project context for both projectId and companyId
  const projectContext = useProjectContext();
  const contextProjectId = projectContext.projectId || projectId; // Use route param as fallback
  const companyId = projectContext.companyId || "";
  
  // Debug logging for companyId
  useEffect(() => {
    if (__DEV__) {
      console.log("[PhotoGallery] Context data:", {
        routeProjectId: projectId,
        contextProjectId: projectContext.projectId,
        companyId: projectContext.companyId,
        hasCompany: !!projectContext.company
      });
    }
  }, [projectId, projectContext, companyId]);
  
  // Photo capture hook for camera functionality
  const photoCapture = usePhotoCapture();

  // Header overlay offset
  const [headerH, setHeaderH] = useState(0);
  const onHeaderLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const h = e.nativeEvent.layout.height;
      if (h !== headerH) setHeaderH(h);
    },
    [headerH]
  );

  // Data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  
  // Sorting
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const orderedForViewer = useMemo(
    () => [...photos].sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1)),
    [photos]
  );

  const load = useCallback(async () => {
    const projectIdToUse = contextProjectId || projectId;
    if (!projectIdToUse) {
      console.warn("[PhotoGallery] No projectId available for loading photos");
      setLoading(false);
      return;
    }
    
    try {
      setErr(null);
      console.log("[PhotoGallery] Loading photos for project:", projectIdToUse);
      const list = await fetchProjectPhotos(projectIdToUse);
      setPhotos(list);
      console.log("[PhotoGallery] Loaded", list.length, "photos");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load photos");
    } finally {
      setLoading(false);
    }
  }, [contextProjectId, projectId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await load();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    console.log("[PhotoGallery] Refreshing photos...");
    setRefreshing(true);
    await load();
    setRefreshing(false);
    console.log("[PhotoGallery] Refresh complete, photos count:", photos.length);
  }, [load, photos.length]);

  // Optional tag filter from route (shows a subset without mutating source)
  const visiblePhotos = useMemo(() => {
    if (!initialTag) return photos;
    return photos.filter((p) => p.tag === initialTag);
  }, [photos, initialTag]);

  // Group by section (most recent first inside each section)
  const sections = useMemo(
    () => groupBySection(visiblePhotos),
    [visiblePhotos]
  );
  
  // Group sections by system/equipment
  const systems = useMemo(
    () => groupBySystem(sections),
    [sections]
  );

  // Which section should be initially expanded?
  const initialExpandedKeyRef = useRef<string | undefined>(initialSection);

  // Enhanced navigation state tracking
  const [navigationState, setNavigationState] = useState<{
    canGoBack: boolean;
    previousScreenName: string | null;
    isFromTabNavigator: boolean;
  }>({
    canGoBack: false,
    previousScreenName: null,
    isFromTabNavigator: false,
  });

  // Track if we've loaded at least once
  const hasLoadedRef = useRef(false);
  
  // Detect navigation context on focus
  useFocusEffect(
    useCallback(() => {
      const state = navigation.getState();
      
      // Get parent navigator state (tab navigator)
      const parentNav = navigation.getParent();
      const parentState = parentNav?.getState();
      
      // Detect if we're coming from tab navigator
      const isFromTabNavigator = parentState?.type === 'tab' || 
        fromScreen === 'TabNavigator' ||
        fromScreen === 'Camera';
      
      // Get active tab name
      let activeTabName = null;
      if (isFromTabNavigator && parentState?.routes && parentState.index !== undefined) {
        const activeTabIndex = parentState.index;
        const activeRoute = parentState.routes[activeTabIndex];
        activeTabName = activeRoute?.name || null;
      }
      
      // Use fromScreen param or detected tab name
      const detectedFromScreen = fromScreen || activeTabName;
      
      // Auto-refresh when returning to screen (but not on first load)
      if (hasLoadedRef.current) {
        console.log("[PhotoGallery] Screen focused, refreshing photos...");
        onRefresh();
      } else {
        hasLoadedRef.current = true;
      }
      
      setNavigationState({
        canGoBack: navigation.canGoBack(),
        previousScreenName: detectedFromScreen,
        isFromTabNavigator: isFromTabNavigator || 
          ['Site', 'Equipment', 'Electrical', 'Structural', 'Review', 'Camera'].includes(detectedFromScreen || ''),
      });
      
      if (__DEV__) {
        console.log('[PhotoGallery] Navigation context detected:', {
          fromScreen,
          detectedFromScreen,
          activeTabName,
          isFromTabNavigator,
          parentNavigatorType: parentState?.type,
          parentRoutes: parentState?.routes?.map((r: any) => r?.name || 'unknown'),
        });
      }
    }, [navigation, fromScreen, onRefresh])
  );

  // Enhanced back navigation with tab support
  // Open drawer menu
  const handleDrawerPress = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleBack = useCallback(() => {
    if (__DEV__) {
      console.log('[PhotoGallery] handleBack called with state:', {
        fromScreen,
        navigationState,
        canGoBack: navigation.canGoBack(),
      });
    }

    // Strategy 1: Handle PhotoNotesModal - use standard goBack
    if (fromScreen === 'PhotoNotesModal') {
      if (__DEV__) {
        console.log('[PhotoGallery] Navigating back to PhotoNotesModal');
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }
    }

    // Strategy 2: Handle tab navigator context
    if (navigationState.isFromTabNavigator || fromScreen === 'TabNavigator' || fromScreen === 'Camera') {
      const tabName = navigationState.previousScreenName || 'Camera';
      
      if (['Site', 'Equipment', 'Electrical', 'Structural', 'Review', 'Camera'].includes(tabName)) {
        if (__DEV__) {
          console.log('[PhotoGallery] Navigating back to tab:', tabName);
        }
        
        try {
          // Navigate back to the Main tab navigator, focusing on the specific tab
          navigation.navigate('Main', { 
            screen: tabName,
            initial: false // Don't reset the tab's internal state
          });
          return;
        } catch (error) {
          console.warn('[PhotoGallery] Tab navigation failed:', error);
        }
      }
    }

    // Strategy 3: Try parent navigator
    try {
      const parentNav = navigation.getParent();
      if (parentNav && parentNav.canGoBack()) {
        if (__DEV__) {
          console.log('[PhotoGallery] Using parent navigator to go back');
        }
        parentNav.goBack();
        return;
      }
    } catch (error) {
      console.warn('[PhotoGallery] Parent navigation failed:', error);
    }

    // Strategy 4: Standard goBack
    try {
      if (navigation.canGoBack()) {
        if (__DEV__) {
          console.log('[PhotoGallery] Using standard goBack');
        }
        navigation.goBack();
        return;
      }
    } catch (error) {
      console.warn('[PhotoGallery] Standard goBack failed:', error);
    }

    // Strategy 5: Fallback to Main tab navigator
    try {
      if (__DEV__) {
        console.log('[PhotoGallery] Fallback: navigating to Main');
      }
      navigation.navigate('Main');
    } catch (error) {
      console.error('[PhotoGallery] All navigation strategies failed:', error);
      // Last resort: go to home
      navigation.navigate('Home');
    }
  }, [navigation, navigationState, fromScreen]);

  // Toggle selection
  const togglePick = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Long-press enters edit mode
  const handleLongPressThumb = (id: string) => {
    setEditMode(true);
    setSelected(new Set([id]));
  };

  // Delete selected
  const handleDelete = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    try {
      await deletePhotos(projectId, ids);
      setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
      setSelected(new Set());
      setEditMode(false);
    } catch (e) {
      console.warn("Delete failed", e);
    }
  };

  // Viewer open
  const handleOpenViewer = (item: PhotoItem) => {
    const idx = orderedForViewer.findIndex((p) => p.id === item.id);
    setViewerIndex(Math.max(0, idx));
    setViewerOpen(true);
  };

  const fullName = project?.details
    ? `${project.details.customer_last_name}, ${project.details.customer_first_name}`
    : undefined;

  const addressLines = project?.site
    ? [
        project.site.address,
        [project.site.city, project.site.state, project.site.zip_code]
          .filter(Boolean)
          .join(", "),
      ]
    : undefined;

  const isEmpty =
    !loading &&
    !err &&
    Object.values(sections).every((arr) => (arr?.length ?? 0) === 0);

  return (
    <LinearGradient {...BLUE_MD_TB} style={styles.root}>
      {/* Action bar when editing */}
      {editMode && (
        <View style={[styles.editBar, { top: headerH }]}>
          <TouchableOpacity
            onPress={() => {
              setEditMode(false);
              setSelected(new Set());
            }}
          >
            <Text style={styles.editBarBtn}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.editBarCount}>{selected.size} selected</Text>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={[styles.editBarBtn, { color: "#FFB02E" }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerH + (editMode ? 48 : 0),
            paddingBottom: Dimensions.get("window").height * 0.085 + verticalScale(20),
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        {loading ? (
          <Text style={styles.loading}>Loading photos…</Text>
        ) : err ? (
          <Text style={styles.error}>{err}</Text>
        ) : isEmpty ? (
          <Text style={styles.loading}>No photos yet.</Text>
        ) : (
          <View style={styles.systemsContainer}>
            {/* Sort Controls */}
            <View style={styles.sortBar}>
              <TouchableOpacity 
                style={styles.sortButton}
                onPress={() => setSortOrder(sortOrder === "recent" ? "oldest" : "recent")}
              >
                <Text style={styles.sortButtonText}>
                  Sort: {sortOrder === "recent" ? "Most Recent" : "Oldest First"}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* System Groups */}
            {Object.keys(systems).map((systemKey) => {
              const systemSections = systems[systemKey];
              const totalItems = Object.values(systemSections).reduce(
                (sum, items) => sum + items.length, 0
              );
              
              return (
                <View key={systemKey} style={styles.systemWrapper}>
                  <CollapsibleSection
                    title={systemKey}
                    initiallyExpanded={false}
                    photoCount={totalItems}
                    renderCamera={false}
                    alwaysShowCamera={false}
                    fullWidth={true}
                  >
                    {Object.keys(systemSections).map((sectionKey) => {
                      const items = systemSections[sectionKey]!;
                      if (items.length === 0) return null;
                      
                      // Sort items based on current sort order
                      const sortedItems = [...items].sort((a, b) => {
                        if (sortOrder === "recent") {
                          return (a.capturedAt || "") < (b.capturedAt || "") ? 1 : -1;
                        } else {
                          return (a.capturedAt || "") > (b.capturedAt || "") ? 1 : -1;
                        }
                      });
                      
                      return (
                        <View key={sectionKey} style={styles.equipmentWrapper}>
                          <CollapsibleSection
                            title={sectionKey}
                            initiallyExpanded={initialExpandedKeyRef.current === sectionKey}
                            photoCount={items.length}
                            renderCamera={true}
                            alwaysShowCamera={true}
                            fullWidth={true}
                            captureConfig={{
                              projectId: contextProjectId,
                              companyId: companyId,
                              section: sectionKey,
                              tagOptions: DEFAULT_PANEL_PHOTO_TAGS,
                              onMediaAdded: (type: "photo" | "video") => {
                                console.log(`[PhotoGallery] New ${type} added to section:`, sectionKey);
                                setTimeout(() => {
                                  console.log("[PhotoGallery] Triggering refresh after media added");
                                  onRefresh();
                                }, 500);
                              },
                              onSaveNote: (note: string) => {
                                console.log("[PhotoGallery] Note saved for section:", sectionKey);
                                setTimeout(() => {
                                  onRefresh();
                                }, 500);
                              }
                            }}
                          >
                            <ThumbnailGrid
                              items={sortedItems}
                              editMode={editMode}
                              selected={selected}
                              onToggleSelect={togglePick}
                              onLongPress={handleLongPressThumb}
                              onOpen={handleOpenViewer}
                            />
                          </CollapsibleSection>
                        </View>
                      );
                    })}
                  </CollapsibleSection>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* LargeHeader with back button */}
      <View style={styles.headerWrap} onLayout={onHeaderLayout}>
        <LargeHeader
          title="Photo Gallery"
          name={fullName}
          addressLines={addressLines}
          projectId={project?.details?.installer_project_id}
          onDrawerPress={handleDrawerPress}
        />
      </View>

      {/* Full-screen viewer */}
      <FullScreenViewer
        visible={viewerOpen}
        items={orderedForViewer}
        index={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />

      {/* Custom Tab Bar at bottom */}
      <CustomTabBar navigation={navigation} />
    </LinearGradient>
  );
}

// Custom Tab Bar Component
const CustomTabBar: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { widthPercentageToDP, verticalScale } = useResponsive();
  
  // Device dimensions
  const SCREEN_HEIGHT = Dimensions.get("window").height;
  const SCREEN_WIDTH = Dimensions.get("window").width;
  
  // Constants
  const TAB_BAR_HEIGHT = SCREEN_HEIGHT * 0.085;
  const ICON_CONTAINER_SIZE = SCREEN_WIDTH / 8.25;
  const ICON_RADIUS = ICON_CONTAINER_SIZE / 2;
  
  const tabs = [
    { name: 'Site', icon: require('../../../assets/Images/icons/House_Icon_White.png'), route: 'Site' },
    { name: 'Equipment', icon: require('../../../assets/Images/icons/tab2.png'), route: 'Equipment' },
    { name: 'Electrical', icon: require('../../../assets/Images/icons/tab3.png'), route: 'Electrical' },
    { name: 'Structural', icon: require('../../../assets/Images/icons/tab4.png'), route: 'Structural' },
    { name: 'Review', icon: require('../../../assets/Images/icons/tab5.png'), route: 'Review' },
    { name: 'Camera', icon: require('../../../assets/Images/icons/camera.png'), route: 'PhotoGallery', active: true },
  ];
  
  const handleTabPress = (route: string) => {
    if (route === 'PhotoGallery') {
      // Already on PhotoGallery, do nothing
      return;
    }
    
    // Navigate to the Main tab navigator with the selected tab
    navigation.navigate('Main', {
      screen: route,
      initial: false
    });
  };
  
  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: TAB_BAR_HEIGHT,
    }}>
      <LinearGradient
        {...BLUE_MD_TB}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          borderTopLeftRadius: TAB_BAR_HEIGHT / 2,
          borderTopRightRadius: TAB_BAR_HEIGHT / 2,
          paddingHorizontal: widthPercentageToDP("2%"),
        }}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            onPress={() => handleTabPress(tab.route)}
            style={{ alignItems: 'center' }}
          >
            <LinearGradient
              {...(tab.active ? ORANGE_TB : BLUE_2C_BT)}
              style={{
                width: ICON_CONTAINER_SIZE,
                height: ICON_CONTAINER_SIZE,
                borderRadius: ICON_RADIUS,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Image
                source={tab.icon}
                style={{
                  width: ICON_CONTAINER_SIZE * 0.6,
                  height: ICON_CONTAINER_SIZE * 0.6,
                  tintColor: '#FFFFFF',
                }}
                resizeMode="contain"
              />
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1, gap: 0 },
  headerWrap: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },

  loading: { color: "#FFFFFF", opacity: 0.9, padding: 12 },
  error: { color: "#FF8888", padding: 12 },

  editBar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: "rgba(12,31,63,0.9)",
    zIndex: 9,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editBarBtn: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  editBarCount: { color: "#FFFFFF", opacity: 0.9, fontSize: 14 },
  sortBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  systemsContainer: {
    flex: 1,
  },
  systemWrapper: {
    marginBottom: 2,
  },
  equipmentWrapper: {
    backgroundColor: "rgba(12, 31, 63, 0.3)",
  },
  sortButton: {
    backgroundColor: "rgba(255, 176, 46, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 176, 46, 0.3)",
  },
  sortButtonText: {
    color: "#FFB02E",
    fontSize: 14,
    fontWeight: "600",
  },
});
