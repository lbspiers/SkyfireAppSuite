import React, { useEffect } from "react";
import { SafeAreaView, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { styles } from "../../styles/equipmentScreenStyles";
import { HeaderLogoComponent } from "../../components/Header";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import Text from "../../components/Text";
import { EquipmentLists, saveEquipmentDetails } from "../../api/project.service";
import { useDispatch, useSelector } from "react-redux";
import { getEquipmentSetByType, setUpdateProjectDetails } from "../../store/slices/projectSlice";
import { debugLogJson, omitNullValues } from "../../utils/utlityFunc";
import logger from "../../utils/logger";
import _ from "lodash";

const Equipment = () => {
  const dispatch = useDispatch();
  const companyID = useSelector((store: any) => store?.profile?.profile);
  const project = useSelector((store: any) => store?.project?.currentProject);
  const updateProjectDetails = useSelector((store: any) => store?.project?.updateProjectDetails);
  const { user, company } = companyID;
  const userFullName = `${user?.firstName || ""} ${user?.lastName || ""}`;
  const addressString = `${company?.address || ""} ${company?.city || ""} ${company?.state || ""} ${
    company?.zipCode || ""
  } `;

  const InstallerId = useSelector(
    (store: any) => store?.project?.projectDetails?.data?.details?.installer_project_id
  );

  const fetchEquipmentSetList = async () => {
    try {
      const response = await EquipmentLists(project?.uuid, companyID?.company?.uuid);
      if (response?.status === 200) {
        dispatch(setUpdateProjectDetails(response?.data?.data));
      } else {
        console.log("Failed to fetch Equipment Lists", response?.data);
      }
    } catch (error: any) {
      console.log(error?.message);
    }
  };

  useEffect(() => {
    if (project?.uuid) fetchEquipmentSetList();
  }, [project]);

  const navigation: any = useNavigation();

  const options = [
    "Micro / Inverter 1",
    "Micro / Inverter 1 - ESS",
    "Micro / Inverter 2",
    "Micro / Inverter 2 - ESS",
    "Inverter 3",
    "Inverter 3 - ESS",
    "Inverter 4",
    "Inverter 4 - ESS",
  ];

  const optionsAsObjects = options?.map((item, index) => ({
    name: item,
    id: index + 1,
  }));

  const equipmentSetGroup =
    updateProjectDetails?.equipment_sets?.reduce((acc: any, equipmentSet: any) => {
      acc[equipmentSet?.label] = equipmentSet;
      return acc;
    }, {}) || {};

  const onSaveEquipmentDetails = async (data: any) => {
    const payloadData: any = {
      equipmentSet: [
        {
          label: data,
          equipmentSetUuid: updateProjectDetails?.uuid ?? undefined,
          solarPanelQuantity: 0,
        },
      ],
    };

    const payload = { equipmentSet: _.map(payloadData.equipmentSet, omitNullValues) };

    try {
      const response = await saveEquipmentDetails(project.uuid, companyID?.company?.uuid, payload);
      if (response?.status === 200) {
        console.log("response", JSON.stringify(response?.data?.message));
        fetchEquipmentSetList();
      } else {
        console.log("Failed to save equipment details", response?.data);
      }
    } catch (error: any) {
      console.log(error?.message);
    }
  };

  const handleOnPress = async (title: string) => {
    if (title === "Micro / Inverter 1 - ESS" || title === "Micro / Inverter 2 - ESS") {
      const modifiedTitle = title.replace("- ESS", "Energy Storage System");
      const equipmentSet = updateProjectDetails?.equipment_sets?.find(
        (equipmentSet: any) => equipmentSet?.label === title.split(" - ESS")[0]
      );

      navigation.navigate("EnergySS", {
        title: modifiedTitle,
        equipmentSetUuid: equipmentSet?.uuid,
        systemType: equipmentSet?.system_type?.equipment_type,
      });
    } else if (title === "Micro / Inverter 2") {
      const data = updateProjectDetails?.equipment_sets?.find(
        (item: any) => item.label === "Micro / Inverter 2"
      );

      if (data?.solar_panel_quantity > 0) {
        navigation.navigate("EquipmentDetails", {
          title: title,
          details: {
            address: addressString,
            name: userFullName,
            installerId: InstallerId,
          },
          data: data,
        });
      } else {
        if (!data) {
          await onSaveEquipmentDetails(title);
        }

        navigation.navigate("EquipmentConfirmation", {
          title: title,
          details: {
            address: addressString,
            name: userFullName,
            installerId: InstallerId,
          },
        });
      }
    } else if (title === "Micro / Inverter 1") {
      const isMicroData = optionsAsObjects.find(
        (item: any) => equipmentSetGroup[item?.name] != null
      );

      if (!isMicroData) {
        navigation.navigate("SystemSelection", {
          title: title,
          details: {
            address: addressString,
            name: userFullName,
            installerId: InstallerId,
          },
        });
      } else {
        navigation.navigate("EquipmentDetails", {
          title: title,
          details: {
            address: addressString,
            name: userFullName,
            installerId: InstallerId,
          },
          data: equipmentSetGroup[title],
        });
      }
    } else {
      navigation.navigate("ComingSoon", {
        title: title,
        details: {
          address: addressString,
          name: userFullName,
          installerId: InstallerId,
        },
        data: equipmentSetGroup[title],
      });
    }
  };

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={20}
          enableAutomaticScroll={true}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <HeaderLogoComponent
            isTitle={true}
            title="Equipment"
            back={false}
            applogo={true}
            onIconPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          />

          <View style={styles.textView}>
            <Text style={styles.headerText}>{userFullName}</Text>
            <Text style={styles.subText}>{addressString}</Text>
            <Text style={[styles.subText, styles.label]}>
              {project?.details?.installer_project_id}
            </Text>
          </View>
          <View style={styles.subContainer}>
            {optionsAsObjects?.map((item, index) => {
              let canHighlight = equipmentSetGroup[item?.name] != null;

              if (item.name.includes("ESS")) {
                const equipmentSetData = useSelector((_) =>
                  getEquipmentSetByType(_, item?.name?.replaceAll(" - ESS", ""))
                );

                canHighlight = equipmentSetData?.has_ess;
              }

              if (canHighlight) {
                return (
                  <View key={index} style={styles.eachBlock}>
                    <LinearGradient colors={["#FD7332", "#B92011"]} style={{ borderRadius: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleOnPress(item?.name)}
                        style={styles.listItemEdit}
                      >
                        <Text style={styles.listTextEdit}>{item.name}</Text>
                        <Text style={styles.listTextEdit}>Edit</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                );
              } else {
                return (
                  <View key={index} style={styles.eachBlock}>
                    <TouchableOpacity
                      onPress={() => handleOnPress(item.name)}
                      style={styles.listItem}
                    >
                      <Text style={styles.listText}>{`+ ${item.name}`}</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
            })}
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Equipment;
