"use client";

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { ChevronDown, GripVertical, PencilIcon, TrashIcon } from "lucide-react";
import { Switch } from '@/components/ui/switch';
import { ConfirmButton } from '@/components/ui/confirm-button';

interface SortableFieldProps {
  id: string;
  name: string;
  showInFilter: boolean;
  showInList: boolean;
  showInSearch: boolean;
  isEditing?: boolean;
  editingName?: string;
  onEditStart?: () => void;
  onEditChange?: (value: string) => void;
  onEditSubmit?: () => void;
  onEditCancel?: () => void;
  toggleFilter: (fieldId: string) => void;
  toggleVisibility: (fieldId: string) => void;
  toggleSearch: (fieldId: string) => void;
  removeField?: (fieldId: string) => void;
}

export function SortableField({
  id,
  name,
  showInFilter,
  showInList,
  showInSearch,
  isEditing,
  editingName,
  onEditStart,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  toggleFilter,
  toggleVisibility,
  toggleSearch,
  removeField,
}: SortableFieldProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col sm:flex-row sm:items-center sm:grid sm:grid-cols-[1fr_60px_60px_60px] gap-2 sm:gap-4 rounded-lg border p-2 ${
        isDragging ? 'bg-accent' : ''
      }`}
    >
      <div className="flex items-center gap-2 w-full">
        <button
          className="cursor-grab hover:text-accent-foreground/50 active:cursor-grabbing shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {isEditing ? (
          <Input
            className="h-8 flex-1"
            value={editingName}
            onChange={(e) => onEditChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onEditSubmit?.();
              } else if (e.key === 'Escape') {
                onEditCancel?.();
              }
            }}
            onBlur={onEditSubmit}
            autoFocus
          />
        ) : (
          <>
            <div className="hidden sm:flex items-center gap-2 flex-1">
              <span className="text-sm font-medium">{name}</span>
              {onEditStart && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onEditStart}
                >
                  <PencilIcon className="h-3 w-3" />
                </Button>
              )}
              <div className="flex-1"></div>
              {removeField && (
                <ConfirmButton
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive self-end "
                  onClick={() => removeField(id)}
                >
                  <TrashIcon className="h-3 w-3" />
                  <span className="sr-only">Remove field</span>
                </ConfirmButton>
              )}
            </div>

            <button
              className="sm:hidden flex items-center justify-between flex-1 hover:bg-accent/50 rounded-md transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className="text-sm font-medium px-2">{name}</span>
              <div className="p-2">
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>
          </>
        )}
      </div>

      <div className={`sm:contents ${isExpanded ? 'block' : 'hidden'}`}>
        <div className="flex items-center justify-center">
          <Switch
            id={`filter-${id}`}
            checked={showInFilter}
            onCheckedChange={() => toggleFilter(id)}
          />
        </div>
        <div className="flex items-center justify-center">
          <Switch
            id={`visibility-${id}`}
            checked={showInList}
            onCheckedChange={() => toggleVisibility(id)}
          />
        </div>
        <div className="flex items-center justify-center">
          <Switch
            id={`search-${id}`}
            checked={showInSearch}
            onCheckedChange={() => toggleSearch(id)}
          />
        </div>
      </div>
    </div>
  );
}
