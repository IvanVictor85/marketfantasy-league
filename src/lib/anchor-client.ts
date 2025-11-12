import {
  Program,
  AnchorProvider,
  Idl,
  setProvider,
  web3,
} from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

// 1. Importa a IDL (o "mapa" do nosso contrato)
// (Este arquivo foi gerado pelo 'anchor build' na pasta target/)
import type { MflProgram } from "../../target/types/mfl_program";
import IDL from "../../target/idl/mfl_program.json";

// 2. A ID do nosso programa (A QUE ACABAMOS DE FAZER DEPLOY)
const PROGRAM_ID = "7QHMrTeoLTggAy11kTTEwtoRzcvK8rEeY1TRu4oUdgGP";

// 3. A URL do nosso RPC (Helius)
// (Lê a variável de ambiente que configuramos)
const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://api.devnet.solana.com"; // (Fallback)

/**
 * Hook customizado para obter o programa Anchor no frontend
 *
 * @returns {Program<MflProgram> | null} O programa Anchor pronto para uso
 */
export function useMflProgram(): Program<MflProgram> | null {
  const wallet = useAnchorWallet();

  const provider = useMemo(() => {
    const connection = new Connection(RPC_URL);

    if (!wallet) {
      // Se a carteira não estiver conectada, usamos um provedor "somente leitura"
      return new AnchorProvider(
        connection,
        {} as any, // Wallet vazia (somente leitura)
        AnchorProvider.defaultOptions()
      );
    }

    // Se a carteira estiver conectada, crie um provedor completo
    return new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
  }, [wallet]);

  // Cria a instância do programa
  const program = useMemo(() => {
    if (!provider) {
      return null;
    }
    setProvider(provider);

    // Cria o objeto 'program' que o frontend usará para chamar o contrato
    // A IDL já contém o address, então passamos apenas idl e provider
    const program = new Program(
      IDL as Idl, // O "mapa" (já contém o address)
      provider      // A conexão (Helius) e a carteira
    ) as unknown as Program<MflProgram>; // Cast para o nosso tipo

    return program;
  }, [provider]);

  return program;
}

/**
 * Função helper (para uso no backend/scripts) para obter o PDA do cofre
 * @returns A PublicKey do cofre (Vault PDA)
 */
export function getVaultPda(): web3.PublicKey {
  const [vaultPDA] =
    web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mfl-vault")], // A "seed" (semente)
      new web3.PublicKey(PROGRAM_ID)
    );
  return vaultPDA;
}
