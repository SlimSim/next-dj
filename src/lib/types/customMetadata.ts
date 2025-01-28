export interface CustomMetadataField {
  id: string;
  name: string;
  type: 'text';  // For now, we only support text fields
  showInFilter: boolean;
  showInList: boolean;
  showInSearch: boolean;
}

export interface CustomMetadataValue {
  id: string;
  value: string;
}

export interface CustomMetadataState {
  fields: CustomMetadataField[];
}
