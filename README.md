# Tano Finance - DeFi Platform

A modern decentralized finance platform built with Next.js, TypeScript, and Web3 technologies.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd tano-finance
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.local.example .env.local
   \`\`\`
   
   Edit `.env.local` and add your WalletConnect Project ID:
   \`\`\`env
   NEXT_PUBLIC_WC_PROJECT_ID=your_project_id_here
   \`\`\`

4. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure

\`\`\`
├── app/                    # Next.js 13+ app directory
│   ├── (app)/             # App routes (protected)
│   │   ├── vault/         # Vault pages
│   │   ├── earn/          # Earn page
│   │   └── layout.tsx     # App layout with wallet guard
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── abi/                  # Smart contract ABIs
└── types/                # TypeScript type definitions
\`\`\`

## 🔧 Configuration

### WalletConnect Setup

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID to your `.env.local` file

### Supported Networks

- Ethereum Mainnet
- Sepolia Testnet
- Polygon
- Optimism
- Arbitrum
- Base

## 🎨 Features

- **Wallet Integration** - RainbowKit with multiple wallet support
- **Vault System** - Deposit crypto assets and earn yield
- **Stability Pool** - Earn rewards by providing liquidity
- **Responsive Design** - Works on desktop and mobile
- **Dark/Light Mode** - Theme switching support
- **Smooth Animations** - Polished user experience

## 🔐 Security

- Smart contract interactions through ethers.js
- Wallet connection state management
- Input validation and error handling
- Secure environment variable handling

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices with:
- Touch-friendly interactions
- Mobile-optimized navigation
- Responsive layouts
- Progressive Web App features

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Ensure your wallet is connected
3. Verify you're on a supported network
4. Check that environment variables are set correctly

For additional help, please open an issue on GitHub.
