import { RouteProp, useRoute } from "@react-navigation/native";
import React, { act, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import Toast from "react-native-toast-message";
import { styles } from "../../styles/equipmentDetailsStyles.tsx";
import { HeaderLogoComponent } from "../../components/Header";
import { Formik, FormikProps } from "formik";
import * as Yup from "yup";
import Button from "../../components/Button";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import TextInputField from "../../components/TextInput";
import Text from "../../components/Text";
import DropdownComponent from "./extraDropdown";
import { SubHeaderComponent } from "./../../components/Header/SubHeaderComponent";
import { CameraOption } from "./CameraOption";
import {
  EquipmentLists,
  equipmentManufacturers,
  saveEquipmentDetails,
} from "../../api/project.service";
import { GetModelNumber } from "../../api/inventry.service";
import { useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";
import {
  getEquipmentSetByType,
  setUpdateProjectDetails,
} from "../../store/slices/projectSlice";
import _ from "lodash";
import {
  setMttp1,
  setMttp2,
  setMttp3,
  setMttp4,
  setMttp5,
  setMttp6,
} from "../../store/slices/inverterStringingSlice";
import {
  setCircuit1,
  setCircuit2,
  setCircuit3,
  setCircuit4,
  setCircuit5,
  setCircuit6,
  setCircuit7,
  setCircuit8,
  setCircuit9,
} from "../../store/slices/stringingSlice";
import logger from "../../utils/logger";
import { omitNullValues } from "../../utils/utlityFunc";

const EquipmentDetails = () => {
  const navigation: any = useNavigation();
  const { params }: any = useRoute<RouteProp<string | any>>();
  const title = params?.title;

  const isFirstRender = useRef(true);
  const dispatch: any = useDispatch();
  const companyID = useSelector((store: any) => store?.profile?.profile);
  const projectID = useSelector(
    (store: any) => store?.project?.currentProject?.uuid
  );
  const stringingValue = useSelector((store: any) => store?.stringing);
  const inverterStringingValue = useSelector(
    (store: any) => store?.inverterStringing
  );

  const project = useSelector((store: any) => store?.project?.currentProject);
  const formikRef = useRef<FormikProps<any>>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [solarPanelList, setSolarPanelList] = useState([]);
  const [systemTypeList, setSystemTypeList] = useState([]);

  const [stringTypeList, setStringTypeList] = useState([]);

  const [solarModalList, setSolarModalList] = useState([]);
  const [systemTypeModalList, setSystemTypeModalList] = useState([]);
  const [stringfyModalList, setStringfyModalList] = useState([]);
  const updateProjectDetails = useSelector((_) =>
    getEquipmentSetByType(_, title)
  );

  const currentSystemType = updateProjectDetails?.label?.includes("Micro")
    ? "MicroInverter"
    : "Inverter";

  console.log(params?.system || currentSystemType);

  const [active, setIsActive] = useState({
    SystemType: params?.system || currentSystemType,
    StringType: "Auto Size",
  });

  console.log(active);

  const [images, setImages] = useState({
    SolarPanel: [],
    MicroInverter: [],
    CombinerPanel: [],
  });

  const [formValues, setFormValues] = useState({
    selectedSolarPanel: "",
    selectedSystemType: "",
    selectedStringType: "",
    selectedSolarPanelModal: "",
    selectedSystemTypeModal: "",
    selectedStringTypeModal: "",
    isNewSolarPanel: true,
    isNewSystemType: true,
    isNewStringType: true,
    quantity: 0,
  });

  const handleChange = (name: any) => (value: any) => {
    setFormValues({ ...formValues, [name]: value });
  };

  useEffect(() => {
    if (updateProjectDetails) {
      const {
        solar_panel,
        system_type,
        associated_panel,
        is_existing_solar,
        is_existing_system,
        is_existing_associated,
        solar_panel_quantity,
        solar_panel_images,
        system_type_images,
        associated_panel_images,
      } = updateProjectDetails;

      setFormValues({
        selectedSolarPanel: solar_panel?.manufacturer ?? "",
        selectedSystemType: system_type?.manufacturer ?? "",
        selectedStringType: associated_panel?.manufacturer ?? "",

        selectedSolarPanelModal: solar_panel?.uuid ?? "",
        selectedSystemTypeModal: system_type?.uuid ?? "",
        selectedStringTypeModal: associated_panel?.uuid ?? "",

        isNewSolarPanel: is_existing_solar ?? true,
        isNewSystemType: is_existing_system ?? true,
        isNewStringType: is_existing_associated ?? true,

        quantity: solar_panel_quantity ?? 0,
      });

      setImages((_) => ({
        SolarPanel: solar_panel_images || [],
        MicroInverter: system_type_images || [],
        CombinerPanel: associated_panel_images || [],
      }));
      dispatch(
        setMttp1(
          updateProjectDetails?.stringing_data?.mttp1 ||
            inverterStringingValue?.mttp1
        )
      );
      dispatch(
        setMttp2(
          updateProjectDetails?.stringing_data?.mttp2 ||
            inverterStringingValue?.mttp2
        )
      );
      dispatch(
        setMttp3(
          updateProjectDetails?.stringing_data?.mttp3 ||
            inverterStringingValue?.mttp3
        )
      );
      dispatch(
        setMttp4(
          updateProjectDetails?.stringing_data?.mttp4 ||
            inverterStringingValue?.mttp4
        )
      );
      dispatch(
        setMttp5(
          updateProjectDetails?.stringing_data?.mttp5 ||
            inverterStringingValue?.mttp5
        )
      );
      dispatch(
        setMttp6(
          updateProjectDetails?.stringing_data?.mttp6 ||
            inverterStringingValue?.mttp6
        )
      );

      dispatch(
        setCircuit1(
          updateProjectDetails?.stringing_data?.circuit1 ||
            stringingValue.circuit1
        )
      );
      dispatch(
        setCircuit2(
          updateProjectDetails?.stringing_data?.circuit2 ||
            stringingValue.circuit2
        )
      );
      dispatch(
        setCircuit3(
          updateProjectDetails?.stringing_data?.circuit3 ||
            stringingValue.circuit3
        )
      );
      dispatch(
        setCircuit4(
          updateProjectDetails?.stringing_data?.circuit4 ||
            stringingValue.circuit4
        )
      );
      dispatch(
        setCircuit5(
          updateProjectDetails?.stringing_data?.circuit5 ||
            stringingValue.circuit5
        )
      );
      dispatch(
        setCircuit6(
          updateProjectDetails?.stringing_data?.circuit6 ||
            stringingValue.circuit6
        )
      );
      dispatch(
        setCircuit7(
          updateProjectDetails?.stringing_data?.circuit7 ||
            stringingValue.circuit7
        )
      );
      dispatch(
        setCircuit8(
          updateProjectDetails?.stringing_data?.circuit8 ||
            stringingValue.circuit8
        )
      );
      dispatch(
        setCircuit9(
          updateProjectDetails?.stringing_data?.circuit9 ||
            stringingValue.circuit9
        )
      );
    }
  }, [updateProjectDetails]);

  useEffect(() => {
    if (params?.system || updateProjectDetails?.system_type?.equipment_type) {
      setIsActive((prevState) => ({
        ...prevState,
        SystemType:
          params?.system || updateProjectDetails?.system_type?.equipment_type,
      }));
    }
  }, [updateProjectDetails?.system_type?.equipment_type, params?.system]);

  useEffect(() => {
    setIsActive((prevState) => ({
      ...prevState,
      StringType:
        updateProjectDetails?.auto_size_stringing === null ||
        updateProjectDetails?.auto_size_stringing === true
          ? "Auto Size"
          : "Edit",
    }));
  }, [updateProjectDetails?.auto_size_stringing]);

  useFocusEffect(
    React.useCallback(() => {
      if (formikRef.current) {
        formikRef.current.resetForm();
      }
      setErrorMessage("");
    }, [])
  );

  const screenSchema = Yup.object().shape({
    quantity: Yup.number().required("Quantity is required"),
    make: Yup.string().required("Make is required"),
    model: Yup.string().required("Model is required"),
  });

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setErrorMessage("");
  };

  const handleSetImages = (type: string, selectedImages: any) => {
    setImages((prevImages: any) => ({
      ...prevImages,
      [type]: selectedImages,
    }));
  };

  useEffect(() => {
    // equipmentManufacturersFun(active.SystemType);
    equipmentManufacturersFun("Solar Panel");
    equipmentManufacturersFun(active.SystemType);
    if (
      active.SystemType == "MicroInverter" ||
      active.SystemType == "Inverter"
    ) {
      equipmentManufacturersFun(
        active.SystemType == "MicroInverter"
          ? "MicroInverter Combiner Panel"
          : "Inverter Optimizer"
      );
    }

    fetchModelNumber(
      active.SystemType,
      formValues?.selectedSystemType,
      setSystemTypeModalList
    );
    fetchModelNumber(
      active.SystemType == "MicroInverter"
        ? "MicroInverter Combiner Panel"
        : "Inverter Optimizer",
      formValues?.selectedStringType,
      setStringfyModalList
    );

    fetchEquipmentLists();
  }, [active.SystemType]);

  const fetchModelNumber = async (
    type: any,
    manufacturer: any,
    setData: any
  ) => {
    try {
      const response: any = await GetModelNumber(type, manufacturer);
      if (response?.status == 200) {
        setData(response?.data?.data);
      } else {
      }
    } catch (error: any) {
      console.log(error?.message);
    }
  };

  const equipmentManufacturersFun = async (type: any) => {
    try {
      const response: any = await equipmentManufacturers(type);
      if (response?.status == 200) {
        if (type == "Solar Panel") {
          setSolarPanelList(response?.data?.data);
        } else if (type == "Inverter" || type == "MicroInverter") {
          setSystemTypeList(response?.data?.data);
        } else if (
          type == "MicroInverter Combiner Panel" ||
          type == "Inverter Optimizer"
        ) {
          setStringTypeList(response?.data?.data);
        }
      } else {
        setSolarPanelList([]);
        setSystemTypeList([]);
        setStringTypeList([]);
      }
    } catch (error: any) {
      console.log(error?.message);
    }
  };

  const onSaveEquipmentDetails = async () => {
    const stringingData =
      active.StringType === "Edit" && active?.SystemType === "MicroInverter"
        ? stringingValue
        : active.StringType === "Edit" && active?.SystemType === "Inverter"
        ? inverterStringingValue
        : null;

    const payloadData: any = {
      equipmentSet: [
        {
          label: title,
          equipmentSetUuid: updateProjectDetails?.uuid ?? undefined,
          solarPanelQuantity: parseInt(`${formValues?.quantity}`),
          solarPanelUuid: formValues?.selectedSolarPanelModal ?? undefined,
          systemTypeUuid: formValues?.selectedSystemTypeModal ?? undefined,
          associatedPanelUuid: formValues?.selectedStringTypeModal ?? undefined,
          isExistingSolarPanel: formValues?.isNewSolarPanel,
          isExistingSystemType: formValues?.isNewSystemType,
          isExistingAssociatedPanel: formValues?.isNewStringType,
          autoSizeStringing: active.StringType === "Auto Size",
          solarPanelImages: images?.SolarPanel || [],
          systemTypeImages: images?.MicroInverter || [],
          associatedPanelImages: images?.CombinerPanel || [],
          stringingData,
        },
      ],
    };

    const payload = {
      equipmentSet: _.map(payloadData.equipmentSet, (obj) => {
        return omitNullValues(obj);
      }),
    };
    logger.info("payloaddd", JSON.stringify(payload));
    try {
      const response = await saveEquipmentDetails(
        projectID,
        companyID?.company?.uuid,
        payload
      );
      if (response?.status == 200) {
        if (updateProjectDetails == null) {
          fetchEquipmentLists();
        }
        console.log("response", JSON.stringify(response?.data?.message));
        Toast.show({ 
          text1: "Data Saved", 
          type: "success",
          position: "top",
          visibilityTime: 1500, // Quick toast
        });
      } else {
        console.log("Failed to save equipment details", response?.data);
      }
    } catch (error: any) {
      console.log(error?.message);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSave: any = debounce(onSaveEquipmentDetails, 1000);

  // useEffect(() => {
  //   if (!isFirstRender.current) {
  //     debouncedSave();
  //   } else {
  //     isFirstRender.current = false;
  //   }
  // }, [formValues, inverterStringingValue, stringingValue]);

  useEffect(() => {
    if (!isFirstRender.current) {
      debouncedSave();
    } else {
      isFirstRender.current = false;
    }
  }, [formValues]);

  useEffect(() => {
    // Check if any key in inverterStringingValue has a value
    const hasValue = Object.values(inverterStringingValue).some(
      (value: any) => Object.keys(value).length > 0
    );

    if (hasValue && !isFirstRender.current) {
      debouncedSave();
    } else {
      isFirstRender.current = false;
    }
  }, [inverterStringingValue]);

  useEffect(() => {
    // Check if any circuit in stringingValue has a non-empty string
    const hasValue = Object.values(stringingValue).some(
      (value: any) => value.trim() !== ""
    );

    if (hasValue && !isFirstRender.current) {
      debouncedSave();
    } else {
      isFirstRender.current = false;
    }
  }, [stringingValue]);

  useEffect(() => {
    if (formValues?.selectedSolarPanel) {
      fetchModelNumber(
        "Solar Panel",
        formValues.selectedSolarPanel,
        setSolarModalList
      );
    }
  }, [formValues?.selectedSolarPanel]);

  useEffect(() => {
    if (formValues?.selectedSystemType) {
      fetchModelNumber(
        active.SystemType,
        formValues?.selectedSystemType,
        setSystemTypeModalList
      );
    }
  }, [formValues?.selectedSystemType]);

  useEffect(() => {
    if (formValues?.selectedStringType) {
      fetchModelNumber(
        active.SystemType == "MicroInverter"
          ? "MicroInverter Combiner Panel"
          : "Inverter Optimizer",
        formValues?.selectedStringType,
        setStringfyModalList
      );
    }
  }, [formValues?.selectedStringType]);

  const fetchEquipmentLists = async () => {
    try {
      const response = await EquipmentLists(
        projectID,
        companyID?.company?.uuid
      );
      if (response?.status == 200) {
        dispatch(setUpdateProjectDetails(response?.data?.data));
      } else {
        console.log("Failed to fetch Equipment Lists", response?.data);
      }
    } catch (error: any) {
      console.log(error?.message);
    }
  };

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps={"handled"}
          showsVerticalScrollIndicator={false}
          enableAutomaticScroll={true}
          extraScrollHeight={20}
          enableOnAndroid
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <HeaderLogoComponent
            isTitle={true}
            title={title}
            back={false}
            applogo={true}
            onIconPress={() => console.log("Icon Pressed")}
          />
          <View style={styles.textView}>
            <Text style={styles.headerText} children={params?.details?.name} />
            <Text style={styles.subText} children={params?.details?.address} />
            <Text
              style={[styles.subText, styles.label]}
              children={project?.details?.installer_project_id}
            />
          </View>
          <View style={styles.textInputView}>
            <SubHeaderComponent
              name={"Solar Panel"}
              isInfo={true}
              isOptions={true}
              handleExisting={() => {}}
              isNew={formValues?.isNewSolarPanel}
              setIsNew={handleChange("isNewSolarPanel")}
              handleNew={() => {}}
            />

            <Formik
              innerRef={formikRef}
              initialValues={formValues}
              validationSchema={screenSchema}
              onSubmit={(values) => {
                handleSubmit(values);
              }}
              validateOnChange={false}
              validateOnBlur={false}
              enableReinitialize={true}
            >
              {({ handleBlur, errors, touched }) => (
                <View style={{ flex: 1, paddingBottom: 100 }}>
                  <View style={{ flexDirection: "row" }}>
                    <TextInputField
                      label={"Quantity*"}
                      placeholder={"###"}
                      onChangeText={handleChange("quantity")}
                      onBlur={handleBlur("quantity")}
                      value={
                        formValues?.quantity?.toString() ??
                        updateProjectDetails?.solar_panel_quantity
                      }
                      errorText={touched.quantity && errors.quantity ? String(errors.quantity) : undefined}
                      style={[styles.textInput, { width: 100 }]}
                      labelStyle={styles.label}
                      placeHolderColor={styles.label.color}
                    />
                    <CameraOption
                      type="SolarPanel"
                      setImages={handleSetImages}
                      images={images}
                      onSave={debouncedSave}
                      loader={loading}
                    />
                  </View>

                  <Text style={[styles.label, { paddingTop: 10 }]}>Make*</Text>
                  <DropdownComponent
                    label={"Select Make"}
                    onChangeValue={(value: any) => {
                      handleChange("selectedSolarPanel");
                      fetchModelNumber("Solar Panel", value, setSolarModalList);
                    }}
                    error={touched.make && errors.make}
                    data={solarPanelList}
                    values={formValues?.selectedSolarPanel}
                  />
                  <Text style={[styles.label, { paddingTop: 10 }]}>Model*</Text>
                  <DropdownComponent
                    label={"Select Model"}
                    onChangeValue={handleChange("selectedSolarPanelModal")}
                    error={touched.model && errors.model}
                    data={solarModalList}
                    values={formValues?.selectedSolarPanelModal}
                  />
                  <View style={{ rowGap: 10 }}>
                    {/* <SubHeaderComponent
                      name={"Choose System Type"}
                      isInfo={false}
                      isOptions={false}
                    /> */}
                    {/* <View style={[styles.secondsub, { columnGap: 20, paddingVertical: 10 }]}>
                      <Button
                        color1={active.SystemType === "MicroInverter" ? "#FD7332" : "#0C1F3F"}
                        color2={active.SystemType === "MicroInverter" ? "#EF3826" : "#2E4161"}
                        style={[styles.subBtn]}
                        onPress={() =>
                          setIsActive((prevState) => ({
                            ...prevState,
                            SystemType: "MicroInverter",
                          }))
                        }
                        labelStyle={[
                          styles.buttonText,
                          { fontWeight: active.SystemType === "Microinverter" ? "700" : "400" },
                        ]}
                      >
                        MicroInverter
                      </Button>
                      <Button
                        color1={active.SystemType === "Inverter" ? "#FD7332" : "#0C1F3F"}
                        color2={active.SystemType === "Inverter" ? "#EF3826" : "#2E4161"}
                        style={styles.subBtn}
                        onPress={() =>
                          setIsActive((prevState) => ({ ...prevState, SystemType: "Inverter" }))
                        }
                        labelStyle={[
                          styles.buttonText,
                          { fontWeight: active.SystemType === "Inverter" ? "700" : "400" },
                        ]}
                      >
                        Inverter
                      </Button>
                    </View> */}

                    <SubHeaderComponent
                      name={active.SystemType}
                      isInfo={true}
                      isOptions={true}
                      handleExisting={() => {}}
                      handleNew={() => {}}
                      isNew={formValues?.isNewSystemType}
                      setIsNew={handleChange("isNewSystemType")}
                    />
                    <View>
                      <View style={{ flexDirection: "row" }}>
                        <Text style={styles.label}>Make*</Text>
                        <CameraOption
                          type="MicroInverter"
                          setImages={handleSetImages}
                          images={images}
                          onSave={debouncedSave}
                          loader={loading}
                        />
                      </View>
                      <DropdownComponent
                        label={"Select Make"}
                        onChangeValue={(value: any) => {
                          handleChange("selectedSystemType");
                          fetchModelNumber(
                            active.SystemType,
                            value,
                            setSystemTypeModalList
                          );
                        }}
                        error={touched.make && errors.make}
                        data={systemTypeList}
                        values={formValues?.selectedSystemType}
                      />
                      <Text style={styles.label}>Model*</Text>
                      <DropdownComponent
                        label={"Select Model"}
                        onChangeValue={handleChange("selectedSystemTypeModal")}
                        error={touched.model && errors.model}
                        data={systemTypeModalList}
                        values={formValues?.selectedSystemTypeModal}
                      />
                    </View>
                  </View>
                  <View style={{ rowGap: 10 }}>
                    <SubHeaderComponent
                      name={"Stringing"}
                      isInfo={true}
                      isOptions={false}
                    />
                    <View
                      style={[
                        styles.secondsub,
                        { columnGap: 20, paddingVertical: 10 },
                      ]}
                    >
                      <Button
                        color1={
                          active.StringType === "Auto Size"
                            ? "#FD7332"
                            : "#0C1F3F"
                        }
                        color2={
                          active.StringType === "Auto Size"
                            ? "#EF3826"
                            : "#2E4161"
                        }
                        style={[styles.subBtn]}
                        onPress={() => {
                          setIsActive((prevState) => ({
                            ...prevState,
                            StringType: "Auto Size",
                          }));
                          //  debouncedSave();
                        }}
                        labelStyle={styles.buttonText}
                      >
                        Auto Size
                      </Button>
                      <Button
                        color1={
                          active.StringType === "Edit" ? "#FD7332" : "#0C1F3F"
                        }
                        color2={
                          active.StringType === "Edit" ? "#EF3826" : "#2E4161"
                        }
                        style={styles.subBtn}
                        onPress={() => {
                          setIsActive((prevState) => ({
                            ...prevState,
                            StringType: "Edit",
                          }));
                          // debouncedSave()
                          navigation.navigate(
                            active.SystemType != "Inverter"
                              ? "Stringing"
                              : "InverterStringing",
                            {
                              debounceSave: debouncedSave,
                              details: params.details,
                            }
                          );
                        }}
                        labelStyle={styles.buttonText}
                      >
                        Edit
                      </Button>
                    </View>

                    <SubHeaderComponent
                      name={
                        active.SystemType === "Inverter"
                          ? "Opitimizer"
                          : "Combiner Panel"
                      }
                      isInfo={true}
                      isOptions={true}
                      handleExisting={() => {}}
                      handleNew={() => {}}
                      isNew={formValues.isNewStringType}
                      setIsNew={handleChange("isNewStringType")}
                    />
                    <View>
                      <View style={{ flexDirection: "row" }}>
                        <Text style={styles.label}>Make*</Text>
                        <CameraOption
                          type="CombinerPanel"
                          setImages={handleSetImages}
                          images={images}
                          onSave={debouncedSave}
                          loader={loading}
                        />
                      </View>
                      <DropdownComponent
                        label={"Select Make"}
                        onChangeValue={(value: any) => {
                          handleChange("selectedStringType");
                          fetchModelNumber(
                            active.SystemType == "MicroInverter"
                              ? "MicroInverter Combiner Panel"
                              : "Inverter Optimizer",
                            value,
                            setStringfyModalList
                          );
                        }}
                        error={touched.make && errors.make}
                        data={stringTypeList}
                        values={formValues.selectedStringType}
                      />
                      <Text style={styles.label}>Model*</Text>
                      <DropdownComponent
                        label={"Select Model"}
                        onChangeValue={handleChange("selectedStringTypeModal")}
                        error={touched.model && errors.model}
                        data={stringfyModalList}
                        values={formValues?.selectedStringTypeModal}
                      />
                    </View>
                  </View>
                  <Button
                    color1={"#0C1F3F"}
                    color2={"#2E4161"}
                    style={[
                      styles.subBtn,
                      { alignSelf: "flex-start", paddingHorizontal: 15 },
                    ]}
                    onPress={() =>
                      navigation.navigate("EnergySS", {
                        title: title,
                        systemType: active.SystemType,
                        equipmentSetUuid: updateProjectDetails?.uuid,
                      })
                    }
                    labelStyle={styles.buttonText}
                  >
                    + Energy Storage
                  </Button>
                  {Object.keys(errors).length === 0 &&
                    errorMessage.trim() !== "" && (
                      <Text children={errorMessage} style={styles.errorText} />
                    )}
                </View>
              )}
            </Formik>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default EquipmentDetails;
