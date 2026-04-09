# How to Run the Client and Connect Your Wallet

This guide explains how to run the client wallet connection page and connect your wallet for use with the Open Directive extension.

## 1. Start the Wallet Interaction Server

The wallet connection page is now a React app. You must run the React development server before connecting your wallet.

### Steps:

1. Open a terminal and navigate to the React app directory:
   ```sh
   cd client-extension/src/walletinteraction
   ```
2. Install dependencies (if you haven't already):
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```
   By default, this will start the server at [http://localhost:5173](http://localhost:5173).

## 2. Connect Your Wallet

- In the extension popup, click the **Connect Wallet** button.
- This will open a new tab to the wallet connection page at [http://localhost:5173](http://localhost:5173) (or your configured URL).
- Follow the instructions to connect your MetaMask wallet.

## 3. Update the URL (Optional)

If you run the React server on a different port or host, update the `CONNECTING_PAGE_URL` in `client-extension/js/config.js` to match your new URL:

```sh

CONNECTING_PAGE_URL: env.CONNECT_ENDPOINT || 'http://localhost:5173',
```

---

**Note:** The wallet connection will not work unless the React server is running and the URL matches the extension configuration.
