"use client";

import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { usePlayerStore } from "@/lib/store";
import { SongList } from "@/lib/types/player";
import { cn } from "@/lib/utils/common";

const NewListInput = () => {
  const [newListName, setNewListName] = useState("");
  const addSongList = usePlayerStore((state) => state.addSongList);

  const handleCreateList = () => {
    if (newListName.trim()) {
      addSongList(newListName.trim());
      setNewListName("");
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={newListName}
        onChange={(e) => setNewListName(e.target.value)}
        placeholder="New list name..."
        onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
      />
      <Button size="icon" onClick={handleCreateList}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function ListsPanel() {
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const showLists = usePlayerStore((state) => state.showLists);
  const songLists = usePlayerStore((state) => state.songLists);
  const selectedListId = usePlayerStore((state) => state.selectedListId);
  const toggleLists = usePlayerStore((state) => state.toggleLists);
  const removeSongList = usePlayerStore((state) => state.removeSongList);
  const renameSongList = usePlayerStore((state) => state.renameSongList);
  const setSelectedListId = usePlayerStore((state) => state.setSelectedListId);

  const handleRenameList = (list: SongList, newName: string) => {
    if (newName.trim() && newName !== list.name) {
      renameSongList(list.id, newName.trim());
    }
    setEditingListId(null);
  };

  const ListContent = ({ inSheet = false }: { inSheet?: boolean }) => (
    <>
      {inSheet ? (
        <SheetHeader>
          <SheetTitle>Lists</SheetTitle>
        </SheetHeader>
      ) : (
        <h2 className="text-lg font-semibold mb-2">Lists</h2>
      )}

      <div className={cn("space-y-4", !inSheet && "mt-4")}>
        <NewListInput />
        <div className="space-y-2">
          <div
            className={cn(
              "flex items-center justify-between p-2 rounded-md cursor-pointer",
              !selectedListId ? "bg-accent" : "hover:bg-accent/50"
            )}
            onClick={() => setSelectedListId(null)}
          >
            <span className="flex-1">All Songs</span>
            <span className="text-sm text-muted-foreground">
              {/* You could add total song count here if needed */}
            </span>
          </div>

          {songLists.map((list) => (
            <div
              key={list.id}
              className={cn(
                "flex items-center justify-between p-2 rounded-md cursor-pointer",
                selectedListId === list.id ? "bg-accent" : "hover:bg-accent/50"
              )}
              onClick={() =>
                setSelectedListId(selectedListId === list.id ? null : list.id)
              }
            >
              {editingListId === list.id ? (
                <Input
                  defaultValue={list.name}
                  autoFocus
                  onBlur={(e) => handleRenameList(list, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRenameList(list, e.currentTarget.value);
                    } else if (e.key === "Escape") {
                      setEditingListId(null);
                    }
                  }}
                />
              ) : (
                <>
                  <span className="flex-1">{list.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {list.songs.length}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => setEditingListId(list.id)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => removeSongList(list.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile/tablet sheet */}
      <div className="lg:hidden">
        <Sheet open={showLists} onOpenChange={toggleLists}>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <ListContent inSheet />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop permanent sidebar */}
      <div className="hidden lg:block border-r bg-background w-[300px]">
        <div className="p-6">
          <ListContent />
        </div>
      </div>
    </>
  );
}
