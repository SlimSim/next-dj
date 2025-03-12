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
} from '@dnd-kit/sortable';
import { usePlayerStore } from "@/lib/store";
import { SortableField } from "../components/sortable-field";

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
  const reorderCustomMetadataFields = usePlayerStore((state) => state.reorderCustomMetadataFields);

  const standardMetadataFields = usePlayerStore((state) => state.standardMetadataFields);
  const toggleStandardMetadataFilter = usePlayerStore((state) => state.toggleStandardMetadataFilter);
  const toggleStandardMetadataVisibility = usePlayerStore((state) => state.toggleStandardMetadataVisibility);
  const toggleStandardMetadataSearch = usePlayerStore((state) => state.toggleStandardMetadataSearch);
  const reorderStandardMetadataFields = usePlayerStore((state) => state.reorderStandardMetadataFields);

  const [newFieldName, setNewFieldName] = useState("");
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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
    <div className="space-y-6 h-[calc(100vh-12rem)]">
      {/* Header - Only visible on larger screens */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_60px_60px_60px] gap-4 items-center px-2 sticky top-0 bg-background z-10">
        <div className="font-medium">Field</div>
        <div className="text-center font-medium">List</div>
        <div className="text-center font-medium">Filter</div>
        <div className="text-center font-medium">Search</div>
      </div>

      <div className="flex flex-col gap-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
        {/* Standard Metadata Fields */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium sticky top-0 bg-background py-2 z-10">Standard Metadata Fields</h4>
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
                    toggleFilter={() => toggleStandardMetadataFilter(field.id)}
                    toggleVisibility={() => toggleStandardMetadataVisibility(field.id)}
                    toggleSearch={() => toggleStandardMetadataSearch(field.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Custom Metadata Fields */}
        <div className="space-y-4">
          <div className="flex items-center flex-wrap justify-between sticky top-0 bg-background py-2 z-20">
            <h4 className="text-sm font-medium pb-2 pr-2">Custom Metadata Fields</h4>
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
                {customMetadata.fields.map((field) => (
                  <SortableField
                    key={field.id}
                    id={field.id}
                    name={field.name}
                    showInFilter={field.showInFilter}
                    showInList={field.showInList}
                    showInSearch={field.showInSearch}
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
                    toggleVisibility={() => toggleCustomMetadataVisibility(field.id)}
                    toggleSearch={() => toggleCustomMetadataSearch(field.id)}
                    removeField={removeCustomMetadataField}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
