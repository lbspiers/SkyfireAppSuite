import React, { useEffect, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { HeaderLogoComponent } from "../../../components/Header";
import Text from "../../../components/Text";
import { styles } from "../../../styles/electricalStyles";
import Button from "../../../components/Button";
import PanelComponent from "./components/PanelComponent";
import ServiceEntranceComponent from "./components/ServiceEntranceComponent";
import InterconnectionComponent from "./components/InterconnectionComponent";
import { debounce } from "lodash";
import { omitNullValues } from "../../../utils/utlityFunc";
import { useSelector } from "react-redux";
import { getProjectElectricalData, saveProjectElectricalData } from "../../../api/project.service";
import logger from "../../../utils/logger";
import ActivityIndicator from "../../../components/ActivityIndicator/ActivityIndicator";
import { Formik } from "formik";

const Electrical = () => {
  const navigation = useNavigation();
  const options = ["Service Entrance", "Point of\nInterconnection"];
  const panelButtons = ["Sub Panel B", "Sub Panel C", "Sub Panel D"];

  const companyData = useSelector((store: any) => store?.profile?.profile);
  const projectID = useSelector((store: any) => store?.project?.currentProject?.uuid);
  const company = companyData?.company;
  const companyID = company.uuid;

  const userFullName = `${companyData.user?.firstName || ""} ${companyData.user?.lastName || ""}`;
  const addressString = `${company?.name || ""} ${company?.address || ""} ${company?.city || ""} ${
    company?.state || ""
  }`;

  const InstallerId = useSelector(
    (store: any) => store?.project?.currentProject?.details?.installer_project_id
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [breakerQuantity, setQuantity] = useState<number | undefined>();
  const [serviceSelection, setServiceSelection] = useState("No");
  const [selectedOption, setSelection] = useState<string>("Service Entrance");
  const [selectedServiceEntrance, setSelctedServiceEntrance] = useState<string | undefined>(
    undefined
  );
  const [mainPanel, setMainPanel] = useState<any>();
  const [subPanels, setSubPanels] = useState<any>([]);
  const [isInitialRenderDone, setInitialRenderDone] = useState(false);
  const [interconnectionPoint, setInterconnectionPoint] = useState<any>();
  const [interconnectionData, setInterconnectionData] = useState<any>();

  const [images, setImages] = useState<any>({
    SEType: [],
    SEMainCircuit: [],
    PanelABusBar: [],
    PanelAMainCircuit: [],
    PanelAFeederLocation: [],
    PanelBBusBar: [],
    PanelBMainCircuit: [],
    PanelBFeederLocation: [],
    PanelBUpstreamBreaker: [],
    PanelCBusBar: [],
    PanelCMainCircuit: [],
    PanelCFeederLocation: [],
    PanelCUpstreamBreaker: [],
    PanelCUpstreamLocation: [],
    PanelDBusBar: [],
    PanelDMainCircuit: [],
    PanelDFeederLocation: [],
    PanelDUpstreamBreaker: [],
    PanelDUpstreamLocation: [],
  });

  useEffect(() => {
    async function getData() {
      try {
        const response = await getProjectElectricalData(projectID, companyID);
        const responseData = response?.data?.data || {};
        const {
          uuid,
          ses_type,
          circuit_breaker_quantity,
          main_panel,
          subpanels,
          interconnection_point,
          interconnection_data,
          images,
        } = responseData;

        if (Object.keys(images || {}).length) {
          setImages({ ...images });
        }

        if (ses_type) {
          setSelctedServiceEntrance(ses_type);
        }

        if (circuit_breaker_quantity) {
          setQuantity(circuit_breaker_quantity);
        }

        if (main_panel) {
          setMainPanel(main_panel);
          if (main_panel.is_existing_panel == false) {
            setServiceSelection("Yes");
          }
        }

        if (subpanels) {
          setSubPanels(subpanels);
        }

        if (interconnection_point) {
          setInterconnectionPoint(interconnection_point);
        }

        if (interconnection_data) {
          setInterconnectionData(interconnection_data);
        }

        setInitialRenderDone(true);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    }
    getData();
  }, []);

  useEffect(() => {
    debouncedSave();
  }, [
    selectedServiceEntrance,
    breakerQuantity,
    serviceSelection,
    mainPanel,
    subPanels,
    interconnectionPoint,
    interconnectionData,
  ]);

  useEffect(() => {
    if (subPanels.length > 1) {
      debouncedSave();
    }
  }, [subPanels]);

  async function saveElectricalData() {
    if (!isInitialRenderDone) return;

    mainPanel.is_existing_panel = serviceSelection == "NO";

    const payload = omitNullValues({
      sesType: selectedServiceEntrance,
      mainPanel: mainPanel,
      images: images,
      subPanels: subPanels?.length > 0 ? subPanels : null,
      circuitBreakerQuantity: breakerQuantity,
      interconnectionPoint,
      interconnectionData,
    });

    logger.warn(JSON.stringify(payload, null, 2));
    const response = await saveProjectElectricalData(projectID, companyID, payload);
  }

  const debouncedSave: any = debounce(saveElectricalData, 1000);

  const handleSetImages = (type: string, selectedImages: any) => {
    setImages((prevImages: any) => ({ ...prevImages, [type]: selectedImages }));
  };

  const handleServiceSelection = (value: string) => {
    setServiceSelection(value);
  };

  const handleServiceEntranceChange = (value: string) => {
    setSelctedServiceEntrance(value);
  };

  const onMainPanelDataChange = (data: any) => {
    setMainPanel({ name: "Main Panel A", ...data });
  };

  const onSubPanelDataChange = (index: number, name: string, data: any) => {
    subPanels[index] = { name, ...subPanels[index], ...data };
    setSubPanels([...subPanels]);
  };

  function renderSubpanelButtonBlock(index: number) {
    if (index > panelButtons.length - 1) {
      return <></>;
    }

    const subpanel = subPanels[index];

    return (
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
        <Button
          children={`+ ${panelButtons[index]}`}
          color1={subpanel ? "#FD7332" : "#0C1F3F"}
          color2={subpanel ? "#EF3826" : "#2E4161"}
          onPress={() => {
            if (!subpanel) {
              setSubPanels([...subPanels, { name: panelButtons[index] }]);
            } else {
              setSubPanels([...subPanels.slice(0, index)]);
            }
          }}
          style={styles.subButton}
          labelStyle={[styles.optionText, { fontWeight: !!subPanels[0] ? "700" : "400" }]}
        />

        {subpanel && (
          <Button
            children={"+ Load Calcs"}
            color1={subpanel?.can_calculate_load ? "#FD7332" : "#0C1F3F"}
            color2={subpanel?.can_calculate_load ? "#EF3826" : "#2E4161"}
            onPress={() => {
              onSubPanelDataChange(index, subpanel?.name, {
                can_calculate_load: !subpanel?.can_calculate_load,
              });
            }}
            style={styles.calcsBtn}
            labelStyle={[styles.optionText, { fontWeight: subpanel?.isLoadCalc ? "700" : "400" }]}
          />
        )}
      </View>
    );
  }

  function renderPanelForms() {
    if (serviceSelection === "Help Me Decide") {
      return <View></View>;
    }

    /* If Help Me Decide is Selected the following code won't render */
    return (
      <View>
        <PanelComponent
          images={images}
          panelName={"Main Panel A"}
          setImages={handleSetImages}
          isServiceNew={serviceSelection}
          data={mainPanel}
          onValueChange={(_, value) => {
            onMainPanelDataChange({ ...mainPanel, ...value });
          }}
        />
        {renderSubpanelButtonBlock(0)}

        {subPanels.map((subpanel: any, index: number) => {
          return (
            <View key={index}>
              <>
                <PanelComponent
                  images={images}
                  data={subpanel}
                  panelName={subpanel.name}
                  setImages={handleSetImages}
                  isServiceNew={serviceSelection}
                  onValueChange={(_, __) => onSubPanelDataChange(index, _, __)}
                />
                {renderSubpanelButtonBlock(index + 1)}
              </>
            </View>
          );
        })}
      </View>
    );
  }

  function renderPageContent() {
    if (isLoading) {
      return (
        <View
          style={{
            flex: 1,
            paddingHorizontal: 30,
            paddingBottom: 50,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size={50} />
        </View>
      );
    }
    return (
      <View style={{ paddingHorizontal: 30, paddingBottom: 50 }}>
        <View>
          <Text children={userFullName} style={styles.username} />
          <Text style={styles.Address} children={addressString} />
          <Text style={styles.installer} children={InstallerId} />
        </View>

        <View style={styles.optionsContainer}>
          {options.map((value, index) => (
            <Button
              children={value}
              key={index}
              color1={selectedOption === value ? "#FD7332" : "#0C1F3F"}
              color2={selectedOption === value ? "#EF3826" : "#2E4161"}
              onPress={() => setSelection(value)}
              style={styles.optionItem}
              labelStyle={[
                styles.optionText,
                { fontWeight: selectedOption === value ? "700" : "400" },
              ]}
            />
          ))}
        </View>

        {selectedOption === "Service Entrance" ? (
          <View>
            <ServiceEntranceComponent
              images={images}
              serviceSelection={serviceSelection}
              selectedServiceEntrance={selectedServiceEntrance}
              breakerQuantity={breakerQuantity}
              handleSetImages={handleSetImages}
              setQuantity={setQuantity}
              handleServiceSelection={handleServiceSelection}
              handleServiceEntranceChange={handleServiceEntranceChange}
            />
            {renderPanelForms()}
          </View>
        ) : (
          <InterconnectionComponent
            interconnectionData={interconnectionData}
            interconnectionPoint={interconnectionPoint}
            setInterconnectionData={setInterconnectionData}
            setInterconnectionPoint={setInterconnectionPoint}
          />
        )}
      </View>
    );
  }

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
            title="Electrical"
            back={false}
            applogo={true}
            onIconPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          />

          {renderPageContent()}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Electrical;
