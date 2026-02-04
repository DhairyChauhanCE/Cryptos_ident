template NationalityVerification() {
    // Private inputs (not revealed)
    signal private input nationality;   // User's nationality code
    signal private input salt;          // Unique salt for privacy
    
    // Public inputs
    signal input expectedNationality;   // Required nationality code
    signal input nonce;                 // Replay protection nonce
    
    // Check equality
    component isEqual = IsEqual();
    isEqual.in[0] <== nationality;
    isEqual.in[1] <== expectedNationality;
    
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

component main = NationalityVerification();
