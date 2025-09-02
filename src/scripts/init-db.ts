import { initDB } from "@/lib/database"

async function main() {
  try {
    console.log("🚀 Starting database initialization...")
    console.log("Environment check:")
    console.log("- DB_HOST:", process.env.DB_HOST || "not set")
    console.log("- DB_USER:", process.env.DB_USER || "not set")
    console.log("- DB_PASSWORD:", process.env.DB_PASSWORD ? "***set***" : "not set")

    await initDB()
    console.log("✅ Database initialization completed successfully!")

    // Test database connection
    console.log("🧪 Testing database connection...")
    const { DatabaseService } = await import("@/lib/database")

    // Try to fetch all requests to test connection
    const mintRecords = await DatabaseService.getAllMintRecords()
    const redeemRequests = await DatabaseService.getAllRedeemRequests()

    console.log(`📊 Database status:`)
    console.log(`- Mint records: ${mintRecords.length}`)
    console.log(`- Redeem requests: ${redeemRequests.length}`)

    console.log("✅ Database connection test successful!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Database initialization failed:")
    console.error("Error details:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    process.exit(1)
  }
}

main()
