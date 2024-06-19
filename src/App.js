import React, { useEffect, useState } from 'react';
import './App.css';
import { fillStats,intialGameParse } from './functions/players.ts';

function App() {
  const [games, setGames] = useState([]);
  const [allGames, setAllGames] = useState([]);
  const [playerName, setPlayerName] = useState('J. Brown');

  useEffect(() => {
    fetch(`http://localhost:3001/parseGame/1012400002`)
      .then(res => res.json())
      .then(bodyContent => {

        let game = intialGameParse(bodyContent.actions);
        // console.log(ret)
        setAllGames([
          {
            date: bodyContent.date,
            actions: bodyContent.actions,
            homeTeam: game[0],
            awayTeam: game[1],
            displayedStats: fillStats(playerName, 'W', bodyContent.actions)
          }
        ])

         // console.log("intialGameStats", bodyContent.teams)
        setGames([{
          date: bodyContent.date,
          actions: bodyContent.actions,
          homeTeam: game[0],
          awayTeam: game[1],
          displayedStats: fillStats(playerName, 'W', bodyContent.actions)
        }])
      })
      .catch(err => {
        console.log(err);
      });
  }, []);

  const handleInputChange = (e) => {
    setPlayerName(e.target.value);
  };
  const handleSearch = () => {
    searchSort(playerName);
  };

  
  const periodSort = (period) => {
    let newGames = [];
    games.forEach((game) => {
      newGames.push({
        ...game,
        displayedStats: fillStats(playerName, period, game.actions)
      })
    })

    setGames(newGames);
  }
  const searchSort = (name) => {
    let parsedName = name.trim(); //Remove whitespace
    parsedName = parsedName.toLowerCase(); //To lowercase
    let nameParts = parsedName.split(' '); //Split the name
    if (nameParts.length >= 2) { //Basicaly turn Cait Clark to C. Clark
        let firstName = nameParts[0];
        let lastName = nameParts[1];
        parsedName = `${firstName.charAt(0)}. ${lastName}`;
    }

    let newGames = [];
    allGames.forEach((game) => {
      if(
        game.homeTeam.players.find(player => player.toLowerCase() === parsedName) ||
        game.awayTeam.players.find(player => player.toLowerCase() === parsedName)
      ){
        newGames.push({
          ...game,
          displayedStats: fillStats(parsedName, "W", game.actions)
        })
      }
    })

    // console.log(newGames)

    /* If this is empty then the player doesn't play/exist */
    if(newGames.length === 0){
      console.log("player doesn't exist")
    }

    setGames(newGames);
  }

  // useEffect(() => {
  //   console.log("The Games")
  //   console.log(games)
  // }, [games, setGames])

  return (
    <div className="App" style={{display:'flex', flexDirection: 'column'}}>
      <button onClick={() => periodSort("Q1")}>1st Quarter</button>
      <button onClick={() => periodSort("Q2")}>2nd Quarter</button>
      <button onClick={() => periodSort("Q3")}>3rd Quarter</button>
      <button onClick={() => periodSort("Q4")}>4th Quarter</button>
      <button onClick={() => periodSort("H1")}>1st Half</button>
      <button onClick={() => periodSort("H2")}>2nd Half</button>
      <button onClick={() => periodSort("W")}>Whole Game</button>

      <input
        type="text"
        value={playerName}
        onChange={handleInputChange}
        placeholder="Enter player name"
      />
      <button onClick={handleSearch}>Search</button>

      <table style={{width: '80%', borderCollapse: "collapse"}}>
        <thead>
            <tr>
                <th>Date</th>
                <th>Team</th>
                <th>PTS</th>
                <th>REB</th>
                <th>AST</th>
                <th>STL</th>
                <th>BLK</th>
                <th>3PM</th>
                <th>3PA</th>
                <th>FTA</th>
                <th>FTM</th>
                <th>TO</th>
            </tr>
        </thead>
        <tbody>
          {games.map((game, index) => { 
            return <tr key={index}>
                <th>{game.date}</th>
                <th>{game.homeTeam.name}@{game.awayTeam.name}</th>
                <th>{game.displayedStats["PTS"]}</th>
                <th>{game.displayedStats["AST"]}</th>
                <th>{game.displayedStats["REB"]}</th>
                <th>{game.displayedStats["STL"]}</th>
                <th>{game.displayedStats["BLK"]}</th>
                <th>{game.displayedStats["3PM"]}</th>
                <th>{game.displayedStats["3PA"]}</th>
                <th>{game.displayedStats["FTA"]}</th>
                <th>{game.displayedStats["FTM"]}</th>
                <th>{game.displayedStats["TO"]}</th>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
