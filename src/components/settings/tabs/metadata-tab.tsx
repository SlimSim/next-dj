"use client";

import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { PlusIcon } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable';
import { usePlayerStore } from "@/lib/store";
import { SortableField } from "../components/sortable-field";
import { InfoCardTrigger, InfoCardContent } from "../components/info-card";
import { Switch } from "../../ui/switch";

interface CustomField {
  id: string;
  name: string;
  type: 'text';
}

interface CustomMetadata {
  fields: CustomField[];
}

export function MetadataTab() {
  const customMetadata = usePlayerStore((state) => state.customMetadata);
  const addCustomMetadataField = usePlayerStore((state) => state.addCustomMetadataField);
  const removeField = usePlayerStore((state) => state.removeCustomMetadataField);
  const renameCustomMetadataField = usePlayerStore((state) => state.renameCustomMetadataField);
  const toggleCustomMetadataFilter = usePlayerStore((state) => state.toggleCustomMetadataFilter);
  const toggleCustomMetadataVisibility = usePlayerStore((state) => state.toggleCustomMetadataVisibility);
  const toggleCustomMetadataSearch = usePlayerStore((state) => state.toggleCustomMetadataSearch);
  const toggleCustomMetadataFooter = usePlayerStore((state) => state.toggleCustomMetadataFooter);
  const reorderCustomMetadataFields = usePlayerStore((state) => state.reorderCustomMetadataFields);

  const standardMetadataFields = usePlayerStore((state) => state.standardMetadataFields);
  const toggleStandardMetadataFilter = usePlayerStore((state) => state.toggleStandardMetadataFilter);
  const toggleStandardMetadataVisibility = usePlayerStore((state) => state.toggleStandardMetadataVisibility);
  const toggleStandardMetadataSearch = usePlayerStore((state) => state.toggleStandardMetadataSearch);
  const toggleStandardMetadataFooter = usePlayerStore((state) => state.toggleStandardMetadataFooter);
  const reorderStandardMetadataFields = usePlayerStore((state) => state.reorderStandardMetadataFields);
  
  // Column visibility settings
  const showMetadataBadgesInLists = usePlayerStore((state) => state.showMetadataBadgesInLists);
  const showMetadataBadgesInFooter = usePlayerStore((state) => state.showMetadataBadgesInFooter);
  const showPlayHistoryInLists = usePlayerStore((state) => state.showPlayHistoryInLists);
  const showPlayHistoryInFooter = usePlayerStore((state) => state.showPlayHistoryInFooter);
  const setShowMetadataBadgesInLists = usePlayerStore((state) => state.setShowMetadataBadgesInLists);
  const setShowMetadataBadgesInFooter = usePlayerStore((state) => state.setShowMetadataBadgesInFooter);
  const setShowPlayHistoryInLists = usePlayerStore((state) => state.setShowPlayHistoryInLists);
  const setShowPlayHistoryInFooter = usePlayerStore((state) => state.setShowPlayHistoryInFooter);

  const [newFieldName, setNewFieldName] = useState("");
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const toggleHelp = () => setIsHelpOpen(!isHelpOpen);

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    const name = newFieldName.trim();
    addCustomMetadataField({
      id: uuidv4(),
      name,
      type: 'text',
      showInFilter: true,
      showInList: true,
      showInSearch: true,
      showInFooter: true,
    });
    setNewFieldName('');
  };

  const removeCustomMetadataField = (id: string) => {
    removeField(id);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = customMetadata.fields.findIndex(
        (field) => field.id === active.id
      );
      const newIndex = customMetadata.fields.findIndex(
        (field) => field.id === over?.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderCustomMetadataFields(oldIndex, newIndex);
      }
    }
  };

  const handleStandardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = standardMetadataFields.findIndex(
        (field) => field.id === active.id
      );
      const newIndex = standardMetadataFields.findIndex(
        (field) => field.id === over?.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderStandardMetadataFields(oldIndex, newIndex);
      }
    }
  };

  return (
    <>
      <div className="space-y-6 h-[calc(100vh-12rem)]">
        {/* Header - Only visible on larger screens */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_60px_60px_60px_60px] gap-4 items-center px-2 sticky top-0 bg-background z-10">
          <div className="font-medium flex items-center gap-2">
            Field
            <InfoCardTrigger onClick={toggleHelp} />
          </div>
          <div className="text-center font-medium">List</div>
          <div className="text-center font-medium">Footer</div>
          <div className="text-center font-medium">Search</div>
          <div className="text-center font-medium">Filter</div>
        </div>

        <div className="flex flex-col gap-4 max-h-[calc(100vh-16rem)] overflow-y-auto">

          {/* Custom Metadata Fields */}
          <div className="space-y-4">
            <div className="flex items-center flex-wrap justify-between sticky top-0 bg-background py-2 z-10">
              <h4 className="text-sm font-medium pb-2 pr-2 flex items-center gap-2">
                Custom Metadata Fields
                <span className="sm:hidden"><InfoCardTrigger onClick={toggleHelp} /></span>
              </h4>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="New field name"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="h-8"
                />
                <Button
                  size="sm"
                  onClick={handleAddCustomField}
                  disabled={!newFieldName.trim()}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={customMetadata.fields.map(field => field.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {customMetadata.fields.length === 0 ? (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">
                        Custom metadata fields allow you to add your own metadata to tracks, such as "first instrument", "name of drummer" or "notes".
                        Enter a name in the field above and click the plus button to create your first custom field.
                      </p>
                    </div>
                  ) : (
                    customMetadata.fields.map((field) => (
                      <SortableField
                        key={field.id}
                        id={field.id}
                        name={field.name}
                        showInFilter={field.showInFilter}
                        showInList={field.showInList}
                        showInSearch={field.showInSearch}
                        showInFooter={field.showInFooter || false}
                        isEditing={editingFieldId === field.id}
                        editingName={editingName}
                        onEditStart={() => {
                          setEditingFieldId(field.id);
                          setEditingName(field.name);
                        }}
                        onEditChange={setEditingName}
                        onEditSubmit={() => {
                          if (editingName.trim() && editingName !== field.name) {
                            renameCustomMetadataField(field.id, editingName.trim());
                          }
                          setEditingFieldId(null);
                          setEditingName("");
                        }}
                        onEditCancel={() => {
                          setEditingFieldId(null);
                          setEditingName("");
                        }}
                        toggleFilter={() => toggleCustomMetadataFilter(field.id)}
                        toggleList={() => toggleCustomMetadataVisibility(field.id)}
                        toggleSearch={() => toggleCustomMetadataSearch(field.id)}
                        toggleFooter={() => toggleCustomMetadataFooter(field.id)}
                        removeField={() => removeCustomMetadataField(field.id)}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Standard Metadata Fields */}
          <div className="space-y-4">
            {/* Standard Fields */}
            <h4 className="text-sm font-medium sticky top-0 bg-background py-2 z-10 flex items-center gap-2">
              Standard Metadata Fields
              <span className="sm:hidden"><InfoCardTrigger onClick={toggleHelp} /></span>
            </h4>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleStandardDragEnd}
            >
              <SortableContext
                items={standardMetadataFields.map(field => field.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {standardMetadataFields.map((field) => (
                    <SortableField
                      key={field.id}
                      id={field.id}
                      name={field.name}
                      showInFilter={field.showInFilter}
                      showInList={field.showInList}
                      showInSearch={field.showInSearch}
                      showInFooter={field.showInFooter || false}
                      toggleFilter={() => toggleStandardMetadataFilter(field.id)}
                      toggleList={() => toggleStandardMetadataVisibility(field.id)}
                      toggleSearch={() => toggleStandardMetadataSearch(field.id)}
                      toggleFooter={() => toggleStandardMetadataFooter(field.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          <div className="space-y-4">
            {/* Column Visibility Rows */}
            <h4 className="text-sm font-medium bg-background py-2 flex items-center gap-2">
              Column Visibility Settings
              <span className="sm:hidden"><InfoCardTrigger onClick={toggleHelp} /></span>
            </h4>
            <SortableContext
              items={['metadata-badges', 'play-history']}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {/* Metadata Badges Column */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:grid sm:grid-cols-[1fr_60px_60px_60px_60px] gap-2 sm:gap-4 rounded-lg border p-2">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm font-medium">Metadata Badges Column</span>
                  </div>
                  
                  <div className="sm:contents">
                    <div className="flex items-center justify-between sm:justify-center px-2 sm:px-0 mb-2 sm:mb-0">
                      <label htmlFor="metadata-badges-list" className="text-sm sm:hidden">List</label>
                      <Switch 
                        id="metadata-badges-list"
                        checked={showMetadataBadgesInLists}
                        onCheckedChange={() => setShowMetadataBadgesInLists(!showMetadataBadgesInLists)}
                      />
                    </div>
                    <div className="flex items-center justify-between sm:justify-center px-2 sm:px-0 mb-2 sm:mb-0">
                      <label htmlFor="metadata-badges-footer" className="text-sm sm:hidden">Footer</label>
                      <Switch 
                        id="metadata-badges-footer"
                        checked={showMetadataBadgesInFooter}
                        onCheckedChange={() => setShowMetadataBadgesInFooter(!showMetadataBadgesInFooter)}
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      {/* Empty for Search column */}
                    </div>
                    <div className="flex items-center justify-center">
                      {/* Empty for Filter column */}
                    </div>
                  </div>
                </div>
                
                {/* Play History Column */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:grid sm:grid-cols-[1fr_60px_60px_60px_60px] gap-2 sm:gap-4 rounded-lg border p-2">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm font-medium">Play History Column</span>
                  </div>
                  
                  <div className="sm:contents">
                    <div className="flex items-center justify-between sm:justify-center px-2 sm:px-0 mb-2 sm:mb-0">
                      <label htmlFor="play-history-list" className="text-sm sm:hidden">List</label>
                      <Switch 
                        id="play-history-list"
                        checked={showPlayHistoryInLists}
                        onCheckedChange={() => setShowPlayHistoryInLists(!showPlayHistoryInLists)}
                      />
                    </div>
                    <div className="flex items-center justify-between sm:justify-center px-2 sm:px-0 mb-2 sm:mb-0">
                      <label htmlFor="play-history-footer" className="text-sm sm:hidden">Footer</label>
                      <Switch 
                        id="play-history-footer"
                        checked={showPlayHistoryInFooter}
                        onCheckedChange={() => setShowPlayHistoryInFooter(!showPlayHistoryInFooter)}
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      {/* Empty for Search column */}
                    </div>
                    <div className="flex items-center justify-center">
                      {/* Empty for Filter column */}
                    </div>
                  </div>
                </div>
              </div>
            </SortableContext>

          </div>
        </div>
      </div>
      {/* Render InfoCardContent outside of the main container */}
      <InfoCardContent isOpen={isHelpOpen} onClose={toggleHelp} />
    </>
  );
}
