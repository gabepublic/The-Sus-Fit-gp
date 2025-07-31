// Test file with intentional lint errors
const unusedVar = "this should trigger unused variable error";

function testFunction() {
  const x = 1;
  return x;
}

export default testFunction; 