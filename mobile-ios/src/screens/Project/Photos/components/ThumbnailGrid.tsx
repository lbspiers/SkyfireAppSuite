import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
} from "react-native";
import type { PhotoItem } from "../types";

type Props = {
  items: PhotoItem[];
  editMode: boolean;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
  onOpen: (item: PhotoItem) => void;
  numColumns?: number;
};

const PADDING_H = 14; // parent horizontal padding on the screen
const GAP = 4; // Further reduced gap for even tighter spacing

export default function ThumbnailGrid({
  items,
  editMode,
  selected,
  onToggleSelect,
  onLongPress,
  onOpen,
  numColumns = 3,
}: Props) {
  const { width } = useWindowDimensions();

  const itemSize = useMemo(() => {
    const inner = width - PADDING_H * 2;
    const totalGaps = GAP * (numColumns - 1);
    return Math.floor((inner - totalGaps) / numColumns);
  }, [width, numColumns]);

  const renderItem = useCallback(
    ({ item }: { item: PhotoItem }) => {
      const isPicked = selected.has(item.id);
      const uri = item.thumbUrl || item.posterUrl || item.url;

      const onPress = () => {
        if (editMode) onToggleSelect(item.id);
        else onOpen(item);
      };

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          onLongPress={() => onLongPress(item.id)}
          style={[styles.cell, { width: itemSize, height: itemSize }]}
        >
          <Image source={{ uri }} style={styles.img} />

          {/* top-right selection pill */}
          {editMode && (
            <View style={styles.pickWrap} pointerEvents="none">
              <View style={[styles.pickDot, isPicked && styles.pickDotOn]} />
            </View>
          )}

          {/* video badge */}
          {item.mediaType === "video" && (
            <View style={styles.videoBadge}>
              <Text style={styles.videoText}>VIDEO</Text>
            </View>
          )}

          {/* optional tag chip (bottom-left) */}
          {!!item.tag && (
            <View style={styles.tagChip}>
              <Text numberOfLines={1} style={styles.tagText}>
                {item.tag}
              </Text>
            </View>
          )}

          {/* focus ring when selected */}
          {isPicked && (
            <View style={styles.selectedRing} pointerEvents="none" />
          )}
        </TouchableOpacity>
      );
    },
    [editMode, itemSize, onLongPress, onOpen, onToggleSelect, selected]
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it.id}
      renderItem={renderItem}
      numColumns={numColumns}
      scrollEnabled={false}
      columnWrapperStyle={[styles.row, { gap: GAP, marginBottom: GAP }]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: "flex-start",
  },
  cell: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#09152B",
  },
  img: {
    width: "100%",
    height: "100%",
  },

  pickWrap: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
  },
  pickDotOn: {
    backgroundColor: "#FFB02E",
    borderColor: "#0C1F3F",
  },

  selectedRing: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: "#FFB02E",
    borderRadius: 10,
  },

  videoBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },

  tagChip: {
    position: "absolute",
    left: 8,
    bottom: 8,
    maxWidth: "70%",
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(12,31,63,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  tagText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
});
