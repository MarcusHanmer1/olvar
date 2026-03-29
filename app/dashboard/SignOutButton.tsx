"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
      style={{
        border: "1px solid #e5e5e4",
        color: "#6b6b67",
        backgroundColor: "#ffffff",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#1c1c1a";
        (e.currentTarget as HTMLElement).style.color = "#1c1c1a";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e4";
        (e.currentTarget as HTMLElement).style.color = "#6b6b67";
      }}
    >
      Sign out
    </button>
  );
}
