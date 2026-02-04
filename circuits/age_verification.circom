template AgeVerification() {
    // Private inputs (explicitly marked private for circom 0.5 compatibility)
    signal private input dob;           // Date of birth (YYYYMMDD)
    signal private input currentDate;   // Current date (YYYYMMDD)
    signal private input salt;          // Unique salt for privacy
    
    // Public inputs (non-private inputs are public in 0.5/snarkjs by default)
    signal input minAge;        // Minimum age requirement (e.g., 18)
    signal input nonce;         // Replay protection nonce
    
    // Higher Precision Logic: YYYYMMDD
    // Example: CurrentDate = 20240202, 
    // Threshold = 20240202 - 180000 = 20060202
    // If Threshold (20060202) >= dob (20060201) -> person is 18+
    
    component ageGeq = GreaterEqThan(32);
    ageGeq.in[0] <== currentDate - 180000;
    ageGeq.in[1] <== dob;
    
    ageGeq.out === 1;
}

// Corrected GreaterEqThan: out = 1 if in[0] >= in[1], else 0
template GreaterEqThan(n) {
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n);
    lt.in[0] <== in[0];
    lt.in[1] <== in[1];
    
    out <== 1 - lt.out;
}

// LessThan template from circomlib
template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;

    component n2b = Num2Bits(n+1);
    n2b.in <== in[0] + (1<<n) - in[1];

    out <== 1-n2b.out[n];
}

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1=0;

    var e2=1;
    for (var i = 0; i<n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] -1 ) === 0;
        lc1 += out[i] * e2;
        e2 = e2+e2;
    }

    lc1 === in;
}

component main = AgeVerification();
