"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createClass(data: {
  name: string;
  year_group: number;
  exam_board: string;
  tier: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("classes").insert({
    teacher_id: user.id,
    name: data.name.trim(),
    year_group: data.year_group,
    exam_board: data.exam_board,
    tier: data.tier,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return {};
}
