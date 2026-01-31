import { View, Text, DimensionValue } from "react-native";
import { CameraOption } from "../../../screens/Project/CameraOption";
import DropdownComponent from "../../Dropdown";
import { SubHeaderComponent } from "../../Header/SubHeaderComponent";
import EquipmentPicker from "../EquipmentPicker";
import { breakerLocations, ampsRatings } from "../../../utils/utlityFunc";

interface EssManagementSystemProps {
  styles: any;
  systemType: string;
  setFieldValue: any;
  touched: any;
  errors: any;
  handleBlur: any;
  handleBlurWithSave: any;
  values: any;
}

function EssManagementSystemForm({
  systemType,
  styles,
  touched,
  errors,
  handleBlur,
  setFieldValue,
  handleBlurWithSave,
  values,
}: EssManagementSystemProps) {
  const isInverterType = systemType == "Inverter";
  const existingEssData = values[`essManagementSystem`] || {};
  const { equipment, isExisting } = existingEssData;

  const formFields = [
    {
      key: "mainBreakerRating",
      value: "Main Breaker Rating (Amps)*",
      imageField: "mainBreakerImages",
      dropdownValues: ampsRatings,
      width: "40%",
      dropdownValue: existingEssData.mainBreakerRating,
    },
    {
      key: "upstreamBreakerRating",
      value: "Upstream Breaker Rating (Amps)*",
      imageField: "upstreamBreakerImages",
      dropdownValues: ampsRatings,
      width: "40%",
      dropdownValue: existingEssData.upstreamBreakerRating,
    },
    {
      key: "upstreamBreakerLocation",
      value: "Upstream Breaker Location",
      imageField: "upstreamBreakerLocationImages",
      dropdownValues: breakerLocations,
      width: "80%",
      dropdownValue: existingEssData.upstreamBreakerLocation,
    },
  ];

  return (
    <View style={{ rowGap: 10 }}>
      <SubHeaderComponent
        name={"ESS Management System"}
        isInfo={true}
        isOptions={true}
        infoStyle={styles.extraInfo}
        isNew={!isExisting}
        setIsNew={(value) => {
          console.log(value);
          setFieldValue("essManagementSystem.isExisting", !value);
          handleBlurWithSave(handleBlur, `essManagementSystem.isExisting`)();
        }}
      />
      <View>
        <EquipmentPicker
          type={isInverterType ? "Inverter SMS" : "MicroInverter SMS"}
          uuid={equipment?.uuid}
          manufacturer={equipment?.manufacturer}
          handleChange={(selectedEquipmentUuid: string) => {
            setFieldValue("essManagementSystem.equipmentUuid", selectedEquipmentUuid);
            handleBlurWithSave(handleBlur, `essManagementSystem.equipmentUuid`)();
          }}
        />

        {formFields.map((data, index) => {
          return (
            <View style={styles.subContainer} key={index}>
              <View style={{ flexGrow: 10 }}>
                <SubHeaderComponent
                  isInfo={true}
                  isOptions={false}
                  name={"ESS Management System"}
                  headerStyle={styles.subText}
                  isNew={!existingEssData.isExisting}
                  setIsNew={(value: boolean) => {
                    setFieldValue(`essManagementSystem.isExisting`, !value);
                    handleBlurWithSave(handleBlur, `essManagementSystem.isExisting`)();
                  }}
                />
                <Text style={styles.label}>{data.value}</Text>
                <View style={{ width: data.width as DimensionValue }}>
                  <DropdownComponent
                    label={index === 2 ? "Select Electrical Panel" : "###"}
                    error={touched.make && errors.make}
                    data={data?.dropdownValues || []}
                    value={data?.dropdownValue}
                    labelField={"label"}
                    valueField={"value"}
                    onChangeValue={(selectedValue: any) => {
                      setFieldValue(`essManagementSystem.${data.key}`, selectedValue);
                      handleBlurWithSave(handleBlur, `essManagementSystem.${data.key}`)();
                    }}
                  />
                </View>
              </View>
              <View style={styles.camOption}>
                <View>
                  <CameraOption
                    loader={false}
                    type={data.key}
                    images={existingEssData[data.imageField] || []}
                    setImages={(type: any, images: any) => {
                      setFieldValue(`essManagementSystem.${data.imageField}`, images);
                      handleBlurWithSave(handleBlur, `essManagementSystem.${data.imageField}`)();
                    }}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default EssManagementSystemForm;
