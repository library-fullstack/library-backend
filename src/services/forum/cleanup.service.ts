import fs from "fs";
import path from "path";

export async function cleanupOrphanedTempFiles(): Promise<void> {
  const tempDir = "uploads/forum/temp";
  const maxAge = 24 * 60 * 60 * 1000;
  const now = Date.now();

  try {
    if (!fs.existsSync(tempDir)) {
      console.log("Temp directory does not exist");
      return;
    }

    const userDirs = fs.readdirSync(tempDir);

    for (const userId of userDirs) {
      const userTempPath = path.join(tempDir, userId);
      const stats = fs.statSync(userTempPath);

      if (!stats.isDirectory()) continue;

      const files = fs.readdirSync(userTempPath);

      for (const file of files) {
        const filePath = path.join(userTempPath, file);
        const fileStats = fs.statSync(filePath);

        if (now - fileStats.mtimeMs > maxAge) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Deleted orphaned temp file: ${filePath}`);
          } catch (err) {
            console.error(`Failed to delete file ${filePath}:`, err);
          }
        }
      }

      try {
        const remainingFiles = fs.readdirSync(userTempPath);
        if (remainingFiles.length === 0) {
          fs.rmdirSync(userTempPath);
          console.log(`Removed empty user temp directory: ${userTempPath}`);
        }
      } catch (err) {}
    }

    console.log("Orphaned temp files cleanup completed");
  } catch (err) {
    console.error("Error during temp files cleanup:", err);
  }
}

export function scheduleCleanupJob(): void {
  const interval = 12 * 60 * 60 * 1000;

  cleanupOrphanedTempFiles();

  setInterval(() => {
    cleanupOrphanedTempFiles();
  }, interval);

  console.log("Cleanup job scheduled to run every 12 hours");
}
