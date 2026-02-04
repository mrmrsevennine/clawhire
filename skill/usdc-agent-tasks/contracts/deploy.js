#!/usr/bin/env node
// Deploy TaskEscrow contract to Polygon Amoy Testnet
// Usage: node contracts/deploy.js
//
// Requires:
//   PRIVATE_KEY - deployer wallet private key
//   Compiled contract ABI & bytecode (via solc or hardhat)

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { config, requireConfig } = require('../lib/config');

// Minimal compiled contract - we compile with solc or use pre-compiled bytecode
// For the hackathon, we provide a pre-compiled version
// To recompile: npx solc --abi --bin --include-path node_modules/ --base-path . contracts/TaskEscrow.sol

async function deploy() {
  requireConfig('privateKey');

  console.log('🚀 Deploying TaskEscrow to', config.network);
  console.log('   RPC:', config.rpcUrl);
  console.log('   Chain ID:', config.chainId);
  console.log('   USDC:', config.usdcAddress);

  const provider = new ethers.JsonRpcProvider(config.rpcUrl, {
    chainId: config.chainId,
    name: config.network,
  });
  const wallet = new ethers.Wallet(config.privateKey, provider);
  console.log('   Deployer:', wallet.address);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('   POL Balance:', ethers.formatEther(balance));
  if (balance === 0n) {
    console.error('❌ No POL for gas. Get testnet POL from https://faucet.polygon.technology/');
    process.exit(1);
  }

  // Load compiled contract
  const artifactPath = path.join(__dirname, 'TaskEscrow.json');
  if (!fs.existsSync(artifactPath)) {
    console.log('\n📦 No compiled artifact found. Compiling with solc...');
    await compileSolidity();
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  // Deploy
  console.log('\n📝 Deploying contract...');
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(config.usdcAddress);

  console.log('   TX:', contract.deploymentTransaction().hash);
  console.log('   Waiting for confirmation...');

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log('\n✅ TaskEscrow deployed!');
  console.log('   Address:', address);
  console.log('   Explorer: https://amoy.polygonscan.com/address/' + address);

  // Save deployment info
  const deploymentInfo = {
    address,
    network: config.network,
    chainId: config.chainId,
    usdc: config.usdcAddress,
    deployer: wallet.address,
    txHash: contract.deploymentTransaction().hash,
    deployedAt: new Date().toISOString(),
  };

  const deployPath = path.join(__dirname, 'deployment.json');
  fs.writeFileSync(deployPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('   Saved to:', deployPath);

  console.log('\n📋 Set this in your environment:');
  console.log(`   export ESCROW_ADDRESS=${address}`);

  return deploymentInfo;
}

async function compileSolidity() {
  // Try using solcjs
  try {
    const solc = require('solc');

    const contractSource = fs.readFileSync(
      path.join(__dirname, 'TaskEscrow.sol'),
      'utf8'
    );

    const input = {
      language: 'Solidity',
      sources: {
        'TaskEscrow.sol': { content: contractSource },
      },
      settings: {
        outputSelection: {
          '*': { '*': ['abi', 'evm.bytecode.object'] },
        },
        optimizer: { enabled: true, runs: 200 },
      },
    };

    // Import callback for OpenZeppelin
    function findImports(importPath) {
      const possiblePaths = [
        path.join(__dirname, '..', 'node_modules', importPath),
        path.join(__dirname, '..', 'node_modules', '@openzeppelin', 'contracts', importPath.replace('@openzeppelin/contracts/', '')),
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          return { contents: fs.readFileSync(p, 'utf8') };
        }
      }
      return { error: `File not found: ${importPath}` };
    }

    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

    if (output.errors) {
      const errors = output.errors.filter(e => e.severity === 'error');
      if (errors.length > 0) {
        console.error('Compilation errors:', errors.map(e => e.message).join('\n'));
        process.exit(1);
      }
    }

    const compiled = output.contracts['TaskEscrow.sol']['TaskEscrow'];
    const artifact = {
      abi: compiled.abi,
      bytecode: '0x' + compiled.evm.bytecode.object,
    };

    fs.writeFileSync(path.join(__dirname, 'TaskEscrow.json'), JSON.stringify(artifact, null, 2));
    console.log('   ✅ Compiled successfully');
  } catch (err) {
    console.error('❌ Compilation failed:', err.message);
    console.error('   Install solc: npm install solc');
    console.error('   Or compile manually and place TaskEscrow.json in contracts/');
    process.exit(1);
  }
}

// Run
deploy().catch(err => {
  console.error('❌ Deployment failed:', err.message);
  process.exit(1);
});
