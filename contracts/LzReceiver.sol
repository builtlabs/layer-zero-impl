// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { LzCommon } from "./LzCommon.sol";
import { ILayerZeroReceiver } from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroReceiver.sol";

abstract contract LzReceiver is LzCommon, ILayerZeroReceiver {
    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) public override onlyEndpoint onlyTrustedRemote(_srcChainId, _srcAddress) {
        _blockingLzReceive(_srcChainId, _srcAddress, _nonce, _payload);
    }

    function _blockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal virtual;
}
