pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template AgeVerification() {
    // Private identity data
    signal input dob;           // YYYYMMDD
    signal input nationality;   // ISO Numeric
    signal input studentId;     // Hashed or numeric ID
    signal input userSalt;      // Privacy salt
    
    // Public inputs
    signal input identityHash;  // Poseidon(dob, nationality, studentId, userSalt)
    signal input currentDate;   // YYYYMMDD
    signal input minAge;        // Requirement (e.g. 18)
    signal input nonce;         // Replay protection
    
    // 1. Verify Commitment
    component hasher = Poseidon(4);
    hasher.inputs[0] <== dob;
    hasher.inputs[1] <== nationality;
    hasher.inputs[2] <== studentId;
    hasher.inputs[3] <== userSalt;
    
    hasher.out === identityHash;
    
    // 2. Verify Age Logic
    // Threshold = currentDate - (minAge * 10000)
    // If currentDate = 20240202 and minAge = 18, Threshold = 20060202
    // dob must be <= Threshold
    
    component ageCheck = LessEqThan(32);
    ageCheck.in[0] <== dob;
    ageCheck.in[1] <== currentDate - (minAge * 10000);
    
    ageCheck.out === 1;
}

component main {public [currentDate, identityHash, minAge, nonce]} = AgeVerification();

