"use client";

import { useParams } from "next/navigation";
import { JobWorkspace } from "@/components/JobWorkspace";

export default function Page() {
  const params = useParams<{ id: string }>();
  return <JobWorkspace jobId={params.id} />;
}
