import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { moderateScale } from '../../../../../utils/responsive';
import BackupBOS1Section from '../../sections/ESS_Subsections/BackupBOS1Section';
import BackupBOS2Section from '../../sections/ESS_Subsections/BackupBOS2Section';
import BackupBOS3Section from '../../sections/ESS_Subsections/BackupBOS3Section';
import { saveSystemDetailsPartialExact } from '../../services/equipmentService';
import { BOSChainItem, BOSItemData, ChainBOSProps } from './types';
import { getBOSBlockName } from '../../../../../constants/bosBlockNames';

interface BackupChainBOSProps extends ChainBOSProps {
  bos1Section: BOSItemData;
  bos2Section: BOSItemData;
  bos3Section: BOSItemData;
  showBOS1: boolean;
  showBOS2: boolean;
  showBOS3: boolean;
  setBOS1Section: React.Dispatch<React.SetStateAction<BOSItemData>>;
  setBOS2Section: React.Dispatch<React.SetStateAction<BOSItemData>>;
  setBOS3Section: React.Dispatch<React.SetStateAction<BOSItemData>>;
  setShowBOS1: React.Dispatch<React.SetStateAction<boolean>>;
  setShowBOS2: React.Dispatch<React.SetStateAction<boolean>>;
  setShowBOS3: React.Dispatch<React.SetStateAction<boolean>>;
  onAddNextBOS: (position: number) => void;
}

