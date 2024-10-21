import React, { useEffect, useRef, useState } from "react";
import { saveFilesToIndexedDB } from "@/utils/indexedDbService";
import { Button } from "../ui/button";

interface FileInputProps {
  onFilesChanged: () => void;
}

const FileInput: React.FC<FileInputProps> = ({ onFilesChanged }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectFileClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await saveFilesToIndexedDB(files); // Persist files to IndexedDB
    onFilesChanged();
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
