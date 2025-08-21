import { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { LeadSourceManagerClient } from "./leads-sources-client";
import { LeadSourcesSkeleton } from "./leads-sources-skeleton";

export const runtime = "edge";

const REVALIDATION_TIME = 300;

const CACHE_HEADERS = {
  "Cache-Control": "max-age=300, stale-while-revalidate=600",
};

export async function generateMetadata(): Promise<Metadata> {
  const fallbackMetadata = getDefaultMetadata();

  try {
    const cookieStore = cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) return fallbackMetadata;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(
      `${baseUrl}/api/workspace/workspace?action=getActiveWorkspace`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...CACHE_HEADERS,
        },
        next: { revalidate: REVALIDATION_TIME },
      }
    );

    if (!response.ok) {
      console.error("API error:", response.status);
      return fallbackMetadata;
    }

    const data = await response.json();
    const workspaceName = data?.data?.name || "CRM Sales";

    return {
      title: `Lead Sources | ${workspaceName}`,
      description: "Manage your lead sources and webhooks",
    };
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return fallbackMetadata;
  }
}

function getDefaultMetadata(): Metadata {
  return {
    title: "Lead Sources | CRM Sales Dashboard",
    description: "Manage your lead sources and webhooks",
  };
}

export default function LeadSourcesPage() {
  return (
    <div className="lead-sources-container">
      <Suspense fallback={<LeadSourcesSkeleton />}>
        <LeadSourceManagerClient />
      </Suspense>
    </div>
  );
}
