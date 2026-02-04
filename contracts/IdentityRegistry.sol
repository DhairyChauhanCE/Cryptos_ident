// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Age_verificationVerifier.sol";
import "./Nationality_verificationVerifier.sol";

/**
 * @title IdentityRegistry
 * @dev Manages decentralized identities and verification proofs
 * @notice Users can register DIDs and submit ZK proofs for various claims
 */
interface IAgeVerifier {
    function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[2] memory input) external view returns (bool);
}

interface INationalityVerifier {
    function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[2] memory input) external view returns (bool);
}

interface IStudentVerifier {
    function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[2] memory input) external view returns (bool);
}

contract IdentityRegistry {
    // Claim types
    enum ClaimType {
        AGE_OVER_18,
        NATIONALITY_MATCH,
        UNIVERSITY_STUDENT
    }
    
    // Verifier contracts
    address public owner;
    IAgeVerifier public ageVerifier;
    INationalityVerifier public nationalityVerifier;
    IStudentVerifier public studentVerifier;
    
    // Identity structure
    struct Identity {
        address wallet;
        string did;
        bool registered;
        mapping(ClaimType => bool) verifiedClaims;
        mapping(ClaimType => uint256) verificationTimestamp;
        uint256 registeredAt;
    }
    
    // Storage
    mapping(address => Identity) private identities;
    mapping(uint256 => bool) private usedNonces;
    
    // Events
    event IdentityRegistered(address indexed user, string did, uint256 timestamp);
    event ClaimVerified(address indexed user, ClaimType claimType, uint256 timestamp);
    event ClaimRevoked(address indexed user, ClaimType claimType, uint256 timestamp);
    
    /**
     * @dev Constructor - deploys or links to verifier contracts
     */
    constructor(address _ageVerifier, address _nationalityVerifier, address _studentVerifier) {
        owner = msg.sender;
        ageVerifier = IAgeVerifier(_ageVerifier);
        nationalityVerifier = INationalityVerifier(_nationalityVerifier);
        studentVerifier = IStudentVerifier(_studentVerifier);
    }
    
    /**
     * @dev Register a new decentralized identifier
     * @param _did The DID string (e.g., "did:ethr:0x...")
     */
    function registerIdentity(string memory _did) external {
        require(!identities[msg.sender].registered, "Identity already registered");
        require(bytes(_did).length > 0, "DID cannot be empty");
        
        identities[msg.sender].wallet = msg.sender;
        identities[msg.sender].did = _did;
        identities[msg.sender].registered = true;
        identities[msg.sender].registeredAt = block.timestamp;
        
        emit IdentityRegistered(msg.sender, _did, block.timestamp);
    }
    
    /**
     * @dev Submit age verification proof
     * @param a Proof A
     * @param b Proof B
     * @param c Proof C
     * @param publicSignals The public inputs [minAge, nonce]
     */
    function verifyAge(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory publicSignals
    ) external {
        require(identities[msg.sender].registered, "Identity not registered");
        require(!usedNonces[publicSignals[1]], "Proof already used (nonce replay)");
        
        // Verify the proof
        bool valid = ageVerifier.verifyProof(a, b, c, publicSignals);
        require(valid, "Invalid proof");
        
        // Mark nonce as used
        usedNonces[publicSignals[1]] = true;
        
        // Mark claim as verified
        identities[msg.sender].verifiedClaims[ClaimType.AGE_OVER_18] = true;
        identities[msg.sender].verificationTimestamp[ClaimType.AGE_OVER_18] = block.timestamp;
        
        emit ClaimVerified(msg.sender, ClaimType.AGE_OVER_18, block.timestamp);
    }
    
    /**
     * @dev Submit nationality verification proof
     * @param a Proof A
     * @param b Proof B
     * @param c Proof C
     * @param publicSignals Public signals [expectedNationality, nonce]
     */
    function verifyNationality(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory publicSignals
    ) external {
        require(identities[msg.sender].registered, "Identity not registered");
        require(!usedNonces[publicSignals[1]], "Proof already used (nonce replay)");
        
        // Verify the proof
        bool valid = nationalityVerifier.verifyProof(a, b, c, publicSignals);
        require(valid, "Invalid proof");
        
        // Mark nonce as used
        usedNonces[publicSignals[1]] = true;
        
        // Mark claim as verified
        identities[msg.sender].verifiedClaims[ClaimType.NATIONALITY_MATCH] = true;
        identities[msg.sender].verificationTimestamp[ClaimType.NATIONALITY_MATCH] = block.timestamp;
        
        emit ClaimVerified(msg.sender, ClaimType.NATIONALITY_MATCH, block.timestamp);
    }

    /**
     * @dev Submit university student verification proof
     * @param a Proof A
     * @param b Proof B
     * @param c Proof C
     * @param publicSignals Public signals [expectedUniversity, nonce]
     */
    function verifyStudent(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory publicSignals
    ) external {
        require(identities[msg.sender].registered, "Identity not registered");
        require(!usedNonces[publicSignals[1]], "Proof already used (nonce replay)");
        
        // Verify the proof
        bool valid = studentVerifier.verifyProof(a, b, c, publicSignals);
        require(valid, "Invalid proof");
        
        // Mark nonce as used
        usedNonces[publicSignals[1]] = true;
        
        // Mark claim as verified
        identities[msg.sender].verifiedClaims[ClaimType.UNIVERSITY_STUDENT] = true;
        identities[msg.sender].verificationTimestamp[ClaimType.UNIVERSITY_STUDENT] = block.timestamp;
        
        emit ClaimVerified(msg.sender, ClaimType.UNIVERSITY_STUDENT, block.timestamp);
    }

    function isAgeVerified(address user) external view returns (bool) {
        return identities[user].verifiedClaims[ClaimType.AGE_OVER_18];
    }

    function isNationalityVerified(address user) external view returns (bool) {
        return identities[user].verifiedClaims[ClaimType.NATIONALITY_MATCH];
    }

    function isStudentVerified(address user) external view returns (bool) {
        return identities[user].verifiedClaims[ClaimType.UNIVERSITY_STUDENT];
    }
    
    /**
     * @dev Check if a user has verified a specific claim
     * @param user The user's address
     * @param claimType The type of claim to check
     * @return verified Whether the claim is verified
     * @return timestamp When the claim was verified (0 if not verified)
     */
    function isVerified(address user, ClaimType claimType) 
        external 
        view 
        returns (bool verified, uint256 timestamp) 
    {
        return (
            identities[user].verifiedClaims[claimType],
            identities[user].verificationTimestamp[claimType]
        );
    }
    
    /**
     * @dev Get user's DID
     * @param user The user's address
     * @return did The user's DID string
     */
    function getDID(address user) external view returns (string memory) {
        require(identities[user].registered, "Identity not registered");
        return identities[user].did;
    }
    
    /**
     * @dev Check if an identity is registered
     * @param user The user's address
     * @return registered Whether the identity is registered
     */
    function isRegistered(address user) external view returns (bool) {
        return identities[user].registered;
    }
    
    /**
     * @dev Revoke a claim (user can revoke their own claims)
     * @param claimType The type of claim to revoke
     */
    function revokeClaim(ClaimType claimType) external {
        require(identities[msg.sender].registered, "Identity not registered");
        require(identities[msg.sender].verifiedClaims[claimType], "Claim not verified");
        
        identities[msg.sender].verifiedClaims[claimType] = false;
        identities[msg.sender].verificationTimestamp[claimType] = 0;
        
        emit ClaimRevoked(msg.sender, claimType, block.timestamp);
    }
}
