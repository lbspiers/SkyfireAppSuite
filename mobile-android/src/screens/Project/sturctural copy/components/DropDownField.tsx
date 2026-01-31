import { StyleSheet, View } from "react-native";
import DropdownComponent from "../../../../components/Dropdown";
import COLORS from "../../../../utils/styleConstant/Color";
import fontFamily from "../../../../utils/styleConstant/FontFamily";
import StructuralSubHeader from "./StructuralSubHeader";

const DropDownField = ({
  label = "",
  dropDownLabel = "",
  onChangeValue = {},
  error = "",
  data = [],
  type = "",
  placeholderColor = COLORS.grey,
  labelInfo = true,
}: any) => {
  return (
    <View style={styles.mainContainer}>
      <StructuralSubHeader isInfo={labelInfo} label={label} headerStyle={styles.fieldName} />
      <DropdownComponent
        label={dropDownLabel}
        placeholderColor={placeholderColor}
        onChangeValue={onChangeValue}
        data={data}
        error={error}
      />
    </View>
  );
};

export default DropDownField;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  fieldName: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 14,
    color: "rgba(134, 137, 144, 1)",
    lineHeight: 17,
  },
  subContainer: {
    flexDirection: "row",
    flex: 1,
  },
});
