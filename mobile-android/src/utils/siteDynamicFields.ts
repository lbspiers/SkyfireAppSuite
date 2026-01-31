const siteDynamicFields = [
  {
    condition: (values: any) => values.state === "CA",
    label: "What’s the square footage?",
    field: "squareFootage",
    componentType: "text",
    placeholder: "Enter square footage",
  },
  {
    condition: (values: any) => values.utility === "Arizona Public Service Co",
    label: "Is utility meter behind a fence or wall?",
    field: "utilityFence",
    componentType: "radio",
    options: ["Yes", "No"],
  },
];

export default siteDynamicFields;
