// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { LzSender } from "../LzSender.sol";
import { LzReceiverAsync } from "../LzReceiverAsync.sol";
import { LzCommon, Ownable } from "../LzCommon.sol";

contract HarnessAsync is LzSender, LzReceiverAsync {
    struct Message {
        address sender;
        uint256 value;
        uint256 estimate;
        bytes payload;
        bytes adapterParams;
    }

    mapping(uint16 => Message[]) public sent;
    mapping(uint16 => mapping(bytes => mapping(uint64 => bytes))) public received;

    constructor(address _lzEndpoint) LzCommon(_lzEndpoint) Ownable(msg.sender) {}

    function send(uint16 _dstChainId, bytes memory _payload, bytes memory _adapterParams) external payable {
        (uint estimate, ) = lzEndpoint.estimateFees(_dstChainId, address(this), _payload, false, _adapterParams);

        sent[_dstChainId].push(Message(msg.sender, msg.value, estimate, _payload, _adapterParams));
        _lzSend(_dstChainId, _payload, payable(msg.sender), address(0), _adapterParams, msg.value);
    }

    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal override {
        received[_srcChainId][_srcAddress][_nonce] = _payload;
    }
}
