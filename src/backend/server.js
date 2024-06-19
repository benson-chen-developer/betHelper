const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const axios = require('axios');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());

app.get("/playerStats/:url", async (req, res) => {
    try {
        const url = decodeURIComponent(req.params.url);
        const response = await axios.get(url);
        const html = response.data; 
        const $ = cheerio.load(html);

        // Find the section with the class "Schedule_gameSectionContainer__r36H5"
        const section = $('section.Schedule_gameSectionContainer__r36H5').first();
        console.log("wrapperElements", section)

        // Extract all elements within the first div with the class "wrapper"
        const wrapperElements = [];
        section.find('div.wrapper').first().children().each((i, element) => {
            wrapperElements.push($.html(element));
        });

        res.json(wrapperElements); // Send the array of elements as the response
    } catch (err) {
        console.log("Something went wrong with url", err);
        res.status(500).json({ error: 'Failed to fetch team data' });
    }
});

app.get("/playerStats", async (req, res) => {
    try {
        /* All this is used to basically scape the data */
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto('https://www.wnba.com/schedule?season=2024&month=all');
        await page.screenshot({path: 'example.png', fullPage:true})

        const html = await page.content();
        console.log(html)
        await browser.close();

        res.send(html);
    } catch (err) {
        console.log("Error fetching data:", err);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

/*
    - Parses JSON file with all the actions
    - Returns elements that we can loop through and add a stat via each one
        (Example: 3PT Made is 5 elements 
            - PTS +3 
            - 3PA +1
            - 3PM +1
            - FGA +1
            - FGM +1
        )
    - Element name should be same as one in our dictionary so we can just put it in the slot
*/
app.get("/parseGame/:urlId", async (req, res) => {
    try {
        const axiosResponse = await axios.get(`https://cdn.wnba.com/static/json/liveData/playbyplay/playbyplay_${req.params.urlId}.json`);
        const gameDate = axiosResponse.data.meta.time.split(" ")[0];
        const actions = axiosResponse.data.game.actions;
        
        const parsedActions = [];

        actions.forEach((action) => {
            if(action.actionType === '2pt' || action.actionType === '3pt') {
                parsedActions.push({
                    name: action.playerNameI,
                    period: action.period,
                    clock: action.clock,
                    teamTricode: action.teamTricode,
                    actionType: "PTS",
                    amount: action.shotResult === "Made" ? parseInt(action.actionType.charAt(0)) : 0
                });
                parsedActions.push({
                    name: action.playerNameI,
                    period: action.period,
                    clock: action.clock,
                    teamTricode: action.teamTricode,
                    actionType: 'FGA',
                    amount: 1
                });
                parsedActions.push({
                    name: action.playerNameI,
                    period: action.period,
                    clock: action.clock,
                    teamTricode: action.teamTricode,
                    actionType: 'FGM',
                    amount: action.shotResult === "Made" ? 1 : 0
                });
                parsedActions.push({
                    name: action.playerNameI,
                    period: action.period,
                    clock: action.clock,
                    teamTricode: action.teamTricode,
                    actionType: "3PA",
                    amount: action.actionType === '3pt' ? 1 : 0
                });
                parsedActions.push({
                    name: action.playerNameI,
                    period: action.period,
                    clock: action.clock,
                    teamTricode: action.teamTricode,
                    actionType: '3PM',
                    amount: action.actionType === '3pt' && action.shotResult === "Made" ? 1 : 0
                });
            } 
            if(action.actionType === 'rebound') {
                parsedActions.push({
                    name: action.playerNameI,
                    period: action.period,
                    clock: action.clock,
                    teamTricode: action.teamTricode,
                    actionType: "REB",
                    amount: 1
                });
            }
            if (action.assistPlayerNameInitial !== undefined) {
                parsedActions.push({
                    name: action.assistPlayerNameInitial,
                    period: action.period,
                    clock: action.clock,
                    teamTricode: action.teamTricode,
                    actionType: "AST",
                    amount: 1
                });
            } 
            if (action.actionType === "freethrow") {
                parsedActions.push({
                    name: action.playerNameI,
                    period: action.period,
                    clock: action.clock,
                    teamTricode: action.teamTricode,
                    actionType: "FTA",
                    amount: 1
                });
                parsedActions.push({
                    name: action.playerNameI,
                    period: action.period,
                    clock: action.clock,
                    teamTricode: action.teamTricode,
                    actionType: "FTM",
                    amount: action.shotResult === "Made" ? 1 : 0
                });
                parsedActions.push({
                    name: action.playerNameI,
                    period: action.period,
                    clock: action.clock,
                    teamTricode: action.teamTricode,
                    actionType: "PTS",
                    amount: action.shotResult === "Made" ? 1 : 0
                });
            } 
            if (action.actionType === "steal") {
                parsedActions.push({
                    name: action.playerNameI,
                    period: action.period,
                    clock: action.clock,
                    teamTricode: action.teamTricode,
                    actionType: "STL",
                    amount: 1
                });
            } 
            if (action.actionType === "block") {
                parsedActions.push({
                    name: action.playerNameI,
                    period: action.period,
                    clock: action.clock,
                    teamTricode: action.teamTricode,
                    actionType: "BLK",
                    amount: 1
                });
            } 
            if (action.actionType === "turnover") {
                parsedActions.push({
                    name: action.playerNameI,
                    period: action.period,
                    clock: action.clock,
                    teamTricode: action.teamTricode,
                    actionType: "TO",
                    amount: 1
                });
            }
        });

        res.json({
            actions: parsedActions,
            date: gameDate,
            teams: getTeamNames(axiosResponse.data.game.actions)
        });
    } catch (err) {
        console.log("Error fetching data:", err);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

const getTeamNames = (actions) => {
    let teamNames = [];
    let i = 0;

    while(teamNames.length < 2){
        let currentAction = actions[i];

        if(currentAction.teamTricode){
            const teamTriCode = teamNames.find(teamName => teamName === currentAction.teamTricode);
            if(teamTriCode === undefined){
                teamNames.push(currentAction.teamTricode)
            }
        }

        i++;
    }

    return teamNames;
}

app.listen(3001, () => {
    console.log("Server is on 3001");
});