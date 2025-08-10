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
    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parse.error.flatten() },
        { status: 400 },
      );
    }
    const { email } = parse.data;

    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e: any) {
      return NextResponse.json(
        { error: "Admin client init failed", details: e?.message },
        { status: 500 },
      );
    }

    try {
      const supabaseSSR = await createSSRClient();
      const { data: { user } } = await supabaseSSR.auth.getUser();

      const payload: Record<string, unknown> = {
        memory_L0: "",
        memory_L1: "",
        memory_L2: "",
        questionnaire: {},
      };

      if (user) {
        payload.email = user.email;
        payload.auth_user_id = user.id;
      } else if (email) {
        payload.email = email;
      } else {
        return NextResponse.json(
          { error: "No email or authenticated user provided" },
          { status: 400 },
        );
      }

      const { error } = await supabase
        .from("users_table")
        .upsert(payload, { onConflict: "email" });

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


