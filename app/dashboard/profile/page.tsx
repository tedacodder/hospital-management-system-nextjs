import { requirePageSession } from "@/lib/auth";
import ProfileClient from "./ProfileClient";

// No role restriction — every signed-in role has a profile to edit.
export default async function Page() {
  await requirePageSession();
  return <ProfileClient />;
}
