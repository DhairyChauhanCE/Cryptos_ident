template StudentVerification() {
    // Private inputs
    signal private input studentId;           // Student ID (hashed or numeric)
    signal private input universityCode;      // University code (e.g., 1001=MIT, 1002=Stanford)
    signal private input salt;                // Privacy salt
    
    // Public inputs
    signal input expectedUniversity;  // The university we are verifying for
    signal input nonce;               // Replay protection nonce
    
    // Check equality
    component isEqual = IsEqual();
    isEqual.in[0] <== universityCode;
    isEqual.in[1] <== expectedUniversity;
    
    // ENFORCE: proof valid only if match
    isEqual.out === 1;
}

// Helper template for equality check
template IsEqual() {
    signal input in[2];
    signal output out;
    
    component isz = IsZero();
    isz.in <== in[1] - in[0];
    
    out <== isz.out;
}

// IsZero template
template IsZero() {
    signal input in;
    signal output out;
    
    signal inv;
    
    inv <-- in!=0 ? 1/in : 0;
    
    out <== -in*inv +1;
    in*out === 0;
}

component main = StudentVerification();
