import { redirect } from "next/navigation";

// Public signup removed — send everyone to sign in
export default function RegisterPage() {
  redirect("/auth/signin");
}
