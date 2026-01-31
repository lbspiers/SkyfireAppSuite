import { View } from "react-native";
import { CameraOption } from "../../../screens/Project/CameraOption";
import { SubHeaderComponent } from "../../Header/SubHeaderComponent";
import TextInputField from "../../TextInput";
import EquipmentPicker from "../EquipmentPicker";
import { capitalize } from "lodash";

interface EssBatteryFieldProps {
  styles: any;
  systemType: string;
  setFieldValue: any;
  touched: any;
  errors: any;
  handleBlur: any;
  values: any;
  equipmentUuid: string;
  manufacturer: string;
  images: any[];
  fieldIndex: number;
  handleBlurWithSave: any;
}

function EssBatteryField({
  styles,
  systemType,
  setFieldValue,
  touched,
  errors,
  handleBlur,
  values,
  equipmentUuid,
  images,
  manufacturer,
  fieldIndex,
  handleBlurWithSave,
}: EssBatteryFieldProps) {
  const isInverterType = systemType == "Inverter";
  const batteryKeyPrefix = fieldIndex == 0 ? "battery" : `battery${fieldIndex + 1}`;

  const quantity = values[`${batteryKeyPrefix}Quantity`];
  const isExistingEquipment = values[`does${capitalize(batteryKeyPrefix)}Exists`];

  return (
    <View style={{ rowGap: 10 }}>
      <SubHeaderComponent
        name={"Battery Storage"}
        isInfo={true}
        isOptions={true}
        isNew={!isExistingEquipment}
        setIsNew={(value) => {
          setFieldValue(`does${capitalize(batteryKeyPrefix)}Exists`, !value);
          handleBlurWithSave(handleBlur, `does${capitalize(batteryKeyPrefix)}Exists`)();
        }}
      />
      <View>
        <View style={{ flexDirection: "row" }}>
          <TextInputField
            label={"Quantity*"}
            placeholder={"###"}
            value={`${quantity || ""}`}
            onChangeText={(value: any) => setFieldValue(`${batteryKeyPrefix}Quantity`, value)}
            onBlur={handleBlurWithSave(handleBlur, `${batteryKeyPrefix}Quantity`)}
            error={touched.quantity && errors.quantity}
            style={[styles.textInput, { width: 100 }]}
            placeHolderColor={styles.label.color}
            labelStyle={styles.label}
          />
          <CameraOption
            type="BatteryStorage"
            camStyle={styles.extraCamStyle}
            setImages={() => {}}
            images={images}
            loader={false}
          />
        </View>
        <EquipmentPicker
          type={isInverterType ? "Inverter Storage" : "MicroInverter Storage"}
          manufacturer={manufacturer}
          uuid={equipmentUuid}
          handleChange={(selectedEquipmentUuid: string) => {
            console.log(`${batteryKeyPrefix}ModelUuid`, selectedEquipmentUuid);
            setFieldValue(`${batteryKeyPrefix}ModelUuid`, selectedEquipmentUuid);
            handleBlurWithSave(handleBlur, `${batteryKeyPrefix}ModelUuid`)();
          }}
        />
      </View>
    </View>
  );
}

export default EssBatteryField;
