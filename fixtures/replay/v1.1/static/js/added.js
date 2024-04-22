window.addKill = (kill) => {
    console.log(kill);
    // Death x y
    const {x,y} = kill.state.curves[0].state;
    const killerId = kill.game.players[kill.state.killerId].data.uid;
    const {gameType,isAnonymous} = kill.game.gameSettings;
    const gameTeams = gameType == "TEAM" ? kill.game.teams.length : 0;
    const playerId = kill.game.players[kill.roundPlayerId].data.uid;
    const totalPlayers = kill.game.players.length;
    const playerName = kill.game.players[kill.roundPlayerId].data.username;
    const gameId = window.gameId;
    const killerSpeed = kill.state.killerSpeed;
    

    const killObj = {
        x,
        y,
        killerId,
        gameType,
        gameTeams,
        totalPlayers,
        playerName,
        playerId,
        isAnonymous,
        gameId,
        killerSpeed
        };
    window.allKills.push(killObj);
    console.log(`Kill added: ${JSON.stringify(killObj)}`);
    return true;
  }
  window.allKills = [];