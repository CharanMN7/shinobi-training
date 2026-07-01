import { redirect } from "next/navigation";
import { RegisterForm } from "./register-form";

// Server component — enforces SINGLE_USER guard before any HTML is sent.
// The client-side NEXT_PUBLIC_SINGLE_USER check in register-form is a UX shortcut;
// this redirect is the authoritative gate.
export default function RegisterPage() {
  if (process.env.SINGLE_USER === "true") {
    redirect("/login");
  }

  return <RegisterForm />;
}
