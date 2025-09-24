"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DashboardLayout() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="d-flex flex-column vh-100">
      <nav className="navbar navbar-dark bg-dark px-3 d-flex justify-content-between">
        <span className="navbar-brand mb-0 h1">🏥 HMS Dashboard</span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white small">{session?.user?.name}</span>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
      <main className="flex-grow-1 p-4 bg-light">main</main>
    </div>
  );
}
