/**
 * Auth helper — TEST_AUTH bypass for local dev.
 * In production, swap to NextAuth getServerSession.
 */
export async function getSession(): Promise<{ userId: string } | null> {
  if (process.env.TEST_AUTH === "true") {
    const userId = process.env.TEST_USER_ID;
    if (!userId) return null;
    return { userId };
  }
  // Production: delegate to NextAuth
  // const { getServerSession } = await import("next-auth");
  // const session = await getServerSession(authOptions);
  // return session?.user?.id ? { userId: session.user.id } : null;
  return null;
}
