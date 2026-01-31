import {
  Image,
  ImageProps,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

type NavButtonProps = {
  source: ImageSourcePropType;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};
export const NavButton = ({
  source,
  onPress,
  style,
  imageStyle,
}: NavButtonProps) => {
  return (
    <TouchableOpacity onPress={onPress} style={style} activeOpacity={0.6}>
      <Image source={source} style={imageStyle} />
    </TouchableOpacity>
  );
};
