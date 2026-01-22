import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

// Update this with your new program ID after deployment
const PROGRAM_ID = new PublicKey("11111111111111111111111111111111");

async function main() {
  // Configure the client to use devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  console.log("Wallet:", provider.wallet.publicKey.toString());
  console.log("Program ID:", PROGRAM_ID.toString());

  // Load the IDL
  const idl = require("../target/idl/mfl_program.json");
  const program = new Program(idl, provider);

  // Calculate vault PDA
  const [vaultPda, bump] = await PublicKey.findProgramAddressSync(
    [Buffer.from("mfl-vault")],
    PROGRAM_ID
  );

  console.log("Vault PDA:", vaultPda.toString());
  console.log("Bump:", bump);

  // Check if vault already exists
  const vaultAccount = await provider.connection.getAccountInfo(vaultPda);
  if (vaultAccount) {
    console.log("Vault already exists!");
    console.log("Lamports:", vaultAccount.lamports);
    return;
  }

  // Initialize the vault
  console.log("Initializing vault...");

  try {
    const tx = await program.methods
      .initializeVault()
      .accounts({
        vault: vaultPda,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Vault initialized successfully!");
    console.log("Transaction:", tx);
    console.log("Vault address:", vaultPda.toString());
    console.log("Authority:", provider.wallet.publicKey.toString());
  } catch (error) {
    console.error("Error initializing vault:", error);
  }
}

main().catch(console.error);
