import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { BrainCircuit, Share2, ScrollText } from "lucide-react";

import { AuthShell, type AuthFeature } from "@/components/auth/auth-shell";

const signInFeatures: AuthFeature[] = [
  {
    icon: BrainCircuit,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: ScrollText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export const metadata: Metadata = {
  title: "Sign In | Ghost AI",
  description: "Sign in to Ghost AI to access your collaborative architecture workspace.",
};

export default function SignInPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your architecture workspace."
      panelTitle={
        <>
          Design systems at the
          <br />
          speed of thought.
        </>
      }
      panelDescription="Describe your architecture in plain English. Ghost AI maps it to a shared canvas your whole team can refine in real time."
      features={signInFeatures}
    >
      <SignIn
        routing="path"
        path="/sign-in"
        oauthFlow="redirect"
        forceRedirectUrl="/editor"
        fallbackRedirectUrl="/editor"
        signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
      />
    </AuthShell>
  );
}
