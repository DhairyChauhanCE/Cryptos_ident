const hre = require("hardhat");
const fs = require("fs").promises;
const path = require("path");

/**
 * CI-Safe Deterministic Deployment Script (Phase 12)
 */

async function deployContract(name, args = []) {
    const Factory = await hre.ethers.getContractFactory(name);
    const contract = await Factory.deploy(...args);
    await contract.waitForDeployment();
    return contract;
}

async function main() {
    console.log("🚀 Initiating Deterministic Deployment...");

    const [deployer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();

    // 1. Deploy Verifiers
    const age = await deployContract("Age_verificationVerifier");
    const nat = await deployContract("Nationality_verificationVerifier");
    const stu = await deployContract("Student_verificationVerifier");

    const ageAddr = await age.getAddress();
    const natAddr = await nat.getAddress();
    const stuAddr = await stu.getAddress();

    // 2. Deploy Registry
    const registry = await deployContract("IdentityRegistry", [
        ageAddr,
        natAddr,
        stuAddr
    ]);
    const registryAddr = await registry.getAddress();

    const deploymentInfo = {
        network: hre.network.name,
        deployer: deployerAddress,
        timestamp: new Date().toISOString(),
        contracts: {
            AgeVerifier: ageAddr,
            NationalityVerifier: natAddr,
            StudentVerifier: stuAddr,
            IdentityRegistry: registryAddr
        }
    };

    // 3. Export to Frontend (Silent for CI, but destructive for consistency)
    const deploymentsDir = path.join(__dirname, "../frontend/src/contracts");
    await fs.mkdir(deploymentsDir, { recursive: true });

    await fs.writeFile(
        path.join(deploymentsDir, "deployment.json"),
        JSON.stringify(deploymentInfo, null, 2)
    );

    const artifacts = [
        { name: "IdentityRegistry", artifact: "IdentityRegistry" },
        { name: "AgeVerifier", artifact: "Age_verificationVerifier" },
        { name: "NationalityVerifier", artifact: "Nationality_verificationVerifier" },
        { name: "StudentVerifier", artifact: "Student_verificationVerifier" }
    ];

    for (const item of artifacts) {
        const art = await hre.artifacts.readArtifact(item.artifact);
        await fs.writeFile(
            path.join(deploymentsDir, `${item.name}.json`),
            JSON.stringify({ abi: art.abi }, null, 2)
        );
    }

    // 4. Final CI Output (JSON Stringified)
    console.log("-----------------------------------------");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    console.log("-----------------------------------------");
    console.log("✅ Deployment successful. Frontend synced.");
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
});
bitumen
