import React, { useState } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

const DatePickerComponent = ({ onChangeDate }:any) => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const onChange = (event:any, selectedDate:any) => {
    if (selectedDate) {
      const currentDate = selectedDate || date;
      setShow(false);
      setDate(currentDate);

      // Format date and pass it to the parent component
      const formattedDate = dayjs(currentDate).format('DD-MM-YYYY');
      onChangeDate(formattedDate);
    } else {
      setShow(false); // close the picker if user cancels
    }
  };

  const showDatepicker = () => {
    setShow(true);
  };

  return (
    <>
      <TouchableOpacity onPress={showDatepicker}>
        <Image source={require('../../assets/Images/icons/calendar.png')} />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={'date'} 
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
    </>
  );
};

export default DatePickerComponent;
