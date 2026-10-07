import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";

export default async function PreviewPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }
  redirect("/display");
}
