"use client";

import AvailableSongs from "@/components/pwa/AvailableSongs";
import FilePicker from "@/components/pwa/FilePicker";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const HomePage = () => {
  const [files, setFiles] = useState<File[]>([]);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  return (
    <div>
      <h2 className="text-xl">Welcome to Next DJ</h2>
      <p>Your music player PWA.</p>
      <p>Jag vill ha Sonner</p>
      <Button
        variant="outline"
        onClick={() => {
          toast("Toast working");
        }}
      >
        Test Toast
      </Button>
      <FilePicker onFilesSelected={handleFilesSelected} />
      <AvailableSongs files={files} />
    </div>
  );
};

export default HomePage;
