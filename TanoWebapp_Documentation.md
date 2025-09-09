# Tano Finance Web Application Documentation

## 1. Project Overview

Tano Finance is a decentralized finance (DeFi) platform that allows users to unlock the power of their cryptocurrency. The application enables users to earn yield and participate in a decentralized financial ecosystem. The platform supports features like minting, redeeming, and managing digital assets in a vault. It caters to both retail and institutional users, offering distinct user experiences and flows that adapt dynamically based on the selected user type.

## 2. Technologies Used

The Tano Finance web application is built with a modern tech stack:

-   **Frontend:**
    -   **Framework:** [Next.js](https://nextjs.org/) (a React framework)
    -   **Language:** [TypeScript](https://www.typescriptlang.org/)
    -   **UI Components:** [shadcn/ui](https://ui.shadcn.com/) and [Radix UI](https://www.radix-ui.com/)
    -   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
    -   **Web3/Blockchain:**
        -   [Wagmi](https://wagmi.sh/): For interacting with Ethereum.
        -   [Viem](https://viem.sh/): A lightweight and efficient Ethereum toolkit.
        -   [Ethers.js](https://ethers.io/): A complete Ethereum wallet implementation and utilities in JavaScript and TypeScript.
        -   [RainbowKit](https://www.rainbowkit.com/): For connecting wallets.
    

-   **Backend:**
    -   **API:** [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
    -   **Database:** [MySQL](https://www.mysql.com/) (using the `mysql2` library)
    

-   **Other:**
    -   **Environment Variables:** `dotenv`
    -   **Unique IDs:** `uuid`

## 3. Project Structure

The project follows a standard Next.js `src` directory structure:

```
tano-webapp/
├── src/
│   ├── abi/              # ABI files for smart contract interaction
│   ├── app/              # Next.js App Router
│   │   ├── (app)/        # Main application routes (protected)
│   │   │   ├── mint/
│   │   │   ├── redeem/
│   │   │   ├── vault/
│   │   │   └── ...
│   │   ├── api/          # API routes for backend logic
│   │   └── ...
│   ├── components/       # Reusable React components
│   │   └── ui/           # shadcn/ui components
│   ├── contexts/         # React contexts (e.g., UserTypeContext)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions, configs, and services
│   │   ├── database.ts   # Database service and schema
│   │   ├── wagmiConfig.ts# Wagmi configuration
│   │   └── ...
│   └── ...
├── .env.example          # Example environment variables
├── next.config.ts        # Next.js configuration
├── package.json          # Project dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## 4. System Interaction Flow

This section describes the high-level system interactions, particularly concerning API routes and database operations.

### 4.1. User Authentication and Wallet Connection

-   The application's main layout (`src/app/(app)/layout.tsx`) is protected by a `WalletGuard`.
-   Users must connect their Ethereum wallet (e.g., MetaMask) to access the application's features.
-   [RainbowKit](https://www.rainbowkit.com/) is used to provide a user-friendly wallet connection experience.

### 4.2. Mint Request Processing (Backend)

1.  **API Request:** After frontend initiation (as detailed in User Flows), the frontend sends a `POST` request to the `/api/mint` endpoint with details like the EVM address, transaction hash, and amount.
2.  **Backend Logic:**
    -   The API route in `src/app/api/mint/route.ts` receives the request.
    -   It first verifies if the transaction hash has already been used to prevent duplicate requests.
    -   A new mint request entry is created in the `mint_records` table in the MySQL database, initially with a status such as `"pending verification"` or `"verified"`.
3.  **Admin Approval (If applicable):** For certain minting scenarios (e.g., institutional or requiring additional checks), the request might enter a state pending approval from an administrator. The UI typically provides a separate dashboard for admins to review and approve these requests.

### 4.3. Redeem Request Processing (Backend)

-   Similar to minting, a user initiating a redeem request from the frontend triggers an API call (e.g., to `/api/redeem`).
-   This API route handles the logic for burning the assets on-chain (if required as part of the redemption) and creates a corresponding record in the `redeem_requests` table in the database.

## 5. Detailed User Flows

This section outlines the step-by-step journeys for different user types within the Tano Finance application.

### 5.1. User Types

Tano Finance caters to two primary user types, each with potentially distinct interfaces and underlying processes:

-   **Retail User:** Typically an individual user engaging directly with the DeFi platform for personal asset management.
-   **Institutional User:** Represents organizations or high-volume traders who may require additional features, compliance steps, or administrative oversight.

The `UserTypeContext` (`src/contexts/UserTypeContexts.tsx`) dynamically adjusts the available navigation and features based on the selected user type.

### 5.2. Retail User Journey

#### 5.2.1. Minting Process

The retail user minting process involves several steps to ensure a secure and verified asset conversion:

1.  **Connect Wallet:** The user first connects their EVM-compatible wallet (e.g., MetaMask) to the Tano Finance application via RainbowKit.
2.  **Send Asset to Designated Wallet:** The user sends the specified cryptocurrency asset from their connected wallet to a Tano Finance designated wallet address.
3.  **Enter Transaction Hash:** After sending the assets, the user enters the transaction hash of the asset transfer into the application's UI. This hash serves as proof of the off-chain transfer.
4.  **ZK Proof Generation:** The application sends this transaction hash to a verifier server. This server performs checks and, typically within 2 to 3 minutes, generates a Zero-Knowledge Proof (ZK Proof) confirming the validity of the asset transfer without revealing sensitive information.
5.  **On-chain Minting (UI Trigger & Smart Contract Interaction):**
    -   Upon receiving a successful ZK Proof from the verifier server, the UI enables the "Mint" action for the user.
    -   The user confirms the minting transaction via their connected wallet (e.g., a Metamask prompt appears).
    -   The smart contract receives the generated `proof bytes` and `public bytes` from the application.
    -   The smart contract then verifies these proofs on-chain and, if valid, mints the corresponding digital assets to the user's connected wallet address.
6.  **Redirect to Mint Records:** After successful on-chain minting, the user is automatically redirected to the "Mint Records" page, which displays a comprehensive list of all their past minting transactions and their current statuses.

#### 5.2.2. Redeeming Process

The retail user redeeming process is designed for simplicity:

1.  **Initiate Redeem Request (UI):** The user navigates to the `/redeem` page and specifies the amount of assets they wish to redeem.
2.  **On-chain Burn:** The application prompts the user's connected wallet to approve a transaction that burns the specified amount of minted assets on the smart contract.
3.  **Database Record Update:** Concurrently, a new entry is created or an existing record is updated in the `redeem_requests` table in the backend database, logging the redemption request and its status.

### 5.3. Institutional User Journey

Details for institutional user flows are not yet fully defined but are expected to involve enhanced security protocols, potentially different asset transfer mechanisms, and administrative oversight. These flows may leverage components like `AdminAssistedMintWizard.tsx` for specialized handling and integration with internal API routes for advanced operations. Further documentation will be provided as these processes are solidified.

## 6. Backend and Database

-   The backend logic is implemented using Next.js API Routes.
-   A `DatabaseService` class in `src/lib/database.ts` encapsulates all database interactions.
-   The database schema consists of two main tables:
    -   `mint_records`: Stores all information related to minting requests.
    -   `redeem_requests`: Stores all information related to redeeming requests.
-   The `initDB` function in `src/lib/database.ts` is used to initialize the database and create the tables if they don't exist.



