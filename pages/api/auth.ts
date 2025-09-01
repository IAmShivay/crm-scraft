import { NextApiRequest, NextApiResponse } from "next";
import { AUTH_MESSAGES } from "@/lib/constant/auth";
import { supabase } from "../../lib/supabaseServer";
import { ActivityLogger } from "@/lib/services/activityLogger";
import { logger } from "@/lib/logger";

interface AuthRequestBody {
  email?: string;
  password?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body, query } = req;
  const action = query.action as string;

  switch (method) {
    case "POST": {
      if (!action) {
        return res.status(400).json({ error: AUTH_MESSAGES.SIGNUP_FAILED });
      }

      const { email, password }: AuthRequestBody = body;

      switch (action) {
        case "signup": {
          if (!email || !password) {
            return res.status(400).json({ error: AUTH_MESSAGES.SIGNUP_FAILED });
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          return res
            .status(200)
            .json({ user: data.user, message: AUTH_MESSAGES.SIGNUP_SUCCESS });
        }

        // case "acceptInvite": {
        //   try {
        //     const { email, workspaceId } = query;

        //     if (!email || !workspaceId) {
        //       return res
        //         .status(400)
        //         .json({ error: "Email and Workspace ID are required" });
        //     }

        //     // Fetch users
        //     const { data: userData, error: userError } =
        //       await supabase.auth.admin.listUsers();

        //     if (userError) {
        //       console.error("Error fetching users:", userError.message);
        //       return res.status(500).json({ error: "Failed to fetch users" });
        //     }

        //     const targetEmail = email;
        //     const matchingUsers = userData.users.filter(
        //       (user) => user.email === targetEmail
        //     );

        //     if (matchingUsers.length > 0) {
        //       console.log("Matching user(s) found:", matchingUsers);

        //       // Update workspace membership
        //       const { data: updateData, error: updateError } = await supabase
        //         .from("workspace_members")
        //         .update({
        //           status: "accepted",
        //           user_id: matchingUsers[0]?.id,
        //           name:
        //             matchingUsers[0]?.user_metadata.name ||
        case "signin": {
          if (!email || !password) {
            return res.status(400).json({ error: AUTH_MESSAGES.LOGIN_FAILED });
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          logger.debug(data);
          if (error) {
            return res.status(400).json({ error: error.message });
          }
          await supabase.auth.setSession(data.session);

          // Login activity will be logged in getActiveWorkspace to avoid duplicates
          logger.debug("Auth API: User authenticated successfully");

          return res
            .status(200)
            .json({ user: data.user, message: AUTH_MESSAGES.LOGIN_SUCCESS });
        }

        case "signout": {
          // Get user info before signing out for activity logging
          const token = req.headers.authorization?.split("Bearer ")[1];
          let userForLogging = null;
          let workspaceForLogging = null;

          if (token) {
            try {
              const { data: { user } } = await supabase.auth.getUser(token);
              if (user) {
                userForLogging = user;
                // Get user's active workspace
                const { data: memberData } = await supabase
                  .from("workspace_members")
                  .select("workspace_id, workspaces(name)")
                  .eq("user_id", user.id)
                  .eq("is_active", true)
                  .eq("status", "accepted")
                  .single();
                workspaceForLogging = memberData;
              }
            } catch (getUserError) {
              logger.error('Auth API: Failed to get user for logout logging:', getUserError);
            }
          }

          const { error } = await supabase.auth.signOut();

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          // Log logout activity
          logger.debug("Auth API: Logging logout activity");
          try {
            await ActivityLogger.logActivity({
              workspace_id: workspaceForLogging.workspace_id.toString(),
              user_id: userForLogging.id,
              member_email: userForLogging.email || '',
              member_name: userForLogging.user_metadata?.name || userForLogging.user_metadata?.firstName,
              activity_type: 'logout' as any,
              activity_description: `${userForLogging.email} logged out`,
              metadata: {
                workspace_name: (workspaceForLogging.workspaces as any)?.name,
              },
              ip_address: ActivityLogger.getClientIP(req),
              user_agent: ActivityLogger.getUserAgent(req),
            });
            logger.debug("Auth API: Logout activity logged successfully");
          } catch (logError) {
            logger.error('Auth API: Failed to log logout activity:', logError);
          }

          return res
            .status(200)
            .json({ message: AUTH_MESSAGES.LOGOUT_SUCCESS });
        }
        case "verify": {
          const token = req.headers.authorization?.split("Bearer ")[1]; // Extract token

          if (!token) {
            return res
              .status(401)
              .json({ error: AUTH_MESSAGES.INVALID_LOGIN_DATA });
          }

          try {
            const { data, error } = await supabase.auth.getUser(token);

            if (error) {
              return res
                .status(401)
                .json({ error: AUTH_MESSAGES.INVALID_LOGIN_DATA });
            }

            return res.status(200).json({ user: data });
          } catch (error) {
            logger.error(error);
            return res.status(500).json({ error: AUTH_MESSAGES.API_ERROR });
          }
        }
        default:
          return res.status(400).json({ error: AUTH_MESSAGES.API_ERROR });
      }
    }

    case "GET": {
      if (!action) {
        return res.status(400).json({ error: AUTH_MESSAGES.API_ERROR });
      }

      switch (action) {
        case "acceptInvite": {
          try {
            const { email, workspaceId } = query;

            if (!email || !workspaceId) {
              res
                .status(400)
                .json({ error: "Email and Workspace ID are required" });
              break;
            }

            const { data: pendingInvite, error: inviteError } = await supabase
              .from("workspace_members")
              .select("*")
              .eq("workspace_id", workspaceId)
              .eq("email", email)
              .single();

            if (inviteError) {
              logger.error(
                "Error checking pending invite:",
                inviteError.message
              );
              res.status(500).json({ error: "Failed to check pending invite" });
              break;
            }

            if (!pendingInvite) {
              res.status(404).json({ error: "No pending invite found" });
              break;
            }

            const { data: userData, error: userError } =
              await supabase.auth.admin.listUsers();

            if (userError) {
              logger.error("Error fetching users:", userError.message);
              res.status(500).json({ error: "Failed to fetch users" });
              break;
            }

            const matchingUser = userData.users.find(
              (user) => user.email === email
            );

            if (matchingUser) {
              const { error: updateError } = await supabase
                .from("workspace_members")
                .update({
                  status: "accepted",
                  user_id: matchingUser.id,
                  name:
                    matchingUser.user_metadata?.name ||
                    matchingUser.user_metadata?.name?.first_name,
                  updated_at: new Date().toISOString(),
                })
                .eq("workspace_id", workspaceId)
                .eq("email", email);

              if (updateError) {
                logger.error(
                  "Error updating workspace membership:",
                  updateError.message
                );
                res
                  .status(500)
                  .json({ error: "Failed to update workspace membership" });
                break;
              }

              res.setHeader("Location", "/dashboard");
              res.status(302).end();
            } else {
              res.setHeader(
                "Location",
                `/signup?email=${email}&workspaceId=${workspaceId}`
              );
              res.status(302).end();
            }
          } catch (error: any) {
            logger.error("Unexpected error:", error.message);
            res.status(500).json({ error: "An unexpected error occurred" });
          }
          break;
        }
        default:
          return res.status(400).json({ error: AUTH_MESSAGES.API_ERROR });
      }
    }

    default:
      return res.status(405).json({ error: AUTH_MESSAGES.API_ERROR });
  }
}
