export { auth as proxy } from "@/src/lib/auth";

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js|workbox-.*|login|register).*)",
  ],
};
