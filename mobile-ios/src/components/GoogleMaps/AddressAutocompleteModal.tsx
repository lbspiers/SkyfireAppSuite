// src/components/GoogleMaps/AddressAutocompleteModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

type Prediction = {
  description: string;
  place_id: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
};

type AddressPick = {
  address: string; // "123 Main St"
  city: string; // "San Diego"
  state: string; // "CA"
  zip: string; // "92101"
  lat?: number;
  lng?: number;
  placeId: string;
  formattedAddress: string;
  components?: any;
};

export interface AddressAutocompleteModalProps {
  visible: boolean;
  apiKey: string;
  initialQuery?: string;
  country?: string; // default "us"
  minChars?: number; // default 3
  debounceMs?: number; // default 250
  onClose: () => void;
  onSelect: (addr: AddressPick) => void;
}

const GRAD = ["#2E4161", "#1D2A4F", "#0C1F3F"];

// Simple UUID-ish session token for Google Places session grouping
function makeSessionToken() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function parseComponents(components: any[]) {
  const get = (type: string) =>
    components.find((c) => Array.isArray(c.types) && c.types.includes(type)) ||
    {};

  const num = get("street_number")?.long_name || "";
  const route = get("route")?.long_name || "";
  const city =
    get("locality")?.long_name ||
    get("postal_town")?.long_name ||
    get("sublocality")?.long_name ||
    "";
  const state = get("administrative_area_level_1")?.short_name || "";
  const zip = get("postal_code")?.long_name || "";

  const address = [num, route].filter(Boolean).join(" ");
  return { address, city, state, zip };
}

// Fallback API key - only used if prop fails
const FALLBACK_API_KEY = "AIzaSyBTIEUeUnP1QWoLBzmdWE1x0R_N4UlN4dQ";

