// Function to fetch CSV and parse it
async function fetchCSVData(csvFileUrl) {
    const response = await fetch(csvFileUrl);
    const csvText = await response.text();

    return Papa.parse(csvText, {
        header: true,
        dynamicTyping: true
    }).data;
}

// Function to fetch goals data for a specific game and group by period
async function fetchGoalsData(gameID) {
    const response = await fetch('goals_data.csv'); // Update with the correct path to your goals CSV file
    const csvText = await response.text();
    const parsedData = Papa.parse(csvText, { header: true, dynamicTyping: true }).data;

    // Filter and group goals related to the selected game ID by period
    const goalsByPeriod = parsedData.filter(row => row.GameID === gameID).reduce((acc, goal) => {
        const period = goal.PeriodName; // Assuming the Period field exists in your CSV
        if (!acc[period]) {
            acc[period] = [];
        }
        acc[period].push(goal);
        return acc;
    }, {});

    return goalsByPeriod;
}

function displayGoals(goalsByPeriod) {
    const goalsContainer = document.getElementById("goals");
    goalsContainer.innerHTML = '';

    for (const period in goalsByPeriod) {
        const periodDiv = document.createElement("div");
        periodDiv.classList.add("period");
        periodDiv.innerHTML = `<h5>${period} Period</h5>`;

        goalsByPeriod[period].forEach(goal => {
            const goalBox = document.createElement("div");
            goalBox.classList.add("goal-box");

            // Assuming you have a way to get the player image URL
            const playerImageUrl = 'default-skater.png'; // Update with your actual image URL property
            const GoalUrl = goal.GoalID; // GoalID for the video url

            goalBox.innerHTML = `
                <div class="goal-details">
                    <img src="${playerImageUrl}" alt="${goal.GoalPlayerFirstName} ${goal.GoalPlayerLastName}" class="player-image"/>
                    <div class="goal-info">
                        <span class="goal-player">${goal.GoalPlayerFirstName} ${goal.GoalPlayerLastName}</span>
                        <span class="goal-team">${goal.TeamName}</span>
                    </div>
                    <span class="goal-time">${goal.PeriodClockTime}</span>
                        <div class="playbutton">
                        <img src="play.png" class="player-image play-button" data-goal-id="${GoalUrl}" alt="Play Video">
                        </div>
                </div>
                <div class="goal-assists">
                <strong>Assists:</strong>
                ${goal.Assist1_FirstName || goal.Assist1_LastName ? 
                    `${goal.Assist1_FirstName ? goal.Assist1_FirstName : ''} ${goal.Assist1_LastName ? goal.Assist1_LastName : ''}` : 
                    'Unassisted'
                }${goal.Assist2_FirstName || goal.Assist2_LastName ? 
                    `, ${goal.Assist2_FirstName ? goal.Assist2_FirstName : ''} ${goal.Assist2_LastName ? goal.Assist2_LastName : ''}` : 
                    ''
                }
                </div>

            `;

            periodDiv.appendChild(goalBox);
        });

        goalsContainer.appendChild(periodDiv);
    }

    // After rendering goals, attach event listeners for play buttons
    attachPlayButtonListeners();
}

// Function to attach play button event listeners
function attachPlayButtonListeners() {
    const playButtons = document.querySelectorAll('.play-button');
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const goalId = this.getAttribute('data-goal-id');
            const videoUrl = `video/${goalId}.mp4`; // Update with your actual video URL logic
            openVideoModal(videoUrl);
        });
    });
}

// Function to open video modal
function openVideoModal(videoUrl) {
    const modal = document.getElementById('videoModal');
    const videoSource = document.getElementById('videoSource');
    const video = document.getElementById('goalVideo');
    
    videoSource.src = videoUrl; // Set the video URL
    video.load(); // Load the new video
    modal.style.display = 'block'; // Show the modal
}

// Close modal functionality
const closeButton = document.querySelector('.close-button');
closeButton.addEventListener('click', function() {
    closeVideoModal();
});

window.onclick = function(event) {
    const modal = document.getElementById('videoModal');
    if (event.target === modal) {
        closeVideoModal();
    }
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    modal.style.display = 'none'; // Hide the modal
    const video = document.getElementById('goalVideo');
    video.pause(); // Pause the video when closing
    video.currentTime = 0; // Reset video to the start
}

