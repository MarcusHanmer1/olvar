"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TemplateQuestion = {
  max_marks: number;
  topic: string;
};

export type Template = {
  id: string;
  name: string;
  questions: TemplateQuestion[];
};

export async function getTemplates(): Promise<Template[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("assessment_templates")
    .select("id, name, questions")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as Template[];
}

export async function saveTemplate(
  name: string,
  questions: TemplateQuestion[]
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!name.trim()) return { error: "Template name is required" };

  const { error } = await supabase.from("assessment_templates").insert({
    teacher_id: user.id,
    name: name.trim(),
    questions,
  });

  if (error) return { error: error.message };

  revalidatePath("/class");
  return {};
}

export async function deleteTemplate(
  templateId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("assessment_templates")
    .delete()
    .eq("id", templateId)
    .eq("teacher_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/class");
  return {};
}
