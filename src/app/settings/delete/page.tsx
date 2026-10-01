import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DeleteAccountPanel } from "@/components/delete-account-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delete account",
};

export default async function DeleteAccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-md pt-8">
      <DeleteAccountPanel />
    </div>
  );
}
