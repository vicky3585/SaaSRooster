/**
 * Test script to verify the invoice numbering gap-filling logic
 */

function findFirstAvailableSequenceNumber(sequenceNumbers: number[]): number {
  console.log(`\n[TEST] Testing with sequence numbers:`, sequenceNumbers);
  
  // If no invoices exist, start from 1
  if (sequenceNumbers.length === 0) {
    console.log(`[TEST] No invoices found, returning 1`);
    return 1;
  }
  
  // Sort sequence numbers
  sequenceNumbers.sort((a, b) => a - b);
  console.log(`[TEST] Sorted sequence numbers:`, sequenceNumbers);
  
  // Find the first gap in the sequence starting from 1
  let expectedNumber = 1;
  for (const num of sequenceNumbers) {
    console.log(`[TEST] Checking expected: ${expectedNumber}, found: ${num}`);
    if (num > expectedNumber) {
      // Found a gap!
      console.log(`[TEST] ✅ Found gap! Expected ${expectedNumber} but found ${num}, returning ${expectedNumber}`);
      return expectedNumber;
    }
    expectedNumber = num + 1;
  }
  
  // No gaps found, return next number after the highest
  console.log(`[TEST] ✅ No gaps found, returning next number: ${expectedNumber}`);
  return expectedNumber;
}

// Test cases
console.log("\n=== INVOICE NUMBERING GAP-FILLING TESTS ===\n");

// Test 1: Empty array (no invoices)
console.log("Test 1: No existing invoices");
const result1 = findFirstAvailableSequenceNumber([]);
console.log(`Result: ${result1} (Expected: 1) ${result1 === 1 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 2: Sequential invoices [1, 2, 3] - should return 4
console.log("Test 2: Sequential invoices [1, 2, 3]");
const result2 = findFirstAvailableSequenceNumber([1, 2, 3]);
console.log(`Result: ${result2} (Expected: 4) ${result2 === 4 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 3: Gap in middle [1, 3, 4] - should return 2
console.log("Test 3: Gap in middle [1, 3, 4] - CRITICAL TEST");
const result3 = findFirstAvailableSequenceNumber([1, 3, 4]);
console.log(`Result: ${result3} (Expected: 2) ${result3 === 2 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 4: Multiple gaps [1, 3, 5] - should return 2 (first gap)
console.log("Test 4: Multiple gaps [1, 3, 5]");
const result4 = findFirstAvailableSequenceNumber([1, 3, 5]);
console.log(`Result: ${result4} (Expected: 2) ${result4 === 2 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 5: Gap at start [2, 3, 4] - should return 1
console.log("Test 5: Gap at start [2, 3, 4]");
const result5 = findFirstAvailableSequenceNumber([2, 3, 4]);
console.log(`Result: ${result5} (Expected: 1) ${result5 === 1 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 6: Only one invoice [1] - should return 2
console.log("Test 6: Only one invoice [1]");
const result6 = findFirstAvailableSequenceNumber([1]);
console.log(`Result: ${result6} (Expected: 2) ${result6 === 2 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 7: Non-sequential start [5, 6, 7] - should return 1
console.log("Test 7: Non-sequential start [5, 6, 7]");
const result7 = findFirstAvailableSequenceNumber([5, 6, 7]);
console.log(`Result: ${result7} (Expected: 1) ${result7 === 1 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 8: Unsorted input [4, 1, 3] - should return 2
console.log("Test 8: Unsorted input [4, 1, 3]");
const result8 = findFirstAvailableSequenceNumber([4, 1, 3]);
console.log(`Result: ${result8} (Expected: 2) ${result8 === 2 ? '✅ PASS' : '❌ FAIL'}\n`);

// Summary
console.log("\n=== TEST SUMMARY ===");
const allTests = [result1 === 1, result2 === 4, result3 === 2, result4 === 2, result5 === 1, result6 === 2, result7 === 1, result8 === 2];
const passedTests = allTests.filter(t => t).length;
console.log(`Passed: ${passedTests}/${allTests.length}`);

if (passedTests === allTests.length) {
  console.log("\n✅ ALL TESTS PASSED! The invoice numbering logic is working correctly.");
} else {
  console.log("\n❌ SOME TESTS FAILED! Please review the logic.");
}
