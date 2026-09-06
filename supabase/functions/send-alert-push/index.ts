import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type AlertPayload = {
  alert_id: string;
  farm_id: string;
  severity: "yellow" | "red" | "info";
  type: string;
  message: string;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: secrets, error: secretsError } = await supabase.rpc("get_push_secrets");
  if (secretsError || !secrets?.vapid_public_key || !secrets?.vapid_private_key || !secrets?.push_webhook_secret) {
    console.error("secrets unavailable", secretsError);
    return new Response("secrets unavailable", { status: 500 });
  }

  const providedSecret = req.headers.get("x-webhook-secret") ?? "";
  if (providedSecret !== secrets.push_webhook_secret) {
    return new Response("unauthorized", { status: 401 });
  }

  let payload: AlertPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  webpush.setVapidDetails(
    "mailto:dennychrisst@gmail.com",
    secrets.vapid_public_key,
    secrets.vapid_private_key
  );

  const { data: recipients, error: recipientsError } = await supabase
    .from("profiles")
    .select("id")
    .eq("farm_id", payload.farm_id)
    .in("role", ["owner", "admin"])
    .eq("active", true);

  if (recipientsError) {
    console.error("recipients query failed", recipientsError);
    return new Response("recipients query failed", { status: 500 });
  }

  const userIds = (recipients ?? []).map((r: { id: string }) => r.id);
  if (userIds.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no recipients" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: subs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (subsError) {
    console.error("subscriptions query failed", subsError);
    return new Response("subscriptions query failed", { status: 500 });
  }

  const notificationBody = JSON.stringify({
    title: payload.severity === "red" ? "⚠️ Alert Penting - LayerFarm" : "LayerFarm Alert",
    body: payload.message,
    tag: payload.type,
  });

  const results = await Promise.allSettled(
    (subs ?? []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          notificationBody
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id);
        }
        throw err;
      }
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { "Content-Type": "application/json" },
  });
});
