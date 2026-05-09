import type { Metadata } from "next";

import { EditorHomeClient } from "@/components/editor/editor-home-client";

export const metadata: Metadata = {
  title: "Editor",
  description: "Create and manage architecture projects in the editor workspace.",
};

export default function EditorPage() {
  return <EditorHomeClient />;
}
