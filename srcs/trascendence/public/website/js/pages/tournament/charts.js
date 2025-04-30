import { navigate, user_name } from "../../main.js";
import { formatTime } from "../../game/pong/other/timer.js";

let userData;
let wins = 0;
let losses = 0;
let ralliesChartInstance = null;
let winLossChartInstance = null;
let winLossHistoryChartInstance = null;

export function Charts() {
  return `
        <img id="backImageButton" src="../website/images/home.png" alt="Back" class="back-button">
        <h1 class="text h1_margin">
            <span class="letter letter-1">P</span>
            <span class="letter letter-2">o</span>
            <span class="letter letter-3">n</span>
            <span class="letter letter-4">g</span>
            <span class="letter letter-5"> </span>
            <span class="letter letter-6"> </span>
            <span class="letter letter-7">S</span>
            <span class="letter letter-8">t</span>
            <span class="letter letter-9">a</span>
            <span class="letter letter-10">t</span>
            <span class="letter letter-11">i</span>
            <span class="letter letter-12">s</span>
            <span class="letter letter-13">t</span>
            <span class="letter letter-14">i</span>
            <span class="letter letter-15">c</span>
            <span class="letter letter-16">s</span>
        </h1>
        <div class="charts-page">
            <div id="noMatchesMessage" class="no-matches-message">
                <h2>No matches played</h2>
            </div>
            <div class="charts-container">
                <div class="chart-item"><canvas id="matchLongestRallyChart"></canvas></div>
                <div class="chart-item"><canvas id="winLossChart"></canvas></div>
                <div class="chart-item">
                    <h5>Matches Played</h5>
                    <h4 id="matchesPlayed"></h4>
                    <h3>Average Match Duration</h3>
                    <h4 id="avgMatchTime"></h4>
                    <h3>Points</h3>
                    <h4 id="rankPointsLabel"></h4>
                </div>
                <div class="chart-item"><canvas id="xpProgressChart"></canvas></div>
            </div>
            <div class="charts-button-container">
                <div class="mode-button-container">
                    <button class="button-style" id="matchDetailsButton"><span class="text-animation">Match Details</span></button>
                </div>
                <div class="mode-button-container">
                    <button class="button-style" id="chartsBackMenuButton"><span class="text-animation">Back to Menu</span></button>
                </div>
            </div>
        </div>
        <div id="pongMatchDetailsContainer" class="hidden1">
        </div>
    `;
}

function drawRalliesChart(matchesData) {
  const longestRallies = matchesData.map((match) => match.longest_rally);
  const opponents = matchesData.map((match) =>
    match.player1 === user_name ? match.player2 : match.player1
  );

  const ralliesCtx = document
    .getElementById("matchLongestRallyChart")
    .getContext("2d");

  if (ralliesChartInstance) {
    ralliesChartInstance.destroy();
  }
  const ralliesData = {
    labels: opponents,
    datasets: [
      {
        label: "Longest Rally",
        data: longestRallies,
        backgroundColor: "#02BFB9",
      },
    ],
  };
  ralliesChartInstance = new Chart(ralliesCtx, {
    type: "bar",
    data: ralliesData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: "Matches Longest Rallies" },
      },
      scales: {
        x: { title: { display: true, text: "Opponents" } },
        y: { title: { display: true, text: "Max Hits" } },
      },
    },
  });
}

function drawWinLossChart() {
  wins = 0;
  losses = 0;
  userData.forEach((game) => {
    if (game.player1 === user_name || game.player2 === user_name) {
      if (game.winner === user_name) {
        wins++;
      } else {
        losses++;
      }
    }
  });

  const winLossCtx = document.getElementById("winLossChart").getContext("2d");

  if (winLossChartInstance) winLossChartInstance.destroy();

  const winLossData = {
    labels: ["Win", "Loss"],
    datasets: [
      {
        data: [wins, losses],
        backgroundColor: ["#02BFB9", "#014C4A"],
      },
    ],
  };
  winLossChartInstance = new Chart(winLossCtx, {
    type: "pie",
    data: winLossData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text:
            "Victory Rate: " +
            ((wins / (wins + losses)) * 100).toFixed(1) +
            "%",
        },
      },
    },
  });
}

