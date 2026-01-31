#!/bin/bash

# Audit script to find all inline style violations
# Output: JSON format for easy parsing

echo "["

first=true
while IFS= read -r file; do
  if [ -f "$file" ]; then
    # Get line numbers and content for style={{
    grep -n "style={{" "$file" 2>/dev/null | while IFS=: read -r linenum content; do
      if [ "$first" = true ]; then
        first=false
      else
        echo ","
      fi
      # Escape quotes in content
      clean_content=$(echo "$content" | sed 's/"/\\"/g' | sed 's/\/\\/g')
      echo -n "{\"file\":\"$file\",\"line\":$linenum,\"content\":\"$clean_content\"}"
    done
  fi
done << 'EOFILES'
src/pages/DrafterPortal/components/FileUploadPanel.js
src/pages/DrafterPortal/components/CountdownTimer.js
src/hooks/useAdminDrafterSocket.js
src/hooks/useDrafterSocket.js
src/components/project/equipment/StringCombinerPanelSection.js
src/components/project/MediaGallery.js
src/components/debug/PerformanceMonitor.js
src/components/modals/UtilityValidationModal.js
src/components/project/ProjectOverview.js
src/pages/Dashboard.js
src/components/dashboard/DrafterPortal.js
src/components/dashboard/ProjectsOverview.js
src/components/project/survey/SiteSurveyReportPanel.js
src/pages/SupportTickets.js
src/components/chatter/UserAvatar.js
src/components/chatter/ChatterThread.js
src/components/pdf/PdfToolbar.js
src/components/scheduling/EventCard.js
src/components/scheduling/UpcomingEvents.js
src/components/ui/Skeleton.js
src/components/survey/PhotoToolbar.js
src/components/ResetPassword.js
src/components/project/SiteForm.js
src/components/project/ProjectDetailsForm.js
src/components/project/equipment/storage/EnergyStorageSection.js
src/components/project/equipment/GatewayConfigurationSection.js
src/components/pdf/QCChecklistPanel.js
src/components/OTPModal.js
src/components/maps/AzimuthFinder.js
src/components/dashboard/PlanSetVersions.js
src/components/ui/EquipmentRow.js
src/components/project/equipment/StorageManagementSystemSection.js
src/components/project/equipment/BatteryTypeSection.js
src/components/project/equipment/SolarPanelSection.js
src/components/auth/RedeemInvite.js
src/components/checklist/ChecklistPanel.js
src/components/checklist/ChecklistItem.js
src/components/project/equipment/BOSEquipmentSection.js
src/components/project/electrical/PointOfInterconnectionSection.js
src/components/project/structural/RoofingSection.js
src/components/project/structural/MountingHardwareSection.js
src/components/project/StructuralForm.js
src/components/project/electrical/MainPanelASection.js
src/components/ui/SectionRemoveModal.js
src/components/project/ElectricalForm.js
src/components/project/FilesTab.js
src/components/project/electrical/MainCircuitBreakersSection.js
src/components/project/structural/RailsSection.js
src/components/project/equipment/EnergyStorageSection.js
src/components/project/equipment/SolarPanel2Section.js
src/components/ui/SystemDeleteModal.js
src/components/project/ProjectPhotoGallery.js
src/components/ui/PhotoModal.js
src/components/project/equipment/BOSPanel.js
src/components/common/SearchableSelect.js
src/components/dashboard/StatusTabs.js
src/components/project/equipment/storage/BatteryTypeSection.js
src/components/project/equipment/CombinerPanelForm.js
src/components/ui/CollapsibleSection.js
src/components/project/FilesPanel.js
src/components/common/UpdateModal.js
src/components/ui/Tooltip.js
src/pages/DrafterPortal/components/admin/AdminActiveAssignments.js
src/components/dashboard/SitePlanVersions.js
src/components/project/UploadZone.js
src/components/project/SurveyNotesGallery.js
src/components/scheduling/ScheduleCalendar.js
src/components/scheduling/WeekView.js
src/components/scheduling/EventModal.js
src/components/dashboard/StatusTabCard.js
src/components/ui/Progress.js
src/components/ui/Avatar.js
EOFILES

echo "]"
