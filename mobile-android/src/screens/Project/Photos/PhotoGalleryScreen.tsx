/**
 * PhotoGalleryScreen - Professional photo management for field surveyors
 *
 * Designed to handle 100-250+ photos per site visit with:
 * - System-based and equipment-type filtering
 * - Collapsible sections with photo counts
 * - Bulk selection and deletion
 * - Quick navigation and organization
 * - Seamless camera integration
 *
 * @module PhotoGalleryScreen
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  LayoutChangeEvent,
  TouchableOpacity,
  Text,
  RefreshControl,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
  Platform,
  TextInput,
} from "react-native";
import { useRoute, useNavigation, RouteProp, DrawerActions } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";

import { usePhotoCapture } from "../../../hooks/usePhotoCapture";
import { useProjectContext } from "../../../hooks/useProjectContext";
import { DEFAULT_PANEL_PHOTO_TAGS } from "../../../utils/constants";
import LargeHeader from "../../../components/Header/LargeHeader";
import Button from "../../../components/Button";
import { BLUE_MD_TB, ORANGE_TB, BLUE_2C_BT } from "../../../styles/gradient";

import { fetchProjectPhotos, deletePhotos } from "./services/galleryservice";
import type { PhotoItem } from "./types";
import FullScreenViewer from "./components/FullScreenViewer";
import {
  formatVideoDuration,
  filterPhotosBySearch,
  cachePhotos,
  loadCachedPhotos,
  getCacheMetadata,
  getTimeSinceSync,
} from "../../../utils/photoGalleryHelpers";
import OptimizedImage from "../../../components/OptimizedImage";

// ==================== CONSTANTS ====================
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const GRID_COLUMNS = 3; // Changed from 4 to 3 for better visibility
const GRID_PADDING = 16;
const GRID_GAP = 8; // Increased gap for better spacing
const ITEM_SIZE = (SCREEN_WIDTH - (GRID_PADDING * 2) - (GRID_GAP * (GRID_COLUMNS - 1))) / GRID_COLUMNS;
const SCROLL_THRESHOLD = 300; // Show jump-to-top after scrolling this far

// Tab bar height calculation (matches TabNavigator.tsx logic)
const getTabBarHeight = () => {
  const { width, height } = Dimensions.get("window");
  const isTablet = width >= 768 || height >= 1024;
  const isAndroid = Platform.OS === 'android';
  const androidExtraHeight = isAndroid ? 20 : 0;

  if (isTablet) return 80 + androidExtraHeight;
  if (width < 375) return 55 + androidExtraHeight;
  if (width > 414) return 70 + androidExtraHeight;
  return 65 + androidExtraHeight;
};

const TAB_BAR_HEIGHT = getTabBarHeight();

// ==================== TYPES ====================
type ParamList = {
  PhotoGalleryScreen: {
    projectId: string;
    initialSection?: string;
    fromScreen?: string;
    initialTag?: string;
  };
};

interface PhotoSection {
  title: string;
  data: PhotoItem[][];
  collapsed: boolean;
  photoCount: number;
}

interface EquipmentType {
  label: string;
  count: number;
}

// ==================== MAIN COMPONENT ====================
export default function PhotoGalleryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, "PhotoGalleryScreen">>();
  const { projectId, initialSection, fromScreen } = route.params || {};

  // Project context
  const project = useSelector((s: any) => s.project?.currentProject);
  const projectContext = useProjectContext();
  const contextProjectId = projectContext.projectId || projectId;
  const companyId = projectContext.companyId || "";
  const photoCapture = usePhotoCapture();

  // Safe area insets for proper spacing
  const insets = useSafeAreaInsets();

  // Calculate bottom offset for tab bar
  const bottomOffset = Platform.OS === "android"
    ? Math.max(insets.bottom, 20)
    : insets.bottom;
  const totalBottomPadding = TAB_BAR_HEIGHT + bottomOffset;

  // Refs
  const scrollRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header layout
  const [headerH, setHeaderH] = useState(0);
  const onHeaderLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const h = e.nativeEvent.layout.height;
      if (h !== headerH) setHeaderH(h);
    },
    [headerH]
  );

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Filter states
  const [activeSystem, setActiveSystem] = useState<string>("All Systems");
  const [activeEquipment, setActiveEquipment] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Section collapse states
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [allCollapsed, setAllCollapsed] = useState(false);

  // Selection states
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Scroll state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ==================== DATA LOADING ====================

  const load = useCallback(async () => {
    const projectIdToUse = contextProjectId || projectId;
    if (!projectIdToUse) {
      console.warn("[PhotoGallery] No projectId available");
      setLoading(false);
      return;
    }

    try {
      setErr(null);

      // Try to load from cache first (for offline support)
      const cachedPhotos = await loadCachedPhotos(projectIdToUse);
      if (cachedPhotos && cachedPhotos.length > 0) {
        console.log("[PhotoGallery] Loaded from cache:", cachedPhotos.length);
        setPhotos(cachedPhotos);
      }

      // Load fresh data from network
      const list = await fetchProjectPhotos(projectIdToUse);
      setPhotos(list);

      // Cache the fresh data for offline use
      await cachePhotos(projectIdToUse, list);

      // Update last sync time
      const metadata = await getCacheMetadata();
      if (metadata) {
        setLastSyncTime(metadata.lastSynced);
      }

    } catch (e: any) {
      console.error("[PhotoGallery] Load error:", e);

      // If we have cached data, show it with error message
      const cachedPhotos = await loadCachedPhotos(projectIdToUse);
      if (cachedPhotos && cachedPhotos.length > 0) {
        setPhotos(cachedPhotos);
        setErr("Using cached data - network unavailable");
      } else {
        setErr(e?.message ?? "Failed to load photos");
      }
    } finally {
      setLoading(false);
    }
  }, [contextProjectId, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // Listen to photo capture refresh trigger
  useEffect(() => {
    if (photoCapture?.refreshTrigger) {
      load();
    }
  }, [photoCapture?.refreshTrigger, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // ==================== FILTERING & ORGANIZATION ====================

  // Extract systems from photos with photo counts
  const systemsWithCounts = useMemo(() => {
    const systemCounts = new Map<string, number>();

    photos.forEach(photo => {
      // Extract system number from section (e.g., "System 1", "Solar Panel 2")
      const systemMatch = photo.section?.match(/(?:System|sys)\s*(\d+)/i);
      let systemName: string;

      if (systemMatch) {
        systemName = `System ${systemMatch[1]}`;
      } else if (photo.section?.match(/Main Panel|Sub Panel|Point of Interconnection|Service Entrance/i)) {
        systemName = "Electrical";
      } else {
        systemName = "General";
      }

      systemCounts.set(systemName, (systemCounts.get(systemName) || 0) + 1);
    });

    const systemsArray = Array.from(systemCounts.entries()).map(([name, count]) => ({ name, count }));

    return systemsArray.sort((a, b) => {
      // Sort: System 1, System 2, ..., Electrical, General
      const sysA = a.name.match(/System (\d+)/);
      const sysB = b.name.match(/System (\d+)/);
      if (sysA && sysB) return parseInt(sysA[1]) - parseInt(sysB[1]);
      if (sysA) return -1;
      if (sysB) return 1;
      if (a.name === "Electrical") return -1;
      if (b.name === "Electrical") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [photos]);

  // Extract equipment types from photos (based on section names)
  const equipmentTypes: EquipmentType[] = useMemo(() => {
    const typeMap = new Map<string, number>();

    photos.forEach(photo => {
      // Apply system filter first
      if (activeSystem !== "All Systems") {
        const photoSystem = extractSystemFromPhoto(photo);
        if (photoSystem !== activeSystem) return;
      }

      const section = photo.section || "Uncategorized";
      typeMap.set(section, (typeMap.get(section) || 0) + 1);
    });

    const types: EquipmentType[] = Array.from(typeMap.entries()).map(([label, count]) => ({
      label,
      count,
    }));

    // Sort alphabetically
    types.sort((a, b) => a.label.localeCompare(b.label));

    return types;
  }, [photos, activeSystem]);

  // Helper to extract system from photo
  const extractSystemFromPhoto = (photo: PhotoItem): string => {
    const systemMatch = photo.section?.match(/(?:System|sys)\s*(\d+)/i);
    if (systemMatch) {
      return `System ${systemMatch[1]}`;
    }
    if (photo.section?.match(/Main Panel|Sub Panel|Point of Interconnection|Service Entrance/i)) {
      return "Electrical";
    }
    return "General";
  };

  // Group photos into sections
  const photoSections: PhotoSection[] = useMemo(() => {
    let filtered = [...photos];

    // Search filter (applied first)
    if (searchQuery.trim()) {
      filtered = filterPhotosBySearch(filtered, searchQuery);
    }

    // System filter
    if (activeSystem !== "All Systems") {
      filtered = filtered.filter(photo => extractSystemFromPhoto(photo) === activeSystem);
    }

    // Equipment filter
    if (activeEquipment !== "All") {
      filtered = filtered.filter(photo => photo.section === activeEquipment);
    }

    // Group by section
    const grouped: Record<string, PhotoItem[]> = {};
    filtered.forEach(photo => {
      const section = photo.section || "Uncategorized";
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(photo);
    });

    // Convert to sections with grid rows
    const sections: PhotoSection[] = [];
    Object.entries(grouped).forEach(([title, items]) => {
      // Sort items by date (newest first)
      items.sort((a, b) => (b.capturedAt || "").localeCompare(a.capturedAt || ""));

      // Group into rows of 3
      const rows: PhotoItem[][] = [];
      for (let i = 0; i < items.length; i += GRID_COLUMNS) {
        rows.push(items.slice(i, i + GRID_COLUMNS));
      }

      sections.push({
        title,
        data: rows,
        collapsed: allCollapsed || collapsedSections.has(title),
        photoCount: items.length,
      });
    });

    // Sort sections alphabetically
    sections.sort((a, b) => a.title.localeCompare(b.title));

    return sections;
  }, [photos, activeSystem, activeEquipment, searchQuery, collapsedSections, allCollapsed]);

  // Calculate total visible photos
  const totalPhotos = useMemo(() => {
    return photoSections.reduce((sum, section) => sum + section.photoCount, 0);
  }, [photoSections]);

  // ==================== SECTION MANAGEMENT ====================

  const toggleSection = useCallback((sectionTitle: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  }, []);

  const toggleAllSections = useCallback(() => {
    setAllCollapsed(prev => !prev);
    setCollapsedSections(new Set()); // Clear individual states
  }, []);

  // ==================== SELECTION MANAGEMENT ====================

  const handleLongPress = useCallback((item: PhotoItem) => {
    if (!isSelectMode) {
      setIsSelectMode(true);
      setSelectedItems(new Set([item.id]));
    }
  }, [isSelectMode]);

  const handleItemPress = useCallback((item: PhotoItem) => {
    if (isSelectMode) {
      setSelectedItems(prev => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
        return next;
      });
    } else {
      // Open full-screen viewer
      const allPhotos = photoSections.flatMap(section => section.data.flat());
      const idx = allPhotos.findIndex(p => p.id === item.id);
      setViewerIndex(Math.max(0, idx));
      setViewerOpen(true);
    }
  }, [isSelectMode, photoSections]);

  const handleSelectAll = useCallback(() => {
    const allPhotoIds = photoSections.flatMap(section =>
      section.data.flat().map(p => p.id)
    );
    setSelectedItems(new Set(allPhotoIds));
  }, [photoSections]);

  const handleDeselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const handleCancelSelection = useCallback(() => {
    setIsSelectMode(false);
    setSelectedItems(new Set());
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.size === 0) return;

    const count = selectedItems.size;
    Alert.alert(
      "Delete Photos",
      `Are you sure you want to delete ${count} photo${count > 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const ids = Array.from(selectedItems);
              await deletePhotos(contextProjectId || projectId, ids);
              setPhotos(prev => prev.filter(p => !selectedItems.has(p.id)));
              setSelectedItems(new Set());
              setIsSelectMode(false);
            } catch (e) {
              console.error("Delete failed:", e);
              Alert.alert("Error", "Failed to delete photos. Please try again.");
            }
          },
        },
      ]
    );
  }, [selectedItems, contextProjectId, projectId]);

  // ==================== CAMERA & NAVIGATION ====================

  const handleCameraPress = useCallback(() => {
    if (photoCapture?.openForSection) {
      photoCapture.openForSection({
        section: activeEquipment !== "All" ? activeEquipment : (initialSection || "General"),
        tagOptions: DEFAULT_PANEL_PHOTO_TAGS,
        onPhotoAdded: () => {
          // Refresh will happen automatically via photoCapture.refreshTrigger
        },
      });
    }
  }, [photoCapture, activeEquipment, initialSection]);

  const handleDrawerPress = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleScrollToTop = useCallback(() => {
    scrollRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Monitor scroll position for jump-to-top button
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowScrollTop(offsetY > SCROLL_THRESHOLD);
      },
    }
  );

  // ==================== RENDERING ====================

  // Address info for header
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

  const allPhotosForViewer = useMemo(() =>
    photoSections.flatMap(section => section.data.flat()),
    [photoSections]
  );

  // Render photo thumbnail
  const renderPhotoItem = useCallback((item: PhotoItem, isLastInRow: boolean = false) => {
    const isSelected = selectedItems.has(item.id);
    const isVideo = item.mediaType === "video";
    const firstTag = item.tag || null;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.gridItem, isLastInRow && styles.gridItemLast]}
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <OptimizedImage
          uri={item.posterUrl || item.thumbUrl || item.url || ''}
          style={styles.gridImage}
          containerStyle={styles.gridImageContainer}
          resizeMode="cover"
          fadeDuration={250}
          showLoader={true}
          loaderColor="#FFB02E"
          placeholderColor="rgba(255, 255, 255, 0.05)"
        />

        {/* Show first tag if available */}
        {firstTag && !isSelectMode && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText} numberOfLines={1}>
              {firstTag}
            </Text>
          </View>
        )}

        {/* Video indicator with duration */}
        {isVideo && (
          <View style={styles.videoDurationBadge}>
            <Text style={styles.videoDurationIcon}>▶</Text>
            {item.durationMs && (
              <Text style={styles.videoDurationText}>
                {formatVideoDuration(item.durationMs)}
              </Text>
            )}
          </View>
        )}

        {/* Selection overlay */}
        {isSelectMode && (
          <View style={[styles.selectionOverlay, isSelected && styles.selectionOverlayActive]}>
            {isSelected && (
              <View style={styles.checkmarkCircle}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedItems, isSelectMode, handleItemPress, handleLongPress]);

  // Render section
  const renderSection = useCallback(({ item: section }: { item: PhotoSection }) => {
    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.title)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.photoCountBadge}>
              <Text style={styles.photoCountText}>{section.photoCount}</Text>
            </View>
          </View>
          <Text style={styles.sectionToggle}>
            {section.collapsed ? "+" : "−"}
          </Text>
        </TouchableOpacity>

        {!section.collapsed && (
          <View style={styles.sectionContent}>
            {section.data.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((item, itemIndex) =>
                  renderPhotoItem(item, itemIndex === row.length - 1)
                )}
                {/* Fill empty cells to maintain grid alignment */}
                {row.length < GRID_COLUMNS && Array.from({ length: GRID_COLUMNS - row.length }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={[styles.gridItem, styles.gridItemEmpty, idx === GRID_COLUMNS - row.length - 1 && styles.gridItemLast]} />
                ))}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }, [toggleSection, renderPhotoItem]);

  // Render system tab
  const renderSystemTab = useCallback((system: { name: string; count: number }) => {
    const isActive = activeSystem === system.name;
    return (
      <TouchableOpacity
        key={system.name}
        style={[styles.systemTab, isActive && styles.systemTabActive]}
        onPress={() => {
          setActiveSystem(system.name);
          setActiveEquipment("All"); // Reset equipment filter
        }}
      >
        <Text style={[styles.systemTabText, isActive && styles.systemTabTextActive]}>
          {system.name}
        </Text>
        <View style={[styles.systemTabBadge, isActive && styles.systemTabBadgeActive]}>
          <Text style={[styles.systemTabBadgeText, isActive && styles.systemTabBadgeTextActive]}>
            {system.count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [activeSystem]);

  // Render equipment chip
  const renderEquipmentChip = useCallback((type: EquipmentType) => {
    const isActive = activeEquipment === type.label;
    return (
      <TouchableOpacity
        key={type.label}
        style={[styles.equipmentChip, isActive && styles.equipmentChipActive]}
        onPress={() => setActiveEquipment(type.label)}
      >
        <Text style={[styles.equipmentChipText, isActive && styles.equipmentChipTextActive]}>
          {type.label}
        </Text>
        <View style={[styles.equipmentChipBadge, isActive && styles.equipmentChipBadgeActive]}>
          <Text style={[styles.equipmentChipBadgeText, isActive && styles.equipmentChipBadgeTextActive]}>
            {type.count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [activeEquipment]);

  // ==================== MAIN RENDER ====================

  return (
    <LinearGradient {...BLUE_MD_TB} style={styles.root}>
      <View style={[styles.container, { paddingTop: headerH }]}>

        {/* ========== FIXED FILTER SECTION ========== */}
        <View style={styles.fixedFilterSection}>

          {/* System Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.systemTabs}
            contentContainerStyle={styles.systemTabsContent}
          >
            {renderSystemTab({ name: "All Systems", count: photos.length })}
            {systemsWithCounts.map(renderSystemTab)}
          </ScrollView>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by notes, tags, or section..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.searchClearButton}
                onPress={() => setSearchQuery("")}
              >
                <Text style={styles.searchClearText}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Equipment Type Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.equipmentChips}
            contentContainerStyle={styles.equipmentChipsContent}
          >
            {renderEquipmentChip({ label: "All", count: totalPhotos })}
            {equipmentTypes.map(renderEquipmentChip)}
          </ScrollView>

          {/* Action Bar */}
          {(isSelectMode || photos.length > 0) && (
            <View style={styles.actionBar}>
              {isSelectMode ? (
                <>
                  <View style={styles.actionBarLeft}>
                    <Text style={styles.selectionCount}>
                      {selectedItems.size} selected
                    </Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <Button
                      title={selectedItems.size === totalPhotos ? "Deselect All" : "Select All"}
                      onPress={selectedItems.size === totalPhotos ? handleDeselectAll : handleSelectAll}
                      selected={false}
                      width={110}
                      height={36}
                      rounded={18}
                      textStyle={styles.buttonTextStyle}
                    />
                    <Button
                      title="Cancel"
                      onPress={handleCancelSelection}
                      selected={false}
                      width={80}
                      height={36}
                      rounded={18}
                      textStyle={styles.buttonTextStyle}
                    />
                    {selectedItems.size > 0 && (
                      <Button
                        title="Delete"
                        onPress={handleDeleteSelected}
                        selected={false}
                        color1="#FF4444"
                        color2="#CC0000"
                        width={80}
                        height={36}
                        rounded={18}
                        textStyle={styles.buttonTextStyle}
                      />
                    )}
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.actionBarLeft}>
                    <View>
                      <Text style={styles.photoCount}>
                        {searchQuery.trim() ? (
                          <>
                            {totalPhotos} result{totalPhotos !== 1 ? 's' : ''}
                            <Text style={styles.searchResultsOf}> of {photos.length}</Text>
                          </>
                        ) : (
                          `${totalPhotos} photo${totalPhotos !== 1 ? 's' : ''}`
                        )}
                      </Text>
                      {lastSyncTime && (
                        <Text style={styles.lastSyncText}>
                          Synced {getTimeSinceSync(lastSyncTime)}
                        </Text>
                      )}
                    </View>
                    {photoSections.length > 1 && (
                      <TouchableOpacity
                        onPress={toggleAllSections}
                        style={styles.collapseAllButton}
                      >
                        <Text style={styles.collapseAllText}>
                          {allCollapsed ? "Expand All" : "Collapse All"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Button
                    title="Add Photo"
                    onPress={handleCameraPress}
                    selected={true}
                    width={130}
                    height={38}
                    rounded={20}
                    color1="#FD7332"
                    color2="#B92011"
                    textStyle={styles.cameraButtonTextStyle}
                  />
                </>
              )}
            </View>
          )}
        </View>

        {/* ========== SCROLLABLE CONTENT ========== */}
        <View style={styles.scrollableContent}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#FFB02E" />
              <Text style={styles.loadingText}>Loading photos...</Text>
            </View>
          ) : err ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>{err}</Text>
              <Button
                title="Retry"
                onPress={onRefresh}
                selected={true}
                width={120}
                height={44}
                rounded={22}
                color1="#FD7332"
                color2="#B92011"
                textStyle={styles.retryButtonTextStyle}
              />
            </View>
          ) : photos.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No photos yet</Text>
              <Text style={styles.emptySubtext}>
                Start documenting this project by taking your first photo
              </Text>
              <Button
                title="Take First Photo"
                onPress={handleCameraPress}
                selected={true}
                width={200}
                height={48}
                rounded={24}
                color1="#FD7332"
                color2="#B92011"
                textStyle={styles.addFirstPhotoButtonTextStyle}
              />
            </View>
          ) : photoSections.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>
                {searchQuery.trim() ? "No search results" : "No photos match filters"}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery.trim()
                  ? `No photos found matching "${searchQuery}"`
                  : "Try adjusting your system or equipment filters"}
              </Text>
              {searchQuery.trim() && (
                <Button
                  title="Clear Search"
                  onPress={() => setSearchQuery("")}
                  selected={true}
                  width={160}
                  height={44}
                  rounded={22}
                  color1="#FD7332"
                  color2="#B92011"
                  textStyle={styles.retryButtonTextStyle}
                />
              )}
            </View>
          ) : (
            <FlatList
              ref={scrollRef}
              data={photoSections}
              renderItem={renderSection}
              keyExtractor={(item) => item.title}
              contentContainerStyle={[styles.listContent, { paddingBottom: totalBottomPadding + 20 }]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#FFB02E"
                  colors={["#FFB02E"]}
                />
              }
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            />
          )}
        </View>

        {/* ========== JUMP TO TOP BUTTON ========== */}
        {showScrollTop && !loading && photoSections.length > 0 && (
          <TouchableOpacity
            style={[styles.scrollTopButton, { bottom: totalBottomPadding + 24 }]}
            onPress={handleScrollToTop}
            activeOpacity={0.8}
          >
            <LinearGradient {...ORANGE_TB} style={styles.scrollTopGradient}>
              <Text style={styles.scrollTopText}>↑</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* ========== HEADER ========== */}
      <View style={styles.headerWrap} onLayout={onHeaderLayout}>
        <LargeHeader
          title="Photo Gallery"
          name={fullName}
          addressLines={addressLines}
          projectId={project?.details?.installer_project_id}
          onDrawerPress={handleDrawerPress}
        />
      </View>

      {/* ========== FULL-SCREEN VIEWER ========== */}
      <FullScreenViewer
        visible={viewerOpen}
        items={allPhotosForViewer}
        index={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />

    </LinearGradient>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  // ========== FIXED FILTER SECTION ==========
  fixedFilterSection: {
    backgroundColor: "transparent",
    paddingBottom: 8,
  },

  // System Tabs
  systemTabs: {
    marginTop: 12,
    maxHeight: 50,
  },
  searchContainer: {
    marginTop: 12,
    marginHorizontal: GRID_PADDING,
    position: "relative",
  },
  searchInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  searchClearButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 32,
    height: 32,
    alignSelf: "center",
  },
  searchClearText: {
    fontSize: 24,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "300",
  },
  systemTabsContent: {
    paddingHorizontal: GRID_PADDING,
    alignItems: "center",
  },
  systemTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    gap: 8,
  },
  systemTabActive: {
    backgroundColor: "#FD7332",
  },
  systemTabText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  systemTabTextActive: {
    color: "#0C1F3F",
  },
  systemTabBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  systemTabBadgeActive: {
    backgroundColor: "#0C1F3F",
  },
  systemTabBadgeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  systemTabBadgeTextActive: {
    color: "#FD7332",
  },

  // Equipment Chips
  equipmentChips: {
    marginTop: 12,
    maxHeight: 48,
  },
  equipmentChipsContent: {
    paddingHorizontal: GRID_PADDING,
    alignItems: "center",
  },
  equipmentChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  equipmentChipActive: {
    backgroundColor: "rgba(253, 115, 50, 0.2)",
    borderColor: "#FFB02E",
  },
  equipmentChipText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
    marginRight: 6,
  },
  equipmentChipTextActive: {
    color: "#FD7332",
  },
  equipmentChipBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  equipmentChipBadgeActive: {
    backgroundColor: "#FD7332",
  },
  equipmentChipBadgeText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  equipmentChipBadgeTextActive: {
    color: "#0C1F3F",
  },

  // Action Bar
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: GRID_PADDING,
    paddingVertical: 12,
    marginTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.15)",
  },
  actionBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  photoCount: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    marginRight: 12,
  },
  searchResultsOf: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
  lastSyncText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
    marginTop: 2,
  },
  selectionCount: {
    fontSize: 15,
    color: "#FD7332",
    fontWeight: "700",
  },
  collapseAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  collapseAllText: {
    fontSize: 12,
    color: "#FD7332",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  buttonTextStyle: {
    fontSize: 13,
    fontWeight: "600",
  },
  cameraButtonTextStyle: {
    fontSize: 14,
    fontWeight: "700",
  },

  // ========== SCROLLABLE CONTENT ==========
  scrollableContent: {
    flex: 1,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: GRID_PADDING,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    marginHorizontal: GRID_PADDING,
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
    marginRight: 8,
  },
  photoCountBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#FD7332",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCountText: {
    fontSize: 12,
    color: "#0C1F3F",
    fontWeight: "700",
  },
  sectionToggle: {
    fontSize: 28,
    color: "#FD7332",
    fontWeight: "700",
    width: 32,
    textAlign: "center",
  },
  sectionContent: {
    paddingHorizontal: GRID_PADDING,
  },

  // Grid
  listContent: {
    paddingTop: 12,
    // paddingBottom is set dynamically in component to account for tab bar
  },
  gridRow: {
    flexDirection: "row",
    marginBottom: GRID_GAP,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginRight: GRID_GAP,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  gridItemLast: {
    marginRight: 0,
  },
  gridItemEmpty: {
    backgroundColor: "transparent",
  },
  gridImageContainer: {
    width: "100%",
    height: "100%",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },

  // Tag Badge (on photo thumbnail)
  tagBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "600",
    textTransform: "uppercase",
  },

  // Video Duration Badge
  videoDurationBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  videoDurationIcon: {
    fontSize: 8,
    color: "#FFFFFF",
  },
  videoDurationText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Selection Overlay
  selectionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectionOverlayActive: {
    backgroundColor: "rgba(253, 115, 50, 0.25)",
    borderColor: "#FFB02E",
  },
  checkmarkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FD7332",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    fontSize: 20,
    color: "#0C1F3F",
    fontWeight: "900",
  },

  // ========== EMPTY/LOADING/ERROR STATES ==========
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 15,
    marginTop: 16,
    fontWeight: "600",
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 20,
    marginBottom: 8,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButtonTextStyle: {
    fontSize: 15,
    fontWeight: "700",
  },
  addFirstPhotoButtonTextStyle: {
    fontSize: 16,
    fontWeight: "700",
  },

  // ========== SCROLL TO TOP BUTTON ==========
  scrollTopButton: {
    position: "absolute",
    // bottom is set dynamically to sit above tab bar
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 100,
  },
  scrollTopGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollTopText: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
