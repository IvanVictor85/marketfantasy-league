import { PublicKey } from "@solana/web3.js";

export type Vault = {
  authority: PublicKey;
  totalPot: bigint;
};

export type MflProgram = {
  address: "7QHMrTeoLTggAy11kTTEwtoRzcvK8rEeY1TRu4oUdgGP";
  metadata: {
    name: "mflProgram";
    version: "0.1.0";
    spec: "0.1.0";
  };
  instructions: [
    {
      name: "depositEntryFee";
      accounts: [
        { name: "vault" },
        { name: "user" },
        { name: "systemProgram" }
      ];
      args: [];
    },
    {
      name: "initializeVault";
      accounts: [
        { name: "vault" },
        { name: "authority" },
        { name: "systemProgram" }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "vault";
      type: {
        kind: "struct";
        fields: [
          { name: "authority"; type: "publicKey" },
          { name: "totalPot"; type: "u64" }
        ];
      };
    }
  ];
  types: [
    {
      name: "Vault";
      type: {
        kind: "struct";
        fields: [
          { name: "authority"; type: "publicKey" },
          { name: "totalPot"; type: "u64" }
        ];
      };
    }
  ];
};
