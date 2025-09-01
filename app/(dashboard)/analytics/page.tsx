import { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { AnalyticsClient } from "./analytics-client";
import { AnalyticsSkeleton } from "./analytics-skeleton";
import ErrorBoundary from "@/components/error/ErrorBoundary";

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
      // Silent error handling for metadata - don't log in production
      return fallbackMetadata;
    }

    const data = await response.json();
    const workspaceName = data?.data?.name || "CRM Sales";

    return {
      title: `Analytics Dashboard | ${workspaceName}`,
      description:
        "View detailed analytics and performance metrics for your sales activities",
    };
  } catch (error) {
    // Silent error handling for metadata - don't log in production
    return fallbackMetadata;
  }
}

function getDefaultMetadata(): Metadata {
  return {
    title: "Analytics Dashboard | CRM Sales",
    description:
      "View detailed analytics and performance metrics for your sales activities",
  };
}

// Main page component
export default function AnalyticsPage() {
  return (
    <div className="analytics-container">
      <ErrorBoundary>
        <Suspense fallback={<AnalyticsSkeleton />}>
          <AnalyticsClient />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
