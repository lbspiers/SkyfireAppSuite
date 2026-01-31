// src/components/AddressAutocompleteInput/index.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import axios from "axios";
import TextInput from "../TextInput";
import { moderateScale, verticalScale } from "../../utils/responsive";
import { GOOGLE_MAPS_API_KEY } from "@env";

// Fallback to the same key used in MapScreen if env var fails
const FALLBACK_API_KEY = "AIzaSyBTIEUeUnP1QWoLBzmdWE1x0R_N4UlN4dQ";

interface AddressSuggestion {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressDetails {
  address: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
}

interface Props {
  apiKey: string;
  value: string;
  onChangeText: (text: string) => void;
  onAddressSelect: (details: AddressDetails) => void;
  placeholder?: string;
  errorText?: string;
}

const AddressAutocompleteInput: React.FC<Props> = ({
  apiKey: propsApiKey,
  value,
  onChangeText,
  onAddressSelect,
  placeholder = "123 Main St…",
  errorText,
}) => {
  // Use the provided API key, or fallback to env var, or use the hardcoded fallback
  const apiKey = propsApiKey || GOOGLE_MAPS_API_KEY || FALLBACK_API_KEY;
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const sessionTokenRef = useRef<string>("");
  const isSelectingRef = useRef<boolean>(false);

  // Generate session token for billing optimization
  useEffect(() => {
    sessionTokenRef.current = Math.random().toString(36).substring(7);
    
    // Debug: Check which API key is being used
    if (!apiKey) {
      console.error("Google Places API Key is missing!");
    } else {
      const keySource = propsApiKey ? "props" : GOOGLE_MAPS_API_KEY ? "env" : "fallback";
      console.log(`Using API Key from ${keySource}:`, apiKey.substring(0, 10) + "...");
    }
  }, [apiKey]);

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Using the Web API endpoint which works from React Native
      const params = new URLSearchParams({
        input: input,
        key: apiKey,
        sessiontoken: sessionTokenRef.current,
        components: "country:us",
      });

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
      
      console.log("Fetching suggestions for:", input);
      console.log("API URL:", url);

      const response = await axios.get(url);

      console.log("API Response:", response.data);

      if (response.data.predictions && response.data.predictions.length > 0) {
        setSuggestions(response.data.predictions.slice(0, 5));
        setShowDropdown(true);
      } else if (response.data.error_message) {
        console.error("Google API Error:", response.data.error_message);
        setSuggestions([]);
      } else {
        console.log("No predictions found");
        setSuggestions([]);
      }
    } catch (error: any) {
      console.error("Error fetching suggestions:", error?.response?.data || error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if we're in the middle of selecting an address
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value]);

  // Fetch place details when suggestion is selected
  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    isSelectingRef.current = true; // Prevent search on the next onChangeText
    setShowDropdown(false);
    setSuggestions([]);
    Keyboard.dismiss();

    try {
      const params = new URLSearchParams({
        place_id: suggestion.place_id,
        fields: "address_components,geometry",
        key: apiKey,
        sessiontoken: sessionTokenRef.current,
      });

      const url = `https://maps.googleapis.com/maps/api/place/details/json?${params}`;
      
      console.log("Fetching place details for:", suggestion.place_id);
      console.log("Details URL:", url);

      const response = await axios.get(url);

      console.log("Place Details Response:", response.data);

      if (response.data.result) {
        const components = response.data.result.address_components;
        const geometry = response.data.result.geometry;

        let streetNumber = "";
        let streetName = "";
        let city = "";
        let state = "";
        let zip = "";

        components.forEach((component: any) => {
          const types = component.types;
          if (types.includes("street_number")) {
            streetNumber = component.long_name;
          }
          if (types.includes("route")) {
            streetName = component.long_name;
          }
          if (types.includes("locality")) {
            city = component.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            state = component.short_name;
          }
          if (types.includes("postal_code")) {
            zip = component.long_name;
          }
        });

        const fullAddress = streetNumber
          ? `${streetNumber} ${streetName}`
          : streetName;

        onAddressSelect({
          address: fullAddress,
          city,
          state,
          zip,
          lat: geometry?.location?.lat,
          lng: geometry?.location?.lng,
        });

        // Update the input value
        onChangeText(fullAddress);
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
    }

    // Generate new session token for next search
    sessionTokenRef.current = Math.random().toString(36).substring(7);
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
    if (!text) {
      // If address is cleared, reset everything
      onAddressSelect({
        address: "",
        city: "",
        state: "",
        zip: "",
      });
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Address*"
        placeholder={placeholder}
        value={value}
        onChangeText={handleTextChange}
        errorText={errorText}
      />

      {showDropdown && (value.length >= 3) && (
        <View style={styles.dropdownContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FD7332" size="small" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : suggestions.length > 0 ? (
            <ScrollView
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled={true}
            >
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.place_id}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion.structured_formatting ? (
                    <View>
                      <Text style={styles.mainText}>
                        {suggestion.structured_formatting.main_text}
                      </Text>
                      <Text style={styles.secondaryText}>
                        {suggestion.structured_formatting.secondary_text}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.mainText}>{suggestion.description}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No addresses found</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    zIndex: 1000,
  },
  dropdownContainer: {
    position: "absolute",
    top: verticalScale(90), // Position below the input
    left: 0,
    right: 0,
    backgroundColor: "#1A2940",
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#2E4161",
    maxHeight: verticalScale(250),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1001,
  },
  suggestionsList: {
    maxHeight: verticalScale(250),
  },
  suggestionItem: {
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#2E4161",
  },
  mainText: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "600",
    marginBottom: verticalScale(2),
  },
  secondaryText: {
    color: "#A0A8B8",
    fontSize: moderateScale(14),
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: moderateScale(20),
  },
  loadingText: {
    color: "#FD7332",
    fontSize: moderateScale(14),
    marginLeft: moderateScale(10),
  },
  noResultsContainer: {
    padding: moderateScale(20),
    alignItems: "center",
  },
  noResultsText: {
    color: "#A0A8B8",
    fontSize: moderateScale(14),
  },
});

export default AddressAutocompleteInput;