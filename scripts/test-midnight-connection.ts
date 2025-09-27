#!/usr/bin/env bun
/**
 * Test script to verify connection to Midnight proof server
 * Run with: bun scripts/test-midnight-connection.ts
 */

import { Effect, Console } from "effect"
import { CompactClient } from "../src/proofs/compactClient"
import * as dotenv from "dotenv"

// Load environment variables from testnet config
dotenv.config({ path: ".env.testnet" })

// Test circuit for demonstration
const TEST_CIRCUIT_CODE = `
circuit SimpleProof {
    private input secret: Field;
    public input hash: Field;
    
    constraint hash == poseidon(secret);
}
`

const main = Effect.gen(function* () {
  yield* Console.log("🔍 Testing Midnight Proof Server Connection...")
  yield* Console.log("=" . repeat(60))
  
  const client = new CompactClient({
    baseUrl: process.env.MIDNIGHT_PROOF_SERVER_URL || "http://192.168.50.209:6300/",
    apiKey: process.env.MIDNIGHT_API_KEY
  })
  
  // Step 1: Health Check
  yield* Console.log("\n1️⃣  Performing health check...")
  const healthStatus = yield* client.healthCheck()
  
  if (healthStatus) {
    yield* Console.log("✅ Health check passed - server is responsive")
  } else {
    yield* Console.log("❌ Health check failed - server may not be running")
    yield* Console.log("\n📋 Please ensure Docker is running and execute:")
    yield* Console.log("   docker compose up -d")
    return
  }
  
  // Step 2: Test Circuit Compilation (if server supports it)
  yield* Console.log("\n2️⃣  Testing circuit compilation...")
  try {
    const compiledKeys = yield* client.compileCircuit(
      TEST_CIRCUIT_CODE,
      "test-simple-proof"
    )
    yield* Console.log("✅ Circuit compilation successful")
    yield* Console.log(`   Proving key: ${compiledKeys.provingKey.substring(0, 20)}...`)
    yield* Console.log(`   Verification key: ${compiledKeys.verificationKey.substring(0, 20)}...`)
  } catch (error) {
    yield* Console.log("⚠️  Circuit compilation not supported or failed")
    yield* Console.log(`   Error: ${error}`)
  }
  
  // Step 3: Test Proof Generation
  yield* Console.log("\n3️⃣  Testing proof generation...")
  try {
    const proofResponse = yield* client.generateProof({
      circuitId: "test-simple-proof",
      inputs: {
        secret: "123456789",
        hash: "0xabc123" // This would be the actual poseidon hash in production
      }
    })
    
    yield* Console.log("✅ Proof generation successful")
    yield* Console.log(`   Proof ID: ${proofResponse.proofId || "N/A"}`)
    yield* Console.log(`   Proof: ${proofResponse.proof.substring(0, 20)}...`)
    yield* Console.log(`   Public inputs: ${JSON.stringify(proofResponse.publicInputs)}`)
    yield* Console.log(`   Timestamp: ${new Date(proofResponse.timestamp || 0).toISOString()}`)
    
    // Step 4: Test Proof Verification
    yield* Console.log("\n4️⃣  Testing proof verification...")
    const isValid = yield* client.verifyProof(
      proofResponse.proof,
      [...proofResponse.publicInputs], // Convert readonly array to mutable
      proofResponse.verificationKey,
      proofResponse.publicSignals ? [...proofResponse.publicSignals] : undefined
    )
    
    yield* Console.log(isValid ? "✅ Proof verification passed" : "❌ Proof verification failed")
  } catch (error) {
    yield* Console.log("❌ Proof generation failed")
    yield* Console.log(`   Error: ${error}`)
    yield* Console.log("\n   This may be normal if the server requires actual compiled circuits")
  }
  
  // Step 5: Test Circuit Info Retrieval
  yield* Console.log("\n5️⃣  Testing circuit metadata retrieval...")
  try {
    const circuitInfo = yield* client.getCircuitInfo("test-simple-proof")
    yield* Console.log("✅ Circuit info retrieved")
    yield* Console.log(`   Constraints: ${circuitInfo.constraints}`)
    yield* Console.log(`   Public inputs: ${circuitInfo.publicInputs}`)
    yield* Console.log(`   Private inputs: ${circuitInfo.privateInputs}`)
    yield* Console.log(`   Gates: ${circuitInfo.gates}`)
  } catch (error) {
    yield* Console.log("⚠️  Circuit info not available")
    yield* Console.log(`   Error: ${error}`)
  }
  
  yield* Console.log("\n" + "=" . repeat(60))
  yield* Console.log("🎉 Connection test complete!")
  yield* Console.log("\n📝 Summary:")
  yield* Console.log("   - Server URL: " + (process.env.MIDNIGHT_PROOF_SERVER_URL || "http://192.168.50.209:6300/"))
  yield* Console.log("   - Network: " + (process.env.MIDNIGHT_NETWORK || "testnet"))
  yield* Console.log("   - API Key: " + (process.env.MIDNIGHT_API_KEY ? "Configured" : "Not configured"))
})

// Run the test
Effect.runPromise(main).catch(error => {
  console.error("Fatal error:", error)
  process.exit(1)
})
