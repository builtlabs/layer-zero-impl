// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { LzCommon } from "./LzCommon.sol";

abstract contract LzSender is LzCommon {
    function estimateFees(
        bool _payInZRO,
        uint16 _dstChainId,
        bytes memory _payload,
        bytes memory _adapterParams
    ) external view returns (uint256, uint256) {
        return lzEndpoint.estimateFees(_dstChainId, address(this), _payload, _payInZRO, _adapterParams);
    }

    function _lzSend(
        uint16 _dstChainId,
        bytes memory _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes memory _adapterParams,
        uint _nativeFee
    ) internal virtual {
        bytes memory trustedRemote = trustedRemoteLookup[_dstChainId];
        if (trustedRemote.length == 0) revert NotTrustedRemote();

        lzEndpoint.send{ value: _nativeFee }(
            _dstChainId,
            trustedRemote,
            _payload,
            _refundAddress,
            _zroPaymentAddress,
            _adapterParams
        );
    }
}
