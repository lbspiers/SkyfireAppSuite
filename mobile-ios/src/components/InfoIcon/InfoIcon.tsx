import { Image, Pressable } from "react-native";

const InfoIcon = ({
  containerStyle = {},
  onIconPress = () => {},
  iconStyle = {},
  isgradientInfo = false,
}) => {
  return (
    <Pressable style={containerStyle} onPress={() => onIconPress()}>
      <Image
        style={[iconStyle, { width: 25, height: 25 }]}
        source={
          isgradientInfo
            ? require("../../assets/Images/icons/gradientInfo.png")
            : require("../../assets/Images/icons/info.png")
        }
      />
    </Pressable>
  );
};
export default InfoIcon;
