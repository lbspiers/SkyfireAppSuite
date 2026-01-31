import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DatePicker from 'react-native-date-picker';
import { adminAPI, CreateExceptionRequest, ExceptionType } from '../../services/adminAPI';
import { useResponsive } from '../../utils/responsive';
import { DemoException } from './DemoExceptions';

interface ExceptionFormModalProps {
  visible: boolean;
  exception: DemoException | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const ExceptionFormModal: React.FC<ExceptionFormModalProps> = ({
  visible,
  exception,
  onClose,
  onSaveSuccess,
}) => {
  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  const [exceptionType, setExceptionType] = useState<ExceptionType>('specific_date');
  const [specificDate, setSpecificDate] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // For multi-day selection
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [hasTimeRange, setHasTimeRange] = useState(false);
  const [reason, setReason] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Date picker states
  const [showSpecificDatePicker, setShowSpecificDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Load exception data when editing
  useEffect(() => {
    if (exception) {
      setExceptionType(exception.exception_type);
      setReason(exception.reason);
      setIsActive(exception.is_active);

      if (exception.specific_date) {
        setSpecificDate(new Date(exception.specific_date));
      }
      if (exception.start_date) {
        setStartDate(new Date(exception.start_date));
      }
      if (exception.end_date) {
        setEndDate(new Date(exception.end_date));
      }
      if (exception.day_of_week !== undefined) {
        setDayOfWeek(exception.day_of_week);
      }
      if (exception.start_time) {
        const [hours, minutes] = exception.start_time.split(':');
        const time = new Date();
        time.setHours(parseInt(hours), parseInt(minutes), 0);
        setStartTime(time);
        setHasTimeRange(true);
      }
      if (exception.end_time) {
        const [hours, minutes] = exception.end_time.split(':');
        const time = new Date();
        time.setHours(parseInt(hours), parseInt(minutes), 0);
        setEndTime(time);
      }
    } else {
      resetForm();
    }
  }, [exception, visible]);

  const resetForm = () => {
    setExceptionType('specific_date');
    setSpecificDate(new Date());
    setStartDate(new Date());
    setEndDate(new Date());
    setDayOfWeek(1);
    setSelectedDays([1]);
    const defaultStartTime = new Date();
    defaultStartTime.setHours(9, 0, 0);
    const defaultEndTime = new Date();
    defaultEndTime.setHours(17, 0, 0);
    setStartTime(defaultStartTime);
    setEndTime(defaultEndTime);
    setHasTimeRange(false);
    setReason('');
    setIsActive(true);
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        // Remove day if already selected (but keep at least one)
        return prev.length > 1 ? prev.filter(d => d !== day) : prev;
      } else {
        // Add day
        return [...prev, day].sort();
      }
    });
  };

  const selectWeekdays = () => {
    setSelectedDays([1, 2, 3, 4, 5]); // Mon-Fri
  };

  const selectWeekend = () => {
    setSelectedDays([0, 6]); // Sun, Sat
  };

  const selectAllDays = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}:00`;
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDisplayTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const validateForm = (): boolean => {
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please enter a reason for this exception');
      return false;
    }

    if (exceptionType === 'date_range') {
      if (endDate < startDate) {
        Alert.alert('Validation Error', 'End date must be after start date');
        return false;
      }
    }

    if ((exceptionType === 'specific_date' || exceptionType === 'recurring_weekly' || exceptionType === 'recurring_daily') && hasTimeRange) {
      if (endTime <= startTime) {
        Alert.alert('Validation Error', 'End time must be after start time');
        return false;
      }
    }

    if (exceptionType === 'recurring_weekly' && selectedDays.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one day');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      // For multi-day weekly recurring, create multiple exceptions
      if (exceptionType === 'recurring_weekly' && selectedDays.length > 1 && !exception) {
        let successCount = 0;
        let failCount = 0;

        for (const day of selectedDays) {
          const requestData: CreateExceptionRequest = {
            exceptionType,
            reason: reason.trim(),
            isActive,
            dayOfWeek: day,
          };

          if (hasTimeRange) {
            requestData.startTime = formatTime(startTime);
            requestData.endTime = formatTime(endTime);
          }

          try {
            const result = await adminAPI.createDemoException(requestData);
            if (result.status === 'SUCCESS') {
              successCount++;
            } else {
              failCount++;
            }
          } catch {
            failCount++;
          }
        }

        if (successCount > 0) {
          Alert.alert(
            'Success',
            `Created ${successCount} exception${successCount > 1 ? 's' : ''} for selected days` +
            (failCount > 0 ? `\n${failCount} failed to create` : '')
          );
          onSaveSuccess();
        } else {
          Alert.alert('Error', 'Failed to create exceptions');
        }
      } else {
        // Single exception or update
        const requestData: CreateExceptionRequest = {
          exceptionType,
          reason: reason.trim(),
          isActive,
        };

        // Add type-specific fields
        switch (exceptionType) {
          case 'specific_date':
            requestData.specificDate = formatDate(specificDate);
            // Add time range for specific date
            if (hasTimeRange) {
              requestData.startTime = formatTime(startTime);
              requestData.endTime = formatTime(endTime);
            }
            break;

          case 'date_range':
            requestData.startDate = formatDate(startDate);
            requestData.endDate = formatDate(endDate);
            break;

          case 'recurring_weekly':
            requestData.dayOfWeek = selectedDays[0]; // Use first selected day for single/edit
            if (hasTimeRange) {
              requestData.startTime = formatTime(startTime);
              requestData.endTime = formatTime(endTime);
            }
            break;

          case 'recurring_daily':
            requestData.startTime = formatTime(startTime);
            requestData.endTime = formatTime(endTime);
            break;
        }

        let result;
        if (exception) {
          result = await adminAPI.updateDemoException(exception.id, requestData);
        } else {
          result = await adminAPI.createDemoException(requestData);
        }

        if (result.status === 'SUCCESS') {
          Alert.alert(
            'Success',
            exception ? 'Exception updated successfully' : 'Exception created successfully'
          );
          onSaveSuccess();
        } else {
          Alert.alert('Error', result.message || 'Failed to save exception');
        }
      }
    } catch (error: any) {
      console.error('Error saving exception:', error);
      Alert.alert('Error', error.message || 'Failed to save exception. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const TypeButton = ({ type, label, icon }: { type: ExceptionType; label: string; icon: string }) => (
    <TouchableOpacity
      style={[styles.typeButton, exceptionType === type && styles.typeButtonActive]}
      onPress={() => setExceptionType(type)}
    >
      <Text style={styles.typeIcon}>{icon}</Text>
      <Text style={[styles.typeLabel, exceptionType === type && styles.typeLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const DayButton = ({ day, label }: { day: number; label: string }) => {
    const isSelected = selectedDays.includes(day);
    return (
      <TouchableOpacity
        style={[styles.dayButton, isSelected && styles.dayButtonActive]}
        onPress={() => toggleDay(day)}
      >
        <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#2E4161', '#0C1F3F']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {exception ? 'Edit Exception' : 'Block Time Slots'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Exception Type Selection */}
              <Text style={styles.sectionLabel}>Exception Type</Text>
              <View style={styles.typeGrid}>
                <TypeButton type="specific_date" label="Single Date" icon="📅" />
                <TypeButton type="date_range" label="Date Range" icon="📆" />
                <TypeButton type="recurring_weekly" label="Weekly" icon="🔄" />
                <TypeButton type="recurring_daily" label="Daily" icon="⏰" />
              </View>

              {/* Type-Specific Fields */}
              {exceptionType === 'specific_date' && (
                <>
                  <Text style={styles.sectionLabel}>Select Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowSpecificDatePicker(true)}
                  >
                    <Text style={styles.datePickerText}>{formatDisplayDate(specificDate)}</Text>
                  </TouchableOpacity>
                  <DatePicker
                    modal
                    mode="date"
                    open={showSpecificDatePicker}
                    date={specificDate}
                    minimumDate={new Date()}
                    onConfirm={(date) => {
                      setSpecificDate(date);
                      setShowSpecificDatePicker(false);
                    }}
                    onCancel={() => setShowSpecificDatePicker(false)}
                  />

                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Specific Time Range (e.g., 9 AM - 12 PM)</Text>
                    <Switch
                      value={hasTimeRange}
                      onValueChange={setHasTimeRange}
                      trackColor={{ false: '#767577', true: '#FD7332' }}
                      thumbColor={hasTimeRange ? '#FFF' : '#f4f3f4'}
                    />
                  </View>

                  {hasTimeRange && (
                    <>
                      <Text style={styles.sectionLabel}>Start Time</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowStartTimePicker(true)}
                      >
                        <Text style={styles.datePickerText}>{formatDisplayTime(startTime)}</Text>
                      </TouchableOpacity>
                      <DatePicker
                        modal
                        mode="time"
                        open={showStartTimePicker}
                        date={startTime}
                        onConfirm={(time) => {
                          setStartTime(time);
                          setShowStartTimePicker(false);
                        }}
                        onCancel={() => setShowStartTimePicker(false)}
                      />

                      <Text style={styles.sectionLabel}>End Time</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowEndTimePicker(true)}
                      >
                        <Text style={styles.datePickerText}>{formatDisplayTime(endTime)}</Text>
                      </TouchableOpacity>
                      <DatePicker
                        modal
                        mode="time"
                        open={showEndTimePicker}
                        date={endTime}
                        onConfirm={(time) => {
                          setEndTime(time);
                          setShowEndTimePicker(false);
                        }}
                        onCancel={() => setShowEndTimePicker(false)}
                      />
                    </>
                  )}
                </>
              )}

              {exceptionType === 'date_range' && (
                <>
                  <Text style={styles.sectionLabel}>Start Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={styles.datePickerText}>{formatDisplayDate(startDate)}</Text>
                  </TouchableOpacity>
                  <DatePicker
                    modal
                    mode="date"
                    open={showStartDatePicker}
                    date={startDate}
                    minimumDate={new Date()}
                    onConfirm={(date) => {
                      setStartDate(date);
                      if (date > endDate) {
                        setEndDate(date);
                      }
                      setShowStartDatePicker(false);
                    }}
                    onCancel={() => setShowStartDatePicker(false)}
                  />

                  <Text style={styles.sectionLabel}>End Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={styles.datePickerText}>{formatDisplayDate(endDate)}</Text>
                  </TouchableOpacity>
                  <DatePicker
                    modal
                    mode="date"
                    open={showEndDatePicker}
                    date={endDate}
                    minimumDate={startDate}
                    onConfirm={(date) => {
                      setEndDate(date);
                      setShowEndDatePicker(false);
                    }}
                    onCancel={() => setShowEndDatePicker(false)}
                  />
                </>
              )}

              {exceptionType === 'recurring_weekly' && (
                <>
                  <Text style={styles.sectionLabel}>Select Days (tap to select/deselect)</Text>
                  <View style={styles.dayGrid}>
                    <DayButton day={0} label="Sun" />
                    <DayButton day={1} label="Mon" />
                    <DayButton day={2} label="Tue" />
                    <DayButton day={3} label="Wed" />
                    <DayButton day={4} label="Thu" />
                    <DayButton day={5} label="Fri" />
                    <DayButton day={6} label="Sat" />
                  </View>

                  {/* Quick Selection Buttons */}
                  <View style={styles.quickSelectRow}>
                    <TouchableOpacity style={styles.quickSelectButton} onPress={selectWeekdays}>
                      <Text style={styles.quickSelectText}>Mon-Fri</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickSelectButton} onPress={selectWeekend}>
                      <Text style={styles.quickSelectText}>Weekend</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickSelectButton} onPress={selectAllDays}>
                      <Text style={styles.quickSelectText}>All Days</Text>
                    </TouchableOpacity>
                  </View>

                  {selectedDays.length > 1 && (
                    <Text style={styles.selectedDaysInfo}>
                      {selectedDays.length} days selected - Will create {selectedDays.length} exceptions
                    </Text>
                  )}

                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Specific Time Range</Text>
                    <Switch
                      value={hasTimeRange}
                      onValueChange={setHasTimeRange}
                      trackColor={{ false: '#767577', true: '#FD7332' }}
                      thumbColor={hasTimeRange ? '#FFF' : '#f4f3f4'}
                    />
                  </View>

                  {hasTimeRange && (
                    <>
                      <Text style={styles.sectionLabel}>Start Time</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowStartTimePicker(true)}
                      >
                        <Text style={styles.datePickerText}>{formatDisplayTime(startTime)}</Text>
                      </TouchableOpacity>
                      <DatePicker
                        modal
                        mode="time"
                        open={showStartTimePicker}
                        date={startTime}
                        onConfirm={(time) => {
                          setStartTime(time);
                          setShowStartTimePicker(false);
                        }}
                        onCancel={() => setShowStartTimePicker(false)}
                      />

                      <Text style={styles.sectionLabel}>End Time</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowEndTimePicker(true)}
                      >
                        <Text style={styles.datePickerText}>{formatDisplayTime(endTime)}</Text>
                      </TouchableOpacity>
                      <DatePicker
                        modal
                        mode="time"
                        open={showEndTimePicker}
                        date={endTime}
                        onConfirm={(time) => {
                          setEndTime(time);
                          setShowEndTimePicker(false);
                        }}
                        onCancel={() => setShowEndTimePicker(false)}
                      />
                    </>
                  )}
                </>
              )}

              {exceptionType === 'recurring_daily' && (
                <>
                  <Text style={styles.sectionLabel}>Start Time</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Text style={styles.datePickerText}>{formatDisplayTime(startTime)}</Text>
                  </TouchableOpacity>
                  <DatePicker
                    modal
                    mode="time"
                    open={showStartTimePicker}
                    date={startTime}
                    onConfirm={(time) => {
                      setStartTime(time);
                      setShowStartTimePicker(false);
                    }}
                    onCancel={() => setShowStartTimePicker(false)}
                  />

                  <Text style={styles.sectionLabel}>End Time</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text style={styles.datePickerText}>{formatDisplayTime(endTime)}</Text>
                  </TouchableOpacity>
                  <DatePicker
                    modal
                    mode="time"
                    open={showEndTimePicker}
                    date={endTime}
                    onConfirm={(time) => {
                      setEndTime(time);
                      setShowEndTimePicker(false);
                    }}
                    onCancel={() => setShowEndTimePicker(false)}
                  />
                </>
              )}

              {/* Reason */}
              <Text style={styles.sectionLabel}>Reason *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Company Holiday, Lunch Break, Team Meeting"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
              />

              {/* Active Toggle */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Active</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#767577', true: '#4CAF50' }}
                  thumbColor={isActive ? '#FFF' : '#f4f3f4'}
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <LinearGradient
                  colors={['#FD7332', '#EF3826']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButtonGradient}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {exception ? 'Update' : 'Create'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = ({
  moderateScale,
  verticalScale,
  font,
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
  font: (n: number) => number;
}) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      maxHeight: '90%',
      borderTopLeftRadius: moderateScale(20),
      borderTopRightRadius: moderateScale(20),
      overflow: 'hidden',
    },
    modalGradient: {
      paddingBottom: verticalScale(20),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: moderateScale(20),
      paddingVertical: verticalScale(20),
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(253, 115, 50, 0.3)',
    },
    headerTitle: {
      fontSize: font(20),
      fontWeight: '700',
      color: '#FFF',
    },
    closeButton: {
      padding: moderateScale(5),
    },
    closeButtonText: {
      fontSize: font(24),
      color: '#FFF',
      opacity: 0.8,
    },
    scrollView: {
      maxHeight: verticalScale(500),
    },
    scrollContent: {
      paddingHorizontal: moderateScale(20),
      paddingVertical: verticalScale(20),
    },
    sectionLabel: {
      fontSize: font(14),
      fontWeight: '600',
      color: '#FD7332',
      marginTop: verticalScale(15),
      marginBottom: verticalScale(8),
    },
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: moderateScale(10),
    },
    typeButton: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(10),
      paddingVertical: verticalScale(12),
      paddingHorizontal: moderateScale(12),
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    typeButtonActive: {
      backgroundColor: 'rgba(253, 115, 50, 0.2)',
      borderColor: '#FD7332',
    },
    typeIcon: {
      fontSize: font(24),
      marginBottom: verticalScale(4),
    },
    typeLabel: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.7,
      fontWeight: '500',
    },
    typeLabelActive: {
      opacity: 1,
      fontWeight: '700',
    },
    datePickerButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(8),
      paddingVertical: verticalScale(12),
      paddingHorizontal: moderateScale(15),
      borderWidth: 1,
      borderColor: 'rgba(253, 115, 50, 0.3)',
    },
    datePickerText: {
      fontSize: font(14),
      color: '#FFF',
      fontWeight: '500',
    },
    dayGrid: {
      flexDirection: 'row',
      gap: moderateScale(6),
    },
    dayButton: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(8),
      paddingVertical: verticalScale(10),
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    dayButtonActive: {
      backgroundColor: 'rgba(253, 115, 50, 0.3)',
      borderColor: '#FD7332',
    },
    dayLabel: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.7,
      fontWeight: '500',
    },
    dayLabelActive: {
      opacity: 1,
      fontWeight: '700',
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: verticalScale(15),
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      padding: moderateScale(12),
      borderRadius: moderateScale(8),
    },
    switchLabel: {
      fontSize: font(14),
      color: '#FFF',
      fontWeight: '500',
    },
    textInput: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(8),
      paddingHorizontal: moderateScale(15),
      paddingVertical: verticalScale(12),
      fontSize: font(14),
      color: '#FFF',
      borderWidth: 1,
      borderColor: 'rgba(253, 115, 50, 0.3)',
      textAlignVertical: 'top',
      minHeight: verticalScale(80),
    },
    actionButtons: {
      flexDirection: 'row',
      paddingHorizontal: moderateScale(20),
      paddingTop: verticalScale(20),
      gap: moderateScale(12),
      borderTopWidth: 1,
      borderTopColor: 'rgba(253, 115, 50, 0.3)',
    },
    cancelButton: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(8),
      paddingVertical: verticalScale(14),
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    cancelButtonText: {
      fontSize: font(16),
      fontWeight: '600',
      color: '#FFF',
    },
    saveButton: {
      flex: 1,
    },
    saveButtonGradient: {
      borderRadius: moderateScale(8),
      paddingVertical: verticalScale(14),
      alignItems: 'center',
    },
    saveButtonText: {
      fontSize: font(16),
      fontWeight: '700',
      color: '#FFF',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    quickSelectRow: {
      flexDirection: 'row',
      gap: moderateScale(8),
      marginTop: verticalScale(10),
    },
    quickSelectButton: {
      flex: 1,
      backgroundColor: 'rgba(253, 115, 50, 0.2)',
      borderRadius: moderateScale(6),
      paddingVertical: verticalScale(8),
      paddingHorizontal: moderateScale(8),
      borderWidth: 1,
      borderColor: '#FD7332',
      alignItems: 'center',
    },
    quickSelectText: {
      fontSize: font(11),
      color: '#FFF',
      fontWeight: '600',
    },
    selectedDaysInfo: {
      fontSize: font(12),
      color: '#4CAF50',
      fontWeight: '500',
      marginTop: verticalScale(8),
      textAlign: 'center',
    },
  });

export default ExceptionFormModal;
