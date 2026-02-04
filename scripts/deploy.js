const hre = require("hardhat");
const fs = require("fs").promises;
const path = require("path");

async function main() {
    console.log("🚀 Deploying ZK Identity Verification contracts...");

    const [deployer] = await hre.ethers.getSigners();
    if (!deployer) {
        throw new Error("DEPLOYMENT_ERROR: No deployer found. Check your .env PRIVATE_KEY.");
    }

    // In ethers v6, address is available on the signer, but getAddress() is safer
    const deployerAddress = await deployer.getAddress();
    console.log("Deploying with account:", deployerAddress);

    // 1. Deploy Age Verifier
    console.log("📦 Deploying Age Verifier...");
    const AgeVerifier = await hre.ethers.getContractFactory("Age_verificationVerifier");
    const ageVerifier = await AgeVerifier.deploy();
    await ageVerifier.waitForDeployment();
    const ageVerifierAddress = await ageVerifier.getAddress();
    console.log("AgeVerifier deployed at:", ageVerifierAddress);

    // 2. Deploy Nationality Verifier
    console.log("📦 Deploying Nationality Verifier...");
    const NationalityVerifier = await hre.ethers.getContractFactory("Nationality_verificationVerifier");
    const nationalityVerifier = await NationalityVerifier.deploy();
    await nationalityVerifier.waitForDeployment();
    const nationalityVerifierAddress = await nationalityVerifier.getAddress();
    console.log("NationalityVerifier deployed at:", nationalityVerifierAddress);

    // 3. Deploy Student Verifier
    console.log("📦 Deploying Student Verifier...");
    const StudentVerifier = await hre.ethers.getContractFactory("Student_verificationVerifier");
    const studentVerifier = await StudentVerifier.deploy();
    await studentVerifier.waitForDeployment();
    const studentVerifierAddress = await studentVerifier.getAddress();
    console.log("StudentVerifier deployed at:", studentVerifierAddress);

    // 4. Deploy Identity Registry
    console.log("📦 Deploying Identity Registry...");
    const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry");
    const identityRegistry = await IdentityRegistry.deploy(
        ageVerifierAddress,
        nationalityVerifierAddress,
        studentVerifierAddress
    );
    await identityRegistry.waitForDeployment();
    const identityRegistryAddress = await identityRegistry.getAddress();
    console.log("IdentityRegistry deployed at:", identityRegistryAddress);

    // Save deployment addresses to frontend
    const deploymentInfo = {
        network: hre.network.name,
        deployer: deployerAddress,
        timestamp: new Date().toISOString(),
        contracts: {
            AgeVerifier: ageVerifierAddress,
            NationalityVerifier: nationalityVerifierAddress,
            StudentVerifier: studentVerifierAddress,
            IdentityRegistry: identityRegistryAddress
        }
    };

    const deploymentsDir = path.join(__dirname, "../frontend/src/contracts");
    await fs.mkdir(deploymentsDir, { recursive: true });
    await fs.writeFile(path.join(deploymentsDir, "deployment.json"), JSON.stringify(deploymentInfo, null, 2));

    // Export ABIs for frontend
    const contractsToExport = [
        { name: "IdentityRegistry", artifact: "IdentityRegistry" },
        { name: "AgeVerifier", artifact: "Age_verificationVerifier" },
        { name: "NationalityVerifier", artifact: "Nationality_verificationVerifier" },
        { name: "StudentVerifier", artifact: "Student_verificationVerifier" }
    ];

    for (const item of contractsToExport) {
        const artifact = await hre.artifacts.readArtifact(item.artifact);
        await fs.writeFile(
            path.join(deploymentsDir, `${item.name}.json`),
            JSON.stringify({ abi: artifact.abi }, null, 2)
        );
    }

    console.log("✅ Deployment completed successfully! Addresses saved to frontend.");
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
});
