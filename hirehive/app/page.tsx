import { redirect } from "next/navigation";

// The home address "/" has no content of its own.
// We send everyone to the login page.
export default function Home() {
  redirect("/login");
}
