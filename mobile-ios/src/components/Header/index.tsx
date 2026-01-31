import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../Text";
import fontFamily from "../../utils/styleConstant/FontFamily";
import COLORS from "../../utils/styleConstant/Color";
import { useNavigation } from "@react-navigation/native";
import { moderateScale, verticalScale } from "../../utils/responsive";
type HeaderProps = {
  isTitle: boolean;
  title?: string;
  back: boolean;
  applogo: boolean;
  onIconPress: Function;
  onBackButtonPress?: Function;
};

export const HeaderLogoComponent = ({
  isTitle,
  title,
  back,
  applogo,
  onIconPress = () => {},
  onBackButtonPress = () => {},
}: HeaderProps) => {
  const navigation = useNavigation();
  return (
    <View style={styles.logoContainer}>
      <View
        style={{
          flex: 0.2,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {back && (
          <TouchableOpacity onPress={() => onBackButtonPress()}>
            <Image
              style={{ height: verticalScale(40), width: moderateScale(40) }}
              source={require("../../assets/Images/icons/back.png")}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 0.6, justifyContent: "center", alignItems: "center" }}>
        {isTitle && <Text children={title} style={styles.headerTitle} />}
      </View>

      <View
        style={{
          flex: 0.2,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {applogo && (
          <TouchableOpacity onPress={() => onIconPress()}>
            <Image
              source={require("../../assets/Images/fire-inactive.png")}
              style={styles.logoStyle}
            />
          </TouchableOpacity>
        )}
      </View>
      {/* 
      <Image
        source={require("../../assets/Images/appIcon.png")}
        style={styles.logoStyle}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(10),
  },
  logoStyle: {
    width: moderateScale(48.13),
    height: verticalScale(48),
    overflow: "hidden",
  },
  headerTitle: {
    fontFamily: fontFamily.Inter_18pt_Black,
    fontSize: moderateScale(18),
    color: COLORS.white,
    fontWeight: "700",
    textAlign: "center",
  },
});
