import { toast } from "sonner";

// src/utils/fetchAndSaveSong.ts
export async function fetchAndSaveSong(url: string, fileName: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch the file.");

    const fileData = await response.blob(); // Get the file as a Blob

    // Check if OPFS is available
    if ("getDirectory" in navigator.storage) {
      // Get the OPFS directory
      const root = await navigator.storage.getDirectory();
      const handle = await root.getFileHandle(fileName, { create: true });

      // Create a writable stream
      const writable = await handle.createWritable();
      await writable.write(fileData);
      await writable.close();

      // Return the file handle (you can convert it to File object if needed)
      return new File([fileData], fileName, { type: fileData.type });
    } else {
      // Fallback for browsers that do not support OPFS
      toast.warning("File OPFS is not supported in this browser.");
      console.error("File OPFS is not supported in this browser.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching or saving the song:", error);
    return null;
  }
}
