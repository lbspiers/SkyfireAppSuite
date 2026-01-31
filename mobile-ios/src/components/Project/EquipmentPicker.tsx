import { Text, View } from "react-native";
import { useEffect, useState } from "react";
import { equipmentManufacturers } from "../../api/project.service";
import { GetModelNumber } from "../../api/inventry.service";
import DropdownComponent from "../Dropdown";
import logger from "../../utils/logger";
import { Colors } from "react-native/Libraries/NewAppScreen";

type EquipimentPickerProps = {
  type: string;
  labelStyle?: any;
  manufacturer?: string;
  uuid?: string;
  handleChange: (value: any) => void;
};

function EquipmentPicker({
  type,
  labelStyle,
  handleChange,
  manufacturer,
  uuid: initialUuid,
}: EquipimentPickerProps) {
  const [models, setModels] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | undefined>(
    manufacturer
  );
  const [localUuid, setLocalUuid] = useState<string | undefined>(initialUuid);

  useEffect(() => {
    fetchEquipmentManufacturers();
  }, [type]);

  useEffect(() => {
    if (manufacturer !== selectedManufacturer) {
      setSelectedManufacturer(manufacturer);
    }
  }, [manufacturer]);

  useEffect(() => {
    if (selectedManufacturer) {
      fetchManufacturerModels();
    } else {
      setModels([]);
    }
  }, [selectedManufacturer, type]);

  useEffect(() => {
    if (initialUuid !== localUuid) {
      setLocalUuid(initialUuid);
    }
  }, [initialUuid]);

  async function fetchEquipmentManufacturers() {
    try {
      const response: any = await equipmentManufacturers(type);
      let { data } = response?.data || {};
      data = data.map((each: any) => ({ label: each, value: each })).filter((_: any) => _.value);

      setManufacturers(data);
    } catch (error: any) {
      console.log(error?.message);
    }
  }

  async function fetchManufacturerModels() {
    try {
      const response: any = await GetModelNumber(type, selectedManufacturer);
      const { data } = response?.data || {};
      setModels(data);
    } catch (error: any) {
      console.log(error?.message);
    }
  }

  const handleManufacturerChange = (value: any) => {
    setSelectedManufacturer(value);
    setLocalUuid(undefined);
    setModels([]);
  };

  return (
    <View>
      <Text style={[labelStyle, { paddingTop: 10, color: "white" }]}>Make*</Text>
      <DropdownComponent
        label={"Select Make"}
        labelField={"label"}
        valueField={"value"}
        data={manufacturers}
        key={selectedManufacturer}
        value={selectedManufacturer}
        onChangeValue={handleManufacturerChange}
      />

      <Text style={[labelStyle, { paddingTop: 10, color: "white" }]}>Model*</Text>
      <DropdownComponent
        label={"Select Model"}
        labelField={"model"}
        valueField={"uuid"}
        data={models}
        key={localUuid}
        value={localUuid}
        onChangeValue={(value: any) => {
          setLocalUuid(value);
          handleChange(value);
        }}
      />
    </View>
  );
}

export default EquipmentPicker;
