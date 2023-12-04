const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LzSender", function () {
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

    describe("estimateFees", function () {
        it("forwards the call as expected", async function () {
            const { sut, config } = await loadFixture(deploy);

            const payload = "0x696969";
            const adapterParams = "0x";

            const fees = await sut.a.estimateFees(
                false,
                config.chainId,
                payload,
                adapterParams
            );

            expect(fees[0]).to.equal(13201133000000000n);
            expect(fees[1]).to.equal(0n);
        });
    });

    describe("_lzSend", function () {
        it("reverts if there is no trusted remote", async function () {
            const { sut, config } = await loadFixture(deploy);

            const payload = "0x696969";
            const adapterParams = "0x";

            const fees = await sut.a.estimateFees(
                false,
                config.chainId,
                payload,
                adapterParams
            );

            await sut.a.setTrustedRemote(config.chainId, "0x");

            await expect(sut.a.send(config.chainId, payload, adapterParams, { value: fees[0] }))
                .to.be.revertedWithCustomError(sut.a, "NotTrustedRemote");
        });

        it("forwards the call as expected", async function () {
            const { sut, endPoint, wallets, config } = await loadFixture(deploy);

            const payload = "0x696969";
            const adapterParams = "0x";

            const fees = await sut.a.estimateFees(
                false,
                config.chainId,
                payload,
                adapterParams
            );

            const path = await sut.a.trustedRemoteLookup(config.chainId);

            await expect(sut.a.send(config.chainId, payload, adapterParams, { value: fees[0] }))
                .to.emit(endPoint, "Sending")
                .withArgs(
                    config.chainId,
                    path,
                    payload,
                    wallets.owner.address,
                    "0x0000000000000000000000000000000000000000",
                    adapterParams,
                    fees[0],
                );
        });
    });
});
