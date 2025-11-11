"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Mail, Wallet, Link, Check, AlertCircle, X } from "lucide-react";
import toast from "react-hot-toast";

interface AuthMethod {
  user_id: string;
  email?: string;
  wallet_address?: string;
  auth_method: "email" | "wallet" | "hybrid";
  merged_wallets?: string[];
  email_verified?: boolean;
}

interface DuplicateAccount {
  user_id: string;
  email?: string;
  wallet_address?: string;
  auth_method: string;
}

export const ProfileAuthManager = () => {
  const [authMethods, setAuthMethods] = useState<AuthMethod | null>(null);
  const [duplicateAccounts, setDuplicateAccounts] = useState<DuplicateAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const account = useActiveAccount();

  useEffect(() => {
    fetchAuthMethods();
    checkDuplicates();
  }, []);

  const fetchAuthMethods = async () => {
    try {
      const response = await fetch("/api/auth/add-email", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAuthMethods(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch auth methods:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkDuplicates = async () => {
    try {
      const response = await fetch("/api/auth/merge-accounts", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setDuplicateAccounts(data.duplicates || []);
      }
    } catch (error) {
      console.error("Failed to check duplicates:", error);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingEmail(true);

    try {
      const response = await fetch("/api/auth/add-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: newEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Email added successfully!");
        setAuthMethods(data.user);
        setShowAddEmail(false);
        setNewEmail("");
      } else if (response.status === 409) {
        // Email exists in another account
        if (data.suggestMerge) {
          const confirmMerge = confirm(
            `This email is already associated with another account. Would you like to merge these accounts?`
          );
          
          if (confirmMerge) {
            await mergeAccounts(data.existingAccount.userid);
          }
        }
      } else {
        toast.error(data.error || "Failed to add email");
      }
    } catch (error) {
      toast.error("Failed to add email");
    } finally {
      setIsAddingEmail(false);
    }
  };

  const mergeAccounts = async (secondaryAccountId: string) => {
    try {
      const response = await fetch("/api/auth/merge-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ secondaryAccountId }),
      });

      if (response.ok) {
        toast.success("Accounts merged successfully!");
        await fetchAuthMethods();
        await checkDuplicates();
        
        // Reload page to update session
        window.location.reload();
      } else {
        toast.error("Failed to merge accounts");
      }
    } catch (error) {
      toast.error("Failed to merge accounts");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const hasEmail = authMethods?.email;
  const hasWallet = authMethods?.wallet_address || account?.address;
  const isHybrid = authMethods?.auth_method === "hybrid";

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Authentication Methods</h2>

      {/* Current Auth Methods */}
      <div className="space-y-3 mb-6">
        {hasWallet && (
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-amber-600" />
              <div>
                <div className="font-medium">Wallet Connected</div>
                <div className="text-sm text-gray-600">
                  {(authMethods?.wallet_address || account?.address)?.slice(0, 6)}...
                  {(authMethods?.wallet_address || account?.address)?.slice(-4)}
                </div>
              </div>
            </div>
            <Check className="w-5 h-5 text-green-600" />
          </div>
        )}

        {hasEmail && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium">Email Connected</div>
                <div className="text-sm text-gray-600">{authMethods?.email}</div>
              </div>
            </div>
            {authMethods?.email_verified ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" title="Email not verified" />
            )}
          </div>
        )}

        {authMethods?.merged_wallets && authMethods.merged_wallets.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-5 h-5 text-gray-600" />
              <div className="font-medium">Linked Wallets</div>
            </div>
            <div className="space-y-1 ml-7">
              {authMethods.merged_wallets.map((wallet, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {wallet.slice(0, 6)}...{wallet.slice(-4)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Email Section (for wallet-only users) */}
      {!hasEmail && hasWallet && (
        <div className="mb-6">
          {!showAddEmail ? (
            <button
              onClick={() => setShowAddEmail(true)}
              className="w-full p-3 border-2 border-dashed border-amber-300 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Add Email for Account Recovery
            </button>
          ) : (
            <form onSubmit={handleAddEmail} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium">Add Email Address</h3>
                <button
                  type="button"
                  onClick={() => setShowAddEmail(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full p-2 border border-amber-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
              <button
                type="submit"
                disabled={isAddingEmail}
                className="w-full py-2 px-4 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAddingEmail ? "Adding..." : "Add Email"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Duplicate Accounts Warning */}
      {duplicateAccounts.length > 0 && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Duplicate Accounts Detected</h3>
              <p className="text-sm text-red-700 mt-1">
                We found other accounts that might belong to you. Consider merging them for a better experience.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {duplicateAccounts.map((acc) => (
              <div
                key={acc.user_id}
                className="flex items-center justify-between p-2 bg-white rounded border border-red-200"
              >
                <div className="text-sm">
                  {acc.email && <div>Email: {acc.email}</div>}
                  {acc.wallet_address && (
                    <div>
                      Wallet: {acc.wallet_address.slice(0, 6)}...{acc.wallet_address.slice(-4)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => mergeAccounts(acc.user_id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Merge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Authentication Methods</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Email addresses help with account recovery</li>
              <li>Multiple wallets can be linked to the same account</li>
              <li>You can sign in with any linked authentication method</li>
              {!isHybrid && hasWallet && !hasEmail && (
                <li className="font-medium">Adding an email is recommended for account security</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};