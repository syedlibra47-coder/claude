// Supabase Edge Function: invite-user
//
// Handles the two admin-only user-management actions that need the
// service-role key (which must never reach the browser):
//   - { action: "invite", email, fullName, role, agentId } -> creates the
//     login (Supabase sends the invite email) and its user_profiles row.
//   - { action: "delete", userId } -> removes the login and its profile.
//
// The admin panel calls this via supabase.functions.invoke('invite-user',
// { body: {...} }), which automatically attaches the caller's session JWT.
//
// Deploy: Supabase Dashboard -> Edge Functions -> Create a function
// named "invite-user" -> paste this file's contents -> Deploy.
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided automatically,
// no manual secrets needed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    // Scoped to the caller's own JWT, purely to identify who is calling.
    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerAuth, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !callerAuth?.user) return json({ error: "Not authenticated" }, 401);

    // Privileged client for everything else -- never exposed to the browser.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: callerProfile } = await adminClient
      .from("user_profiles")
      .select("role")
      .eq("id", callerAuth.user.id)
      .maybeSingle();
    const callerRole = callerProfile?.role;
    if (!callerRole || !["admin", "super_admin"].includes(callerRole)) {
      return json({ error: "Not authorized to manage users" }, 403);
    }

    const body = await req.json();

    if (body.action === "delete") {
      const targetId = body.userId;
      if (!targetId) return json({ error: "userId is required" }, 400);
      if (targetId === callerAuth.user.id) return json({ error: "You can't delete your own account" }, 400);

      const { data: targetProfile } = await adminClient
        .from("user_profiles")
        .select("role")
        .eq("id", targetId)
        .maybeSingle();
      if (targetProfile?.role === "super_admin" && callerRole !== "super_admin") {
        return json({ error: "Only a super admin can remove another super admin" }, 403);
      }

      const { error: delErr } = await adminClient.auth.admin.deleteUser(targetId);
      if (delErr) return json({ error: delErr.message }, 400);
      // user_profiles row cascades on auth.users delete (foreign key on delete cascade).
      return json({ success: true });
    }

    // Default action: invite a new user.
    const email = (body.email || "").trim().toLowerCase();
    const fullName = (body.fullName || "").trim();
    const role = body.role;
    const agentId = body.agentId || null;

    if (!email || !role) return json({ error: "email and role are required" }, 400);
    if (!["super_admin", "admin", "agent"].includes(role)) {
      return json({ error: "Invalid role" }, 400);
    }
    if (role === "super_admin" && callerRole !== "super_admin") {
      return json({ error: "Only a super admin can create another super admin" }, 403);
    }

    const { data: invited, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email);
    if (inviteErr) return json({ error: inviteErr.message }, 400);

    const { error: profileErr } = await adminClient.from("user_profiles").insert({
      id: invited.user.id,
      email,
      full_name: fullName,
      role,
      agent_id: agentId,
    });
    if (profileErr) {
      // Roll back the auth user so a failed profile insert doesn't leave an
      // orphaned login with no role.
      await adminClient.auth.admin.deleteUser(invited.user.id);
      return json({ error: profileErr.message }, 400);
    }

    return json({ success: true, userId: invited.user.id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
