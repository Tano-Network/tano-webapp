import mysql from "mysql2/promise"
import { v4 as uuidv4 } from "uuid"

// Database schema types
export interface MintRequest {
  id: string
  evmAddress: string
  evmChain: string
  evmChainId: number
  vaultId: string
  vaultChain: string
  userVaultChainAddress: string
  amount: string
  utxo: string
  transactionHash: string
  whitelisted: boolean
  mintTxLink?: string
  proof: string
  createdAt: string
  updatedAt: string
  status: "pending" | "verified" | "whitelisted" | "minted" | "rejected"
  requestType: "retail"
}

export interface RedeemRequest {
  id: string
  evmAddress: string
  evmChain: string
  evmChainId: number
  asset: string // e.g., "DOGE", "LTC", "BCH"
  amount: string
  burnTxHash: string
  nativeRecipientAddress: string
  nativeTransactionId?: string // ID of the transaction on the native chain
  createdAt: string
  updatedAt: string
  status: "pending" | "processing" | "completed" | "failed"
}

const dbName = process.env.DB_NAME || 'bima-mainnet';

const connectionConfig = {
  host: process.env.DB_HOST || "localhost",
  port: 25060,
  user: process.env.DB_USER || "doadmin",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: process.env.DB_MULTIPLE_STATEMENTS === "true",
}

let pool: mysql.Pool | null = null

