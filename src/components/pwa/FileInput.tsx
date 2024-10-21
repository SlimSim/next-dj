import React, { useEffect, useRef, useState } from "react";
import { getFilesFromIndexedDB } from "@/utils/indexedDbService";
import { saveFilesToIndexedDB } from "@/utils/indexedDbService";
import { Button } from "../ui/button";

interface FileInputProps {
  onFilesSelected: (files: File[]) => void;
}

const FileInput: React.FC<FileInputProps> = ({ onFilesSelected }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadStoredFiles = async () => {
      const files = await getFilesFromIndexedDB(); // Load files from IndexedDB
      if (files.length) {
        onFilesSelected(files); // Pass stored files to parent component
      }
    };
    loadStoredFiles();
  }, []);

  const handleSelectFileClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFilesSelected(files);
    await saveFilesToIndexedDB(files); // Persist files to IndexedDB
  };

  return (
    <div>
      <Button variant="outline" onClick={handleSelectFileClick}>
        Select a file
      </Button>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        multiple
        onChange={handleFileChange}
      />
    </div>
  );
};

export default FileInput;
