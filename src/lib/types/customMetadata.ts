export interface CustomMetadataField {
  id: string;
  name: string;
  type: 'text';  // For now, we only support text fields
}

export interface CustomMetadataValue {
  fieldId: string;
  value: string | string[];
}

export interface CustomMetadataState {
  fields: CustomMetadataField[];
}