// Function to generate scoreboards from CSV data
function generateAllScoreboards(csvData) {
    let games = {};
    
    // Group rows by GameID
    csvData.forEach(row => {
        if (!games[row.GameID]) {
            games[row.GameID] = {
                gameStartTime: row.GameStartTime,
                rows: []
            };
        }
        games[row.GameID].rows.push(row);
    });

    let scoreboards = [];
    
    // For each game, calculate the score and teams
    Object.keys(games).forEach(gameID => {
        let gameRows = games[gameID].rows;
        let homeTeam = "";
        let awayTeam = "";
        let homeScore = 0;
        let awayScore = 0;

        gameRows.forEach(row => {
            if (row.TeamType === "Home") {
                homeTeam = row.TeamName;
                homeScore++;
            } else if (row.TeamType === "Away") {
                awayTeam = row.TeamName;
                awayScore++;
            }
        });

        scoreboards.push({
            gameID: gameID,
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            homeScore: homeScore,
            awayScore: awayScore,
            gameStartTime: new Date(games[gameID].gameStartTime)  // Convert to Date object for sorting
        });
    });

    // Sort scoreboards by GameStartTime (oldest to newest)
    scoreboards.sort((a, b) => a.gameStartTime - b.gameStartTime);

    return scoreboards;
}

// Function to display scoreboards in the HTML
function displayScoreboards(scoreboards) {
    const container = document.getElementById("scoreboards");
    container.innerHTML = ''; // Clear the container first

    scoreboards.forEach(board => {
        const scoreboardDiv = document.createElement("div");
        scoreboardDiv.classList.add("card"); // Add scoreboard class

        scoreboardDiv.innerHTML = `
            <div class="score-details">
                <div class="date-time-container">
                    <div class="date-time">
                        <div class="month">${board.gameStartTime.toLocaleDateString('en-US', { month: 'short' })}</div>
                        <div class="day">${board.gameStartTime.getDate()}</div>
                    </div>
                    <div class="time">
                        ${board.gameStartTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <div class="team">
                    <span class="team-name">${board.awayTeam}</span>
                    <span class="team-score">${board.awayScore}</span>
                </div>
                <div class="team">
                    <span class="team-name">${board.homeTeam}</span>
                    <span class="team-score">${board.homeScore}</span>
                </div>
            </div>
        `;

        // Add click event for scoreboard selection
        scoreboardDiv.addEventListener('click', async () => {
            const selected = container.querySelector('.card.selected');
            if (selected) {
                // Deselect if the clicked scoreboard is already selected
                if (selected === scoreboardDiv) {
                    selected.classList.remove('selected');
                } else {
                    // Deselect previously selected scoreboard
                    selected.classList.remove('selected');
                    // Select the clicked scoreboard
                    scoreboardDiv.classList.add('selected');
                }
            } else {
                // Select the clicked scoreboard
                scoreboardDiv.classList.add('selected');
            }

            // Display game details above the goals
            displayGameDetails(board);
            await fetchAndDisplayGoals(board.gameID); // Fetch and display goals
        });

        container.appendChild(scoreboardDiv);
    });

    // Set the initial transform for the scoreboard container
    container.style.transform = 'translateX(0)';
}

// Function to display game details and a horizontal timeline
function displayGameDetails(board) {
    const gameDetailsContainer = document.getElementById("game-details");

    // Clear previous game details
    gameDetailsContainer.innerHTML = '';

    // Game details section
    gameDetailsContainer.innerHTML = `
        <h3>Game Details</h3>
        <p class="game-summary">
            <span class="home-team-name">${board.homeTeam}</span>
            <span class="game-score">${board.homeScore} - ${board.awayScore}</span>
            <span class="away-team-name">${board.awayTeam}</span>
        </p>
        <br> </br>
        <h4>Scoring Summary</h4>
    `;

    // Fetch and display the goals to populate the timeline
    fetchAndDisplayGoals(board.gameID);
}


// Function to fetch and display goals for the selected game
async function fetchAndDisplayGoals(gameID) {
    const goals = await fetchGoalsData(gameID); // Fetch goals for the specific game
    displayGoals(goals); // Display the goals below the game details
}

// Function to initialize the app
async function init() {
    const csvData = await fetchCSVData('goals_data.csv');
    const scoreboards = generateAllScoreboards(csvData);
    displayScoreboards(scoreboards);
}

// Call the init function when the document is ready
document.addEventListener('DOMContentLoaded', init);


