import React, { useEffect, useRef, useState } from "react";
import { getFilesFromIndexedDB } from "@/utils/indexedDbService";
import { saveFilesToIndexedDB } from "@/utils/indexedDbService";
import { Button } from "../ui/button";

interface FileInputProps {
  onFilesSelected: (files: File[]) => void;
}

const FileInput: React.FC<FileInputProps> = ({ onFilesSelected }) => {
  const [storedFiles, setStoredFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadStoredFiles = async () => {
      const files = await getFilesFromIndexedDB(); // Load files from IndexedDB
      if (files.length) {
        setStoredFiles(files);
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
    setStoredFiles(files); // Set selected files in state
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
      <div>
        <h4>Stored Files:</h4>
        <ul>
          {storedFiles.map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FileInput;
