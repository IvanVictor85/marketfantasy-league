-- Remove foreign key constraint de CompetitionToken.tokenId -> Token.id
ALTER TABLE "competition_tokens" DROP CONSTRAINT IF EXISTS "competition_tokens_tokenId_fkey";
