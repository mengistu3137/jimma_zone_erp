(async () => {
  try {
    const appModule = await import("./src/app.js");
    const { prisma } = await import("./src/config/database.js");
    const app = appModule.default;

    // Connect Prisma database
    await prisma.$connect();
    console.log("Prisma Database connected successfully!");

    if (process.env.NODE_ENV === "production") {
      // For cPanel production - use the port provided by cPanel
      const port = process.env.PORT || 3000;
      app.listen(port, () => {
        console.log(` Jimmazone Server running in production mode on port ${port}`);
      });
    } else {
      const port = process.env.PORT || 5000;
      app.listen(port, () => {
        console.log(` Jimmazone Server running locally on port ${port} - http://localhost:${port}`);
      });
    }

    // Graceful shutdown for production
    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...');
      await prisma.$disconnect();
      process.exit(0);
    });

  } catch (err) {
    console.error("Error loading app:", err);
    process.exit(1);
  }
})();