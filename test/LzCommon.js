const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LzCommon", function () {
    async function deploy() {
        const [owner, user] = await ethers.getSigners();

        const chainId = 123;

        const LayerZeroEndpointMock = await ethers.getContractFactory("LZEndpointMock");
        const lzEndpointMock = await LayerZeroEndpointMock.deploy(chainId);

        const Harness = await ethers.getContractFactory("Harness");
        const harness = await Harness.deploy(lzEndpointMock.target);

        return {
            sut: harness,
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

    describe("constructor", function () {
        it("sets the endpoint", async function () {
            const { sut, endPoint } = await loadFixture(deploy);

            expect(await sut.lzEndpoint()).to.equal(endPoint.target);
        });
    });

    describe("onlyEndpoint", function () {
        it("does not revert when called by the endpoint", async function () {
            const { sut, endPoint } = await loadFixture(deploy);

            await expect(endPoint.callTestOnlyEndpoint(sut.target)).to.not.be.reverted;
        });

        it("reverts when not called by the endpoint", async function () {
            const { sut } = await loadFixture(deploy);

            await expect(sut.t_onlyEndpoint()).to.be.revertedWithCustomError(sut, "NotEndpoint");
        });
    });

    describe("onlyTrustedRemote", function () {
        it("does not revert if the remote is trusted", async function () {
            const { sut } = await loadFixture(deploy);
            await sut.setTrustedRemote(0, "0x696969");
            await expect(sut.t_onlyTrustedRemote(0, "0x696969")).to.not.be.reverted;
        });

        it("reverts if there is no trusted remote for that chain", async function () {
            const { sut } = await loadFixture(deploy);
            await expect(sut.t_onlyTrustedRemote(0, "0x696969"))
                .to.be.revertedWithCustomError(sut, "NotTrustedRemote");
        });

        it("reverts if the trusted remote length does not match", async function () {
            const { sut } = await loadFixture(deploy);
            await sut.setTrustedRemote(0, "0x696969");
            await expect(sut.t_onlyTrustedRemote(0, "0x69696969"))
                .to.be.revertedWithCustomError(sut, "NotTrustedRemote");
        });

        it("reverts if the trusted remote values don't match", async function () {
            const { sut } = await loadFixture(deploy);
            await sut.setTrustedRemote(0, "0x696969");
            await expect(sut.t_onlyTrustedRemote(0, "0x696968"))
                .to.be.revertedWithCustomError(sut, "NotTrustedRemote");
        });
    });

    describe("isTrustedRemote", function () {
        it("returns true if the paths match", async function () {
            const { sut } = await loadFixture(deploy);
            await sut.setTrustedRemote(0, "0x696969");

            expect(await sut.isTrustedRemote(0, "0x696969")).to.equal(true);
        });

        it("returns false if the paths do not match", async function () {
            const { sut } = await loadFixture(deploy);
            await sut.setTrustedRemote(0, "0x696969");

            expect(await sut.isTrustedRemote(0, "0x686868")).to.equal(false);
        });
    });

    describe("setTrustedRemote", function () {
        it("sets the trusted remote", async function () {
            const { sut } = await loadFixture(deploy);
            await sut.setTrustedRemote(0, "0x696969");

            expect(await sut.trustedRemoteLookup(0)).to.equal("0x696969");
        });

        it("emits SetTrustedRemote", async function () {
            const { sut } = await loadFixture(deploy);
            await expect(sut.setTrustedRemote(0, "0x696969"))
                .to.emit(sut, "SetTrustedRemote")
                .withArgs(0, "0x696969");
        });

        it("can only be called by the owner", async function () {
            const { sut, wallets } = await loadFixture(deploy);

            await expect(sut.connect(wallets.user).setTrustedRemote(0, "0x696969")).to.be.revertedWithCustomError(
                sut,
                "OwnableUnauthorizedAccount"
            );
        });
    });

    describe("setPrecrime", function () {
        it("sets the precrime", async function () {
            const { sut, wallets } = await loadFixture(deploy);
            await sut.setPrecrime(wallets.user.address);

            expect(await sut.precrime()).to.equal(wallets.user.address);
        });

        it("emits SetPrecrime", async function () {
            const { sut, wallets } = await loadFixture(deploy);
            await expect(sut.setPrecrime(wallets.user.address))
                .to.emit(sut, "SetPrecrime")
                .withArgs(wallets.user.address);
        });

        it("can only be called by the owner", async function () {
            const { sut, wallets } = await loadFixture(deploy);

            await expect(sut.connect(wallets.user).setPrecrime(wallets.user.address)).to.be.revertedWithCustomError(
                sut,
                "OwnableUnauthorizedAccount"
            );
        });
    });

    describe("setConfig", function () {
        it("sets the suts config for version, chain, and type", async function () {
            const { sut, endPoint } = await loadFixture(deploy);

            await sut.setConfig(0, 1, 2, "0x696969");

            expect(await endPoint.getConfig(0, 1, sut.target, 2)).to.equal("0x696969");
        });

        it("can only be called by the owner", async function () {
            const { sut, wallets } = await loadFixture(deploy);

            await expect(sut.connect(wallets.user).setConfig(0, 0, 0, "0x696969")).to.be.revertedWithCustomError(
                sut,
                "OwnableUnauthorizedAccount"
            );
        });
    });

    describe("setSendVersion", function () {
        it("sets the send version", async function () {
            const { sut, endPoint } = await loadFixture(deploy);

            await sut.setSendVersion(5);

            expect(await endPoint.getSendVersion(sut.target)).to.equal(5);
        });

        it("can only be called by the owner", async function () {
            const { sut, wallets } = await loadFixture(deploy);

            await expect(sut.connect(wallets.user).setSendVersion(0)).to.be.revertedWithCustomError(
                sut,
                "OwnableUnauthorizedAccount"
            );
        });
    });

    describe("setReceiveVersion", function () {
        it("sets the receive version", async function () {
            const { sut, endPoint } = await loadFixture(deploy);

            await sut.setReceiveVersion(5);

            expect(await endPoint.getReceiveVersion(sut.target)).to.equal(5);
        });

        it("can only be called by the owner", async function () {
            const { sut, wallets } = await loadFixture(deploy);

            await expect(sut.connect(wallets.user).setReceiveVersion(0)).to.be.revertedWithCustomError(
                sut,
                "OwnableUnauthorizedAccount"
            );
        });
    });

    describe("forceResumeReceive", function () {
        it("forwards the call to the endpoint", async function () {
            const { sut, endPoint } = await loadFixture(deploy);

            await endPoint.mockStoredPayload(0, "0x696969", sut.target);

            await expect(sut.forceResumeReceive(0, "0x696969"))
                .to.emit(endPoint, "UaForceResumeReceive")
                .withArgs(0, "0x696969");
        });

        it("can only be called by the owner", async function () {
            const { sut, wallets } = await loadFixture(deploy);

            await expect(sut.connect(wallets.user).forceResumeReceive(0, "0x696969")).to.be.revertedWithCustomError(
                sut,
                "OwnableUnauthorizedAccount"
            );
        });
    });
});
