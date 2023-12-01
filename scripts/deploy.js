const hre = require("hardhat");

/*
    Addresses:    
    - endpoint:
        Sepolia: (10161) 0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1
        Mumbai:  (10109) 0xf69186dfBa60DdB133E91E9A4B5673624293d8F8
    - harness:
        Sepolia: 0x279C193B98Ed14709E53906353Be4C9c5FaF5DAc
        Mumbai:  0x9254868793634BCe5c446849d62149e88c0B956e
    - hardness async:
        Sepolia: 0xd4AFEAd9286afeB9f10535d34cB49aBdFE39ce54
        Mumbai:  0xE2DEB40a0D187334B8725c046fefa1d35e3EBD2a
*/

async function main() {
    return trust();
}

async function trust() {
    const chainId = 10161;

    const Harness = await hre.ethers.getContractFactory("Harness");
    const harness = Harness.attach("0x9254868793634BCe5c446849d62149e88c0B956e");

    const HarnessAsync = await hre.ethers.getContractFactory("HarnessAsync");
    const harnessAsync = HarnessAsync.attach("0xE2DEB40a0D187334B8725c046fefa1d35e3EBD2a");

    const hardnessRemote = hre.ethers.solidityPacked(["address", "address"], ["0x279C193B98Ed14709E53906353Be4C9c5FaF5DAc", "0x9254868793634BCe5c446849d62149e88c0B956e"]);
    const hardnessAsyncRemote = hre.ethers.solidityPacked(["address", "address"], ["0xd4AFEAd9286afeB9f10535d34cB49aBdFE39ce54", "0xE2DEB40a0D187334B8725c046fefa1d35e3EBD2a"]);

    // await harness.setTrustedRemote(chainId, hardnessRemote);
    // await harnessAsync.setTrustedRemote(chainId, hardnessAsyncRemote);

    console.log(hre.ethers.solidityPacked(["uint16", "uint256"], ["1", "500000"]))

    console.log("harness: ", await harness.isTrustedRemote(chainId, hardnessRemote));
    console.log("harnessAsync: ", await harnessAsync.isTrustedRemote(chainId, hardnessAsyncRemote));

    console.log("done");
}

async function deploy() {
    const endpoint = "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1";

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