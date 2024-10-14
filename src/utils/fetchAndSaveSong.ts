import { toast } from "sonner";
import { saveFilesToIndexedDB } from "./fileBlobStorage";

// src/utils/fetchAndSaveSong.ts
export async function fetchAndSaveSong(url: string, fileName: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      toast.error("Failed to fetch the file. " + url);
      throw new Error("Failed to fetch the file.");
    }

    const fileData = await response.blob(); // Get the file as a Blob
    toast.info(`Fetched file ${fileName} with size ${fileData.size} bytes`);

    const file_to_save = new File([fileData], fileName, {
      type: fileData.type,
    });
    saveFilesToIndexedDB([file_to_save]);
    return file_to_save;
  } catch (error: any) {
    toast.error("Error fetching or saving the song. " + error.message);
    console.error("Error fetching or saving the song:", error);
    return null;
  }
}
