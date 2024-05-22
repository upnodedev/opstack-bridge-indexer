# opstack-bridge-indexer

## Description
opstack-bridge-indexer is a project designed to securely store and receive events related to the `TransactionDeposited` event on Layer 1 and the `WithdrawalInitiated` event on Layer 2. The project exposes a server to be used in a frontend application using TypeScript, Viem, SQLite, Ether.js, and Express.

## Prerequisites
- Node.js v20+
- Recommendation use Full Node to run fetch pass events

## Setup Instructions

### Step 1: Clone the Repository
Clone this repository to your local machine using the following command
```bash
git clone <repository-url>
cd opstack-bridge-indexer
```

### Step 2: Install Packages
Install the necessary packages by running
```bash
npm install --ignore-engines
```

### Step 3: Configure Environment Variables
Create a .env file in the root directory and configure the following environment variables (example provided for mainnet and optimism) 
```bash
# Layer 1 (L1) Configuration (Recommendation use Full Node)
L1_RPC_URL_1=https://eth-mainnet.g.alchemy.com/v2/demo
L1_RPC_URL_2=https://eth-mainnet.g.alchemy.com/v2/demo
L1_RPC_URL_3=https://eth-mainnet.g.alchemy.com/v2/demo
L1_CHAIN_NAME=Sepolia
L1_CHAIN_ID=11155111
L1_PORTAL_ADDRESS=0x16Fc5058F25648194471939df75CF27A2fdC48BC
L1_PORTAL_BLOCK_CREATED=4071248
L1_WSS_URL_1=wss://sepolia.gateway.tenderly.co

# Layer 2 (L2) Configuration (Recommendation use Full Node)
L2_RPC_URL_1=https://mainnet.optimism.io
L2_RPC_URL_2=https://mainnet.optimism.io
L2_RPC_URL_3=https://mainnet.optimism.io
L2_CHAIN_NAME=OP Sepolia Testnet
L2_CHAIN_ID=11155420
L2_STANDARD_BRIDGE_ADDRESS=0x4200000000000000000000000000000000000010
L2_STANDARD_BRIDGE_BLOCK_CREATED=0

# PORT to expose API
PORT = 3000
```

### Step 4: Build the Project
Build the project by running
``` bash
npm run build
```

### Step 5: Create local Database
Create local SQLite via run :
``` bash
npm run db
```

### Step 6: Store and Receive Events
To start the process of storing and receiving events, run
``` bash
npx pm2 start npm --name "opstack-bridge-indexer" -- run start
```

### Step 7: Start the Server
To start the server for frontend using, run
``` bash
npx pm2 start npm --name "opstack-bridge-server" -- run server
```

### Usage
The server exposes endpoints to interact with the stored events. You can use these endpoints in your frontend application to fetch and display the events as needed.

``` bash
curl http://{IP Address}:{PORT}/deposit?limit=100&to={address}&from={address}
curl http://{IP Address}:{PORT}/withdrawal?limit=100&to={address}&from={address}
```