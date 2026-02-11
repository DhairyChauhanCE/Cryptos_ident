const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

const CIRCUITS_DIR = path.join(__dirname, '../circuits');
const BUILD_DIR = path.join(CIRCUITS_DIR, 'build');
const CONTRACTS_DIR = path.join(__dirname, '../contracts');
const KEYS_DIR = path.join(__dirname, '../keys');

const CIRCUITS = [
    { name: 'age_verification', file: 'age_verification.circom' },
    { name: 'nationality_verification', file: 'nationality_verification.circom' },
    { name: 'student_verification', file: 'student_verification.circom' }
];

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
}

async function compileCircuit(circuitName, circuitFile) {
    console.log(`\n📦 Compiling circuit: ${circuitName}...`);

    const circuitPath = path.join(CIRCUITS_DIR, circuitFile);
    const outputDir = path.join(BUILD_DIR, circuitName);

    await ensureDir(outputDir);

    // Compile circuit to R1CS, WASM, and symbols
    console.log('  ├─ Generating R1CS, WASM, and symbols...');
    // Use local circom.exe. Circom 2.x creates a _js directory for WASM
    const compileCmd = `.\\circom.exe "${circuitPath}" --r1cs --wasm --sym -o "${outputDir}"`;
    await execAsync(compileCmd);

    // Circom 2.x puts WASM in a directory named {circuitName}_js/
    const wasmSourceDir = path.join(outputDir, `${circuitName}_js`);
    const wasmSourceFile = path.join(wasmSourceDir, `${circuitName}.wasm`);
    const wasmDestFile = path.join(outputDir, `${circuitName}.wasm`);

    try {
        await fs.rename(wasmSourceFile, wasmDestFile);
        console.log(`  ├─ WASM moved to ${wasmDestFile}`);
    } catch (e) {
        console.log(`  ! Warning: could not move WASM from ${wasmSourceFile}: ${e.message}`);
    }

    console.log(`  ✓ Circuit compiled successfully`);
    return outputDir;
}


async function setupCeremony(circuitName, outputDir) {
    console.log(`\n🔐 Setting up trusted setup for ${circuitName}...`);

    const r1csPath = path.join(outputDir, `${circuitName}.r1cs`);
    const ptauPath = path.join(KEYS_DIR, 'pot12_final.ptau');
    const zkeyPath = path.join(KEYS_DIR, `${circuitName}.zkey`);
    const vkeyPath = path.join(KEYS_DIR, `${circuitName}_verification_key.json`);

    // Check if we already have the powers of tau file
    try {
        await fs.access(ptauPath);
        console.log('  ├─ Using existing powers of tau file');
    } catch {
        console.log('  ├─ Generating powers of tau (this may take a while)...');
        const pot12Path = path.join(KEYS_DIR, 'pot12.ptau');

        // Start powers of tau ceremony
        await execAsync(`npx snarkjs powersoftau new bn128 12 "${pot12Path}" -v`);

        // Contribute to the ceremony
        await execAsync(`npx snarkjs powersoftau contribute "${pot12Path}" "${ptauPath}" --name="First contribution" -v -e="random entropy"`);

        // Prepare phase 2 (CRITICAL for Groth16)
        const ptauPreparedPath = path.join(KEYS_DIR, 'pot12_prepared.ptau');
        await execAsync(`npx snarkjs powersoftau prepare phase2 "${ptauPath}" "${ptauPreparedPath}" -v`);

        // Use the prepared ptau as the final one
        await fs.rename(ptauPreparedPath, ptauPath);

        // Clean up intermediate file
        await fs.unlink(pot12Path);
    }

    // Generate zkey
    console.log('  ├─ Generating proving key...');
    await execAsync(`npx snarkjs groth16 setup "${r1csPath}" "${ptauPath}" "${zkeyPath}"`);

    // Export verification key
    console.log('  ├─ Exporting verification key...');
    await execAsync(`npx snarkjs zkey export verificationkey "${zkeyPath}" "${vkeyPath}"`);

    console.log(`  ✓ Setup completed for ${circuitName}`);
    return { zkeyPath, vkeyPath };
}

async function generateSolidityVerifier(circuitName, zkeyPath) {
    console.log(`\n📝 Generating Solidity verifier for ${circuitName}...`);

    const className = circuitName.charAt(0).toUpperCase() + circuitName.slice(1) + 'Verifier';
    const verifierPath = path.join(CONTRACTS_DIR, `${className}.sol`);

    await execAsync(`npx snarkjs zkey export solidityverifier "${zkeyPath}" "${verifierPath}"`);

    // Post-process: Rename the contract from 'Groth16Verifier' to a unique name
    let contractContent = await fs.readFile(verifierPath, 'utf8');
    contractContent = contractContent.replace(/contract Groth16Verifier/g, `contract ${className}`);
    await fs.writeFile(verifierPath, contractContent);

    console.log(`  ✓ Verifier contract generated and renamed to ${className}: ${verifierPath}`);
    return verifierPath;
}

async function copyWasmToFrontend(circuitName, outputDir) {
    console.log(`\n📋 Copying WASM files to frontend...`);

    const wasmDestDir = path.join(__dirname, '../frontend/public/circuits', circuitName);
    await ensureDir(wasmDestDir);

    // Copy WASM file
    const wasmFile = `${circuitName}.wasm`;
    await fs.copyFile(
        path.join(outputDir, wasmFile),
        path.join(wasmDestDir, wasmFile)
    );

    // Note: Circom v0 doesn't generate witness_calculator.js; snarkjs handles it differently
    console.log(`  ✓ WASM file copied to frontend`);
}

async function copyZkeyToFrontend(circuitName) {
    console.log(`📋 Copying ZKey to frontend...`);
    const zkeySrc = path.join(KEYS_DIR, `${circuitName}.zkey`);
    const zkeyDestDir = path.join(__dirname, '../frontend/public/circuits', circuitName);
    const zkeyDest = path.join(zkeyDestDir, `${circuitName}.zkey`);

    await ensureDir(zkeyDestDir);
    await fs.copyFile(zkeySrc, zkeyDest);
    console.log(`  ✓ ZKey file copied to frontend`);
}

async function main() {
    console.log('🚀 Starting circuit compilation and setup...\n');

    await ensureDir(BUILD_DIR);
    await ensureDir(KEYS_DIR);

    for (const circuit of CIRCUITS) {
        try {
            // Compile circuit
            const outputDir = await compileCircuit(circuit.name, circuit.file);

            // Setup ceremony and generate keys
            const { zkeyPath } = await setupCeremony(circuit.name, outputDir);

            // Generate Solidity verifier
            await generateSolidityVerifier(circuit.name, zkeyPath);

            // Copy WASM to frontend
            await copyWasmToFrontend(circuit.name, outputDir);

            // Copy ZKey to frontend
            await copyZkeyToFrontend(circuit.name);

            console.log(`\n✅ ${circuit.name} completed successfully!\n`);
        } catch (error) {
            console.error(`\n❌ Error processing ${circuit.name}:`, error.message);
            throw error;
        }
    }

    console.log('\n🎉 All circuits compiled and setup completed!\n');
    console.log('Next steps:');
    console.log('  1. Run: npm install');
    console.log('  2. Deploy contracts: npm run deploy:local');
    console.log('  3. Start frontend: npm run dev');
}

main().catch(console.error);
