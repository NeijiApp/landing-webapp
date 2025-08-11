export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createAdminClient } from "~/utils/supabase/admin";
import { createClient as createSSRClient } from "~/utils/supabase/server";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const schema = z.object({ email: z.string().email().optional() });
    const parse = schema.safeParse(body);
    const email = parse.success ? parse.data.email : undefined;

    // Try to initialize admin client, but allow fallback to SSR client if missing SERVICE_ROLE
    let supabaseAdmin: ReturnType<typeof createAdminClient> | null = null;
    try {
      supabaseAdmin = createAdminClient();
    } catch (e: any) {
      // Continue without admin; we'll use SSR client instead
    }

    try {
      const supabaseSSR = await createSSRClient();
      const { data: { user }, error: authError } = await supabaseSSR.auth.getUser();

      // Create payload with only columns that definitely exist
      const payload: Record<string, unknown> = {};

      if (user) {
        payload.email = user.email;
        // Try to add auth_user_id if the column exists
        payload.auth_user_id = user.id;
      } else if (email) {
        payload.email = email;
      } else {
        return NextResponse.json(
          { error: "No email or authenticated user provided" },
          { status: 400 },
        );
      }

      // Add default values for user profile columns
      payload.memory_L0 = "";
      payload.memory_L1 = "";
      payload.memory_L2 = "";
      payload.questionnaire = {};

      // Choose DB client: admin preferred, fallback to SSR client
      const dbClient = supabaseAdmin ?? supabaseSSR;

      // First attempt with full payload
      let { error } = await dbClient
        .from("users_table")
        .upsert(payload, { onConflict: "email" });

      // Fallback: if any column doesn't exist, retry with minimal payload
      if (error && typeof error.message === "string") {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes("column") || errorMsg.includes("does not exist")) {
          // Create minimal payload with only guaranteed columns (id + email)
          const minimalPayload: Record<string, unknown> = {};
          if (user) {
            minimalPayload.email = user.email;
          } else if (email) {
            minimalPayload.email = email;
          }
          
          const retry = await dbClient
            .from("users_table")
            .upsert(minimalPayload, { onConflict: "email" });
          error = retry.error ?? null;
        }
      }

      if (error) {
        return NextResponse.json(
          { error: "Upsert failed", details: error.message },
          { status: 500 },
        );
      }
    } catch (e: any) {
      return NextResponse.json(
        { error: "Database error", details: e?.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unexpected error", details: err?.message },
      { status: 500 },
    );
  }
}