const getPool = () => {
  if (!pool) {
    console.log("Creating new database pool with config:", {
      ...connectionConfig,
      password: "***hidden***",
    })
    pool = mysql.createPool({
      ...connectionConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  }
  return pool
}

export const initDB = async () => {
  try {
    console.log("Initializing database...")

    // Create connection without database to create database if needed
    const connection = await mysql.createConnection(connectionConfig)
    console.log("Connected to MySQL server")

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
    console.log(`Database '${dbName}' created or already exists`)

    await connection.query(`USE \`${dbName}\``)
    console.log(`Using database '${dbName}'`)

    // Create user_requests table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_requests (
        id VARCHAR(100) PRIMARY KEY,
        evmAddress VARCHAR(100) NOT NULL,
        evmChain VARCHAR(100) NOT NULL,
        evmChainId INT NOT NULL,
        vaultId VARCHAR(100) NOT NULL,
        vaultChain VARCHAR(100) NOT NULL,
        userVaultChainAddress VARCHAR(100) NOT NULL,
        amount DECIMAL(36, 18) NOT NULL,
        utxo VARCHAR(200) NOT NULL,
        transactionHash VARCHAR(200) NOT NULL,
        whitelisted BOOLEAN NOT NULL DEFAULT FALSE,
        mintTxLink TEXT,
        proof TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        status ENUM('pending', 'verified', 'whitelisted', 'minted', 'rejected') NOT NULL DEFAULT 'pending',
        requestType ENUM('retail') NOT NULL,
        INDEX idx_evmAddress (evmAddress),
        INDEX idx_transactionHash (transactionHash),
        INDEX idx_status (status),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    console.log("user_requests table created or already exists")

    // Create redeem_requests table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS redeem_requests (
        id VARCHAR(100) PRIMARY KEY,
        evmAddress VARCHAR(100) NOT NULL,
        evmChain VARCHAR(100) NOT NULL,
        evmChainId INT NOT NULL,
        asset VARCHAR(50) NOT NULL,
        amount DECIMAL(36, 18) NOT NULL,
        burnTxHash VARCHAR(200) NOT NULL UNIQUE,
        nativeRecipientAddress VARCHAR(100) NOT NULL,
        nativeTransactionId VARCHAR(200),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
        INDEX idx_evmAddress (evmAddress),
        INDEX idx_burnTxHash (burnTxHash),
        INDEX idx_asset (asset),
        INDEX idx_status (status),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    console.log("redeem_requests table created or already exists")

    console.log("✅ Database and tables initialized successfully.")
    await connection.end()
  } catch (error) {
    console.error("❌ Error initializing database:", error)
    throw error
  }
}

export class DatabaseService {
  static async createMintRequest(request: Omit<MintRequest, "id" | "createdAt" | "updatedAt">): Promise<MintRequest> {
    const pool = getPool()
    const id = `mint_${uuidv4()}`
    const now = new Date()
    const createdAt = now.toISOString().slice(0, 19).replace("T", " ")
    const updatedAt = createdAt

    console.log("Creating mint request with ID:", id)

    const {
      evmAddress,
      evmChain,
      evmChainId,
      vaultId,
      vaultChain,
      userVaultChainAddress,
      amount,
      utxo,
      transactionHash,
      whitelisted,
      mintTxLink,
      proof,
      status,
      requestType,
    } = request

    try {
      await pool.query(
        `INSERT INTO user_requests (
          id, evmAddress, evmChain, evmChainId, vaultId, vaultChain, userVaultChainAddress,
          amount, utxo, transactionHash, whitelisted, mintTxLink, proof, createdAt, updatedAt, status, requestType
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          evmAddress,
          evmChain,
          evmChainId,
          vaultId,
          vaultChain,
          userVaultChainAddress,
          amount,
          utxo,
          transactionHash,
          whitelisted,
          mintTxLink ?? null,
          proof,
          createdAt,
          updatedAt,
          status,
          requestType,
        ],
      )

      console.log("Successfully created mint request:", id)

      return {
        id,
        createdAt,
        updatedAt,
        ...request,
      }
    } catch (error) {
      console.error("Error creating mint request:", error)
      throw error
    }
  }

  static async getMintRequestsByEvmAddress(evmAddress: string): Promise<MintRequest[]> {
    const pool = getPool()
    console.log("Fetching mint requests for address:", evmAddress)

    try {
      const [rows] = await pool.query(
        `SELECT * FROM user_requests WHERE LOWER(evmAddress) = LOWER(?) ORDER BY createdAt DESC`,
        [evmAddress],
      )
      console.log(`Found ${(rows as any[]).length} mint requests for address ${evmAddress}`)
      return rows as MintRequest[]
    } catch (error) {
      console.error("Error fetching mint requests by address:", error)
      throw error
    }
  }

  static async getMintRequestByTxHash(transactionHash: string): Promise<MintRequest | null> {
    const pool = getPool()
    console.log("Fetching mint request by transaction hash:", transactionHash)

    try {
      const [rows] = await pool.query(`SELECT * FROM user_requests WHERE transactionHash = ? LIMIT 1`, [
        transactionHash,
      ])
      const result = (rows as MintRequest[])[0] || null
      console.log("Mint request found:", !!result)
      return result
    } catch (error) {
      console.error("Error fetching mint request by tx hash:", error)
      throw error
    }
  }

  static async updateMintRequest(id: string, updates: Partial<MintRequest>): Promise<MintRequest | null> {
    const existing = await this.getMintRequestById(id)
    if (!existing) {
      console.log("Mint request not found for update:", id)
      return null
    }

    const pool = getPool()
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString().slice(0, 19).replace("T", " ") }

    console.log("Updating mint request:", id)

    try {
      await pool.query(
        `UPDATE user_requests SET
          evmAddress = ?, evmChain = ?, evmChainId = ?, vaultId = ?, vaultChain = ?,
          userVaultChainAddress = ?, amount = ?, utxo = ?, transactionHash = ?, whitelisted = ?,
          mintTxLink = ?, proof = ?, updatedAt = ?, status = ?, requestType = ?
        WHERE id = ?`,
        [
          updated.evmAddress,
          updated.evmChain,
          updated.evmChainId,
          updated.vaultId,
          updated.vaultChain,
          updated.userVaultChainAddress,
          updated.amount,
          updated.utxo,
          updated.transactionHash,
          updated.whitelisted,
          updated.mintTxLink ?? null,
          updated.proof,
          updated.updatedAt,
          updated.status,
          updated.requestType,
          id,
        ],
      )

      console.log("Successfully updated mint request:", id)
      return updated
    } catch (error) {
      console.error("Error updating mint request:", error)
      throw error
    }
  }

  static async getAllMintRequests(): Promise<MintRequest[]> {
    const pool = getPool()
    console.log("Fetching all mint requests")

    try {
      const [rows] = await pool.query(`SELECT * FROM user_requests ORDER BY createdAt DESC`)
      console.log(`Found ${(rows as any[]).length} total mint requests`)
      return rows as MintRequest[]
    } catch (error) {
      console.error("Error fetching all mint requests:", error)
      throw error
    }
  }

  static async getMintRequestById(id: string): Promise<MintRequest | null> {
    const pool = getPool()
    console.log("Fetching mint request by ID:", id)

    try {
      const [rows] = await pool.query(`SELECT * FROM user_requests WHERE id = ? LIMIT 1`, [id])
      const result = (rows as MintRequest[])[0] || null
      console.log("Mint request found by ID:", !!result)
      return result
    } catch (error) {
      console.error("Error fetching mint request by ID:", error)
      throw error
    }
  }

  // Redeem Request Methods
  static async createRedeemRequest(
    request: Omit<RedeemRequest, "id" | "createdAt" | "updatedAt">,
  ): Promise<RedeemRequest> {
    const pool = getPool()
    const id = `redeem_${uuidv4()}`
    const now = new Date()
    const createdAt = now.toISOString().slice(0, 19).replace("T", " ")
    const updatedAt = createdAt

    console.log("Creating redeem request with ID:", id)
    console.log("Request data:", JSON.stringify(request, null, 2))

    const {
      evmAddress,
      evmChain,
      evmChainId,
      asset,
      amount,
      burnTxHash,
      nativeRecipientAddress,
      nativeTransactionId,
      status,
    } = request

    try {
      const result = await pool.query(
        `INSERT INTO redeem_requests (
          id, evmAddress, evmChain, evmChainId, asset, amount, burnTxHash, nativeRecipientAddress, nativeTransactionId, createdAt, updatedAt, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          evmAddress,
          evmChain,
          evmChainId,
          asset,
          amount,
          burnTxHash,
          nativeRecipientAddress,
          nativeTransactionId ?? null,
          createdAt,
          updatedAt,
          status,
        ],
      )

      console.log("Database insert result:", result)
      console.log("Successfully created redeem request:", id)

      const createdRequest = {
        id,
        createdAt,
        updatedAt,
        ...request,
      }

      console.log("Returning created request:", JSON.stringify(createdRequest, null, 2))
      return createdRequest
    } catch (error) {
      console.error("Error creating redeem request:", error)
      console.error("Error details:", error instanceof Error ? error.message : "Unknown error")
      throw error
    }
  }

  static async getRedeemRequestByBurnTxHash(burnTxHash: string): Promise<RedeemRequest | null> {
    const pool = getPool()
    console.log("Checking for existing redeem request with burnTxHash:", burnTxHash)

    try {
      const [rows] = await pool.query(`SELECT * FROM redeem_requests WHERE burnTxHash = ? LIMIT 1`, [burnTxHash])
      const result = (rows as RedeemRequest[])[0] || null
      console.log("Existing redeem request found:", !!result)
      if (result) {
        console.log("Existing request details:", JSON.stringify(result, null, 2))
      }
      return result
    } catch (error) {
      console.error("Error checking for existing redeem request:", error)
      throw error
    }
  }

  static async updateRedeemRequest(id: string, updates: Partial<RedeemRequest>): Promise<RedeemRequest | null> {
    const existing = await this.getRedeemRequestById(id)
    if (!existing) {
      console.log("Redeem request not found for update:", id)
      return null
    }

    const pool = getPool()
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString().slice(0, 19).replace("T", " ") }

    console.log("Updating redeem request:", id)

    try {
      await pool.query(
        `UPDATE redeem_requests SET
          evmAddress = ?, evmChain = ?, evmChainId = ?, asset = ?, amount = ?, burnTxHash = ?,
          nativeRecipientAddress = ?, nativeTransactionId = ?, updatedAt = ?, status = ?
        WHERE id = ?`,
        [
          updated.evmAddress,
          updated.evmChain,
          updated.evmChainId,
          updated.asset,
          updated.amount,
          updated.burnTxHash,
          updated.nativeRecipientAddress,
          updated.nativeTransactionId ?? null,
          updated.updatedAt,
          updated.status,
          id,
        ],
      )

      console.log("Successfully updated redeem request:", id)
      return updated
    } catch (error) {
      console.error("Error updating redeem request:", error)
      throw error
    }
  }

  static async getAllRedeemRequests(): Promise<RedeemRequest[]> {
    const pool = getPool()
    console.log("Fetching all redeem requests")

    try {
      const [rows] = await pool.query(`SELECT * FROM redeem_requests ORDER BY createdAt DESC`)
      console.log(`Found ${(rows as any[]).length} total redeem requests`)
      return rows as RedeemRequest[]
    } catch (error) {
      console.error("Error fetching all redeem requests:", error)
      throw error
    }
  }

  static async getRedeemRequestById(id: string): Promise<RedeemRequest | null> {
    const pool = getPool()
    console.log("Fetching redeem request by ID:", id)

    try {
      const [rows] = await pool.query(`SELECT * FROM redeem_requests WHERE id = ? LIMIT 1`, [id])
      const result = (rows as RedeemRequest[])[0] || null
      console.log("Redeem request found by ID:", !!result)
      return result
    } catch (error) {
      console.error("Error fetching redeem request by ID:", error)
      throw error
    }
  }

  static async getRedeemRequestsByAddress(evmAddress: string, vaultId?: string): Promise<RedeemRequest[]> {
    const pool = getPool()
    console.log("Fetching redeem requests for address:", evmAddress, "vaultId:", vaultId)

    let query = `SELECT * FROM redeem_requests WHERE LOWER(evmAddress) = LOWER(?)`
    const params: any[] = [evmAddress]

    if (vaultId) {
      const assetMap: Record<string, string> = {
        tdoge: "DOGE",
        tltc: "LTC",
        tbch: "BCH",
      }
      const asset = assetMap[vaultId]
      if (asset) {
        query += ` AND asset = ?`
        params.push(asset)
        console.log("Filtering by asset:", asset)
      }
    }

    query += ` ORDER BY createdAt DESC`

    try {
      const [rows] = await pool.query(query, params)
      console.log(`Found ${(rows as any[]).length} redeem requests for address ${evmAddress}`)
      return rows as RedeemRequest[]
    } catch (error) {
      console.error("Error fetching redeem requests by address:", error)
      throw error
    }
  }

  static async getLatestMintRequestByAddress(evmAddress: string, vaultId?: string): Promise<MintRequest | null> {
    const pool = getPool()
    console.log("Fetching latest mint request for address:", evmAddress, "vaultId:", vaultId)

    let query = `SELECT * FROM user_requests WHERE LOWER(evmAddress) = LOWER(?)`
    const params: any[] = [evmAddress]

    if (vaultId) {
      query += ` AND vaultId = ?`
      params.push(vaultId)
    }

    query += ` ORDER BY createdAt DESC LIMIT 1`

    try {
      const [rows] = await pool.query(query, params)
      const result = (rows as MintRequest[])[0] || null
      console.log("Latest mint request found:", !!result)
      return result
    } catch (error) {
      console.error("Error fetching latest mint request:", error)
      throw error
    }
  }
}
