import { useState } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { atom, login, logout } from "../data/data.session";

const RootLayout = () => {
  const active = useAtomValue(atom).member;
  const [busy, setBusy] = useState(false);

  if (!active) {
    return (
      <form
        onSubmit={async (e) => {
          e?.preventDefault();
          const form = new FormData(e.currentTarget);
          const email = String(form.get("email"));
          const password = String(form.get("password"));
          setBusy(true);
          const response = await login({ email, password });
          if (!response) alert("Invalid login details");
          setBusy(false);
        }}
      >
        <input placeholder="Email" name="email" disabled={busy} />

        <input
          name="password"
          placeholder="Password"
          type="password"
          disabled={busy}
        />

        <button type="submit" disabled={busy}>
          {busy ? "Checking..." : "LOG IN"}
        </button>
      </form>
    );
  }

  return (
    <>
      <button onClick={logout}>LOG OUT</button>
      <Outlet />
    </>
  );
};

export const Route = createRootRoute({ component: RootLayout });
