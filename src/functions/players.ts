export type Action = {
    name: string
    period: number,
    clock: string,
    teamTricode: string,
    actionType: string,
    amount: number
}

export type Stats = {
    "PTS": number, "REB": number, "AST":number,
    "3PM": number, "3PA": number, 
    "FGM":  number, "FGA": number,
    "FTA": number, "FTM": number,
    "STL": number, "BLK": number, "TO": number 
}

export type Game = {
    date: string,
    homeTeam: string,
    awayTeam: string,
    stats: Stats,
    homePlayers: string[],
    awayPlayers: string[]
}

type Team = {
    name: string,
    stats: Stats,
    players: string[]
    actions: Action[]
}

/*
    Gets the
        - 2 teams
        - all players on each team
        - and intial whole game stats 
            - (we loop through everything so it makes sense to might as well get this)
*/
export const intialGameParse = (actions: Action[]): Team[] => {
    let i = 0; let teams: Team[] = [];

    actions.forEach(action => {
        /* This is to find both teams */
        if(teams.length < 2){
            if(action.teamTricode){
                const teamTriCode = teams.find(team => team.name === action.teamTricode);
                if(teamTriCode === undefined){
                    teams.push({
                        name: action.teamTricode,
                        stats: {
                            "PTS": 0, "REB": 0, "AST":0,
                            "3PM": 0, "3PA": 0,
                            "FTA": 0, "FTM": 0,
                            "FGM": 0, "FGA": 0,
                            "STL": 0, "BLK": 0, "TO": 0,
                        },
                        actions: actions,
                        players: []
                    })
                }
            }
            i++;
        }

        /* Add up the total stats for each team */
        const team = teams.find(t => t.name === action.teamTricode);
        if(team){
            team.stats[action.actionType] += action.amount;
        }

        /* Find all the players on this team */
        let teamOfCurrentPlayer = teams.find(team => team.name === action.teamTricode);
        if(!teamOfCurrentPlayer?.players.find(p => p === action.name) && action.name){
            teamOfCurrentPlayer?.players.push(action.name);
        }
    })

    // console.log(teams)
    return teams;
}

/*
    condition can be Q1, Q2, Q3, Q4, H1, H2, W

    if playerName is "" then just get all stats
*/
export const fillStats = (playerName: string, condition: string, actions: Action[]): Stats => {
    let intialStats = {
        "PTS": 0, "REB": 0, "AST":0,
        "3PM": 0, "3PA": 0,
        "FTA": 0, "FTM": 0,
        "STL": 0, "BLK": 0, "TO": 0,
        "FGM": 0, "FGA": 0
    }

    actions.forEach(action => {
        /* This to see if the current action is what the player is looking for */
        let conditionMet = false; let playerConditionMet = false;

        if(condition === "Q1" && action.period === 1) conditionMet = true;
        else if(condition === "Q2" && action.period === 2) conditionMet = true;
        else if(condition === "Q3" && action.period === 3) conditionMet = true;
        else if(condition === "Q4" && action.period === 4) conditionMet = true;
        else if(condition === "H1" && (action.period === 1 || action.period === 2)) conditionMet = true;
        else if(condition === "H2" && (action.period === 3 || action.period === 4)) conditionMet = true;
        else if(condition === "W") conditionMet = true;

        if(playerName.toLowerCase() === action?.name?.toLowerCase()) playerConditionMet = true;
        else if(playerName === "") playerConditionMet = true;

        if(conditionMet && playerConditionMet){
            intialStats[action.actionType] += action.amount;
        }
    })

    return intialStats;
}