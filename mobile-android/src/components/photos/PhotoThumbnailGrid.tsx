// src/components/photos/PhotoThumbnailGrid.tsx
import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Text from "../Text";
import { PhotoRecord } from "../../api/photo.service";
import COLORS from "../../utils/styleConstant/Color";
import { spacing } from "../../theme/theme";

interface Props {
  photos: PhotoRecord[];
  onPhotoPress: (photo: PhotoRecord) => void;
  onDeletePhoto?: (photoId: string) => void;
  loading?: boolean;
}

export default function PhotoThumbnailGrid({
  photos,
  onPhotoPress,
  onDeletePhoto,
  loading = false,
}: Props) {
  const renderPhotoItem = ({ item: photo }: { item: PhotoRecord }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => onPhotoPress(photo)}>
        <Image
          source={{ uri: photo.thumb_url || photo.url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        {/* Video indicator */}
        {photo.media_type === "video" && (
          <View style={styles.videoIndicator}>
            <Text style={styles.videoText}>▶</Text>
          </View>
        )}

        {/* Tag badge */}
        {photo.tag && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{photo.tag}</Text>
          </View>
        )}

        {/* Note indicator */}
        {photo.note && (
          <View style={styles.noteIndicator}>
            <Text style={styles.noteEmoji}>📝</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Delete button - matches your ImageCollection pattern */}
      {onDeletePhoto && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDeletePhoto(photo.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image
            source={require("../../assets/Images/icons/close.png")}
            style={styles.deleteIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.orange} />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No photos in this section</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={photos}
      contentContainerStyle={styles.flatListContainer}
      numColumns={3}
      renderItem={renderPhotoItem}
      keyExtractor={(photo) => photo.id}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false} // Let parent scroll
    />
  );
}

const styles = StyleSheet.create({
  flatListContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  itemContainer: {
    flex: 1,
    margin: spacing.xs,
    position: "relative",
  },
  thumbnail: {
    width: 86, // Match your ImageCollection
    height: 70, // Match your ImageCollection
    borderRadius: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  deleteButton: {
    position: "absolute",
    right: -10,
    top: -10,
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIcon: {
    height: 16,
    width: 16,
    tintColor: COLORS.white,
  },
  videoIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  videoText: {
    color: COLORS.white,
    fontSize: 10,
  },
  tagBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: COLORS.orange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
  },
  noteIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noteEmoji: {
    fontSize: 10,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
  },
});
