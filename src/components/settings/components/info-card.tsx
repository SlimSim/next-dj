"use client";

import { useState } from "react";
import { 
  HelpCircle, 
  Info, 
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Separate trigger component
export function InfoCardTrigger({ onClick }: { onClick: () => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0"
            onClick={onClick}
          >
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">Toggle help information</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Click for column explanations</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Separate content component
export interface InfoCardContentProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InfoCardContent({ isOpen, onClose }: InfoCardContentProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-start justify-center pointer-events-none z-[9999]">
      <div className="w-[90%] max-w-md pt-16 pointer-events-auto">
        <Card className="bg-pink-50 shadow-lg animate-in fade-in-50 slide-in-from-top-5 duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metadata Settings Help</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <h3 className="font-semibold flex items-center gap-1">
                    <span>List Column</span>
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Toggles whether this metadata field appears in track lists, history, 
                    and queue views. Enable this for important fields you want to see 
                    when browsing your music collection.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-semibold flex items-center gap-1">
                    <span>Filter Column</span>
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Determines whether this field can be used to filter tracks in the 
                    playlist. Enable this for fields you want to filter by, like Genre 
                    or Artist.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-semibold flex items-center gap-1">
                    <span>Search Column</span>
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Controls if this field is included when searching for tracks. 
                    Enable this for fields containing text you might want to search for.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-semibold flex items-center gap-1">
                    <span>Footer Column</span>
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Toggles visibility of this field in the song info footer (player and next views). 
                    Keep minimal for cleaner UI - recommended only for essential info like Artist.
                  </p>
                </div>
              </div>
              
              <p className="pt-2 text-xs text-muted-foreground italic">
                Tip: On mobile devices, you'll see the column name next to each switch when you expand a field.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Original component (for backward compatibility)
export function InfoCard() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div>
      <InfoCardTrigger onClick={toggleOpen} />
      <InfoCardContent isOpen={isOpen} onClose={toggleOpen} />
    </div>
  );
}
