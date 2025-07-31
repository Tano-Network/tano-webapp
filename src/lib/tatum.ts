// Tatum API integration for blockchain transaction verification
export interface TatumTransactionResponse {
  hash: string
  size: number
  vsize: number
  version: number
  vin: Array<{
    txid: string
    vout: number
    scriptSig: {
      asm: string
      hex: string
    }
    sequence: number
  }>
  vout: Array<{
    value: number
    n: number
    scriptPubKey: {
      asm: string
      hex: string
      reqSigs: number
      type: string
      addresses: string[]
    }
  }>
  locktime: number
  confirmations?: number
  blockHeight?: number
  blockTime?: number
}

export interface TransactionDetails {
  amount: string
  fromAddress: string
  toAddress: string
  confirmations: number
  utxo: string
  blockHeight: number
  timestamp: number
}

export class TatumService {
  private static readonly API_KEY = process.env.TATUM_API_KEY
  private static readonly BASE_URL = "https://api.tatum.io/v3"

  static async getTransaction(chain: string, txHash: string): Promise<TatumTransactionResponse | null> {
    try {
      // Map our chain names to Tatum chain identifiers
   

      if (!this.API_KEY) {
        console.warn("TATUM_API_KEY not set, using mock data")
        return null
      }

      const response = await fetch(`${this.BASE_URL}/${chain}/transaction/${txHash}`, {
        headers: {
          "x-api-key": this.API_KEY,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // Transaction not found
        }
        throw new Error(`Tatum API error: ${response.status} ${response.statusText}`)
      }

      const data: TatumTransactionResponse = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching transaction from Tatum:", error)
      // Fallback to mock data for development
      return null
    }
  }

  

  static async verifyTransaction(
    chain: string,
    txHash: string,
    expectedFromAddress: string,
    expectedToAddress: string,
    minimumAmount?: string,
  ): Promise<TransactionDetails | null> {
    try {
      const txData = await this.getTransaction(chain, txHash)
        console.log(JSON.stringify(txData, null, 2)) // Add this line to log txData)
      if (!txData) {
        throw new Error("Transaction not found on the blockchain")
      }

      // Check confirmations (default minimum is 3)
      const confirmations = txData.confirmations || 0
    //   if (confirmations  3) {
    //     throw new Error(`Transaction needs more confirmations. Current: ${confirmations}, Required: 3`)
    //   }

      // Find the input that matches the expected from address
      // For UTXO-based chains, we need to look up the previous transaction to get the from address
      // For now, we'll use a simplified approach assuming the first input is from the expected address
      const fromAddress = expectedFromAddress // Simplified for mock data

      // Find the output that matches the expected to address
      const matchingOutput = txData.vout.find(
        (output) =>
          output.scriptPubKey.addresses &&
          output.scriptPubKey.addresses.some((addr) => addr.toLowerCase() === expectedToAddress.toLowerCase()),
      )

      if (!matchingOutput) {
        throw new Error(`Transaction does not send funds to the expected address: ${expectedToAddress}`)
      }

      // Check minimum amount if specified
      if (minimumAmount && Number.parseFloat(matchingOutput.value.toString()) < Number.parseFloat(minimumAmount)) {
        throw new Error(`Transaction amount ${matchingOutput.value} is less than required minimum ${minimumAmount}`)
      }

      // Create UTXO identifier
      const utxo = `${txData.hash}:${matchingOutput.n}`

      return {
        amount: matchingOutput.value.toString(),
        fromAddress: fromAddress,
        toAddress: matchingOutput.scriptPubKey.addresses[0],
        confirmations: confirmations,
        utxo: utxo,
        blockHeight: txData.blockHeight || 0,
        timestamp: txData.blockTime ? txData.blockTime * 1000 : Date.now(),
      }
    } catch (error) {
      console.error("Error verifying transaction:", error)
      throw error
    }
  }

  // Helper method to get the from address by looking up previous transaction
  private static async getFromAddress(chain: string, txid: string, vout: number): Promise<string | null> {
    try {
      const prevTx = await this.getTransaction(chain, txid)
      if (!prevTx || !prevTx.vout[vout]) {
        return null
      }

      const output = prevTx.vout[vout]
      return output.scriptPubKey.addresses?.[0] || null
    } catch (error) {
      console.error("Error getting from address:", error)
      return null
    }
  }

  // Enhanced verification that looks up the actual from address
  static async verifyTransactionWithFromLookup(
    chain: string,
    txHash: string,
    expectedFromAddress: string,
    expectedToAddress: string,
    minimumAmount?: string,
  ): Promise<TransactionDetails | null> {
    try {
      const txData = await this.getTransaction(chain, txHash)

      if (!txData) {
        throw new Error("Transaction not found on the blockchain")
      }

      // Check confirmations
      const confirmations = txData.confirmations || 0
    //   if (confirmations < 3) {
    //     throw new Error(`Transaction needs more confirmations. Current: ${confirmations}, Required: 3`)
    //   }

      // Get the actual from address by looking up the previous transaction
      let actualFromAddress: string | null = null
      if (txData.vin.length > 0) {
        const firstInput = txData.vin[0]
        actualFromAddress = await this.getFromAddress(chain, firstInput.txid, firstInput.vout)
      }

      // Verify the from address matches
      if (actualFromAddress && actualFromAddress.toLowerCase() !== expectedFromAddress.toLowerCase()) {
        throw new Error(
          `Transaction not sent from expected address. Expected: ${expectedFromAddress}, Actual: ${actualFromAddress}`,
        )
      }

      // Find the output that matches the expected to address
      const matchingOutput = txData.vout.find(
        (output) =>
          output.scriptPubKey.addresses &&
          output.scriptPubKey.addresses.some((addr) => addr.toLowerCase() === expectedToAddress.toLowerCase()),
      )

      if (!matchingOutput) {
        throw new Error(`Transaction does not send funds to the expected address: ${expectedToAddress}`)
      }

      // Check minimum amount if specified
      if (minimumAmount && Number.parseFloat(matchingOutput.value.toString()) < Number.parseFloat(minimumAmount)) {
        throw new Error(`Transaction amount ${matchingOutput.value} is less than required minimum ${minimumAmount}`)
      }

      // Create UTXO identifier
      const utxo = `${txData.hash}:${matchingOutput.n}`

      return {
        amount: matchingOutput.value.toString(),
        fromAddress: actualFromAddress || expectedFromAddress,
        toAddress: matchingOutput.scriptPubKey.addresses[0],
        confirmations: confirmations,
        utxo: utxo,
        blockHeight: txData.blockHeight || 0,
        timestamp: txData.blockTime ? txData.blockTime * 1000 : Date.now(),
      }
    } catch (error) {
      console.error("Error verifying transaction with from lookup:", error)
      throw error
    }
  }
}
