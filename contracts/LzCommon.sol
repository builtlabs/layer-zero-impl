// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ILayerZeroEndpoint } from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroEndpoint.sol";
import { ILayerZeroUserApplicationConfig } from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroUserApplicationConfig.sol";

abstract contract LzCommon is Ownable, ILayerZeroUserApplicationConfig {
    ILayerZeroEndpoint public immutable lzEndpoint;

    mapping(uint16 => bytes) public trustedRemoteLookup;

    address public precrime;

    event SetPrecrime(address precrime);
    event SetTrustedRemote(uint16 _remoteChainId, bytes _path);

    error NotEndpoint();
    error NotTrustedRemote();

    constructor(address _lzEndpoint) {
        lzEndpoint = ILayerZeroEndpoint(_lzEndpoint);
    }

    // #######################################################################################
    // #                                                                                     #
    // #                                      Modifiers                                      #
    // #                                                                                     #
    // #######################################################################################

    modifier onlyEndpoint() {
        if (msg.sender != address(lzEndpoint)) revert NotEndpoint();
        _;
    }

    modifier onlyTrustedRemote(uint16 _remoteChainId, bytes calldata _path) {
        bytes memory trustedRemote = trustedRemoteLookup[_remoteChainId];
        if (
            trustedRemote.length == 0 ||
            trustedRemote.length != _path.length ||
            keccak256(trustedRemote) != keccak256(_path)
        ) revert NotTrustedRemote();
        _;
    }

    // #######################################################################################
    // #                                                                                     #
    // #                                      LzCommon                                       #
    // #                                                                                     #
    // #######################################################################################

    function isTrustedRemote(uint16 _remoteChainId, bytes calldata _path) external view returns (bool) {
        bytes memory trustedSource = trustedRemoteLookup[_remoteChainId];
        return keccak256(trustedSource) == keccak256(_path);
    }

    function setTrustedRemote(uint16 _remoteChainId, bytes calldata _path) external onlyOwner {
        trustedRemoteLookup[_remoteChainId] = _path;
        emit SetTrustedRemote(_remoteChainId, _path);
    }

    function setPrecrime(address _precrime) external onlyOwner {
        precrime = _precrime;
        emit SetPrecrime(_precrime);
    }

    // #######################################################################################
    // #                                                                                     #
    // #                           ILayerZeroUserApplicationConfig                           #
    // #                                                                                     #
    // #######################################################################################

    function setConfig(
        uint16 _version,
        uint16 _chainId,
        uint _configType,
        bytes calldata _config
    ) external override onlyOwner {
        lzEndpoint.setConfig(_version, _chainId, _configType, _config);
    }

    function setSendVersion(uint16 _version) external override onlyOwner {
        lzEndpoint.setSendVersion(_version);
    }

    function setReceiveVersion(uint16 _version) external override onlyOwner {
        lzEndpoint.setReceiveVersion(_version);
    }

    function forceResumeReceive(uint16 _srcChainId, bytes calldata _srcAddress) external override onlyOwner {
        lzEndpoint.forceResumeReceive(_srcChainId, _srcAddress);
    }
}
