const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LzReceiver", function () {
    async function deploy() {
        const [owner, user] = await ethers.getSigners();

        const chainId = 123;

        const LayerZeroEndpointMock = await ethers.getContractFactory("LZEndpointMock");
        const lzEndpointMock = await LayerZeroEndpointMock.deploy(chainId);

        const Harness = await ethers.getContractFactory("Harness");
        const harnessA = await Harness.deploy(lzEndpointMock.target);
        const harnessB = await Harness.deploy(lzEndpointMock.target);

        await lzEndpointMock.setDestLzEndpoint(harnessA.target, lzEndpointMock.target);
        await lzEndpointMock.setDestLzEndpoint(harnessB.target, lzEndpointMock.target);

        await harnessA.setTrustedRemote(
            chainId,
            ethers.solidityPacked(["address", "address"], [harnessB.target, harnessA.target])
        )

        await harnessB.setTrustedRemote(
            chainId,
            ethers.solidityPacked(["address", "address"], [harnessA.target, harnessB.target])
        )

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

    describe("lzReceive", function () {
        it("reverts if its not called by the endpoint", async function () {
            const { sut, config } = await loadFixture(deploy);

            const nonce = 1;
            const notTrustedSource = "0x123456";
            const payload = "0x696969";

            await expect(sut.a.lzReceive(config.chainId, notTrustedSource, nonce, payload))
                .to.be.revertedWithCustomError(sut.b, "NotEndpoint");
        });

        it("reverts if its not called by a trusted remote", async function () {
            const { sut, endPoint, config } = await loadFixture(deploy);

            const nonce = 1;
            const notTrustedSource = "0x123456";
            const payload = "0x696969";

            await expect(endPoint.directCallReceive(sut.a.target, config.chainId, notTrustedSource, nonce, payload))
                .to.be.revertedWithCustomError(sut.b, "NotTrustedRemote");
        });

        it("forwards the call as expected", async function () {
            const { sut, endPoint, config } = await loadFixture(deploy);

            const payload = "0x696969";
            const adapterParams = "0x";

            const fees = await sut.a.estimateFees(
                false,
                config.chainId,
                payload,
                adapterParams
            );

            const sourceAddress = ethers.solidityPacked(["address", "address"], [sut.a.target, sut.b.target])

            await sut.a.send(config.chainId, payload, adapterParams, { value: fees[0] });
            const receipt = await sut.b.received(config.chainId, sourceAddress, 1);

            expect(receipt[0]).to.equal(endPoint.target);
            expect(receipt[1]).to.equal(sourceAddress);
            expect(receipt[2]).to.equal(payload);
        });
    });
});