function drawWinLossHistoryChart(matchesData) {
  const ctx = document.getElementById("xpProgressChart").getContext("2d");

  // Initialize
  const labels = [];
  const progression = [];
  let cumulativeScore = 0;
  let winStreak = 0;
  let currentStreak = 0;

  // Get result for every match
  matchesData.forEach((match, index) => {
    labels.push("Match " + (index + 1));

    if (match.winner === user_name) {
      cumulativeScore += 1;
      currentStreak += 1;
      winStreak = Math.max(winStreak, currentStreak);
    } else if (match.winner !== "tie") {
      cumulativeScore -= 1;
      currentStreak = 0; // Reset streak on loss
    }

    progression.push(cumulativeScore);
  });

  if (winLossHistoryChartInstance) winLossHistoryChartInstance.destroy();

  // Set data for graph
  const winLossData = {
    labels: labels,
    datasets: [
      {
        label: `Win Streak: ${winStreak}`,
        data: progression, // Array of results
        borderColor: "#02BFB9",
        backgroundColor: "#014C4A",
        fill: false,
        tension: 0,
      },
    ],
  };

  // Create graph
  winLossHistoryChartInstance = new Chart(ctx, {
    type: "line",
    data: winLossData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: `Win/Loss Progression` },
      },
      scales: {
        x: { title: { display: true, text: "Matches" } },
        y: { title: { display: true, text: "Cumulative Score" } },
      },
    },
  });
}

function matchesTimeRank() {
  const matchesPlayed = wins + losses;
  const pointsLabel = document.getElementById("rankPointsLabel");
  const matchesPlayedLabel = document.getElementById("matchesPlayed");
  const avgMatchTimeLabel = document.getElementById("avgMatchTime");

  let totalSeconds = 0;
  matchesPlayedLabel.textContent = matchesPlayed;

  //const playerData = data.players[playerName];

  userData.forEach((match) => {
    totalSeconds += Number(match.begin_time);
  });
  //console.log("total seconds = " +totalSeconds);

  const totalTime = formatTime(totalSeconds / matchesPlayed);
  avgMatchTimeLabel.textContent = totalTime;
  const totalMatches = wins + losses;
  //const victoryRate = wins / (totalMatches) * 100;

  let rankPoints = totalMatches + wins * 10 - losses * 5;

  if (rankPoints < 0) rankPoints = 0;

  //console.log("rankpointss => " + rankPoints);
  pointsLabel.textContent = rankPoints;
}

export async function showCharts() {
  //playerName = user_name;
  try {
    const response = await fetch("http://localhost:8008", {
      method: "get_pong_games",
      body: JSON.stringify({
        display_name: user_name,
      }),
    });
    const data = await response.json();
    //console.log("Get Pong Game response: ", data);
    if (data.games) {
      userData = data.games;
      //console.log("userData aggiornata: ", userData);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }

  const noMatchesMessage = document.getElementById("noMatchesMessage");
  const chartsContainer = document.querySelector(".charts-container");
  //const chartsButtonContainer = document.querySelector('.charts-button-container');

  if (!userData || userData.length === 0) {
    noMatchesMessage.style.display = "block";
    chartsContainer.style.display = "none"; // If no matches don't show chartss
    //chartsButtonContainer.style.display = 'none';
    return;
  }

  noMatchesMessage.style.display = "none";
  //chartsContainer.style.display = 'flex';
  //chartsButtonContainer.style.display = 'block';
  let lastMatchesData = userData.slice(-10);

  Chart.defaults.color = "#ffffff";
  Chart.defaults.borderColor = "#ffffff";
  Chart.defaults.font.size = 16;

  drawRalliesChart(lastMatchesData);
  drawWinLossChart();
  matchesTimeRank(lastMatchesData);
  drawWinLossHistoryChart(lastMatchesData);
}

export const addChartsPageHandlers = () => {
  const matchDetailsButton = document.getElementById("matchDetailsButton");
  const chartsBackMenuButton = document.getElementById("chartsBackMenuButton");
  const backImageButton = document.getElementById("backImageButton");

  matchDetailsButton?.addEventListener("click", () => {
    navigate("/tournament/userstats/matchdetails", "Match Details");
  });

  chartsBackMenuButton?.addEventListener("click", () => {
    navigate("/tournament", "Back to Tournament Menu");
  });

  backImageButton?.addEventListener("click", () => {
    navigate("/modes", "Return to Game Mode");
  });
};
