import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_SEED_PASSWORD;
const allowRemote = process.env.ALLOW_REMOTE_DEMO_SEED === "true";

if (!supabaseUrl || !serviceRoleKey || !password) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or DEMO_SEED_PASSWORD in .env.local.",
  );
}

if (password.length < 12) {
  throw new Error("DEMO_SEED_PASSWORD must contain at least 12 characters.");
}

const hostname = new URL(supabaseUrl).hostname;
const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
if (!isLocal && !allowRemote) {
  throw new Error(
    "Refusing to seed a remote Supabase project. Use a dedicated development/staging project and explicitly set ALLOW_REMOTE_DEMO_SEED=true to continue.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const demoUsers = [
  { email: "mizan.demo.client@example.com", name: "Demo Client", locale: "en", role: null },
  { email: "mizan.demo.lawyer@example.com", name: "Demo Lawyer", locale: "en", role: "lawyer" },
  { email: "mizan.demo.assistant@example.com", name: "Demo Assistant", locale: "en", role: "assistant" },
  { email: "mizan.demo.admin@example.com", name: "Demo Administrator", locale: "en", role: "admin" },
  { email: "mizan.demo.owner@example.com", name: "Demo Office Owner", locale: "en", role: "owner" },
];

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 100) return null;
  }
  throw new Error("Reached the user pagination safety limit while searching for demo users.");
}

for (const demo of demoUsers) {
  const existing = await findUserByEmail(demo.email);
  let user;

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: demo.name, locale: demo.locale },
    });
    if (error) throw new Error(`Could not update ${demo.email}: ${error.message}`);
    user = data.user;
    console.log(`Updated demo account: ${demo.email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: demo.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: demo.name, locale: demo.locale },
    });
    if (error) throw new Error(`Could not create ${demo.email}: ${error.message}`);
    user = data.user;
    console.log(`Created demo account: ${demo.email}`);
  }

  if (!user) throw new Error(`Supabase returned no user for ${demo.email}`);

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: demo.name, locale: demo.locale }, { onConflict: "id" });
  if (profileError) throw new Error(`Could not upsert profile for ${demo.email}: ${profileError.message}`);

  if (demo.role) {
    const { error: staffError } = await supabase
      .from("staff_members")
      .upsert({ profile_id: user.id, role: demo.role, status: "active" }, { onConflict: "profile_id" });
    if (staffError) throw new Error(`Could not assign ${demo.role} to ${demo.email}: ${staffError.message}`);
  } else {
    // Keep the client demo account from retaining any previous staff assignment.
    const { error: staffError } = await supabase.from("staff_members").delete().eq("profile_id", user.id);
    if (staffError) throw new Error(`Could not clear staff assignment for ${demo.email}: ${staffError.message}`);
  }
}

console.log("\nDemo account seed completed. Use only in a dedicated development/staging Supabase project.");
console.log("The script is repeatable and does not delete non-demo users.");
