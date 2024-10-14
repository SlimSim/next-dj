// src/utils/opfsUtils.ts

export async function getFilesFromOPFS(): Promise<File[]> {
  try {
    const files: File[] = [];

    // Access the OPFS directory
    const root = await navigator.storage.getDirectory();

    // Iterate over files in the directory
    for await (const [name, handle] of root as any) {
      if (handle.kind === "file") {
        const file = await handle.getFile();
        files.push(file); // Add file to the list
      }
    }

    return files;
  } catch (error) {
    console.error("Error reading from OPFS:", error);
    return [];
  }
}
