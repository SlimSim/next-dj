export interface CustomMetadataField {
  id: string;
  name: string;
  type: 'text' | 'array'; // We can expand this later if needed
}

export interface CustomMetadataValue {
  fieldId: string;
  value: string | string[];
}

export interface CustomMetadataState {
  fields: CustomMetadataField[];
}
