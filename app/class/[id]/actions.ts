"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addStudent(
  classId: string,
  data: { name: string; target_grade: number }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("students").insert({
    class_id: classId,
    name: data.name.trim(),
    target_grade: data.target_grade,
  });

  if (error) return { error: error.message };

  revalidatePath(`/class/${classId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function updateStudent(
  studentId: string,
  classId: string,
  data: { name: string; target_grade: number }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("students")
    .update({ name: data.name.trim(), target_grade: data.target_grade })
    .eq("id", studentId);

  if (error) return { error: error.message };

  revalidatePath(`/class/${classId}`);
  return {};
}

export async function deleteStudent(
  studentId: string,
  classId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId);

  if (error) return { error: error.message };

  revalidatePath(`/class/${classId}`);
  revalidatePath("/dashboard");
  return {};
}
