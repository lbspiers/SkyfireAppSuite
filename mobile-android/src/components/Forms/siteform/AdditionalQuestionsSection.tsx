// src/components/Forms/SiteForm/AdditionalQuestionsSection.tsx
import React from "react";
import CollapsibleSection from "../../UI/CollapsibleSection";
import DynamicFieldRenderer from "../DynamicFieldRenderer";

interface AdditionalQuestionsSectionProps {
  values: any;
  errors: any;
  touched: any;
  setFieldValue: (field: string, value: any) => void;
}

const AdditionalQuestionsSection: React.FC<AdditionalQuestionsSectionProps> = ({
  values,
  errors,
  touched,
  setFieldValue,
}) => {
  if (
    !values.utilitySpecific &&
    !values.utilityMisc &&
    !values.jurisdictionQues
  ) {
    return null; // ❌ don't render anything if there's no additional data
  }

  return (
    <CollapsibleSection title="Additional Questions" initiallyExpanded>
      <DynamicFieldRenderer
        values={values}
        handleChange={(field) => (value) => setFieldValue(field, value)}
        touched={touched}
        errors={errors}
      />
    </CollapsibleSection>
  );
};

export default AdditionalQuestionsSection;
