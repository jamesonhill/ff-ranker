const fetch = require('node-fetch');
const mongoose = require('mongoose');
const { Client } = require('espn-fantasy-football-api/node-dev');
const env = require('dotenv').config();

const ESPNSS2 =
  'AEBipbY1DAimaQ5xZnbLuhLSIGcddoM%2Bol8EPiejHRiBfZoY3oZ%2FqgZxsjfAHy7ExalLdkWgGoqVsVRcohagAy0g9hWiFWTNdl15NRhqeQiLjgwDlHipnJNrHeAEfno54EWLbA%2FEvoK%2BiKHeZlxS2BCbRPTLw2mE5KPuj4tI0gScGn54bxR53pqQNsIA22SQ1nsfhTypp4TfSMELNOQkPctvKmstcI61wJE0sOBetwWimGNuQqD3Ve0F7%2F8EzAF3baoWlPDn1DLIPEjzT2F51iVgxL39EEDf4xU9%2F9CIyAs7fg%3D%3D';
const SWID = '{048B2E9F-DE88-4FDC-915B-128DE467653F}';
const clients = new Client({ leagueId: 18343995 });
clients.setCookies({ espnS2: ESPNSS2, SWID: SWID });

const getFreeAgents = () => {
  clients
    .getLeagueInfo({
      seasonId: 2020,
      // scoringPeriodId: 1,
    })
    .then((res) => {
      console.log('success', res);
    })
    .catch((err) => {
      console.log('err!', err);
    });
};

getFreeAgents();

const getBoxScores = () =>
  clients
    .getBoxscoreForWeek({
      seasonId: 2020,
      matchupPeriodId: 1,
      scoringPeriodId: 1,
    })
    .then((res) => {
      console.log('success', res);
    })
    .catch((err) => {
      console.log('err!', err);
    });

getBoxScores();

const player_endpoint = 'https://api.sleeper.app/v1/players/nfl';

mongoose
  .connect(
    `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?ssl=true&replicaSet=globaldb`,
    {
      auth: {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      },
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: false,
    }
  )
  .then(() => console.log('Connection to db successful'))
  .catch((err) => console.error(err));

const Player = mongoose.model(
  'Player',
  mongoose.Schema({
    position: String,
    number: Number,
    college: String,
    status: String,
    years_exp: Number,
    first_name: String,
    last_name: String,
    active: Boolean,
    team: String,
    full_name: String,
    age: Number,
    sleeper_id: String,
  })
);

const seedDatabase = async () => {
  fetch(player_endpoint)
    .then((res) => res.json())
    .then((players) => {
      const totalPlayers = [];

      for (const [id, player] of Object.entries(players)) {
        const {
          position,
          number,
          college,
          status,
          years_exp,
          first_name,
          last_name,
          full_name,
          active,
          team,
          age,
        } = player;

        totalPlayers.push(
          new Player({
            sleeper_id: id,
            position,
            number,
            college,
            status,
            years_exp,
            first_name,
            last_name,
            full_name,
            active,
            team,
            age,
          })
        );
      }

      Player.insertMany(totalPlayers, (err, docs) => {
        if (err) {
          console.error('shat', err);
        } else {
          console.log('jackpot', docs);
        }
      });
    });
};

seedDatabase();

const fetchPlayersByPosition = async (position = 'QB') => {
  const players = await Player.find({ position, active: true });

  console.log('position: ', position, players);
};

fetchPlayersByPosition();
fetchPlayersByPosition('RB');
fetchPlayersByPosition('WR');
