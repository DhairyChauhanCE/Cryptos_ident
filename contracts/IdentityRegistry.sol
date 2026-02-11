// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

interface IAgeVerifier {
    function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[4] memory input) external view returns (bool);
}

interface INationalityVerifier {
    function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[3] memory input) external view returns (bool);
}

interface IStudentVerifier {
    function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[3] memory input) external view returns (bool);
}

/**
 * @title IdentityRegistry
 * @dev Manages decentralized identities and verification proofs (UUPS Upgradeable)
 * Hardened for production with ReentrancyGuard and Nullifier protection.
 */
contract IdentityRegistry is Initializable, UUPSUpgradeable, Ownable2StepUpgradeable, ReentrancyGuardUpgradeable {
    // Claim types
    enum ClaimType {
        AGE_OVER_18,
        NATIONALITY_MATCH,
        UNIVERSITY_STUDENT
    }
    
    // Verifier contracts
    IAgeVerifier public ageVerifier;
    INationalityVerifier public nationalityVerifier;
    IStudentVerifier public studentVerifier;
    
    // Identity structure
    struct Identity {
        address wallet;
        bytes32 identityHash; // The Poseidon commitment
        bool registered;
        mapping(ClaimType => bool) verifiedClaims;
        mapping(ClaimType => uint256) verificationTimestamp;
        uint256 registeredAt;
    }
    
    // Storage
    mapping(address => Identity) private identities;
    mapping(uint256 => bool) public nullifiers; // Nullifier system (replacing usedNonces)
    
    // Revocation Registry
    mapping(address => mapping(ClaimType => bool)) public revokedClaims;
    
    // Events
    event IdentityRegistered(address indexed user, bytes32 identityHash, uint256 timestamp);
    event ClaimVerified(address indexed user, ClaimType claimType, uint256 timestamp);
    event ClaimRevoked(address indexed user, ClaimType claimType, uint256 timestamp);
    event VerifierUpdated(ClaimType indexed claimType, address newVerifier);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize function for UUPS proxy
     */
    function initialize(
        address _ageVerifier, 
        address _nationalityVerifier, 
        address _studentVerifier
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        ageVerifier = IAgeVerifier(_ageVerifier);
        nationalityVerifier = INationalityVerifier(_nationalityVerifier);
        studentVerifier = IStudentVerifier(_studentVerifier);
    }

    /**
     * @dev Authorize upgrade (UUPS requirement)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Register a new decentralized identifier (as a commitment)
     */
    function registerIdentity(bytes32 _identityHash) external nonReentrant {
        require(!identities[msg.sender].registered, "Identity already registered");
        require(_identityHash != 0, "Commitment cannot be zero");
        
        Identity storage identity = identities[msg.sender];
        identity.wallet = msg.sender;
        identity.identityHash = _identityHash;
        identity.registered = true;
        identity.registeredAt = block.timestamp;
        
        emit IdentityRegistered(msg.sender, _identityHash, block.timestamp);
    }
    
    /**
     * @dev Submit age verification proof
     */
    function verifyAge(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory publicSignals
    ) external nonReentrant {
        require(identities[msg.sender].registered, "Identity not registered");
        require(bytes32(publicSignals[0]) == identities[msg.sender].identityHash, "Commitment mismatch");
        require(!nullifiers[publicSignals[3]], "NULLIFIER_EXHAUSTED: Proof Replay");
        require(!revokedClaims[msg.sender][ClaimType.AGE_OVER_18], "Claim suspended");
        
        require(ageVerifier.verifyProof(a, b, c, publicSignals), "INVALID_ZK_PROOF");
        
        nullifiers[publicSignals[3]] = true;
        identities[msg.sender].verifiedClaims[ClaimType.AGE_OVER_18] = true;
        identities[msg.sender].verificationTimestamp[ClaimType.AGE_OVER_18] = block.timestamp;
        
        emit ClaimVerified(msg.sender, ClaimType.AGE_OVER_18, block.timestamp);
    }
    
    /**
     * @dev Submit nationality verification proof
     */
    function verifyNationality(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[3] memory publicSignals
    ) external nonReentrant {
        require(identities[msg.sender].registered, "Identity not registered");
        require(bytes32(publicSignals[0]) == identities[msg.sender].identityHash, "Commitment mismatch");
        require(!nullifiers[publicSignals[2]], "NULLIFIER_EXHAUSTED");
        require(!revokedClaims[msg.sender][ClaimType.NATIONALITY_MATCH], "Claim suspended");
        
        require(nationalityVerifier.verifyProof(a, b, c, publicSignals), "INVALID_ZK_PROOF");
        
        nullifiers[publicSignals[2]] = true;
        identities[msg.sender].verifiedClaims[ClaimType.NATIONALITY_MATCH] = true;
        identities[msg.sender].verificationTimestamp[ClaimType.NATIONALITY_MATCH] = block.timestamp;
        
        emit ClaimVerified(msg.sender, ClaimType.NATIONALITY_MATCH, block.timestamp);
    }

    /**
     * @dev Submit student verification proof
     */
    function verifyStudent(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[3] memory publicSignals
    ) external nonReentrant {
        require(identities[msg.sender].registered, "Identity not registered");
        require(bytes32(publicSignals[0]) == identities[msg.sender].identityHash, "Commitment mismatch");
        require(!nullifiers[publicSignals[2]], "NULLIFIER_EXHAUSTED");
        require(!revokedClaims[msg.sender][ClaimType.UNIVERSITY_STUDENT], "Claim suspended");
        
        require(studentVerifier.verifyProof(a, b, c, publicSignals), "INVALID_ZK_PROOF");
        
        nullifiers[publicSignals[2]] = true;
        identities[msg.sender].verifiedClaims[ClaimType.UNIVERSITY_STUDENT] = true;
        identities[msg.sender].verificationTimestamp[ClaimType.UNIVERSITY_STUDENT] = block.timestamp;
        
        emit ClaimVerified(msg.sender, ClaimType.UNIVERSITY_STUDENT, block.timestamp);
    }

    // View Functions
    function isRegistered(address user) external view returns (bool) {
        return identities[user].registered;
    }

    function getIdentityHash(address user) external view returns (bytes32) {
        require(identities[user].registered, "Not registered");
        return identities[user].identityHash;
    }

    function isVerified(address user, ClaimType claimType) external view returns (bool verified, uint256 timestamp) {
        return (identities[user].verifiedClaims[claimType], identities[user].verificationTimestamp[claimType]);
    }

    function isRevoked(address user, ClaimType claimType) external view returns (bool) {
        return revokedClaims[user][claimType];
    }

    // Governance & Compliance
    function updateVerifier(ClaimType claimType, address newVerifier) external onlyOwner {
        if (claimType == ClaimType.AGE_OVER_18) ageVerifier = IAgeVerifier(newVerifier);
        else if (claimType == ClaimType.NATIONALITY_MATCH) nationalityVerifier = INationalityVerifier(newVerifier);
        else if (claimType == ClaimType.UNIVERSITY_STUDENT) studentVerifier = IStudentVerifier(newVerifier);
        emit VerifierUpdated(claimType, newVerifier);
    }

    function adminRevokeClaim(address _user, ClaimType _claimType) external onlyOwner {
        identities[_user].verifiedClaims[_claimType] = false;
        revokedClaims[_user][_claimType] = true;
        emit ClaimRevoked(_user, _claimType, block.timestamp);
    }

    /**
     * @dev Full Identity Revocation (Phase 2 Extreme Security)
     */
    function revokeIdentity(address _user) external onlyOwner {
        identities[_user].verifiedClaims[ClaimType.AGE_OVER_18] = false;
        identities[_user].verifiedClaims[ClaimType.NATIONALITY_MATCH] = false;
        identities[_user].verifiedClaims[ClaimType.UNIVERSITY_STUDENT] = false;
        
        revokedClaims[_user][ClaimType.AGE_OVER_18] = true;
        revokedClaims[_user][ClaimType.NATIONALITY_MATCH] = true;
        revokedClaims[_user][ClaimType.UNIVERSITY_STUDENT] = true;
        
        emit ClaimRevoked(_user, ClaimType.AGE_OVER_18, block.timestamp);
    }

    // Gaps for future state additions in upgrades
    uint256[50] private __gap;
}
