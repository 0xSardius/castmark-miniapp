"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { sdk } from "@farcaster/frame-sdk";
import { supabase, User } from "../../lib/supabase";

interface ContextUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface UserContextType {
  dbUser: User | null;
  contextUser: ContextUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  showAuthPrompt: () => Promise<boolean>;
  hideAuthPrompt: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [contextUser, setContextUser] = useState<ContextUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthPromptVisible, setIsAuthPromptVisible] = useState(false);

  // Get basic user context from the Frame SDK
  useEffect(() => {
    const getContextUser = async () => {
      try {
        // Extract user info from SDK context if available
        const context = await sdk.context;
        if (context?.user?.fid) {
          setContextUser({
            fid: context.user.fid,
            // Use the correct property names from the SDK documentation
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
          });
        }
      } catch (err) {
        console.error("Error getting context user:", err);
      }
    };

    getContextUser();
  }, []);

  // Load user data when session changes
  useEffect(() => {
    const loadUser = async () => {
      if (status === "loading") return;

      if (session?.user?.fid) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("fid", session.user.fid)
            .single();

          if (error) throw error;

          if (data) {
            setDbUser(data);
          } else {
            // User exists in auth but not in our DB
            // You might want to create the user here
            console.warn("User authenticated but not found in database");
          }
        } catch (err) {
          console.error("Error loading user data:", err);
        }
      }

      setLoading(false);
    };

    loadUser();
  }, [session, status]);

  const refreshUser = async () => {
    if (!session?.user?.fid) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("fid", session.user.fid)
        .single();

      if (error) throw error;

      if (data) {
        setDbUser(data);
      }
    } catch (err) {
      console.error("Error refreshing user data:", err);
    }
  };

  const showAuthPrompt = async (): Promise<boolean> => {
    if (!!session?.user?.fid) return true;

    setIsAuthPromptVisible(true);
    return false;
  };

  const hideAuthPrompt = () => {
    setIsAuthPromptVisible(false);
  };

  return (
    <UserContext.Provider
      value={{
        dbUser,
        contextUser,
        loading: loading || status === "loading",
        isAuthenticated: !!session?.user?.fid,
        showAuthPrompt,
        hideAuthPrompt,
        refreshUser,
      }}
    >
      {children}
      {isAuthPromptVisible && <AuthPrompt onCancel={hideAuthPrompt} />}
    </UserContext.Provider>
  );
}

function AuthPrompt({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Sign in required</h2>
        <p className="mb-4 text-gray-600">
          You need to sign in with Farcaster to access this feature. Your
          bookmarks will be saved to your account.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <SignInButton />
        </div>
      </div>
    </div>
  );
}

function SignInButton() {
  const handleSignIn = async () => {
    try {
      // Generate a random nonce
      const nonce = Math.random().toString(36).substring(2);

      // Get the Farcaster signature
      const { message, signature } = await sdk.actions.signIn({ nonce });

      // Sign in with Next-Auth
      window.location.href = `/api/auth/callback/credentials?message=${encodeURIComponent(
        message
      )}&signature=${encodeURIComponent(signature)}&callbackUrl=%2F`;
    } catch (error) {
      console.error("Sign-in failed:", error);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      className="px-4 py-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700"
    >
      Sign in with Farcaster
    </button>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
