// styles.ts
import { StyleSheet } from "react-native";

// Export as a function that receives responsive utilities
export const createStyles = ({
  moderateScale,
  verticalScale,
  font,
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
  font: (n: number) => number;
}) => StyleSheet.create({
  fixedArea: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: 0,
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(20),
  },

  filterIconButton: {
    marginLeft: 0,
    paddingRight: moderateScale(10),
    marginRight: 0,
    padding: 0,
  },

  icon: {
    width: moderateScale(28),
    height: moderateScale(28),
    resizeMode: "contain" as const,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1D2A4F",
    borderRadius: moderateScale(6),
    paddingHorizontal: moderateScale(5),
    marginLeft: -moderateScale(20),
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
    height: moderateScale(44),
  },

  searchInput: {
    flex: 1,
    color: "#FFF",
    height: moderateScale(44),
    fontSize: font(14),
  },

  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -moderateScale(8),
    padding: moderateScale(8),
    minWidth: moderateScale(44),
    minHeight: moderateScale(44),
    justifyContent: "center",
    overflow: "visible",
  },

  separator: {
    height: verticalScale(2),
    marginVertical: verticalScale(10),
    borderRadius: moderateScale(2),
  },

  // ----------------------------
  // Pills Container & Pills
  // ----------------------------
  pillsContainer: {
    paddingVertical: verticalScale(4),
  },

  pill: {
    borderRadius: moderateScale(20),
    marginRight: moderateScale(5),
    overflow: "hidden",
    borderWidth: moderateScale(1),
    borderColor: "#888888",
    minWidth: moderateScale(120),
  },

  pillTouchable: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(4),
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  pillText: {
    color: "#FFF",
    fontSize: font(18),
  },

  pillTextActive: {
    fontWeight: "700" as const,
  },

  // ----------------------------
  // New Project Row & Separator
  // ----------------------------
  newProjectContainer: {
    paddingHorizontal: moderateScale(16),
    paddingTop: 0,
    backgroundColor: "transparent",
  },

  newRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  flame: {
    width: moderateScale(36),
    height: moderateScale(36),
    marginRight: moderateScale(10),
    marginBottom: verticalScale(10),
  },

  newText: {
    color: "#FFF",
    fontSize: font(20),
    fontWeight: "700" as const,
    marginBottom: verticalScale(10),
  },

  plusWrap: {
    marginLeft: "auto",
  },

  plus: {
    width: moderateScale(24),
    height: moderateScale(24),
    tintColor: "#FD7332",
    marginBottom: verticalScale(10),
    marginRight: moderateScale(10),
  },

  newSeparatorFull: {
    height: verticalScale(2),
    width: "100%",
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  },
});

// Legacy export for backward compatibility - will use static scaling
// DEPRECATED: Use createStyles() instead
import { scale, verticalScale as vScale, fontSize } from "../../../../utils/responsive";

export const styles = createStyles({
  moderateScale: scale,
  verticalScale: vScale,
  font: fontSize,
});
