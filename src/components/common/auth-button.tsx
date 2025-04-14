import { useState } from 'react';
import { useAuthStore } from '@/lib/firebase/auth-store';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function AuthButton() {
  const { user, isLoading, error, signIn, logOut, syncToCloud, syncFromCloud, isSyncing, lastSync } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignIn = async () => {
    // Check if Firebase API key is available before attempting sign-in
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      toast.error("Firebase configuration missing", {
        description: "Please add your Firebase API keys to .env.local file",
      });
      console.error("Firebase API key is missing. Authentication will fail.");
      console.error("Make sure you have created a .env.local file with your Firebase credentials.");
      return;
    }

    await signIn();
    if (error) {
      // Show error with more helpful message
      toast.error("Authentication failed", {
        description: error,
        duration: 5000, // Show error for longer
      });
      console.error("Sign-in error:", error);
    } else {
      toast.success("Signed in successfully", {
        description: "Your account is now connected",
      });
    }
  };

  const handleSignOut = async () => {
    await logOut();
    if (error) {
      toast.error("Sign out failed", {
        description: error,
      });
    } else {
      toast.success("Signed out successfully");
    }
  };

  const handleSyncToCloud = async () => {
    const success = await syncToCloud();
    if (success) {
      toast.success("Sync to cloud successful", {
        description: "Your music metadata has been backed up to the cloud",
      });
    } else {
      toast.error("Sync to cloud failed", {
        description: "Please try again later",
      });
    }
  };

  const handleSyncFromCloud = async () => {
    const success = await syncFromCloud();
    if (success) {
      toast.success("Sync from cloud successful", {
        description: "Your music metadata has been restored from the cloud",
      });
    } else {
      toast.error("Sync from cloud failed", {
        description: "Please try again later",
      });
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    
    const date = new Date(lastSync);
    return date.toLocaleString();
  };

  if (!user) {
    // Show different button state if Firebase is not properly configured
    const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignIn}
        disabled={isLoading}
        title={!isFirebaseConfigured ? "Firebase configuration is missing" : "Sign in to sync your music metadata across devices"}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in 2'
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              className="w-4 h-4 rounded-full"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-primary" />
          )}
          {isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="truncate max-w-[100px]">
              {user.displayName || user.email?.split('@')[0] || 'User'}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col p-2">
          <p className="text-sm font-medium">{user.displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Last sync: {formatLastSync()}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSyncToCloud}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            'Sync to cloud'
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSyncFromCloud}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            'Sync from cloud'
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
