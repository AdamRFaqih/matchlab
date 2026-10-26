import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { homePathFor } from "@/lib/auth/guards";
import { getInvitationByToken } from "@/modules/team/service";
import { SignupForm } from "@/modules/auth/components/SignupForm";

export const metadata: Metadata = {
  title: "Daftar Akun Baru",
  description: "Daftar akun MatchLab untuk merekrut atau melamar pekerjaan.",
};

export default async function SignupPage(props: {
  searchParams: Promise<{ next?: string; type?: string; invite?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await getSession();

  if (user) {
    redirect(searchParams.next || homePathFor(user));
  }

  let inviteEmail: string | undefined;
  if (searchParams.invite) {
    const inv = await getInvitationByToken(searchParams.invite);
    if (inv) {
      inviteEmail = inv.email;
    }
  }

  const initialType = searchParams.type === "company" ? "COMPANY_USER" : "JOB_SEEKER";

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-muted/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight mb-2">
          <span className="p-2 rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="w-5 h-5" />
          </span>
          <span>MatchLab</span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Buat Akun MatchLab
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href={`/login${searchParams.next ? `?next=${encodeURIComponent(searchParams.next)}` : ""}`}
            className="font-semibold text-primary hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border py-8 px-6 shadow-xs rounded-2xl sm:px-8">
          <SignupForm
            initialType={initialType}
            inviteToken={searchParams.invite}
            inviteEmail={inviteEmail}
            nextPath={searchParams.next}
          />
        </div>
      </div>
    </div>
  );
}