export const BackupChainBOS: React.FC<BackupChainBOSProps> = ({
  systemPrefix,
  systemNumber,
  projectID,
  utilityAbbrev,
  maxContinuousOutputAmps,
  loadingMaxOutput,
  bos1Section,
  bos2Section,
  bos3Section,
  showBOS1,
  showBOS2,
  showBOS3,
  setBOS1Section,
  setBOS2Section,
  setBOS3Section,
  setShowBOS1,
  setShowBOS2,
  setShowBOS3,
  onAddNextBOS,
}) => {
  const prefix = systemPrefix.replace('_', '');
  const fullTrigger = `${prefix}_backup`;

  // Build draggable BOS list for backup chain
  const bosItemsList = useMemo<BOSChainItem[]>(() => {
    const items: BOSChainItem[] = [];

    console.log(`[BackupChainBOS] Building list:`, {
      systemPrefix,
      prefix,
      fullTrigger,
      showBOS1,
      showBOS2,
      showBOS3,
      bos1Trigger: bos1Section.trigger,
      bos2Trigger: bos2Section.trigger,
      bos3Trigger: bos3Section.trigger,
      bos1Equipment: bos1Section.equipmentType,
      bos2Equipment: bos2Section.equipmentType,
      bos3Equipment: bos3Section.equipmentType,
    });

    if (showBOS1 && bos1Section.trigger === fullTrigger) {
      console.log(`[BackupChainBOS] ✓ BOS1 matched - adding to list`);
      items.push({
        key: 'backup-bos1',
        position: 1,
        data: bos1Section,
        setter: setBOS1Section,
        showState: showBOS1,
        label: 'Backup BOS 1',
      });
    } else {
      console.log(`[BackupChainBOS] ✗ BOS1 not matched - showBOS1=${showBOS1}, trigger match=${bos1Section.trigger === fullTrigger}`);
    }

    if (showBOS2 && bos2Section.trigger === fullTrigger) {
      console.log(`[BackupChainBOS] ✓ BOS2 matched - adding to list`);
      items.push({
        key: 'backup-bos2',
        position: 2,
        data: bos2Section,
        setter: setBOS2Section,
        showState: showBOS2,
        label: 'Backup BOS 2',
      });
    } else {
      console.log(`[BackupChainBOS] ✗ BOS2 not matched - showBOS2=${showBOS2}, trigger match=${bos2Section.trigger === fullTrigger}`);
    }

    if (showBOS3 && bos3Section.trigger === fullTrigger) {
      console.log(`[BackupChainBOS] ✓ BOS3 matched - adding to list`);
      items.push({
        key: 'backup-bos3',
        position: 3,
        data: bos3Section,
        setter: setBOS3Section,
        showState: showBOS3,
        label: 'Backup BOS 3',
      });
    } else {
      console.log(`[BackupChainBOS] ✗ BOS3 not matched - showBOS3=${showBOS3}, trigger match=${bos3Section.trigger === fullTrigger}`);
    }

    console.log(`[BackupChainBOS] Built ${items.length} items`);
    return items;
  }, [showBOS1, showBOS2, showBOS3, bos1Section, bos2Section, bos3Section, fullTrigger]);

  // Handle reordering
  const handleBOSReorder = useCallback(
    async (data: BOSChainItem[]) => {
      if (!projectID) return;

      console.log('[Drag-Drop] Reordering backup chain BOS equipment');

      try {
        const updates: any = {};

        // Map dragged items to their new positions
        data.forEach((item, index) => {
          const newPosition = index + 1;
          const blockName = getBOSBlockName(item.data.trigger, item.data.equipmentType);
          updates[`bos_${prefix}_backup_type${newPosition}_equipment_type`] = item.data.equipmentType;
          updates[`bos_${prefix}_backup_type${newPosition}_make`] = item.data.make;
          updates[`bos_${prefix}_backup_type${newPosition}_model`] = item.data.model;
          updates[`bos_${prefix}_backup_type${newPosition}_amp_rating`] = item.data.ampRating;
          updates[`bos_${prefix}_backup_type${newPosition}_is_new`] = item.data.isNew;
          updates[`bos_${prefix}_backup_type${newPosition}_trigger`] = item.data.trigger;
          updates[`bos_${prefix}_backup_type${newPosition}_block_name`] = blockName;
        });

        // Clear any positions beyond the dragged items
        for (let pos = data.length + 1; pos <= 3; pos++) {
          updates[`bos_${prefix}_backup_type${pos}_equipment_type`] = null;
          updates[`bos_${prefix}_backup_type${pos}_make`] = null;
          updates[`bos_${prefix}_backup_type${pos}_model`] = null;
          updates[`bos_${prefix}_backup_type${pos}_amp_rating`] = null;
          updates[`bos_${prefix}_backup_type${pos}_is_new`] = null;
          updates[`bos_${prefix}_backup_type${pos}_trigger`] = null;
          updates[`bos_${prefix}_backup_type${pos}_block_name`] = null;
        }

        // Save to database
        await saveSystemDetailsPartialExact(projectID, updates);

        // Update local state
        const clearState = {
          isNew: true,
          equipmentType: '',
          ampRating: '',
          make: '',
          model: '',
          trigger: null,
        };

        setBOS1Section(data[0] ? data[0].data : clearState);
        setBOS2Section(data[1] ? data[1].data : clearState);
        setBOS3Section(data[2] ? data[2].data : clearState);

        console.log('[Drag-Drop] Successfully reordered backup chain BOS equipment');
      } catch (error) {
        console.error('[Drag-Drop] Error reordering backup chain equipment:', error);
      }
    },
    [projectID, prefix, setBOS1Section, setBOS2Section, setBOS3Section]
  );

  // Render draggable BOS item
  const renderDraggableBOSItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<BOSChainItem>) => {
      const BOSComponent = (() => {
        switch (item.position) {
          case 1:
            return BackupBOS1Section;
          case 2:
            return BackupBOS2Section;
          case 3:
            return BackupBOS3Section;
          default:
            return null;
        }
      })();

      if (!BOSComponent) return null;

      const showAddNextButton = (() => {
        switch (item.position) {
          case 1:
            return !showBOS2;
          case 2:
            return !showBOS3;
          default:
            return false;
        }
      })();

      const addNextButtonProp = (() => {
        switch (item.position) {
          case 1:
            return {
              showAddBOS2Button: showAddNextButton,
              onAddBOS2: showAddNextButton ? () => onAddNextBOS(2) : undefined,
            };
          case 2:
            return {
              showAddBOS3Button: showAddNextButton,
              onAddBOS3: showAddNextButton ? () => onAddNextBOS(3) : undefined,
            };
          default:
            return {};
        }
      })();

      return (
        <ScaleDecorator>
          <View style={[styles.bosItemContainer, isActive && styles.bosItemDragging]}>
            <TouchableOpacity onLongPress={drag} style={styles.dragHandle} activeOpacity={0.7}>
              <Text style={styles.dragHandleIcon}>⋮⋮</Text>
            </TouchableOpacity>
            <View style={styles.bosContentWrapper}>
              <BOSComponent
                key={`backup-bos${item.position}-${systemPrefix}`}
                values={{
                  isNew: item.data.isNew,
                  equipmentType: item.data.equipmentType,
                  ampRating: item.data.ampRating,
                  make: item.data.make,
                  model: item.data.model,
                }}
                label={item.label}
                onChange={(field, val) => {
                  item.setter((prev: any) => ({ ...prev, [field]: val }));
                  if (projectID) {
                    // Convert camelCase to snake_case properly
                    const fieldName = field === 'isNew'
                      ? 'is_new'
                      : field === 'equipmentType'
                      ? 'equipment_type'
                      : field === 'ampRating'
                      ? 'amp_rating'
                      : field; // 'make' and 'model' stay as-is

                    const updates: any = {
                      [`bos_${prefix}_backup_type${item.position}_${fieldName}`]: val,
                    };

                    // If equipment type changed, recalculate block name
                    if (field === 'equipmentType' && item.data.trigger) {
                      const blockName = getBOSBlockName(item.data.trigger, val);
                      updates[`bos_${prefix}_backup_type${item.position}_block_name`] = blockName;
                    }

                    console.log(`[BACKUP BOS${item.position}] Saving ${field}:`, updates);
                    void saveSystemDetailsPartialExact(projectID, updates);
                  }
                }}
                onRemove={() => {
                  item.setter({
                    isNew: true,
                    equipmentType: '',
                    ampRating: '',
                    make: '',
                    model: '',
                    trigger: null,
                  });

                  if (item.position === 1) setShowBOS1(false);
                  else if (item.position === 2) setShowBOS2(false);
                  else if (item.position === 3) setShowBOS3(false);

                  if (projectID) {
                    void saveSystemDetailsPartialExact(projectID, {
                      [`bos_${prefix}_backup_type${item.position}_equipment_type`]: null,
                      [`bos_${prefix}_backup_type${item.position}_amp_rating`]: null,
                      [`bos_${prefix}_backup_type${item.position}_make`]: null,
                      [`bos_${prefix}_backup_type${item.position}_model`]: null,
                      [`bos_${prefix}_backup_type${item.position}_is_new`]: null,
                      [`bos_${prefix}_backup_type${item.position}_trigger`]: null,
                      [`bos_${prefix}_backup_type${item.position}_block_name`]: null,
                    });
                  }
                }}
                {...addNextButtonProp}
                errors={{}}
                maxContinuousOutputAmps={maxContinuousOutputAmps}
                loadingMaxOutput={loadingMaxOutput}
                utilityAbbrev={utilityAbbrev}
              />
            </View>
          </View>
        </ScaleDecorator>
      );
    },
    [
      systemPrefix,
      projectID,
      prefix,
      showBOS2,
      showBOS3,
      maxContinuousOutputAmps,
      loadingMaxOutput,
      utilityAbbrev,
      onAddNextBOS,
      setShowBOS1,
      setShowBOS2,
      setShowBOS3,
    ]
  );

  if (bosItemsList.length === 0) {
    console.log(`[BackupChainBOS] No items to render - returning null`);
    return null;
  }

  console.log(`[BackupChainBOS] Rendering ${bosItemsList.length} items`);
  return (
    <DraggableFlatList
      key={`draggable-backup-${systemPrefix}`}
      data={bosItemsList}
      renderItem={renderDraggableBOSItem}
      keyExtractor={(item) => item.key}
      onDragEnd={({ data }) => void handleBOSReorder(data)}
      activationDistance={20}
      containerStyle={{ flex: 1 }}
      scrollEnabled={false}
    />
  );
};

const styles = StyleSheet.create({
  bosItemContainer: {
    position: 'relative',
    marginVertical: moderateScale(4),
  },
  bosContentWrapper: {
    flex: 1,
  },
  dragHandle: {
    position: 'absolute',
    left: moderateScale(-30),
    top: moderateScale(12),
    width: moderateScale(24),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dragHandleIcon: {
    fontSize: moderateScale(16),
    color: '#999',
    fontWeight: '600',
    letterSpacing: moderateScale(-2),
  },
  bosItemDragging: {
    opacity: 0.7,
    backgroundColor: '#f0f0f0',
  },
});
