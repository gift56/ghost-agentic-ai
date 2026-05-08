import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { BrainCircuit, Share2, ScrollText } from "lucide-react";

import { AuthShell, type AuthFeature } from "@/components/auth/auth-shell";

const signUpFeatures: AuthFeature[] = [
  {
    icon: BrainCircuit,
    title: "Start With AI Guidance",
    description:
      "Turn your idea into an initial architecture map before manual refinements.",
  },
  {
    icon: Share2,
    title: "Collaborate From Day One",
    description:
      "Invite teammates to review, edit, and align on system decisions in one place.",
  },
  {
    icon: ScrollText,
    title: "Ship Better Specs Faster",
    description:
      "Generate exportable documentation directly from your evolving architecture graph.",
  },
];

export const metadata: Metadata = {
  title: "Sign Up | Ghost AI",
  description: "Create your Ghost AI account to start building architecture diagrams with your team.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create account"
      subtitle="Start building with your team."
      panelTitle={
        <>
          Bring your system ideas
          <br />
          into a shared workspace.
        </>
      }
      panelDescription="Create an account to map architecture visually, collaborate live, and keep implementation aligned across your team."
      features={signUpFeatures}
    >
      <SignUp
        routing="path"
        path="/sign-up"
        oauthFlow="redirect"
        forceRedirectUrl="/editor"
        fallbackRedirectUrl="/editor"
        signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      />
    </AuthShell>
  );
}
