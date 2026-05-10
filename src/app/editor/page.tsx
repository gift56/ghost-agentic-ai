import type { Metadata } from "next";

import { EditorHomeClient } from "@/components/editor/editor-home-client";
import { getEditorHomeProjects } from "@/lib/project-data";

export const metadata: Metadata = {
  title: "Editor",
  description: "Create and manage architecture projects in the editor workspace.",
};

export default async function EditorPage() {
  const { ownedProjects, sharedProjects } = await getEditorHomeProjects();

  return (
    <EditorHomeClient
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}
