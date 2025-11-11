import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
    const {
      jobId,
      blockchainJobId,
      tokenAddress,
      balance,
      transactionHash,
      transactionType,
      amount,
      fromAddress,
      blockNumber
    } = await request.json();

    if (!jobId || !blockchainJobId || !tokenAddress || balance === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update job balance
    const balanceUpdateResult = await sql`
      UPDATE goodhive.job_balances
      SET
        balance = ${balance},
        total_deposited = CASE
          WHEN ${transactionType} = 'add_funds' THEN total_deposited + ${amount || 0}
          ELSE total_deposited
        END,
        total_withdrawn = CASE
          WHEN ${transactionType} = 'withdraw_funds' THEN total_withdrawn + ${amount || 0}
          ELSE total_withdrawn
        END,
        total_fees_paid = CASE
          WHEN ${transactionType} = 'pay_fees' THEN total_fees_paid + ${amount || 0}
          ELSE total_fees_paid
        END,
        last_sync_block = ${blockNumber},
        last_sync_at = CURRENT_TIMESTAMP
      WHERE job_id = ${jobId} AND blockchain_job_id = ${blockchainJobId} AND token_address = ${tokenAddress}
      RETURNING id
    `;

    // If balance record doesn't exist, create it
    if (balanceUpdateResult.length === 0) {
      await sql`
        INSERT INTO goodhive.job_balances (
          job_id,
          blockchain_job_id,
          token_address,
          balance,
          total_deposited,
          total_withdrawn,
          total_fees_paid,
          last_sync_block
        ) VALUES (
          ${jobId},
          ${blockchainJobId},
          ${tokenAddress},
          ${balance},
          ${transactionType === 'add_funds' ? (amount || 0) : 0},
          ${transactionType === 'withdraw_funds' ? (amount || 0) : 0},
          ${transactionType === 'pay_fees' ? (amount || 0) : 0},
          ${blockNumber}
        )
      `;
    }

    // Record transaction if provided
    if (transactionHash && transactionType) {
      await sql`
        INSERT INTO goodhive.job_transactions (
          job_id,
          blockchain_job_id,
          transaction_hash,
          transaction_type,
          amount,
          token_address,
          from_address,
          block_number,
          status
        ) VALUES (
          ${jobId},
          ${blockchainJobId},
          ${transactionHash},
          ${transactionType},
          ${amount},
          ${tokenAddress},
          ${fromAddress},
          ${blockNumber},
          'confirmed'
        )
        ON CONFLICT (transaction_hash) DO UPDATE SET
          status = 'confirmed',
          block_number = ${blockNumber}
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Balance updated successfully"
    });

  } catch (error) {
    console.error("Error updating balance:", error);
    return NextResponse.json(
      { error: "Failed to update balance" },
      { status: 500 }
    );
  }
}
