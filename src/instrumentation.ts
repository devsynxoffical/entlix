export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureAdminUser } = await import("./lib/ensureAdmin");
    await ensureAdminUser().catch((err) => {
      console.error("Admin bootstrap error:", err);
    });
  }
}
