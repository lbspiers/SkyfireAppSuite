import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Linking,
  Platform,
} from "react-native";
import type { ViewToken } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import type { PhotoItem } from "../types";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Reuse your red X if you want. Fallbacks to text if asset path differs.
const ICON_X = require("../../../../assets/Images/icons/X_Icon_Red_BB92011.png");

type Props = {
  visible: boolean;
  items: PhotoItem[];
  /** starting index (0-based) */
  index?: number;
  onClose: () => void;
};

export default function FullScreenViewer({
  visible,
  items,
  index = 0,
  onClose,
}: Props) {
  const listRef = useRef<FlatList<PhotoItem>>(null);
  const [current, setCurrent] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);

  const count = items.length;
  const safeIndex = useMemo(
    () => Math.max(0, Math.min(index, Math.max(0, count - 1))),
    [index, count]
  );

  useEffect(() => {
    if (!visible) return;
    setCurrent(safeIndex);
    // give Modal a tick to mount before scrolling
    setTimeout(
      () =>
        listRef.current?.scrollToIndex({ index: safeIndex, animated: false }),
      0
    );
  }, [visible, safeIndex]);

  // ✅ RN expects ArrayLike<T> here
  const getItemLayout = useCallback(
    (_data: ArrayLike<PhotoItem> | null | undefined, i: number) => ({
      length: SCREEN_W,
      offset: SCREEN_W * i,
      index: i,
    }),
    []
  );

  // ✅ Use ViewToken typing
  const onViewableItemsChanged = useRef(
    (info: {
      viewableItems: ViewToken<PhotoItem>[];
      changed: ViewToken<PhotoItem>[];
    }) => {
      const first = info.viewableItems.find((v) => v.isViewable);
      if (first?.index != null) setCurrent(first.index);
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const keyExtractor = useCallback((it: PhotoItem) => it.id, []);
  const toggleChrome = useCallback(() => setChromeVisible((v) => !v), []);

  const renderItem = useCallback(
    ({ item }: { item: PhotoItem }) => {
      const uri = item.url;
      const poster = item.posterUrl || item.thumbUrl || item.url;
      const isVideo = item.mediaType === "video";

      return (
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleChrome}
          style={styles.slide}
        >
          {isVideo ? (
            <View style={styles.mediaWrap}>
              <Image
                source={{ uri: poster }}
                style={styles.media}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.playButton}
                activeOpacity={0.9}
                onPress={() => Linking.openURL(uri)}
              >
                <Text style={styles.playText}>▶︎ Play</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Image source={{ uri }} style={styles.media} resizeMode="contain" />
          )}
        </TouchableOpacity>
      );
    },
    [toggleChrome]
  );

  if (!visible) return null;

  return (
    <Modal visible transparent onRequestClose={onClose} animationType="fade">
      <StatusBar barStyle="light-content" hidden={!chromeVisible} />
      <View style={styles.root}>
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={safeIndex}
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          windowSize={3}
          maxToRenderPerBatch={3}
          removeClippedSubviews={Platform.OS === "android"}
        />

        {/* Top chrome */}
        {chromeVisible && (
          <LinearGradient
            colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.0)"]}
            style={styles.topBar}
          >
            <View style={styles.topBarRow}>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                style={styles.closeBtn}
              >
                {ICON_X ? (
                  <Image source={ICON_X} style={{ width: 18, height: 18 }} />
                ) : (
                  <Text style={{ color: "#fff", fontSize: 16 }}>Close</Text>
                )}
              </TouchableOpacity>

              <View style={styles.counterWrap}>
                <Text style={styles.counterText}>
                  {count ? current + 1 : 0} / {count}
                </Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Bottom caption */}
        {chromeVisible && count > 0 && (
          <LinearGradient
            colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.7)"]}
            style={styles.bottomBar}
          >
            <Caption item={items[current]} />
          </LinearGradient>
        )}
      </View>
    </Modal>
  );
}

function Caption({ item }: { item: PhotoItem }) {
  const dateStr = useMemo(() => {
    if (!item?.capturedAt) return "";
    try {
      const d = new Date(item.capturedAt);
      return d.toLocaleString();
    } catch {
      return String(item.capturedAt);
    }
  }, [item]);

  return (
    <View style={styles.captionWrap}>
      <Text numberOfLines={1} style={styles.captionMain}>
        {item.section || "Untitled Section"}
        {item.tag ? ` • ${item.tag}` : ""}
        {item.mediaType === "video" ? " • Video" : ""}
      </Text>
      {!!dateStr && <Text style={styles.captionSub}>{dateStr}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "black",
  },
  slide: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaWrap: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: "center",
    justifyContent: "center",
  },
  media: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  topBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeBtn: {
    width: 40,
    height: 34,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  counterWrap: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  counterText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 16,
  },
  captionWrap: { gap: 2 },
  captionMain: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  captionSub: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  playButton: {
    position: "absolute",
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    bottom: SCREEN_H * 0.45,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  playText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
