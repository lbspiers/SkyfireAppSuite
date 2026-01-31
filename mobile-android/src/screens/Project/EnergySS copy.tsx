import { DrawerActions, RouteProp, useRoute } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { debounce } from "lodash";
import * as Yup from "yup";
import { styles } from "../../styles/energySSStyles";
import Text from "../../components/Text";
import Button from "../../components/Button";
import { HeaderLogoComponent } from "../../components/Header";
import { Formik, FormikProps } from "formik";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { GetProjectEquipmentStorageData, saveEnergySystemDetails } from "../../api/project.service";
import EssManagementSystemForm from "../../components/Project/ESS/EssManagementSystem";
import EssBatteryField from "../../components/Project/ESS/EssBatteryField";
import { convertKeysToCamelCase, omitNullValues } from "../../utils/utlityFunc";

const parseNumberSchema = (fieldName: string) => {
  return Yup.number()
    .integer(`${fieldName} must be an integer`)
    .min(0, `${fieldName} cannot be negative`);
};

// const validationSchema = Yup.object().shape({
//   uuid: Yup.string().uuid("Invalid UUID format"),
//   equipmentSetUuid: Yup.string().uuid("Invalid UUID format"),
//   backupType: Yup.string(),
//   hasDaisyChain: Yup.boolean(),
//   doesBatteryExists: Yup.boolean(),
//   doesBattery2Exists: Yup.boolean(),
//   batteryQuantity: parseNumberSchema("Battery Quantity"),
//   battery2Quantity: parseNumberSchema("Battery 2 Quantity"),
//   batteryModelUuid: Yup.string().uuid("Invalid UUID format"),
//   battery2ModelUuid: Yup.string().uuid("Invalid UUID format"),
//   batteryImages: Yup.array().of(Yup.object()),
//   battery2Images: Yup.array().of(Yup.object()),
//   essStorageSystemData: Yup.object().shape({
//     mainBreakerRating: parseNumberSchema("Main Breaker Rating"),
//     upstreamBreakerRating: parseNumberSchema("Upstream Breaker Rating"),
//     upstreamBreakerLocation: parseNumberSchema("Upstream Breaker Location"),
//     equipmentUuid: Yup.string().uuid("Invalid UUID format"),
//     equipmentImages: Yup.array().of(Yup.object()),
//     mainBreakerImages: Yup.array().of(Yup.object()),
//     upstreamBreakerImages: Yup.array().of(Yup.object()),
//     upstreamBreakerLocationImages: Yup.array().of(Yup.object()),
//   }),
//   batteryCombinerPanelData: Yup.object().shape({
//     busBarRating: parseNumberSchema("Bus Bar Rating"),
//     mainBreakerRating: parseNumberSchema("Main Breaker Rating"),
//     upstreamBreakerRating: parseNumberSchema("Upstream Breaker Rating"),
//     isExisting: Yup.boolean(),
//     equipmentUuid: Yup.string().uuid("Invalid UUID format"),
//     equipmentImages: Yup.array().of(Yup.object()),
//   }),
//   backupLoadSubpanelData: Yup.object().shape({
//     panelType: Yup.string(),
//     isExisting: Yup.boolean(),
//     busBarRating: parseNumberSchema("Bus Bar Rating"),
//     mainBreakerRating: parseNumberSchema("Main Breaker Rating"),
//     upstreamBreakerRating: parseNumberSchema("Upstream Breaker Rating"),
//     backupLoadData: Yup.array().of(Yup.object()),
//     equipmentUuid: Yup.string().uuid("Invalid UUID format"),
//     equipmentImages: Yup.array().of(Yup.object()),
//   }),
// });

