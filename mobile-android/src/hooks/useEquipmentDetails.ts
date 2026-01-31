import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";

import { EquipmentLists, equipmentManufacturers } from "../api/project.service";
import { GetModelNumber } from "../api/inventry.service";
import {
  setUpdateProjectDetails,
  getEquipmentSetByType,
} from "../store/slices/projectSlice"; // ✅

import logger from "../utils/logger";

export const useEquipmentDetails = (title: string) => {
  const dispatch = useDispatch();

  const companyID = useSelector((store: any) => store?.profile?.profile);
  const projectID = useSelector(
    (store: any) => store?.project?.currentProject?.uuid
  );
  const project = useSelector((store: any) => store?.project?.currentProject);

  const updateProjectDetails = useSelector((state: any) =>
    getEquipmentSetByType(state, title)
  );

  const [images, setImages] = useState({
    SolarPanel: [],
    MicroInverter: [],
    CombinerPanel: [],
  });

  const [formValues, setFormValues] = useState({
    selectedSolarPanel: "",
    selectedSystemType: "",
    selectedStringType: "",
    selectedSolarPanelModel: "",
    selectedSystemTypeModel: "",
    selectedStringTypeModel: "",
    quantity: 0,
    isNewSolarPanel: true,
    isNewSystemType: true,
    isNewStringType: true,
  });

  const [solarPanelList, setSolarPanelList] = useState([]);
  const [systemTypeList, setSystemTypeList] = useState([]);
  const [stringTypeList, setStringTypeList] = useState([]);
  const [solarModalList, setSolarModalList] = useState([]);
  const [systemModalList, setSystemModalList] = useState([]);
  const [stringModalList, setStringModalList] = useState([]);

  const fetchModelNumber = async (
    type: string,
    manufacturer: string,
    setData: (data: any[]) => void
  ) => {
    try {
      const response = await GetModelNumber(type, manufacturer);
      if (response?.status === 200) {
        setData(response.data?.data || []);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("fetchModelNumber error:", error);
      setData([]);
    }
  };

  const fetchEquipmentLists = async () => {
    try {
      const response = await EquipmentLists(
        projectID,
        companyID?.company?.uuid
      );
      if (response?.status === 200) {
        dispatch(setUpdateProjectDetails(response?.data?.data));
      } else {
        console.log("Failed to fetch Equipment Lists", response?.data);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("Unknown error", error);
      }
    }
  };

  const equipmentManufacturersFun = async (type: string) => {
    try {
      const response = await equipmentManufacturers(type);
      if (response?.status === 200) {
        const list = response?.data?.data;
        if (type === "Solar Panel") setSolarPanelList(list);
        else if (["Inverter", "MicroInverter"].includes(type))
          setSystemTypeList(list);
        else setStringTypeList(list);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("Unknown error", error);
      }
    }
  };

  useEffect(() => {
    if (!updateProjectDetails) return;

    const {
      solar_panel,
      system_type,
      associated_panel,
      solar_panel_quantity,
      is_existing_solar,
      is_existing_system,
      is_existing_associated,
      solar_panel_images,
      system_type_images,
      associated_panel_images,
    } = updateProjectDetails;

    setFormValues({
      selectedSolarPanel: solar_panel?.manufacturer ?? "",
      selectedSystemType: system_type?.manufacturer ?? "",
      selectedStringType: associated_panel?.manufacturer ?? "",
      selectedSolarPanelModel: solar_panel?.uuid ?? "",
      selectedSystemTypeModel: system_type?.uuid ?? "",
      selectedStringTypeModel: associated_panel?.uuid ?? "",
      quantity: solar_panel_quantity ?? 0,
      isNewSolarPanel: is_existing_solar ?? true,
      isNewSystemType: is_existing_system ?? true,
      isNewStringType: is_existing_associated ?? true,
    });

    setImages({
      SolarPanel: solar_panel_images || [],
      MicroInverter: system_type_images || [],
      CombinerPanel: associated_panel_images || [],
    });

    fetchEquipmentLists();
  }, [updateProjectDetails]);

  useEffect(() => {
    equipmentManufacturersFun("Solar Panel");
    equipmentManufacturersFun("Inverter");
    equipmentManufacturersFun("MicroInverter");
    equipmentManufacturersFun("Inverter Optimizer");
    equipmentManufacturersFun("MicroInverter Combiner Panel");
  }, []);

  return {
    formValues,
    setFormValues,
    solarPanelList,
    systemTypeList,
    stringTypeList,
    solarModalList,
    systemModalList,
    stringModalList,
    fetchModelNumber,
    images,
    setImages,

    // ⬇️ TEMP until DB wired up:
    combinerPanelList: [],
    combinerModelList: [],
  };
};
