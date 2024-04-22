-- CreateTable
CREATE TABLE "DeathInfo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playerId" INTEGER NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "killerId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "gameType" TEXT NOT NULL,
    "gameTeams" INTEGER NOT NULL,
    "totalPlayers" INTEGER NOT NULL,
    "playerName" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL,
    "killerSpeed" INTEGER NOT NULL
);
