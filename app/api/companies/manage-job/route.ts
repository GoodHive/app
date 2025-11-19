import sql from "@/lib/db";

export async function PATCH(request: Request) {
  const {
    jobId,
    publish,
    in_saving_stage,
    blockchainJobId,
    paymentTokenAddress,
  } = await request.json();

  try {
    // Check if the job exists
    const existingJob = await sql`
      SELECT id FROM goodhive.job_offers WHERE id = ${jobId};
    `;

    if (existingJob.length === 0) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
      });
    }

    // Update the published status and in_saving_stage
    const normalizedBlockchainJobId = (() => {
      if (blockchainJobId === undefined) {
        return undefined;
      }

      if (blockchainJobId === null || blockchainJobId === "") {
        return null;
      }

      const parsedValue = Number(blockchainJobId);
      return Number.isNaN(parsedValue) ? undefined : parsedValue;
    })();

    // Update only core fields that should exist in the basic schema
    await sql`
      UPDATE goodhive.job_offers
      SET published = ${publish},
          in_saving_stage = ${
            in_saving_stage !== undefined
              ? in_saving_stage
              : sql`in_saving_stage`
          }
      WHERE id = ${jobId};
    `;

    // Try to update blockchain-related fields if they exist
    if (normalizedBlockchainJobId !== undefined) {
      try {
        await sql`
          UPDATE goodhive.job_offers
          SET block_id = ${normalizedBlockchainJobId}
          WHERE id = ${jobId};
        `;
      } catch (blockIdError) {
        console.warn("Could not update block_id, column may not exist:", blockIdError.message);
      }
    }

    if (paymentTokenAddress !== undefined) {
      try {
        await sql`
          UPDATE goodhive.job_offers
          SET payment_token_address = ${paymentTokenAddress || null}
          WHERE id = ${jobId};
        `;
      } catch (tokenAddressError) {
        console.warn("Could not update payment_token_address, column may not exist:", tokenAddressError.message);
      }
    }

    const responsePayload: Record<string, unknown> = {
      jobId,
      published: publish,
      in_saving_stage: in_saving_stage,
      message: publish
        ? "Job published successfully"
        : "Job unpublished successfully",
    };

    if (normalizedBlockchainJobId !== undefined) {
      responsePayload.block_id = normalizedBlockchainJobId;
    }

    if (paymentTokenAddress !== undefined) {
      responsePayload.payment_token_address = paymentTokenAddress || null;
    }

    return new Response(JSON.stringify(responsePayload), { status: 200 });
  } catch (error) {
    console.error("Error updating publish status:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update publish status" }),
      { status: 500 },
    );
  }
}
