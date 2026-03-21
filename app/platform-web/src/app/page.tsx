"use client";

import { useAuthenticate } from "@daveyplate/better-auth-ui";

export default function Page() {
  const auth = useAuthenticate();
  return <div>{JSON.stringify(auth, null, 4)}</div>;
}
