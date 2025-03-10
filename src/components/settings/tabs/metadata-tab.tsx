"use client";

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePlayerStore } from "@/lib/store";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { SortableField } from "../components/sortable-field";
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
import { PlusIcon } from "lucide-react";

export function MetadataTab() {
  const [newFieldName, setNewFieldName] = useState("");
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-4">Standard Metadata Fields</h3>
        <div className="hidden sm:grid grid-cols-[1fr_60px_60px_60px] gap-4 mb-2 px-14">
          <div>Field Name</div>
          <div className="text-center">Filter</div>
          <div className="text-center">List</div>
          <div className="text-center">Search</div>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleStandardDragEnd}
        >
          <SortableContext
            items={standardMetadataFields.map((field) => field.id)}
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
                  toggleFilter={toggleStandardMetadataFilter}
                  toggleVisibility={toggleStandardMetadataVisibility}
                  toggleSearch={toggleStandardMetadataSearch}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Custom Metadata Fields</h3>
        <div className="hidden sm:grid grid-cols-[1fr_60px_60px_60px] gap-4 mb-2 px-14">
          <div>Field Name</div>
          <div className="text-center">Filter</div>
          <div className="text-center">List</div>
          <div className="text-center">Search</div>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={customMetadata.fields.map((field) => field.id)}
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
                    if (editingName.trim() && editingFieldId) {
                      renameCustomMetadataField(editingFieldId, editingName.trim());
                      setEditingFieldId(null);
                      setEditingName("");
                    }
                  }}
                  onEditCancel={() => {
                    setEditingFieldId(null);
                    setEditingName("");
                  }}
                  toggleFilter={toggleCustomMetadataFilter}
                  toggleVisibility={toggleCustomMetadataVisibility}
                  toggleSearch={toggleCustomMetadataSearch}
                  removeField={removeField}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex gap-2 mt-4">
          <Input
            placeholder="New field name"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddCustomField();
              }
            }}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleAddCustomField}
            disabled={!newFieldName.trim()}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
