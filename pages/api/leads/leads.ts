import { NextApiRequest, NextApiResponse } from "next";
import { AUTH_MESSAGES } from "@/lib/constant/auth";
import { supabase } from "../../../lib/supabaseServer";
import { validateEmail, validatePhoneNumber } from "../leads";
import { ActivityLogger } from "@/lib/services/activityLogger";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query, headers } = req;
  const action = query.action as string;
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
  }

  const token = authHeader.split(" ")[1];
  switch (method) {
    case "POST":
      switch (action) {
        case "createLead": {
          const body = req.body;
          console.log(body);
          console.log(body.name);

          if (!body || !body.name || !body.email) {
            return res
              .status(400)
              .json({ error: "Name and Email are required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          const { data: existingLeads, error: fetchError } = await supabase
            .from("leads")
            .select("created_at")
            .eq("email", body.email)
            .order("created_at", { ascending: false })
            .limit(1);

          if (fetchError) {
            return res
              .status(500)
              .json({ error: "Error checking existing leads" });
          }

          if (existingLeads.length > 0) {
            const existingLead = existingLeads[0];
            const createdAt = new Date(existingLead.created_at);
            const now = new Date();

            if (!isNaN(createdAt.getTime())) {
              const timeDifference =
                (now.getTime() - createdAt.getTime()) / (1000 * 60);

              if (timeDifference < 60) {
                return res.status(400).json({
                  error:
                    "A lead with this email was created less than an hour ago.",
                });
              }
            }
          }

          // Step 2: Validate email and phone
          const isValidEmail = await validateEmail(body.email);
          const isValidPhone = await validatePhoneNumber(body.phone);
          console.log(isValidEmail, isValidPhone);

          // Step 3: Insert new lead
          const { data, error } = await supabase.from("leads").insert([
            {
              name: body.name,
              email: body.email,
              phone: body.phone || null,
              status: {
                name: "Arrived",
                color: "#FFA500",
              },
              company: body.company || null,
              position: body.position || null,
              contact_method: body.contact_method || "Call",
              assign_to: null,
              lead_source_id: body.source_id || null,
              work_id: req.query.workspaceId,
              user_id: user.id,
              text_area: body.text_area || "",
              is_email_valid: isValidEmail,
              is_phone_valid: isValidPhone,
              created_at: new Date().toISOString(),
            },
          ]).select();

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          // Log the lead creation activity
          if (data && data.length > 0) {
            try {
              await ActivityLogger.logLeadCreated(
                req.query.workspaceId as string,
                user.id,
                user.email || '',
                {
                  id: data[0].id,
                  name: body.name,
                  email: body.email
                },
                undefined, // member name
                ActivityLogger.getClientIP(req),
                ActivityLogger.getUserAgent(req)
              );
            } catch (logError) {
              console.error('Failed to log lead creation activity:', logError);
              // Don't fail the request if logging fails
            }
          }

          return res.status(201).json({ data });
        }

        case "createManyLead": {
          const body = req.body;
          console.log(body);

          if (!Array.isArray(body) || body.length === 0) {
            return res
              .status(400)
              .json({ error: "At least one lead is required" });
          }

          const token = req.headers.authorization?.split(" ")[1];

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          const validLeads = await Promise.all(
            body.map(async (lead) => {
              if (!lead.name || !lead.email) return null;

              const isValidEmail = await validateEmail(lead.email);
              const isValidPhone = await validatePhoneNumber(lead.phone);

              return {
                name: lead.name,
                email: lead.email,
                phone: lead.phone || null,
                status: { name: "Arrived", color: "#FFA500" },
                company: lead.company || null,
                position: lead.position || null,
                contact_method: lead.contact_method || "Call",
                assign_to: null,
                lead_source_id: lead.sourceId || null,
                work_id: req.query.workspaceId,
                user_id: user.id,
                text_area: lead.text_area || "",
                is_email_valid: isValidEmail,
                is_phone_valid: isValidPhone,
                created_at: lead.createdAt
                  ? new Date(lead.createdAt).toISOString()
                  : new Date().toISOString(),
              };
            })
          );

          const filteredLeads = validLeads.filter(Boolean);

          if (filteredLeads.length === 0) {
            return res.status(400).json({ error: "No valid leads provided" });
          }

          // Insert multiple leads into Supabase
          const { data, error } = await supabase
            .from("leads")
            .insert(filteredLeads);

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          return res.status(201).json({ data });
        }

        case "updateNotesById": {
          const { id } = query; // Extract ID from query parameters
          const body = req.body; // Extract body payload

          if (!id) {
            return res.status(400).json({ error: "Lead ID is required" });
          }

          if (!body) {
            return res
              .status(400)
              .json({ error: "Update data is required in 'text_area' field" });
          }
          // Authenticate the user using Supabase
          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          // Update the `leads` table
          const { data, error } = await supabase
            .from("leads")
            .update({ text_area: body }) // Update the `text_area` field
            .eq("id", id) // Match the ID
            .select();
          // .eq("user_id", user.id); // Ensure the user owns the record

          if (error) {
            console.error("Supabase Update Error:", error.message);
            return res.status(400).json({ error: error.message });
          }

          return res.status(200).json({ data });
        }
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

    case "PUT":
      switch (action) {
        case "updateLeadById": {
          const { id } = query;
          const body = req.body;
          console.log(body, id); // Debug to check received data

          if (!id) {
            return res.status(400).json({ error: "Lead ID is required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          if (!body || Object.keys(body).length === 0) {
            return res.status(400).json({ error: "Update data is required" });
          }
          const updatedBody = {
            ...body, // Spread other fields dynamically
            status: body.status,
            tags: body.tags ? JSON.stringify(body.tags) : undefined, // Convert only if tags exist
          };

          const { data, error } = await supabase
            .from("leads")
            // .update({ status: body })
            .update(updatedBody)
            .eq("id", id)
            .select();

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          return res.status(200).json({ data });
        }

        case "assignRoleById": {
          const { id } = query;
          const body = req.body;
          if (!id) {
            return res.status(400).json({ error: "Lead ID is required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          if (!body) {
            return res.status(400).json({ error: "Update data is required" });
          }

          const { data, error } = await supabase
            .from("leads")
            .update({ assign_to: body })
            .eq("id", id)
            .select();
          // .eq("user_id", user.id);

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          // Log lead assignment activity
          try {
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user && data) {
              await ActivityLogger.logActivity({
                workspace_id: data[0]?.work_id?.toString() || '',
                user_id: user.id,
                member_email: user.email || '',
                member_name: user.user_metadata?.name || user.user_metadata?.firstName,
                activity_type: 'lead_updated' as any,
                activity_description: `Lead assigned to ${body} by ${user.email}`,
                metadata: {
                  lead_id: id.toString(),
                  assigned_to: body,
                },
                ip_address: ActivityLogger.getClientIP(req),
                user_agent: ActivityLogger.getUserAgent(req),
              });
            }
          } catch (logError) {
            console.error('Failed to log lead assignment activity:', logError);
          }

          return res.status(200).json({ data });
        }
        case "updateLeadData": {
          const { id } = query;
          const body = req.body;
          if (!id) {
            return res.status(400).json({ error: "Lead ID is required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          if (!body) {
            return res.status(400).json({ error: "Update data is required" });
          }

          const { data, error } = await supabase
            .from("leads")
            .update(body)
            .eq("id", id)
            .select();
          // .eq("user_id", user.id);

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          // Log lead update activity
          try {
            await ActivityLogger.logActivity({
              workspace_id: body.work_id?.toString() || '',
              user_id: user.id,
              member_email: user.email || '',
              member_name: user.user_metadata?.name || user.user_metadata?.firstName,
              activity_type: 'lead_updated' as any,
              activity_description: `Lead updated by ${user.email}`,
              metadata: {
                lead_id: id.toString(),
                lead_name: body.name || body.first_name,
                lead_email: body.email,
                changes: body,
              },
              ip_address: ActivityLogger.getClientIP(req),
              user_agent: ActivityLogger.getUserAgent(req),
            });
          } catch (logError) {
            console.error('Failed to log lead update activity:', logError);
          }

          return res.status(200).json({ data });
        }
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

    case "GET":
      switch (action) {
        case "getLeads": {
          const sourceId = query.sourceId as string;
          const {
            data: { user },
          } = await supabase.auth.getUser(token);
          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }
          if (!sourceId) {
            return res.status(400).json({ error: "Source ID is required" });
          }

          if (!user) {
            return res.status(400).json({ error: "User ID is required" });
          }

          const { data, error } = await supabase
            .from("leads")
            .select("*")
            .eq("source_id", sourceId);
          // .eq("user_id", user.id);

          if (error) {
            return res.status(400).json({ error: error.message });
          }
          return res.status(200).json({ data });
        }

        case "getLeadsByUser": {
          const userId = query.userId as string;

          if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
          }

          const { data, error } = await supabase.from("leads").select("*");
          // .eq("user_id", userId);

          if (error) {
            return res.status(400).json({ error: error.message });
          }
          return res.status(200).json({ data });
        }

        case "getLeadsByWorkspace": {
          const workspaceId = query.workspaceId as string;
          const {
            data: { user },
          } = await supabase.auth.getUser(token);
          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }
          if (!workspaceId) {
            return res.status(400).json({ error: "Workspace ID is required" });
          }

          if (!user) {
            return res.status(400).json({ error: "User ID is required" });
          }

          const { data, error } = await supabase
            .from("leads")
            .select("*")
            .eq("work_id", workspaceId);
          // .eq("user_id", user.id);

          if (error) {
            return res.status(400).json({ error: error.message });
          }
          return res.status(200).json({ data });
        }

        case "getLeadById": {
          const id = query.id as string;

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          if (!user) {
            return res.status(400).json({ error: "User ID is required" });
          }

          const { data, error } = await supabase
            .from("leads")
            .select("*")
            // .eq("user_id", user.id)
            .eq("id", id);
          if (error) {
            return res.status(400).json({ error: error.message });
          }

          return res.status(200).json({ data });
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }
    case "getNotesById": {
      const id = query.id as string;
      console.log(query);

      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (!user) {
        return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
      }

      if (!id) {
        return res.status(400).json({ error: "Lead ID is required" });
      }

      // Fetching only the 'text_area' column from the 'leads' table
      const { data, error } = await supabase
        .from("leads")
        .select("text_area") // Select only the 'text_area' field
        // .eq("user_id", user.id)
        .eq("id", id);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: "No notes found for this lead" });
      }

      return res.status(200).json({ data });
    }
    default:
      return res.status(405).json({
        error: AUTH_MESSAGES.API_ERROR,
        message: `Method ${method} is not allowed.`,
      });
    case "DELETE": {
      if (action === "deleteLeads") {
        const { id, workspaceId } = req.body;

        if (!id || !Array.isArray(id) || id.length === 0) {
          return res
            .status(400)
            .json({ error: "A list of Lead IDs is required" });
        }

        if (!workspaceId) {
          return res.status(400).json({ error: "Workspace ID is required" });
        }

        // Authenticate the user
        const {
          data: { user },
        } = await supabase.auth.getUser(token);

        if (!user) {
          return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
        }

        // First check if user is workspace owner
        const { data: workspaceData, error: workspaceError } = await supabase
          .from("workspaces")
          .select("owner_id")
          .eq("id", workspaceId)
          .single();

        if (workspaceError) {
          console.error("Workspace Check Error:", workspaceError.message);
          return res.status(400).json({ error: workspaceError.message });
        }

        const isWorkspaceOwner = workspaceData?.owner_id === user.id;

        // If not workspace owner, check if user is admin
        if (!isWorkspaceOwner) {
          const { data: memberData, error: memberError } = await supabase
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", workspaceId)
            .eq("user_id", user.id)
            .single();

          if (memberError) {
            console.error("Workspace Member Check Error:", memberError.message);
            return res.status(400).json({ error: memberError.message });
          }

          const isAdmin =
            memberData?.role === "admin" || memberData?.role === "SuperAdmin";

          if (!isAdmin) {
            return res.status(403).json({
              error: "Only workspace owners and admins can delete leads",
            });
          }
        }

        // Proceed with deletion if authorized
        const { data, error } = await supabase
          .from("leads")
          .delete()
          .in("id", id)
          .eq("work_id", workspaceId);

        if (error) {
          console.error("Supabase Delete Error:", error.message);
          return res.status(400).json({ error: error.message });
        }

        // Log lead deletion activity
        try {
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            await ActivityLogger.logActivity({
              workspace_id: workspaceId.toString(),
              user_id: user.id,
              member_email: user.email || '',
              member_name: user.user_metadata?.name || user.user_metadata?.firstName,
              activity_type: 'lead_deleted' as any,
              activity_description: `${id.length} lead(s) deleted by ${user.email}`,
              metadata: {
                resource_type: 'lead',
                additional_info: {
                  deleted_lead_ids: id,
                  deleted_count: id.length,
                },
              },
              ip_address: ActivityLogger.getClientIP(req),
              user_agent: ActivityLogger.getUserAgent(req),
            });
          }
        } catch (logError) {
          console.error('Failed to log lead deletion activity:', logError);
        }

        return res.status(200).json({
          message: "Leads deleted successfully",
          data,
        });
      }

      return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  }
}
