// src/types/fileTypes.ts

export interface CustomFile extends File {
  fileIsFrom?: "local" | "external"; // You can add any other custom properties here
  fileIsIn?: "indexedDB" | "fileSystem";
  fileIsInFirebaseStorage?: boolean;
  timesPlayed?: number;
  // Add more custom properties as needed, e.g., fileSourceUrl?: string;
}
