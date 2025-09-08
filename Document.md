
# Tano Finance Web Application Documentation

## 1. Project Overview

Tano Finance is a decentralized finance (DeFi) platform that allows users to unlock the power of their cryptocurrency. The application enables users to earn yield and participate in a decentralized financial ecosystem. The platform supports features like minting, redeeming, and managing digital assets in a vault. It caters to both retail and institutional users, with a dynamic UI that adapts based on the user type.

## 2. Technologies Used

The Tano Finance web application is built with a modern tech stack:

- **Frontend:**
  - **Framework:** [Next.js](https://nextjs.org/) (a React framework)
  - **Language:** [TypeScript](https://www.typescriptlang.org/)
  - **UI Components:** [shadcn/ui](https://ui.shadcn.com/) and [Radix UI](https://www.radix-ui.com/)
  - **Styling:** [Tailwind CSS](https://tailwindcss.com/)
  - **Web3/Blockchain:**
    - [Wagmi](https://wagmi.sh/): For interacting with Ethereum.
    - [Viem](https://viem.sh/): A lightweight and efficient Ethereum toolkit.
    - [Ethers.js](https://ethers.io/): A complete Ethereum wallet implementation and utilities in JavaScript and TypeScript.
    - [RainbowKit](https://www.rainbowkit.com/): For connecting wallets.
  - **Forms:** [React Hook Form](https://react-hook-form.com/) and [Zod](https://zod.dev/) for validation.
  - **Charting:** [Recharts](https://recharts.org/) for data visualization.

- **Backend:**
  - **API:** [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
  - **Database:** [MySQL](https://www.mysql.com/) (using the `mysql2` library)
  - **AI:** [Genkit](https://firebase.google.com/docs/genkit) with Google AI (`gemini-2.0-flash` model) for AI-powered features.

- **Other:**
  - **Environment Variables:** `dotenv`
  - **Unique IDs:** `uuid`

## 3. Project Structure

The project follows a standard Next.js `src` directory structure:

```
tano-webapp/
├── src/
│   ├── abi/              # ABI files for smart contract interaction
│   ├── ai/               # Genkit AI configuration
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

## 4. Code Flow

### 4.1. User Authentication and Wallet Connection

- The application's main layout (`src/app/(app)/layout.tsx`) is protected by a `WalletGuard`.
- Users must connect their Ethereum wallet (e.g., MetaMask) to access the application's features.
- [RainbowKit](https://www.rainbowkit.com/) is used to provide a user-friendly wallet connection experience.
- The `UserTypeContext` allows users to switch between "retail" and "institutional" modes, which dynamically adjusts the available navigation and features.

### 4.2. Minting Process

1.  **Frontend:** The user initiates a minting request from the `/mint` page.
2.  **API Request:** The frontend sends a `POST` request to the `/api/mint` endpoint with the necessary details (EVM address, transaction hash, amount, etc.).
3.  **Backend:**
    - The API route in `src/app/api/mint/route.ts` receives the request.
    - It first checks if the transaction hash has already been used to prevent duplicate requests.
    - A new mint request is created in the `mint_records` table in the MySQL database with a status of `"verified"`.
4.  **Admin Approval:** The mint request is now pending approval from an administrator. The UI likely has a separate dashboard for admins to view and approve these requests.

### 4.3. Redeeming Process

- The redeeming process likely follows a similar flow to minting, where a user initiates a request from the `/redeem` page, and a corresponding record is created in the `redeem_requests` table in the database.

## 5. Backend and Database

- The backend logic is implemented using Next.js API Routes.
- A `DatabaseService` class in `src/lib/database.ts` encapsulates all database interactions.
- The database schema consists of two main tables:
  - `mint_records`: Stores all information related to minting requests.
  - `redeem_requests`: Stores all information related to redeeming requests.
- The `initDB` function in `src/lib/database.ts` is used to initialize the database and create the tables if they don't exist.

## 6. AI Integration

- The project integrates [Genkit](https://firebase.google.com/docs/genkit) with the Google AI plugin, specifically using the `gemini-2.0-flash` model.
- The configuration is located in `src/ai/genkit.ts`.
- The exact implementation of the AI features is not detailed in the provided files, but it could be used for tasks such as:
  - Analyzing transaction data.
  - Providing insights to users.
  - Automating certain administrative tasks.
