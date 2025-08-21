import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Enable Edge Runtime for faster API responses
export const runtime = "edge";

// Cache the API response but revalidate every 5 minutes
export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const workspaceId = searchParams.get("workspaceId");

    // Get the session token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // Base URL for your API
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

    // Special case for aggregated data - fetch everything in one request
    if (action === "aggregated") {
      if (!workspaceId) {
        return NextResponse.json(
          { error: "Workspace ID required" },
          { status: 400 }
        );
      }

      try {
        // Fetch all dashboard data in parallel
        const [revenueResponse, rocResponse, qualifiedResponse, countResponse] =
          await Promise.all([
            fetch(
              `${baseUrl}/api/workspace/workspace?action=getLeadsRevenueByWorkspace&workspaceId=${workspaceId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                next: { revalidate: 300 },
              }
            ),
            fetch(
              `${baseUrl}/api/workspace/workspace?action=getTotalLeadsCount&workspaceId=${workspaceId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                next: { revalidate: 300 },
              }
            ),
            fetch(
              `${baseUrl}/api/workspace/workspace?action=getQualifiedLeadsCount&workspaceId=${workspaceId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                next: { revalidate: 300 },
              }
            ),
            fetch(
              `${baseUrl}/api/workspace/workspace?action=getArrivedLeadsCount&workspaceId=${workspaceId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                next: { revalidate: 300 },
              }
            ),
          ]);

        // Parse all responses
        const [revenue, roc, qualified, count] = await Promise.all([
          revenueResponse.json(),
          rocResponse.json(),
          qualifiedResponse.json(),
          countResponse.json(),
        ]);

        // Fetch webhooks data if we have a top source ID
        let webhooks = null;
        if (roc?.top_source_id) {
          const webhooksResponse = await fetch(
            `${baseUrl}/api/webhooks/webhooks?action=getWebhooksBySourceId&sourceId=${roc.top_source_id}&workspaceId=${workspaceId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              next: { revalidate: 300 },
            }
          );
          webhooks = await webhooksResponse.json();
        }

        // Combine all data into a single response
        const aggregatedData = {
          revenue,
          roc,
          qualified,
          count,
          webhooks,
        };

        // Return with aggressive caching headers for CDNs
        return NextResponse.json(aggregatedData, {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
          },
        });
      } catch (error) {
        console.error("Dashboard aggregated API error:", error);
        return NextResponse.json(
          { error: "Error fetching aggregated data" },
          { status: 500 }
        );
      }
    }

    // Handle individual endpoint requests (original functionality)
    let url = "";
    let cacheControl = "public, s-maxage=300, stale-while-revalidate=60"; // Default cache for 5 minutes

    switch (action) {
      case "getActiveWorkspace":
        url = `${baseUrl}/api/workspace/workspace?action=getActiveWorkspace`;
        // Active workspace changes less frequently
        cacheControl = "public, s-maxage=600, stale-while-revalidate=60";
        break;
      case "getRevenueByWorkspace":
        url = `${baseUrl}/api/workspace/workspace?action=getLeadsRevenueByWorkspace&workspaceId=${workspaceId}`;
        break;
      case "getROCByWorkspace":
        url = `${baseUrl}/api/workspace/workspace?action=getTotalLeadsCount&workspaceId=${workspaceId}`;
        break;
      case "getQualifiedCount":
        url = `${baseUrl}/api/workspace/workspace?action=getQualifiedLeadsCount&workspaceId=${workspaceId}`;
        break;
      case "getCountByWorkspace":
        url = `${baseUrl}/api/workspace/workspace?action=getArrivedLeadsCount&workspaceId=${workspaceId}`;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          }
        );
    }

    // Fetch data from the API with optimized caching
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip", // Enable response compression
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    const data = await response.json();

    // Return response with appropriate cache headers
    return NextResponse.json(data, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