const EnergySS = () => {
  const formikRef = useRef<FormikProps<any>>(null);
  const navigation = useNavigation<any>();
  const { params } = useRoute<RouteProp<string | any>>();
  const { title, systemType, equipmentSetUuid, storageDataUuid } = params || {};

  const options = ["Whole Home", "Partial Home", "No Backup"];

  const [checkbox, setCheckbox] = React.useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSecondBattery, setSecondBattery] = useState<boolean>(false);
  const [isBackupLoad, setBackupLoad] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [isPageDataLoading, setPageDataLoading] = useState(false);

  const [selectedOption, setSelection] = useState<string>("Whole Home");
  const [active, setIsActive] = useState("Daisy Chain");
  const [isActive, setIsActivedaisy] = useState(true);

  const [currentData, setCurrentData] = useState<any>();

  const dispatch = useDispatch();

  const [images, setImages] = useState({
    ESSMake: [],
    "Main Breaker Rating (Amps)*": [],
    "Upstream BreakerRating (Amps)*": [],
    "Upstream Breaker Location": [],
    BatteryStorage: [],
    SecondBattery: [],
  });

  const companyDetail = useSelector((store: any) => store?.profile?.profile.company);
  const company = useSelector((store: any) => store?.profile?.profile);
  const projectID = useSelector((store: any) => store?.project?.currentProject?.uuid);
  const debouncedSave: any = debounce(onSaveEnergystorageSystem, 1000);

  const companyID = company?.company?.uuid;

  const [initialValues, setInitialValues] = useState({
    quantity: "",
    make: "",
    model: "",
    secondBatteryQuantity: "",
    secondBatteryMake: "",
    secondBatteryModel: "",
  });

  const screenSchema = Yup.object().shape({
    uuid: Yup.string().nullable(),
    hasDaisyChain: Yup.boolean(),
    // Battery 1 fields
    doesBatteryExists: Yup.boolean(),
    batteryQuantity: parseNumberSchema("Battery Quantity"),
    batteryModelUuid: Yup.string().uuid("Invalid UUID format"),
    batteryImages: Yup.array().of(Yup.object()),
    // Battery 2 fields
    doesBattery2Exists: Yup.boolean(),
    battery2Quantity: parseNumberSchema("Battery 2 Quantity"),
    battery2ModelUuid: Yup.string().uuid("Invalid UUID format"),
    battery2Images: Yup.array().of(Yup.object()),
  });

  async function getCurrentData() {
    setPageDataLoading(true);
    const response = await GetProjectEquipmentStorageData(projectID, companyID, equipmentSetUuid);
    setPageDataLoading(false);
    const currentData = convertKeysToCamelCase(response?.data?.data);

    const {
      uuid,
      backupType,
      hasDaisyChain,
      doesBatteryExists,
      batteryQuantity,
      battery2Quantity,
      batteryEquipment,
      batteryImages,
      battery2Images,
      battery2Equipment,
      doesBattery2Exists,
      essManagementSystem,
    } = currentData;

    const parsedFormValues = {
      uuid,
      backupType,
      hasDaisyChain,
      doesBatteryExists,
      batteryQuantity,
      batteryImages,
      batteryModelUuid: batteryEquipment?.uuid,
      battery2Images,
      battery2Quantity,
      doesBattery2Exists,
      essManagementSystem,
      battery2ModelUuid: battery2Equipment?.uuid,
    };

    formikRef.current?.setValues(parsedFormValues);

    if (battery2Images || battery2Equipment || battery2Quantity || batteryEquipment) {
      setSecondBattery(true);
    }

    if (backupType) {
      setSelection(backupType);
    }

    setCheckbox(essManagementSystem?.hasIntegratedEss);
    setCurrentData(currentData);
  }

  useEffect(() => {
    getCurrentData();
  }, []);

  useEffect(() => {
    if (selectedOption !== null) {
      debouncedSave();
    }
  }, [selectedOption]);

  useFocusEffect(
    React.useCallback(() => {
      if (formikRef.current) {
        formikRef.current.resetForm();
      }
      setErrorMessage("");
    }, [])
  );

  const handleSetActive = (value: string) => {
    setIsActive(value);
    if (value === "+ Battery \n Combiner Panel") {
      navigation.navigate("BatteryCombiner", {
        title,
        systemType,
        equipmentSetUuid,
        essUuid: currentData?.uuid,
        currentData: currentData,
      });
    }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setErrorMessage("");
  };

  const handleBackupLoad = async () => {
    setBackupLoad(!isBackupLoad);
    if (selectedOption === "Whole Home") {
      navigation.navigate("wholeHome", {
        title,
        systemType,
        equipmentSetUuid,
        essUuid: currentData?.uuid,
        currentData,
      });
    } else {
      navigation.navigate("wholeHome", {
        flag: "partialHome",
        title,
        systemType,
        equipmentSetUuid,
        essUuid: currentData?.uuid,
        currentData,
      });
    }
    // if (formikRef.current) {
    //   formikRef.current.handleSubmit();
    // }
  };

  const handleInfo = (type: string) => {};
  function renderPageHeaderComponent() {
    return (
      <View style={styles.textView}>
        <Text style={styles.headerText} children={companyDetail?.name} />
        <Text
          style={styles.subText}
          children={companyDetail?.address + " " + companyDetail?.city}
        />
        <Text style={styles.headerText}>Select Backup Option</Text>

        <View style={{ position: "absolute", top: 35, right: 30 }}>
          <Button
            color1={"#0C1F3F"}
            color2={"#213454"}
            color3={"#2E4161"}
            children={"< Back"}
            style={styles.btnStyle}
            labelStyle={styles.buttonText}
            onPress={() => navigation.goBack()}
          />
        </View>
        <View style={styles.optionsContainer}>
          {options.map((value, index) => {
            return (
              <View style={styles.option} key={index}>
                <TouchableOpacity onPress={() => handleInfo(selectedOption)}>
                  <Image
                    source={require("../../assets/Images/icons/info.png")}
                    style={[styles.infoIcon, { alignSelf: "center" }]}
                  />
                </TouchableOpacity>
                <Button
                  color1={selectedOption === value ? "#FD7332" : "#0C1F3F"}
                  color2={selectedOption === value ? "#EF3826" : "#2E4161"}
                  style={styles.optionItem}
                  onPress={() => {
                    setSelection(value);
                    setCheckbox(false);
                  }}
                  labelStyle={[
                    styles.buttonText,
                    { fontWeight: selectedOption === value ? "700" : "400" },
                  ]}
                >
                  {value}
                </Button>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  async function onSaveEnergystorageSystem(data?: any) {
    // if (isPageDataLoading) return;

    setLoading(true);

    const payload = {
      uuid: currentData?.uuid,
      equipmentSetUuid: equipmentSetUuid,
      backupType: selectedOption,
      ...formikRef.current?.values,
    };
    payload.batteryQuantity = payload.batteryQuantity ? +payload.batteryQuantity : null;
    payload.battery2Quantity = payload.battery2Quantity ? +payload.battery2Quantity : null;

    try {
      const response = await saveEnergySystemDetails(projectID, companyID, omitNullValues(payload));
      if (response?.status == 200) {
        console.log("response", response?.data);
      } else {
        console.log("Failed to save equipment details", response?.data);
      }
    } catch (error: any) {
      console.log(error?.message);
    } finally {
      setLoading(false);
    }
  }

  function renderHeaderLogoComponent() {
    return (
      <HeaderLogoComponent
        isTitle={true}
        title={title + " Energy Storage System"}
        back={false}
        applogo={true}
        onIconPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
    );
  }

  function renderIntegratedCheckbox(setFieldValue: any) {
    return (
      <View style={styles.checkView}>
        {!checkbox ? (
          <TouchableOpacity
            onPress={() => {
              setCheckbox(true);
              setFieldValue("hasIntegratedEss", true);
              debouncedSave();
            }}
          >
            <Image
              style={{ height: 20, width: 20, margin: 0.2 }}
              source={require("../../assets/Images/icons/checkbox.png")}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              setCheckbox(false);
              setFieldValue("hasIntegratedEss", false);
              debouncedSave();
            }}
          >
            <Image
              style={{ height: 20.5, width: 20.5 }}
              source={require("../../assets/Images/icons/checked.png")}
            />
          </TouchableOpacity>
        )}
        <Text
          children={
            selectedOption === "No Backup"
              ? "Connect batteries to Main Panel A"
              : "Select if ESS Management System \n is inverter integrated"
          }
          style={styles.checkText}
        ></Text>
      </View>
    );
  }

  function renderSecondaryBatteryButton() {
    return (
      <View style={styles.extraBtns}>
        <Button
          color1={isSecondBattery ? "#FD7332" : "#0C1F3F"}
          color2={isSecondBattery ? "#EF3826" : "#2E4161"}
          style={[styles.subBtn, { alignSelf: "flex-start" }]}
          onPress={() => setSecondBattery(!isSecondBattery)}
          labelStyle={[styles.buttonText, { fontWeight: isSecondBattery ? "700" : "400" }]}
        >
          + Battery Model
        </Button>
        <TouchableOpacity
          onPress={() => handleInfo(selectedOption)}
          style={{ justifyContent: "center", paddingLeft: 15 }}
        >
          <Image source={require("../../assets/Images/icons/info.png")} style={styles.infoIcon} />
        </TouchableOpacity>
      </View>
    );
  }

  function renderFooterButtonBlock() {
    return (
      <View>
        <View style={[styles.subContainer, { columnGap: 20 }]}>
          {Array.from(["Daisy Chain", "+ Battery \n Combiner Panel"]).map((value, index: any) => {
            return (
              <Button
                key={index}
                color1={active === value ? "#FD7332" : "#0C1F3F"}
                color2={active === value ? "#EF3826" : "#2E4161"}
                style={styles.subBtn}
                onPress={() => handleSetActive(value)}
                labelStyle={[styles.buttonText, { fontWeight: active === value ? "700" : "400" }]}
              >
                {value}
              </Button>
            );
          })}
        </View>

        <View style={[styles.extraBtns, { marginVertical: 20 }]}>
          <Button
            color1={isBackupLoad ? "#FD7332" : "#0C1F3F"}
            color2={isBackupLoad ? "#EF3826" : "#2E4161"}
            style={[styles.subBtn, { alignSelf: "flex-start" }]}
            onPress={() => {
              handleBackupLoad();
            }}
            labelStyle={[styles.buttonText, { fontWeight: isBackupLoad ? "700" : "400" }]}
          >
            + Backup Load {"\n"} Sub Panel
          </Button>
          <TouchableOpacity
            onPress={() => handleInfo(selectedOption)}
            style={{ justifyContent: "center", paddingLeft: 15 }}
          >
            <Image source={require("../../assets/Images/icons/info.png")} style={styles.infoIcon} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBlurWithSave = (handleBlur: any, fieldName: any) => () => {
    handleBlur(fieldName);
    debouncedSave();
  };

  function renderFormBlock() {
    return (
      <View style={styles.textInputView}>
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={screenSchema}
          onSubmit={(values) => handleSubmit(values)}
          validateOnChange={false}
          validateOnBlur={false}
        >
          {({ handleBlur, setFieldValue, values, errors, touched }) => {
            return (
              <View style={styles.eSSContainer}>
                {renderIntegratedCheckbox(setFieldValue)}

                {selectedOption !== "No Backup" && (
                  <EssManagementSystemForm
                    styles={styles}
                    values={values}
                    systemType={systemType}
                    setFieldValue={setFieldValue}
                    handleBlur={handleBlur}
                    handleBlurWithSave={handleBlurWithSave}
                    touched={touched}
                    errors={errors}
                  />
                )}

                <EssBatteryField
                  styles={styles}
                  systemType={systemType}
                  setFieldValue={setFieldValue}
                  touched={touched}
                  errors={errors}
                  handleBlur={handleBlur}
                  handleBlurWithSave={handleBlurWithSave}
                  values={values}
                  equipmentUuid={values.batteryModelUuid}
                  manufacturer={currentData?.batteryEquipment?.manufacturer}
                  images={[]}
                  fieldIndex={0}
                />

                {renderSecondaryBatteryButton()}

                {isSecondBattery && (
                  <EssBatteryField
                    styles={styles}
                    systemType={systemType}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    errors={errors}
                    handleBlur={handleBlur}
                    values={values}
                    equipmentUuid={values.battery2ModelUuid}
                    manufacturer={currentData?.battery2Equipment?.manufacturer}
                    images={[]}
                    fieldIndex={1}
                    handleBlurWithSave={handleBlurWithSave}
                  />
                )}

                {renderFooterButtonBlock()}
                {(Object.keys(errors).length > 0 || errorMessage.trim() !== "") && (
                  <Text children={errorMessage} style={styles.errorText} />
                )}
              </View>
            );
          }}
        </Formik>
      </View>
    );
  }

  function renderPageContent() {
    if (isPageDataLoading) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "white" }}>Loading...</Text>
        </View>
      );
    }

    return (
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps={"handled"}
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        enableOnAndroid
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {renderHeaderLogoComponent()}
        {renderPageHeaderComponent()}
        {renderFormBlock()}
      </KeyboardAwareScrollView>
    );
  }

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={{ flex: 1 }}>
        <DismissKeyboardView>{renderPageContent()}</DismissKeyboardView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const DismissKeyboardView = ({ children }: any) => (
  <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>{children}</TouchableWithoutFeedback>
);

export default EnergySS;
