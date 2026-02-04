# 💎 Extreme Emerald: Forever Architecture

This project is now configured for **Always-On / Forever** deployment. This means it can run 24/7 on the public internet without your laptop being on.

## 1. Live Blockchain (Polygon Amoy)
Your "Server" is the Ethereum Network (Polygon). To go live:
1.  **Open `.env`**: Paste your MetaMask Private Key into `PRIVATE_KEY`.
2.  **Deploy**: Run `npm run deploy:amoy`.
3.  **Update Config**: Copy the new contract address from the terminal to `VITE_IDENTITY_REGISTRY` in `.env`. Change `VITE_CHAIN_ID` to `80002`.

## 2. Live Website (Vercel)
To host your UI forever:
1.  **Create a GitHub Repo**: Upload this entire project folder to a new repo.
2.  **Connect to Vercel**:
    *   Go to [Vercel.com](https://vercel.com).
    *   Import your GitHub repo.
    *   **Settings**: Add `VITE_CHAIN_ID` and `VITE_IDENTITY_REGISTRY` as Environment Variables in the Vercel Dashboard.
3.  **Deploy**: Click "Deploy". You now have a permanent URL (like `my-zk-app.vercel.app`).

## 3. Why this runs "Forever"
*   **Infrastructure**: Polygon Amoy is a decentralized public testnet. It never turns off.
*   **Decentralization**: Your identity proofs are verified by thousands of nodes globally, not just your local machine.
*   **Zero-Maintenance**: Once deployed, the frontend is served by Vercel's global CDN and the contract lives on the blockchain forever.

---
**STATUS**: CONFIGURATION_LOCKED // AWAITING_PRIVATE_KEY
