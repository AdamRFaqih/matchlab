import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Building2, UserPlus, LogIn } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getInvitationByToken, ORG_ROLE_LABEL } from "@/modules/team/service";
import { normalizeEmail } from "@/modules/auth/service";
import { buttonVariants } from "@/components/ui/button";
import { AcceptInviteForm } from "@/modules/auth/components/AcceptInviteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Undangan Bergabung ke Tim",
};

export default async function InvitePage(props: {
  params: Promise<{ token: string }>;
}) {
  const params = await props.params;
  const invitation = await getInvitationByToken(params.token);

  if (!invitation) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 bg-muted/20 text-center">
        <div className="bg-card border p-8 rounded-2xl max-w-md w-full shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-foreground">Undangan Tidak Ditemukan</h2>
          <p className="text-sm text-muted-foreground">
            Tautan undangan ini sudah kedaluwarsa, ditarik oleh pengundang, atau telah digunakan.
          </p>
          <Link href="/" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const currentUser = await getSession();
  const roleTitle = ORG_ROLE_LABEL[invitation.orgRole];

  if (currentUser?.memberships.some((m) => m.organizationId === invitation.organizationId)) {
    redirect("/dashboard");
  }

  const isMatchingEmail =
    currentUser && normalizeEmail(currentUser.email) === invitation.email;

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-muted/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight mb-2">
          <span className="p-2 rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="w-5 h-5" />
          </span>
          <span>MatchLab</span>
        </Link>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border py-8 px-6 shadow-xs rounded-2xl sm:px-8 space-y-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Building2 className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Undangan Bergabung ke Tim
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">
                {invitation.invitedBy?.name || "Admin"}
              </span>{" "}
              mengundang Anda bergabung ke{" "}
              <span className="font-semibold text-foreground">
                {invitation.organization.name}
              </span>{" "}
              sebagai <span className="font-semibold text-primary">{roleTitle}</span>.
            </p>
          </div>

          {currentUser ? (
            isMatchingEmail ? (
              <AcceptInviteForm token={params.token} />
            ) : (
              <div className="space-y-4 text-left p-4 rounded-xl bg-muted/50 border text-xs">
                <p className="text-foreground">
                  Anda saat ini masuk sebagai{" "}
                  <strong className="text-primary">{currentUser.email}</strong>, tetapi undangan ini dikirimkan untuk{" "}
                  <strong>{invitation.email}</strong>.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    href={`/login?next=${encodeURIComponent(`/invite/${params.token}`)}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Ganti Akun ke {invitation.email}
                  </Link>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-3">
              <Link
                href={`/signup?invite=${params.token}`}
                className={buttonVariants({ className: "w-full gap-2" })}
              >
                <UserPlus className="w-4 h-4" />
                Buat Akun untuk {invitation.email}
              </Link>
              <Link
                href={`/login?next=${encodeURIComponent(`/invite/${params.token}`)}`}
                className={buttonVariants({ variant: "outline", className: "w-full gap-2" })}
              >
                <LogIn className="w-4 h-4" />
                Masuk jika sudah memiliki akun
              </Link>
            </div>
          )}

          <div className="text-[11px] text-muted-foreground pt-2">
            Undangan berlaku hingga {new Date(invitation.expiresAt).toLocaleDateString("id-ID")}
          </div>
        </div>
      </div>
    </div>
  );
}
