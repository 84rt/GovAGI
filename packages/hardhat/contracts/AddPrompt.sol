//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

contract SubmitText {
    address public userAddress;
    string public textField;
    
    function submitText(address _userAddress, string memory _textField, address _otherContractAddress) public {
        userAddress = _userAddress;
        textField = _textField;
        OtherContract otherContract = OtherContract(_otherContractAddress);
        otherContract.submitText(_textField);
    }
}

contract OtherContract {
    string public textField;
    
    function submitText(string memory _textField) public {
        textField = _textField;
    }
}