export default function AddressAutocompleteModal({
  visible,
  apiKey,
  initialQuery = "",
  country = "us",
  minChars = 3,
  debounceMs = 250,
  onClose,
  onSelect,
}: AddressAutocompleteModalProps) {
  // Use fallback if API key not provided - FORCE using the correct key for now
  // TODO: Fix environment variable loading issue
  const effectiveApiKey = FALLBACK_API_KEY; // Temporarily force the correct key
  // const effectiveApiKey = apiKey || FALLBACK_API_KEY;
  
  // Debug logging
  React.useEffect(() => {
    if (visible) {
      console.log("[AddressAutocomplete Debug] Provided API Key:", apiKey ? `${apiKey.substring(0, 10)}...` : "undefined");
      console.log("[AddressAutocomplete Debug] Using API Key:", effectiveApiKey ? `${effectiveApiKey.substring(0, 10)}...` : "undefined");
    }
  }, [visible, apiKey, effectiveApiKey]);
  const [query, setQuery] = useState(initialQuery);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState(makeSessionToken());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset state every time the modal opens
  useEffect(() => {
    if (visible) {
      setQuery(initialQuery);
      setPredictions([]);
      setFetchErr(null);
      setSessionToken(makeSessionToken());
    } else {
      // cancel outstanding requests when closing
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }, [visible, initialQuery]);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const canSearch = query.trim().length >= minChars;

  const doSearch = async () => {
    if (!canSearch) {
      setPredictions([]);
      return;
    }
    
    if (!effectiveApiKey) {
      // Only log error if we actually tried to search
      if (query.trim().length > 0) {
        console.error("[AddressAutocomplete Error] No API key available for search");
        setFetchErr("Missing Google API key");
      }
      setPredictions([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setFetchErr(null);

      const url =
        "https://maps.googleapis.com/maps/api/place/autocomplete/json" +
        `?input=${encodeURIComponent(query.trim())}` +
        `&types=address` +
        `&components=country:${country}` +
        `&sessiontoken=${sessionToken}` +
        `&key=${encodeURIComponent(effectiveApiKey)}`;
      
      console.log("[AddressAutocomplete Debug] Search query:", query.trim());
      console.log("[AddressAutocomplete Debug] API URL (key hidden):", url.replace(effectiveApiKey, "[API_KEY_HIDDEN]"));

      const r = await fetch(url, { signal: controller.signal });
      const j = await r.json();

      if (j.status !== "OK" && j.status !== "ZERO_RESULTS") {
        const errorMsg = j.error_message || j.status || "Autocomplete failed";
        console.error("[AddressAutocomplete Error] API response error:", errorMsg, "Status:", j.status);
        setFetchErr(errorMsg);
        setPredictions([]);
        return;
      }
      console.log("[AddressAutocomplete Debug] Found", j.predictions?.length || 0, "predictions");
      setPredictions(j.predictions || []);
    } catch (e: any) {
      if (e?.name !== "AbortError") setFetchErr(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!visible) return;
    // Don't search if query is too short
    if (query.trim().length < minChars) {
      setPredictions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doSearch, debounceMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, visible]);

  const handlePick = async (p: Prediction) => {
    try {
      setLoading(true);
      setFetchErr(null);

      const url =
        "https://maps.googleapis.com/maps/api/place/details/json" +
        `?place_id=${encodeURIComponent(p.place_id)}` +
        `&fields=address_component,geometry,formatted_address` +
        `&sessiontoken=${sessionToken}` +
        `&key=${encodeURIComponent(effectiveApiKey)}`;
      
      console.log("[AddressAutocomplete Debug] Getting details for place:", p.place_id);
      console.log("[AddressAutocomplete Debug] Details URL (key hidden):", url.replace(effectiveApiKey, "[API_KEY_HIDDEN]"));

      const r = await fetch(url);
      const j = await r.json();

      if (j.status !== "OK") {
        const errorMsg = j.error_message || j.status || "Details failed";
        console.error("[AddressAutocomplete Error] Place details error:", errorMsg, "Status:", j.status);
        setFetchErr(errorMsg);
        return;
      }
      console.log("[AddressAutocomplete Debug] Place details retrieved successfully");

      const comps = j.result?.address_components || [];
      const { address, city, state, zip } = parseComponents(comps);
      const formattedAddress =
        j.result?.formatted_address || p.description || "";
      const lat = j.result?.geometry?.location?.lat;
      const lng = j.result?.geometry?.location?.lng;

      // Guard against missing handler (prevents runtime errors)
      if (typeof onSelect === "function") {
        onSelect({
          address,
          city,
          state,
          zip,
          lat,
          lng,
          placeId: p.place_id,
          formattedAddress,
          components: comps,
        });
      } else {
        setFetchErr("onSelect is not a function (it is undefined)");
        return;
      }

      onClose();
    } catch (e: any) {
      setFetchErr(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Prediction }) => {
    const main = item.structured_formatting?.main_text || item.description;
    const secondary = item.structured_formatting?.secondary_text || "";
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePick(item)}
        activeOpacity={0.9}
      >
        <View style={styles.pinWrap}>
          <View style={styles.pinCircle}>
            <Text style={{ color: "#0C1F3F", fontWeight: "800" }}>•</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            {main}
          </Text>
          {!!secondary && (
            <Text numberOfLines={1} style={styles.cardSub}>
              {secondary}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <LinearGradient colors={GRAD} style={styles.backdrop}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.sheet}>
            {/* Header */}
            <LinearGradient
              colors={["#0C1F3F", "#0F2447"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.header}
            >
              <Text style={styles.headerTitle}>Search Address</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </LinearGradient>

            {/* Search input */}
            <View style={styles.searchRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Start typing address…"
                placeholderTextColor="#A8B3C7"
                autoFocus
                style={styles.input}
                returnKeyType="search"
                onSubmitEditing={doSearch}
              />
            </View>

            {/* Results / states */}
            {loading && (
              <View style={styles.loading}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}

            {!loading && !!fetchErr && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{fetchErr}</Text>
              </View>
            )}

            {!loading && !fetchErr && (
              <FlatList
                data={predictions}
                keyExtractor={(i) => i.place_id}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  query.trim().length ? (
                    <View style={styles.emptyBox}>
                      <Text style={styles.emptyText}>No matches yet…</Text>
                    </View>
                  ) : (
                    <View style={styles.emptyBox}>
                      <Text style={styles.emptyText}>
                        Type at least {minChars} characters
                      </Text>
                    </View>
                  )
                }
                contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
              />
            )}

            {/* Google branding requirement */}
            <View style={styles.powered}>
              <Text style={styles.poweredText}>Powered by Google</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    paddingTop: Platform.select({ ios: 0, android: 0 }),
  },
  sheet: {
    flex: 1,
    margin: 12,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(13,25,50,0.8)",
    borderWidth: 1,
    borderColor: "rgba(253,115,50,0.25)",
  },
  header: {
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: 8,
  },
  closeText: {
    color: "#FD7332",
    fontWeight: "700",
  },
  searchRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  loading: { paddingVertical: 12, alignItems: "center" },
  errorBox: { paddingHorizontal: 12, paddingVertical: 10 },
  errorText: { color: "#FF7B7B" },
  card: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
  },
  pinWrap: { width: 28, alignItems: "center" },
  pinCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FD7332",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cardSub: { color: "#C6D0E2", fontSize: 13, marginTop: 2 },
  emptyBox: { alignItems: "center", paddingVertical: 16 },
  emptyText: { color: "#9EB0CC" },
  powered: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingVertical: 8,
    alignItems: "center",
  },
  poweredText: { color: "#C6D0E2", fontSize: 12 },
});
