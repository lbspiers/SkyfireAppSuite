import { StyleSheet, View } from "react-native";
import Text from "../../../../components/Text";
import fontFamily from "../../../../utils/styleConstant/FontFamily";
import COLORS from "../../../../utils/styleConstant/Color";
import { CameraOption } from "../../CameraOption";
import InfoIcon from "../../../../components/InfoIcon/InfoIcon";

const StructuralSubHeader = ({
  isInfo = true,
  imageType = {},
  imagesObject = {},
  setImageFun = {},
  isCam = false,
  isGradientInfo = true,
  label = "",
  headerStyle = {},
  infoStyle = {},
  camStyle = {},
}) => {
  return (
    <View style={styles.mainContainer}>
      <View style={styles.subContainer}>
        <Text children={label} style={[styles.backupTitle, headerStyle]} />
        {isInfo && (
          <InfoIcon
            containerStyle={[styles.extraInfo, { infoStyle }]}
            onIconPress={() => {}}
            isgradientInfo={isGradientInfo}
          />
        )}
      </View>
      {isCam && (
        <CameraOption
          type={imageType}
          images={imagesObject}
          setImages={setImageFun}
          camStyle={camStyle}
        />
      )}
    </View>
  );
};

export default StructuralSubHeader;

const styles = StyleSheet.create({
  backupTitle: {
    position: "relative",
    fontFamily: fontFamily.lato,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  extraInfo: {
    width: 25,
    height: 25,
    marginTop: -10,
  },
  mainContainer: {
    flexDirection: "row",
    paddingBottom: 5,
    flex: 1,
    justifyContent: "space-between",
  },
  subContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
