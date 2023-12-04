const hre = require("hardhat");

const sepolia = {
    chainId: 10161,
    endpoint: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1"
}

const mumbai = {
    chainId: 10109,
    endpoint: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8"
}

async function main() {
    return deploy();
}

async function deploy() {
    const endpoint = "";

    const Harness = await hre.ethers.getContractFactory("Harness");
    const harness = await Harness.deploy(endpoint);
    await harness.waitForDeployment();
    console.log("Harness deployed to:", harness.target);

    const HarnessAsync = await hre.ethers.getContractFactory("HarnessAsync");
    const harnessAsync = await HarnessAsync.deploy(endpoint);
    await harnessAsync.waitForDeployment();
    console.log("HarnessAsync deployed to:", harnessAsync.target);

    await sleep(30000);

    await verify(harness.target, [endpoint]);
    await verify(harnessAsync.target, [endpoint]);
}

async function trust() {
    const chainId = 0;

    const Harness = await hre.ethers.getContractFactory("Harness");
    const harness = Harness.attach("");

    const HarnessAsync = await hre.ethers.getContractFactory("HarnessAsync");
    const harnessAsync = HarnessAsync.attach("");

    const hardnessRemote = hre.ethers.solidityPacked(["address", "address"], ["", ""]);
    const harnessAsyncRemote = hre.ethers.solidityPacked(["address", "address"], ["", ""]);

    await harness.setTrustedRemote(chainId, hardnessRemote);
    await harnessAsync.setTrustedRemote(chainId, harnessAsyncRemote);

    console.log("done");
}

async function verify(address, args) {
    await sleep(1000);
    return hre.run("verify:verify", {
        address,
        constructorArguments: args,
    });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});