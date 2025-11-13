// Conteúdo para: tests/cryptofantasy.ts

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MflProgram } from "../target/types/mfl_program";
import { assert } from "chai";
import {
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

describe("mfl_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MflProgram as Program<MflProgram>;
  const authority = provider.wallet as anchor.Wallet;

  const [vaultPDA, vaultBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mfl-vault")],
      program.programId
    );

  const player = Keypair.generate();
  const ENTRY_FEE_LAMPORTS = 5_000_000;

  before(async () => {
    const airdropTx = await provider.connection.requestAirdrop(
      player.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);
  });

  it("Deve inicializar o cofre (Vault)!", async () => {
    console.log("Executando initialize_vault...");
    console.log("Endereço do Cofre (PDA):", vaultPDA.toBase58());
    console.log("Autoridade (Admin):", authority.publicKey.toBase58());

    const txHash = await program.methods
      .initializeVault()
      .accounts({
        vault: vaultPDA,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await provider.connection.confirmTransaction(txHash);

    const vaultAccount = await program.account.vault.fetch(vaultPDA);
    
    assert.ok(
      vaultAccount.authority.equals(authority.publicKey),
      "A autoridade do cofre não é o admin"
    );
    assert.equal(
      vaultAccount.totalPot.toNumber(),
      0,
      "O total do cofre não foi zerado"
    );
    
    console.log("Cofre inicializado com sucesso. Total: 0");
  });

  it("Deve permitir que um jogador deposite a taxa de entrada!", async () => {
    console.log("Executando deposit_entry_fee...");
    console.log("Jogador:", player.publicKey.toBase58());
    
    const vaultBefore = await program.account.vault.fetch(vaultPDA);
    const balanceBefore = vaultBefore.totalPot.toNumber();
    console.log("Saldo anterior do cofre:", balanceBefore);

    const txHash = await program.methods
      .depositEntryFee()
      .accounts({
        vault: vaultPDA,
        user: player.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player])
      .rpc();

    await provider.connection.confirmTransaction(txHash);

    const vaultAfter = await program.account.vault.fetch(vaultPDA);
    const balanceAfter = vaultAfter.totalPot.toNumber();
    console.log("Saldo novo do cofre:", balanceAfter);

    const expectedBalance = balanceBefore + ENTRY_FEE_LAMPORTS;
    assert.equal(
      balanceAfter,
      expectedBalance,
      "O saldo do cofre não aumentou corretamente"
    );
  });
});
