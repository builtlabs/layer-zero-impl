const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LzReceiverAsync", function () {
    async function deploy() {
        const [owner, user] = await ethers.getSigners();

        const chainId = 123;

        const LayerZeroEndpointMock = await ethers.getContractFactory("LZEndpointMock");
        const lzEndpointMock = await LayerZeroEndpointMock.deploy(chainId);

        const Harness = await ethers.getContractFactory("HarnessAsync");
        const harnessA = await Harness.deploy(lzEndpointMock.target);
        const harnessB = await Harness.deploy(lzEndpointMock.target);

        await lzEndpointMock.setDestLzEndpoint(harnessA.target, lzEndpointMock.target);
        await lzEndpointMock.setDestLzEndpoint(harnessB.target, lzEndpointMock.target);

        await harnessA.setTrustedRemote(
            chainId,
            ethers.solidityPacked(["address", "address"], [harnessB.target, harnessA.target])
        );

        await harnessB.setTrustedRemote(
            chainId,
            ethers.solidityPacked(["address", "address"], [harnessA.target, harnessB.target])
        );

        return {
            sut: {
                a: harnessA,
                b: harnessB,
            },
            endPoint: lzEndpointMock,
            wallets: {
                owner,
                user,
            },
            config: {
                chainId,
            },
        };
    }

    describe("_blockingLzReceive", function () {
        it("stores a failed message", async function () {
            const { sut, config } = await loadFixture(deploy);

            const payload = "0x696969";
            const adapterParams = "0x";

            const fees = await sut.a.estimateFees(false, config.chainId, payload, adapterParams);

            const sourceAddress = ethers.solidityPacked(["address", "address"], [sut.a.target, sut.b.target]);

            await sut.b.setRevertOnReceive(true);

            await sut.a.send(config.chainId, payload, adapterParams, { value: fees[0] });

            expect(await sut.b.failedMessages(config.chainId, sourceAddress, 1)).to.equal(
                ethers.keccak256(payload).toLocaleLowerCase()
            );
        });

        it("emits MessageFailed on failure", async function () {
            const { sut, config } = await loadFixture(deploy);

            const payload = "0x696969";
            const adapterParams = "0x";

            const fees = await sut.a.estimateFees(false, config.chainId, payload, adapterParams);

            const sourceAddress = ethers.solidityPacked(["address", "address"], [sut.a.target, sut.b.target]);

            await sut.b.setRevertOnReceive(true);

            // prefix + error code "revertOnReceive", not entirely sure how this gets encoded..
            const reason = "0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000f7265766572744f6e526563656976650000000000000000000000000000000000"

            await expect(sut.a.send(config.chainId, payload, adapterParams, { value: fees[0] }))
                .to.emit(sut.b, "MessageFailed")
                .withArgs(config.chainId, sourceAddress, 1, payload, reason);
        });

        it("forwards the call", async function () {
            const { sut, config } = await loadFixture(deploy);

            const payload = "0x696969";
            const adapterParams = "0x";

            const fees = await sut.a.estimateFees(false, config.chainId, payload, adapterParams);

            const sourceAddress = ethers.solidityPacked(["address", "address"], [sut.a.target, sut.b.target]);

            await sut.a.send(config.chainId, payload, adapterParams, { value: fees[0] });

            expect(await sut.b.received(config.chainId, sourceAddress, 1)).to.equal(payload);
        });
    });

    describe("retryMessage", function () {
        it("reverts when no message is stored", async function () {
            const { sut, config } = await loadFixture(deploy);

            await expect(sut.a.retryMessage(config.chainId, sut.b.target, 1, "0x")).to.be.revertedWithCustomError(
                sut.a,
                "NoStoredMessage"
            );
        });

        it("reverts when calling the same retry again", async function () {
            const { sut, config } = await loadFixture(deploy);

            const target = sut.b.target;
            const nonce = 1;
            const payload = "0x696969";

            await sut.a.storeFailedMessage(config.chainId, target, nonce, payload);
            await sut.a.retryMessage(config.chainId, target, nonce, payload);

            await expect(sut.a.retryMessage(config.chainId, target, nonce, payload)).to.be.revertedWithCustomError(
                sut.a,
                "NoStoredMessage"
            );
        });

        it("reverts when the wrong payload is given", async function () {
            const { sut, config } = await loadFixture(deploy);

            const target = sut.b.target;
            const nonce = 1;
            const payload = "0x696969";

            await sut.a.storeFailedMessage(config.chainId, target, nonce, payload);

            await expect(sut.a.retryMessage(config.chainId, target, nonce, "0x6969")).to.be.revertedWithCustomError(
                sut.a,
                "IncorrectPayloadHash"
            );
        });

        it("retries the message", async function () {
            const { sut, config } = await loadFixture(deploy);

            const target = sut.b.target.toLocaleLowerCase();
            const nonce = 1;
            const payload = "0x696969";

            await sut.a.storeFailedMessage(config.chainId, target, nonce, payload);
            await sut.a.retryMessage(config.chainId, target, nonce, payload);

            expect(await sut.a.received(config.chainId, target, nonce)).to.equal(payload);
        });

        it("emits the RetryMessageSuccess event", async function () {
            const { sut, config } = await loadFixture(deploy);

            const target = sut.b.target.toLocaleLowerCase();
            const nonce = 1;
            const payload = "0x696969";

            await sut.a.storeFailedMessage(config.chainId, target, nonce, payload);

            await expect(sut.a.retryMessage(config.chainId, target, nonce, payload))
                .to.emit(sut.a, "RetryMessageSuccess")
                .withArgs(config.chainId, target, nonce, ethers.keccak256(payload).toLocaleLowerCase());
        });
    });

    describe("nonblockingLzReceive", function () {
        it("reverts if the caller is not the contract", async function () {
            const { sut, config } = await loadFixture(deploy);

            await expect(
                sut.a.nonblockingLzReceive(config.chainId, sut.b.target, 1, "0x")
            ).to.be.revertedWithCustomError(sut.a, "CallerNotThis");
        });
    });
});
