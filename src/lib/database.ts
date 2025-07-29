import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// Database schema types
export interface MintRequest {
  id: string;
  evmAddress: string;
  evmChain: string;
  evmChainId: number;
  vaultId: string;
  vaultChain: string;
  userVaultChainAddress: string;
  amount: string;
  utxo: string;
  transactionHash: string;
  whitelisted: boolean;
  mintTxLink?: string;
  proof: string;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'verified' | 'whitelisted' | 'minted' | 'rejected';
  requestType: 'retail';
}

const dbName = 'tano';

const connectionConfig = {
  host: 'localhost',
  user: 'root',
  password: '1234',
  multipleStatements: true,
};

const pool = mysql.createPool({
  ...connectionConfig,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const initDB = async () => {
  const connection = await mysql.createConnection(connectionConfig);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`; USE \`${dbName}\`;`);

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
      requestType ENUM('retail') NOT NULL
    );
  `);

  console.log('✅ Database and user_requests table initialized.');
  await connection.end();
};

export class DatabaseService {
  static async createMintRequest(request: Omit<MintRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<MintRequest> {
    const id = `mint_${uuidv4()}`;
  const now = new Date();
const createdAt = now.toISOString().slice(0, 19).replace('T', ' ');
const updatedAt = createdAt;


    const {
      evmAddress, evmChain, evmChainId, vaultId, vaultChain,
      userVaultChainAddress, amount, utxo, transactionHash,
      whitelisted, mintTxLink, proof, status, requestType
    } = request;

    await pool.query(
      `INSERT INTO user_requests (
        id, evmAddress, evmChain, evmChainId, vaultId, vaultChain, userVaultChainAddress,
        amount, utxo, transactionHash, whitelisted, mintTxLink, proof, createdAt, updatedAt, status, requestType
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, evmAddress, evmChain, evmChainId, vaultId, vaultChain, userVaultChainAddress,
        amount, utxo, transactionHash, whitelisted, mintTxLink ?? null, proof,
        createdAt, updatedAt, status, requestType
      ]
    );

    return {
      id, createdAt, updatedAt,
      ...request
    };
  }

  static async getMintRequestsByEvmAddress(evmAddress: string): Promise<MintRequest[]> {
    const [rows] = await pool.query(
      `SELECT * FROM user_requests WHERE LOWER(evmAddress) = LOWER(?) ORDER BY createdAt DESC`,
      [evmAddress]
    );
    return rows as MintRequest[];
  }

  static async getMintRequestByTxHash(transactionHash: string): Promise<MintRequest | null> {
    const [rows] = await pool.query(
      `SELECT * FROM user_requests WHERE transactionHash = ? LIMIT 1`,
      [transactionHash]
    );
    return (rows as MintRequest[])[0] || null;
  }

  static async updateMintRequest(id: string, updates: Partial<MintRequest>): Promise<MintRequest | null> {
    const existing = await this.getMintRequestById(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    await pool.query(
      `UPDATE user_requests SET
        evmAddress = ?, evmChain = ?, evmChainId = ?, vaultId = ?, vaultChain = ?,
        userVaultChainAddress = ?, amount = ?, utxo = ?, transactionHash = ?, whitelisted = ?,
        mintTxLink = ?, proof = ?, updatedAt = ?, status = ?, requestType = ?
      WHERE id = ?`,
      [
        updated.evmAddress, updated.evmChain, updated.evmChainId, updated.vaultId, updated.vaultChain,
        updated.userVaultChainAddress, updated.amount, updated.utxo, updated.transactionHash, updated.whitelisted,
        updated.mintTxLink ?? null, updated.proof, updated.updatedAt, updated.status, updated.requestType,
        id
      ]
    );

    return updated;
  }

  static async getAllMintRequests(): Promise<MintRequest[]> {
    const [rows] = await pool.query(
      `SELECT * FROM user_requests ORDER BY createdAt DESC`
    );
    return rows as MintRequest[];
  }

  static async getMintRequestById(id: string): Promise<MintRequest | null> {
    const [rows] = await pool.query(
      `SELECT * FROM user_requests WHERE id = ? LIMIT 1`,
      [id]
    );
    return (rows as MintRequest[])[0] || null;
  }
}
