import { clerkMiddleware } from "@clerk/nextjs/server";

const signInPath = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";
const signUpPath = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up";

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const isPublicRoute =
    pathname === signInPath ||
    pathname.startsWith(`${signInPath}/`) ||
    pathname === signUpPath ||
    pathname.startsWith(`${signUpPath}/`);

  if (!isPublicRoute) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
