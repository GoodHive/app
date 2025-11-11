"use client";

import React from "react";

interface OptimizedJobBalanceProps {
  jobId?: string; // UUID string
  blockId?: number;
  currency?: string;
  className?: string;
  amount?: number; // Add amount prop to allow passing actual balance
}

export const OptimizedJobBalance: React.FC<OptimizedJobBalanceProps> = ({
  jobId,
  blockId,
  currency = "",
  className = "",
  amount,
}) => {
  // Hardcoded placeholder for now
  const displayAmount = "0.00";

  // Function to get proper currency symbol from contract address or currency string
  const getCurrencySymbol = (currencyInput: string): string => {
    // If it's a contract address (starts with 0x), return a default symbol
    if (currencyInput.startsWith("0x")) {
      return "ETH"; // Default to ETH for contract addresses
    }

    // Handle common currency cases
    switch (currencyInput.toUpperCase()) {
      case "EUR":
      case "€":
        return "€";
      case "USD":
      case "$":
        return "$";
      case "ETH":
        return "ETH";
      case "BTC":
        return "BTC";
      default:
        return "ETH"; // Default fallback
    }
  };

  const displayCurrency = getCurrencySymbol(currency);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#FFC905]/15 to-amber-200/60 border border-[#FFC905]/30 rounded-lg px-2.5 py-1 shadow-sm backdrop-blur-sm">
        <div className="w-1.5 h-1.5 bg-[#FFC905] rounded-full"></div>
        <span className="text-xs font-medium text-[#FFC905]">
          {displayAmount} {displayCurrency}
        </span>
      </div>
    </div>
  );
};

export default OptimizedJobBalance;