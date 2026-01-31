import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import FlameToggleButton from "../FlameToggleButton";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface AppHeaderProps {
  title?: string;
  lastName?: string;
  firstName?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  projectId?: string;
  onFlamePress?: () => void;
  /** Adjustable top space in px (default 60) */
  topSpacerHeight?: number;
}

// your two endpoint colors
const LIGHT = "#2E4161";
const DARK = "#0C1F3F";

// compute the midpoint color
function averageHexColor(a: string, b: string) {
  const [r1, g1, b1] = [a, b]
    .map((h) => parseInt(h.slice(1), 16))
    .map(
      (v, i, arr) =>
        // this map just groups them; we'll split next
        v
    );
  // actually split each hex:
  const splitRGB = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [R1, G1, B1] = splitRGB(a);
  const [R2, G2, B2] = splitRGB(b);
  const mid = (x: number, y: number) => Math.round((x + y) / 2);
  const Rm = mid(R1, R2),
    Gm = mid(G1, G2),
    Bm = mid(B1, B2);
  // to hex
  const to2 = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to2(Rm)}${to2(Gm)}${to2(Bm)}`;
}
const MID = averageHexColor(LIGHT, DARK);

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  lastName,
  firstName,
  address,
  projectId,
  onFlamePress,
  topSpacerHeight = verticalScale(60),
}) => {
  const formatName = () =>
    lastName && firstName ? `${lastName}, ${firstName}` : null;

  const formatAddress = () => {
    if (!address) return null;
    const street = address.street || "";
    const cityStateZip = [address.city, address.state, address.zip]
      .filter(Boolean)
      .join(", ");
    return { street, cityStateZip };
  };

  const formattedName = formatName();
  const formattedAddress = formatAddress();

  return (
    <LinearGradient
      colors={[LIGHT, MID]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.headerContainer}
    >
      {/* Adjustable top spacer */}
      <View style={{ height: topSpacerHeight }} />

      {/* Title row */}
      <View style={styles.titleRow}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.flameButtonContainer}>
          <FlameToggleButton top={0} right={0} />
        </View>
      </View>

      {/* Name */}
      {formattedName && <Text style={styles.name}>{formattedName}</Text>}

      {/* Address */}
      {formattedAddress && (
        <View style={styles.addressContainer}>
          {formattedAddress.street && (
            <Text style={styles.address}>{formattedAddress.street}</Text>
          )}
          {formattedAddress.cityStateZip && (
            <Text style={styles.address}>{formattedAddress.cityStateZip}</Text>
          )}
        </View>
      )}

      {/* Project ID */}
      {projectId && <Text style={styles.projectId}>{projectId}</Text>}

      {/* Bottom separator */}
      <LinearGradient
        colors={["#FD7332", "#B92011"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.separator}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    paddingHorizontal: moderateScale(20),
    paddingBottom: 0,
    position: "relative",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: moderateScale(32),
    fontWeight: "700",
    color: "#FFF",
    fontFamily: "Lato-Bold",
  },
  flameButtonContainer: {
    width: moderateScale(58),
    height: moderateScale(58),
    position: "relative",
  },
  name: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    color: "#FFF",
    marginTop: verticalScale(10),
    fontFamily: "Lato-Bold",
  },
  addressContainer: {
    marginTop: verticalScale(5),
  },
  address: {
    fontSize: moderateScale(20),
    fontWeight: "400",
    color: "#FFF",
    lineHeight: verticalScale(28),
    fontFamily: "Lato-Regular",
  },
  projectId: {
    fontSize: moderateScale(16),
    fontWeight: "400",
    color: "#868990",
    marginTop: verticalScale(5),
    fontFamily: "Lato-Regular",
  },
  separator: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: verticalScale(-20),
    height: verticalScale(3),
    borderRadius: moderateScale(2),
  },
});

export default AppHeader;
