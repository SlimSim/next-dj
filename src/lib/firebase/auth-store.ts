import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "firebase/auth";
import { signInWithGoogle, signOut, subscribeToAuthChanges } from "./auth";
import { SyncService } from "./sync-service";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  lastSync: number | null;
  isSyncing: boolean;
  
  // Actions
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  clearError: () => void;
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Setup auth state listener when this store is created (browser only)
      if (typeof window !== 'undefined') {
        // Need to use setTimeout to ensure this runs after store hydration
        setTimeout(() => {
          subscribeToAuthChanges((user) => {
            set({ user });
          });
        }, 0);
      }

      return {
        user: null,
        isLoading: false,
        error: null,
        lastSync: null,
        isSyncing: false,

        signIn: async () => {
          set({ isLoading: true, error: null });
          try {
            const result = await signInWithGoogle();
            if (result.error) {
              set({ error: result.error, isLoading: false });
            } else {
              // First update the UI to show the user is signed in
              set({ user: result.user, isLoading: false });
              
              // After successful sign in, sync data from cloud in the background
              // Don't await this to prevent blocking the UI
              setTimeout(async () => {
                try {
                  const syncService = SyncService.getInstance();
                  const success = await syncService.syncFromCloud();
                  if (success) {
                    set({ lastSync: syncService.getLastSyncTime() });
                  }
                } catch (syncError) {
                  console.error('Background sync error:', syncError);
                  // Don't update error state to avoid disrupting the user experience
                }
              }, 1000); // Wait 1 second before starting sync
            }
          } catch (error: any) {
            set({ error: error.message || "Failed to sign in", isLoading: false });
          }
        },

        logOut: async () => {
          set({ isLoading: true, error: null });
          try {
            const result = await signOut();
            if (result.error) {
              set({ error: result.error, isLoading: false });
            } else {
              set({ user: null, isLoading: false });
            }
          } catch (error: any) {
            set({ error: error.message || "Failed to sign out", isLoading: false });
          }
        },

        clearError: () => set({ error: null }),

        syncToCloud: async () => {
          if (!get().user) {
            set({ error: "User not authenticated" });
            return false;
          }

          set({ isSyncing: true });
          try {
            const syncService = SyncService.getInstance();
            const success = await syncService.syncToCloud();
            if (success) {
              set({ lastSync: syncService.getLastSyncTime() });
            }
            set({ isSyncing: false });
            return success;
          } catch (error: any) {
            set({ 
              error: error.message || "Failed to sync to cloud",
              isSyncing: false 
            });
            return false;
          }
        },

        syncFromCloud: async () => {
          if (!get().user) {
            set({ error: "User not authenticated" });
            return false;
          }

          set({ isSyncing: true });
          try {
            const syncService = SyncService.getInstance();
            const success = await syncService.syncFromCloud();
            if (success) {
              set({ lastSync: syncService.getLastSyncTime() });
            }
            set({ isSyncing: false });
            return success;
          } catch (error: any) {
            set({ 
              error: error.message || "Failed to sync from cloud",
              isSyncing: false 
            });
            return false;
          }
        }
      };
    },
    {
      name: "auth-storage",
      partialize: (state) => ({
        // Only persist these fields
        user: state.user ? {
          uid: state.user.uid,
          email: state.user.email,
          displayName: state.user.displayName,
          photoURL: state.user.photoURL,
        } : null,
        lastSync: state.lastSync,
      }),
    }
  )
);
