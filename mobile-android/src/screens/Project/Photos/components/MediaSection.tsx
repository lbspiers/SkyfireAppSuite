import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import ThumbnailGrid from "./ThumbnailGrid";
import type { PhotoItem } from "../types";

type Props = {
  photos: PhotoItem[];
  videos: PhotoItem[];
  editMode: boolean;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
  onOpen: (item: PhotoItem) => void;
  sortOrder?: "recent" | "oldest";
};

const INITIAL_ITEMS_TO_SHOW = 9;

export default function MediaSection({
  photos,
  videos,
  editMode,
  selected,
  onToggleSelect,
  onLongPress,
  onOpen,
  sortOrder = "recent",
}: Props) {
  const [photosExpanded, setPhotosExpanded] = useState(true);
  const [videosExpanded, setVideosExpanded] = useState(true);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showAllVideos, setShowAllVideos] = useState(false);

  // Sort items based on sortOrder
  const sortItems = (items: PhotoItem[]) => {
    const sorted = [...items];
    if (sortOrder === "oldest") {
      sorted.sort((a, b) => 
        (a.capturedAt || "") > (b.capturedAt || "") ? 1 : -1
      );
    } else {
      sorted.sort((a, b) => 
        (a.capturedAt || "") < (b.capturedAt || "") ? 1 : -1
      );
    }
    return sorted;
  };

  const sortedPhotos = sortItems(photos);
  const sortedVideos = sortItems(videos);
  
  const displayedPhotos = showAllPhotos ? sortedPhotos : sortedPhotos.slice(0, INITIAL_ITEMS_TO_SHOW);
  const displayedVideos = showAllVideos ? sortedVideos : sortedVideos.slice(0, INITIAL_ITEMS_TO_SHOW);
  
  const hasMorePhotos = sortedPhotos.length > INITIAL_ITEMS_TO_SHOW;
  const hasMoreVideos = sortedVideos.length > INITIAL_ITEMS_TO_SHOW;

  return (
    <View style={styles.container}>
      {/* Photos Section */}
      {photos.length > 0 && (
        <View style={styles.mediaTypeSection}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setPhotosExpanded(!photosExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Photos ({photos.length})</Text>
            <Image
              source={
                photosExpanded
                  ? require("../../../../assets/Images/icons/minus_icon_orange_fd7332.png")
                  : require("../../../../assets/Images/icons/plus_icon_orange_fd7332.png")
              }
              style={styles.expandIcon}
            />
          </TouchableOpacity>
          
          {photosExpanded && (
            <>
              <ScrollView
                horizontal={false}
                scrollEnabled={showAllPhotos && photos.length > INITIAL_ITEMS_TO_SHOW}
                style={showAllPhotos ? styles.scrollContainer : undefined}
                showsVerticalScrollIndicator={false}
              >
                <ThumbnailGrid
                  items={displayedPhotos}
                  editMode={editMode}
                  selected={selected}
                  onToggleSelect={onToggleSelect}
                  onLongPress={onLongPress}
                  onOpen={onOpen}
                  numColumns={3}
                />
              </ScrollView>
              
              {hasMorePhotos && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllPhotos(!showAllPhotos)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllPhotos 
                      ? "Show Less" 
                      : `Show All (${photos.length - INITIAL_ITEMS_TO_SHOW} more)`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      {/* Videos Section */}
      {videos.length > 0 && (
        <View style={styles.mediaTypeSection}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setVideosExpanded(!videosExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Videos ({videos.length})</Text>
            <Image
              source={
                videosExpanded
                  ? require("../../../../assets/Images/icons/minus_icon_orange_fd7332.png")
                  : require("../../../../assets/Images/icons/plus_icon_orange_fd7332.png")
              }
              style={styles.expandIcon}
            />
          </TouchableOpacity>
          
          {videosExpanded && (
            <>
              <ScrollView
                horizontal={false}
                scrollEnabled={showAllVideos && videos.length > INITIAL_ITEMS_TO_SHOW}
                style={showAllVideos ? styles.scrollContainer : undefined}
                showsVerticalScrollIndicator={false}
              >
                <ThumbnailGrid
                  items={displayedVideos}
                  editMode={editMode}
                  selected={selected}
                  onToggleSelect={onToggleSelect}
                  onLongPress={onLongPress}
                  onOpen={onOpen}
                  numColumns={3}
                />
              </ScrollView>
              
              {hasMoreVideos && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllVideos(!showAllVideos)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllVideos 
                      ? "Show Less" 
                      : `Show All (${videos.length - INITIAL_ITEMS_TO_SHOW} more)`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      {/* Empty State */}
      {photos.length === 0 && videos.length === 0 && (
        <Text style={styles.emptyText}>No media in this section</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mediaTypeSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 176, 46, 0.05)",
    borderRadius: 8,
  },
  sectionTitle: {
    color: "#FFB02E",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  expandIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    marginRight: 8,
  },
  scrollContainer: {
    maxHeight: 320,
  },
  showMoreButton: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 8,
    backgroundColor: "rgba(255, 176, 46, 0.08)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 176, 46, 0.2)",
  },
  showMoreText: {
    color: "#FFB02E",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
});