import { toast } from "sonner";

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

    // Check if OPFS is available

    const opfsExists = "getDirectory" in navigator.storage;
    toast.info(`OPFS exists: ${opfsExists}`);
    if (opfsExists) {
      toast.info(`A`);
      // Get the OPFS directory
      const root = await navigator.storage.getDirectory();
      toast.info(`B`);
      const handle = await root.getFileHandle(fileName, { create: true });

      toast.info(`C`);
      // Create a writable stream
      const writable = await handle.createWritable();
      toast.info(`D`);
      await writable.write(fileData);
      toast.info(`E`);
      await writable.close();

      toast.info(`F`);
      // Return the file handle (you can convert it to File object if needed)
      return new File([fileData], fileName, { type: fileData.type });
    } else {
      // Fallback for browsers that do not support OPFS
      toast.warning("File OPFS is not supported in this browser.");
      console.error("File OPFS is not supported in this browser.");
      return null;
    }
  } catch (error: any) {
    toast.error("Error fetching or saving the song. " + error.message);
    console.error("Error fetching or saving the song:", error);
    return null;
  }
}
