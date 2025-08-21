import { NextApiRequest, NextApiResponse } from "next";
import { AUTH_MESSAGES } from "@/lib/constant/auth";
import { supabase } from "../../../lib/supabaseServer";
import { sendMail } from "@/lib/sendmail";
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
        case "addMember": {
          const { workspaceId } = query;
          const { data: members } = req.body;
          const { email, role, status } = members;
          if (!workspaceId || !members) {
            return res
              .status(400)
              .json({ error: "Workspace ID and User ID are required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }
          const { data: existingMember, error: existingError } = await supabase
            .from("workspace_members")
            .select("*")
            .eq("workspace_id", workspaceId)
            .eq("email", email);

          if (existingMember && existingMember.length > 0) {
            return res.status(400).json({
              error: "User is already a member of this workspace",
            });
          }
          const { data: currentMember, error: memberError } = await supabase
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", workspaceId)
            .eq("email", user.email)
            .single();

          if (memberError || currentMember.role === "member") {
            return res.status(403).json({
              error: "You must be a admin of this workspace to add new members",
            });
          }

          const { data, error } = await supabase
            .from("workspace_members")
            .insert({
              workspace_id: workspaceId,
              role: role,
              added_by: user?.id,
              email: email,
              status: status,
            })
            .select('*')
            .single();
          await sendMail(
            email,
            "You have been added to a workspace",
            `
              <p>You have been added to a workspace. Please login to your account to view the workspace.</p>
                  <p><strong>Note:</strong> Your invitation expires in 2 hours.</p>
              <a href="${process.env.PUBLIC_URL}api/auth?workspaceId=${workspaceId}&email=${email}&status=${status}&action=acceptInvite" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; font-size: 16px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block;">
                Accept Invite
              </a>
              `
          );

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          // Log the member addition activity
          try {
            await ActivityLogger.logMemberAdded(
              workspaceId as string,
              user.id,
              user.email || '',
              email,
              role,
              undefined, // member name (we don't have it here)
              undefined, // target member name
              ActivityLogger.getClientIP(req),
              ActivityLogger.getUserAgent(req)
            );
          } catch (logError) {
            console.error('Failed to log member addition activity:', logError);
            // Don't fail the request if logging fails
          }

          return res.status(200).json({ data });
        }
        case "resendInvitation": {
          const { workspaceId, email: rawEmail, status }: any = query;
          const email = rawEmail ? rawEmail.trim() : '';

          if (!workspaceId || !email) {
            return res
              .status(400)
              .json({ error: "Workspace ID and email are required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          // Check if sender is admin
          const { data: currentMember, error: memberError } = await supabase
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", workspaceId)
            .eq("email", user.email)
            .single();

          if (memberError || currentMember.role === "member") {
            return res.status(403).json({
              error:
                "You must be an admin of this workspace to resend invitations",
            });
          }

          // Check if member exists and get their status
          const { data: existingMember, error: existingError } = await supabase
            .from("workspace_members")
            .select("status")
            .eq("workspace_id", workspaceId)
            .eq("email", email)
            .single();

          if (!existingMember) {
            return res.status(404).json({
              error: "Member not found in this workspace",
            });
          }
          // Resend the invitation email
          await sendMail(
            email,
            "You have been added to a workspace",
            `
              <p>You have been added to a workspace. Please login to your account to view the workspace.</p>
              <a href="${process.env.PUBLIC_URL}api/auth?workspaceId=${workspaceId}&email=${email}&status=${status}&action=acceptInvite" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; font-size: 16px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block;">
                Accept Invite
              </a>
              `
          );
          console.log(existingMember, "roka", existingError)

          // Log invitation resend activity
          try {
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
              await ActivityLogger.logActivity({
                workspace_id: workspaceId.toString(),
                user_id: user.id,
                member_email: user.email || '',
                member_name: user.user_metadata?.name || user.user_metadata?.firstName,
                activity_type: 'member_invite_resent' as any,
                activity_description: `Invitation resent to ${email} by ${user.email}`,
                metadata: {
                  target_member_email: email,
                  new_status: status,
                },
                ip_address: ActivityLogger.getClientIP(req),
                user_agent: ActivityLogger.getUserAgent(req),
              });
            }
          } catch (logError) {
            console.error('Failed to log invitation resend activity:', logError);
          }

          return res.status(200).json({
            message: "Invitation email resent successfully",
          });
        }
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

    case "DELETE":
      switch (action) {
        case "removeMember": {
          const { workspaceId, id: memberId } = query;

          if (!workspaceId || !memberId) {
            return res
              .status(400)
              .json({ error: "Workspace ID and Member ID are required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          // First check if the user is the workspace owner
          const { data: workspace, error: workspaceError } = await supabase
            .from("workspaces")
            .select("owner_id")
            .eq("id", workspaceId)
            .single();

          if (workspaceError) {
            return res.status(400).json({ error: workspaceError.message });
          }

          // Get the details of the member being removed
          const { data: memberToRemove, error: memberError } = await supabase
            .from("workspace_members")
            .select("role, email, name")
            .eq("workspace_id", workspaceId)
            .eq("id", memberId)
            .single();

          if (memberError) {
            return res.status(400).json({ error: memberError.message });
          }

          // If user is not the owner, check their role in workspace_members
          if (workspace.owner_id !== user.id) {
            const { data: userRole, error: roleError } = await supabase
              .from("workspace_members")
              .select("role")
              .eq("workspace_id", workspaceId)
              .eq("user_id", user.id)
              .single();

            if (roleError) {
              return res.status(400).json({ error: roleError.message });
            }

            // Check if user has sufficient privileges
            if (
              !userRole ||
              (userRole.role !== "SuperAdmin" && userRole.role !== "admin")
            ) {
              return res.status(403).json({
                error:
                  "Unauthorized to remove member. Must be workspace owner, superAdmin, or admin",
              });
            }

            // If user is admin, prevent removing SuperAdmin members
            if (
              userRole.role === "admin" &&
              memberToRemove.role === "SuperAdmin"
            ) {
              return res.status(403).json({
                error: "Admins cannot remove SuperAdmin members",
              });
            }
          }

          // Prevent deletion of workspace owner
          if (workspace.owner_id === memberId) {
            return res.status(403).json({
              error: "Cannot remove workspace owner",
            });
          }

          // If all checks pass, proceed with member removal
          const { data, error } = await supabase
            .from("workspace_members")
            .delete()
            .eq("workspace_id", workspaceId)
            .eq("id", memberId);

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          // Log member removal activity
          try {
            await ActivityLogger.logActivity({
              workspace_id: workspaceId.toString(),
              user_id: user.id,
              member_email: user.email || '',
              member_name: user.user_metadata?.name || user.user_metadata?.firstName,
              activity_type: 'member_removed' as any,
              activity_description: `Member ${memberToRemove.email || 'Unknown'} removed from workspace by ${user.email}`,
              metadata: {
                target_member_email: memberToRemove.email,
                old_role: memberToRemove.role,
              },
              ip_address: ActivityLogger.getClientIP(req),
              user_agent: ActivityLogger.getUserAgent(req),
            });
          } catch (logError) {
            console.error('Failed to log member removal activity:', logError);
            // Don't fail the request if logging fails
          }

          return res.status(200).json({ data });
        }
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

    case "PUT":
      switch (action) {
        case "updateMemberRole": {
          const { workspaceId, memberId } = query;
          const { role } = req.body;

          if (!workspaceId || !memberId || !role) {
            return res.status(400).json({
              error: "Workspace ID, Member ID, and role are required",
            });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          // Check if user is admin
          const { data: adminCheck } = await supabase
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", workspaceId)
            .eq("user_id", user.id)
            .single();

          if (
            !adminCheck ||
            (adminCheck.role !== "admin" && adminCheck.role !== "SuperAdmin")
          ) {
            return res
              .status(403)
              .json({ error: "Only admins can update member roles" });
          }

          // Get the current member data before updating
          const { data: currentMember } = await supabase
            .from("workspace_members")
            .select("role, email")
            .eq("workspace_id", workspaceId)
            .eq("id", memberId)
            .single();

          const { data, error } = await supabase
            .from("workspace_members")
            .update({ role })
            .eq("workspace_id", workspaceId)
            .eq("id", memberId);

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          // Log the role change activity
          if (currentMember) {
            try {
              await ActivityLogger.logMemberRoleChanged(
                workspaceId as string,
                user.id,
                user.email || '',
                currentMember.email,
                currentMember.role,
                role,
                undefined, // member name
                ActivityLogger.getClientIP(req),
                ActivityLogger.getUserAgent(req)
              );
            } catch (logError) {
              console.error('Failed to log member role change activity:', logError);
              // Don't fail the request if logging fails
            }
          }

          return res.status(200).json({ data });
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

    case "GET":
      switch (action) {
        case "getWorkspaceMembers": {
          const { workspaceId } = query;
          if (!workspaceId) {
            return res.status(400).json({ error: "Workspace ID is required" });
          }

          const { data, error } = await supabase
            .from("workspace_members")
            .select()
            .eq("workspace_id", workspaceId);

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          return res.status(200).json({ data });
        }

        case "getMemberRole": {
          const { workspaceId } = query;

          if (!workspaceId) {
            return res
              .status(400)
              .json({ error: "Workspace ID and User ID are required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          console.log("user", user);
          const { data, error } = await supabase
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", workspaceId)
            .eq("user_id", user.id)
            .single();

          if (error) {
            return res.status(400).json({ error: error.message });
          }
          return res.status(200).json({ data });
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

    default:
      return res.status(405).json({
        error: AUTH_MESSAGES.API_ERROR,
        message: `Method ${method} is not allowed.`,
      });
  }
}
