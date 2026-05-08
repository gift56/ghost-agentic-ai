import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-5 min-h-screen">
      <h1>ghost AI</h1>
      <Button variant="outline">Sign in with Google</Button>
    </div>
  );
}
