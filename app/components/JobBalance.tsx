"use client";

import { useState, useEffect } from 'react';
import { useJobData } from '@/hooks/contracts/useJobManager';

interface JobBalanceProps {
  jobId: string | null;
  currency?: string;
  className?: string;
  showLabel?: boolean;
  showCurrency?: boolean;
}

export default function JobBalance({
  jobId,
  currency = 'USDC',
  className = '',
  showLabel = true,
  showCurrency = true
}: JobBalanceProps) {
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    balance: jobBalance,
    isLoading: isJobDataLoading,
    error: jobDataError,
  } = useJobData(jobId);

  useEffect(() => {
    if (jobId && jobBalance !== undefined) {
      setBalance(jobBalance);
      setIsLoading(isJobDataLoading);
      setError(jobDataError);
    } else if (!jobId) {
      setBalance('0');
      setIsLoading(false);
      setError(null);
    }
  }, [jobId, jobBalance, isJobDataLoading, jobDataError]);

  const formatBalance = (balance: string): string => {
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) return '0';

    // Format with appropriate decimal places
    if (numBalance >= 1000) {
      return numBalance.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else if (numBalance >= 1) {
      return numBalance.toFixed(2);
    } else {
      return numBalance.toFixed(6).replace(/\.?0+$/, '');
    }
  };

  const getDisplayText = (): string => {
    if (isLoading) return 'Loading...';
    if (error) {
      console.warn('JobBalance error for jobId:', jobId, 'Error:', error);
      return `0 ${currency}`;  // Show 0 instead of error message
    }

    const formattedBalance = formatBalance(balance);
    const currencyText = showCurrency ? ` ${currency}` : '';
    const labelText = showLabel ? 'Balance: ' : '';

    return `${labelText}${formattedBalance}${currencyText}`;
  };

  const getStatusColor = (): string => {
    if (isLoading) return 'text-gray-500';
    if (error) return 'text-gray-600';  // Changed from red to gray for less alarm

    const numBalance = parseFloat(balance);
    if (numBalance === 0) return 'text-gray-600';
    if (numBalance > 0) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <span className={`${getStatusColor()} ${className}`} title={error || undefined}>
      {getDisplayText()}
    </span>
  );
}

// Export a simplified version for inline use
export function InlineJobBalance({ jobId, currency }: { jobId: string | null; currency?: string }) {
  return (
    <JobBalance
      jobId={jobId}
      currency={currency}
      className="text-sm font-medium"
      showLabel={false}
      showCurrency={true}
    />
  );
}