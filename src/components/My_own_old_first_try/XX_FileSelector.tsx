"use client";

import { useState, useEffect } from "react";

type FileHandle = {
  name: string;
  handle: FileSystemFileHandle;
};

const audio = new Audio();

export default function FileSelector() {
  const [files, setFiles] = useState<FileHandle[]>([]);
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    const storedDirectoryHandle = localStorage.getItem("directoryHandle");
    if (storedDirectoryHandle) {
      // Attempt to restore the directory handle
      (async () => {
        try {
          const handle = await window.showDirectoryPicker();
          setDirectoryHandle(handle);
          await listFiles(handle);
        } catch (error) {
          console.error("Error restoring directory handle:", error);
        }
      })();
    }
  }, []);

  const handleDirectorySelection = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      setDirectoryHandle(handle);
      localStorage.setItem("directoryHandle", JSON.stringify(handle));
      await listFiles(handle);
    } catch (error) {
      console.error("Error selecting directory:", error);
    }
  };

  const listFiles = async (handle: FileSystemDirectoryHandle) => {
    const filesArray: FileHandle[] = [];
    for await (const entry of handle.values()) {
      if (entry.kind === "file") {
        filesArray.push({ name: entry.name, handle: entry });
      }
    }
    setFiles(filesArray);
  };

  const playFile = async (fileHandle: FileSystemFileHandle) => {
    try {
      const file = await fileHandle.getFile();
      const url = URL.createObjectURL(file);
      audio.src = url;
      audio.play();
    } catch (error) {
      console.error("Error playing file:", error);
    }
  };

  const stopFile = async () => {
    try {
      audio.pause();
    } catch (error) {
      console.error("Error pausing file:", error);
    }
  };

  return (
    <div>
      <button
        onClick={handleDirectorySelection}
        className="bg-blue-500 text-white p-2 rounded"
      >
        Select Directory
      </button>
      <button onClick={stopFile} className="bg-gray-500 text-white p-2 rounded">
        Stop
      </button>
      <ul>
        {files.map((file) => (
          <li key={file.name}>
            {file.name}
            <button
              onClick={() => playFile(file.handle)}
              className="ml-2 text-blue-500"
            >
              Play
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
