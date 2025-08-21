import { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import ContactPage from "./contact-client";
import { ContactSkeleton } from "./contact-skeleton";

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
      title: `Contact Management | ${workspaceName}`,
      description: "Manage and track your contacts efficiently",
    };
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return fallbackMetadata;
  }
}

function getDefaultMetadata(): Metadata {
  return {
    title: "Contact Management | CRM Sales",
    description: "Manage and track your contacts efficiently",
  };
}

export default function Contact() {
  return (
    <div className="contact-container">
      <Suspense fallback={<ContactSkeleton />}>
        <ContactPage />
      </Suspense>
    </div>
  );
}
