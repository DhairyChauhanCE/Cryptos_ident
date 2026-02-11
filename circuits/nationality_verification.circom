pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template NationalityVerification() {
    // Private identity data
    signal input dob;           // YYYYMMDD
    signal input nationality;   // ISO Numeric
    signal input studentId;     // Hashed or numeric ID
    signal input userSalt;      // Privacy salt
    
    // Public inputs
    signal input identityHash;      // Poseidon(dob, nationality, studentId, userSalt)
    signal input requiredCountry;   // The country we are verifying for
    signal input nonce;             // Replay protection
    
    // 1. Verify Commitment
    component hasher = Poseidon(4);
    hasher.inputs[0] <== dob;
    hasher.inputs[1] <== nationality;
    hasher.inputs[2] <== studentId;
    hasher.inputs[3] <== userSalt;
    
    hasher.out === identityHash;
    
    // 2. Verify Nationality Match
    component isEqual = IsEqual();
    isEqual.in[0] <== nationality;
    isEqual.in[1] <== requiredCountry;
    
    isEqual.out === 1;
}

component main {public [identityHash, requiredCountry, nonce]} = NationalityVerification();

