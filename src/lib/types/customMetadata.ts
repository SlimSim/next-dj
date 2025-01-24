export interface CustomMetadataField {
  id: string;
  name: string;
  type: 'text';  // For now, we only support text fields
  showInFilter: boolean;  // Controls whether this field appears in the filter dropdown
}

export interface CustomMetadataValue {
  fieldId: string;
  value: string | string[];
}

export interface CustomMetadataState {
  fields: CustomMetadataField[];
}
