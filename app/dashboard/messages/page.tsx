import { requirePageSession } from "@/lib/auth";
import MessagesClient from "./MessagesClient";

// No role restriction — every account can message. Authorization for which
// conversations and messages are visible happens per-row in the API via
// conversation participation, not by role.
export default async function Page() {
  await requirePageSession();
  return <MessagesClient />;
}
