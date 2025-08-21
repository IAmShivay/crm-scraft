// app/leads/page.tsx

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import LeadManagement from "./leads-client";
import { LeadsSkeleton } from "./leads-skeleton";

// Optional: Use Edge runtime for fast global response
export const runtime = "edge";

// Time in seconds to revalidate API response
const REVALIDATION_TIME = 300;

// Optional cache headers (effective only if backend/CDN supports it)
const CACHE_HEADERS = {
  "Cache-Control": "max-age=300, stale-while-revalidate=600",
};

// Generate SEO metadata dynamically
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
      title: `Lead Management | ${workspaceName}`,
      description: "Manage and track your sales leads efficiently",
    };
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return fallbackMetadata;
  }
}

// Default fallback metadata
function getDefaultMetadata(): Metadata {
  return {
    title: "Lead Management | CRM Sales",
    description: "Manage and track your sales leads efficiently",
  };
}

// Page component
export default function LeadsPage() {
  return (
    <div className="leads-container">
      <Suspense fallback={<LeadsSkeleton />}>
        <LeadManagement />
      </Suspense>
    </div>
  );
}
