// ULTRATHINK Immediate Fix - Issue #4
// Simple calculation function bug fix
// Generated: 2025-07-22T20:00:15.409Z

/**
 * Fixed calculation function
 * Issue: Simple JavaScript calculation bug
 * Solution: Corrected calculation logic
 */

function calculateSum(a, b) {
    // Fixed: Ensure proper number conversion and addition
    const numA = parseFloat(a) || 0;
    const numB = parseFloat(b) || 0;
    const result = numA + numB;
    
    console.log(`Calculating: ${numA} + ${numB} = ${result}`);
    return result;
}

function calculateProduct(a, b) {
    // Fixed: Ensure proper number conversion and multiplication
    const numA = parseFloat(a) || 0;
    const numB = parseFloat(b) || 0;
    const result = numA * numB;
    
    console.log(`Calculating: ${numA} * ${numB} = ${result}`);
    return result;
}

// Test the fixes
console.log('🧪 Testing fixed calculations:');
console.log('Sum test:', calculateSum('5', '3')); // Should be 8
console.log('Product test:', calculateProduct('4', '2')); // Should be 8
console.log('Edge case test:', calculateSum('invalid', '5')); // Should be 5

module.exports = {
    calculateSum,
    calculateProduct
};