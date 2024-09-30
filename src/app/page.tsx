"use client";

import FilePicker from "@/components/pwa/FilePicker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const HomePage = () => {
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
      <FilePicker />
    </div>
  );
};

export default HomePage;
