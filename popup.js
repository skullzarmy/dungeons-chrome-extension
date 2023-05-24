window.onload = () => {
    // Fetch the note
    fetchAndDisplayData();
    setInterval(fetchAndDisplayData, 15000); // fetch and update data every 15 seconds

    // Initial icon setup
    var isSystemDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var sunIcon = document.getElementById("sun-icon");
    var moonIcon = document.getElementById("moon-icon");
    var appIcon = document.getElementById("tab-icon");

    appIcon.addEventListener("mouseover", function () {
        appIcon.src = "icons/icon48.gif";
    });

    appIcon.addEventListener("mouseout", function () {
        appIcon.src = "icons/icon48.png";
    });

    var body = document.body;
    if (isSystemDarkMode) {
        body.classList.add("dark-mode");
        moonIcon.style.display = "none";
        sunIcon.style.display = "flex";
    } else {
        body.classList.add("light-mode");
        sunIcon.style.display = "none";
        moonIcon.style.display = "flex";
    }

    feather.replace(); // This line is needed to initially draw the SVG icons.

    // Event listener for the theme switcher
    document.getElementById("theme-switcher").addEventListener("click", function () {
        var sunIcon = document.getElementById("sun-icon");
        var moonIcon = document.getElementById("moon-icon");
        if (body.classList.contains("dark-mode")) {
            body.classList.remove("dark-mode");
            body.classList.add("light-mode");
            sunIcon.style.display = "none";
            moonIcon.style.display = "flex";
        } else {
            body.classList.remove("light-mode");
            body.classList.add("dark-mode");
            moonIcon.style.display = "none";
            sunIcon.style.display = "flex";
        }
        feather.replace(); // Redraw the icons
    });
};

async function fetchAndDisplayData() {
    const icon = document.getElementById("tab-icon");
    icon.src = "icons/icon48.gif";
    const dungeonsId = await getMastodonId("dungeons@mastodon.social");
    const poll = await fetchLatestPoll(dungeonsId);
    const content = document.getElementById("content");

    // Fetch the account note
    const response = await fetch("https://mastodon.social/api/v1/accounts/lookup?acct=dungeons@mastodon.social");
    const data = await response.json();

    const newContent = document.createElement("div");

    const parser = new DOMParser();
    const noteElement = parser.parseFromString(DOMPurify.sanitize(data.note), "text/html");
    const firstPTag = noteElement.querySelector("p");

    if (firstPTag) {
        const textParts = firstPTag.innerHTML.split("<br>");
        const charName = `<div class="character-name">${textParts.shift()}</div>`;
        const lastLine = textParts.pop();
        const stats = lastLine.split(" ");

        // Create a table
        const table = document.createElement("table");
        table.cellSpacing = 0;
        table.classList.add("character-stats");

        // Create rows for stat labels and values
        const labelRow = document.createElement("tr");
        const valueRow = document.createElement("tr");

        for (let i = 0; i < stats.length; i += 2) {
            // Create the label cell and add it to the label row
            const labelCell = document.createElement("td");
            labelCell.textContent = stats[i];
            labelRow.appendChild(labelCell);

            // Create the value cell and add it to the value row
            const valueCell = document.createElement("td");
            valueCell.textContent = stats[i + 1];
            valueRow.appendChild(valueCell);
        }

        // Append the label and value rows to the table
        table.appendChild(labelRow);
        table.appendChild(valueRow);

        // Create a wrapper for the character data and the stats table
        const wrapper = document.createElement("div");
        wrapper.classList.add("character-data-wrapper");

        // Append the character data to the wrapper
        const charData = document.createElement("div");
        charData.classList.add("character-info");
        charData.innerHTML = textParts.join("<br>");
        wrapper.appendChild(charData);

        // Append the stats table to the wrapper
        wrapper.appendChild(table);

        // Replace the first paragraph with the wrapper
        firstPTag.innerHTML = charName + wrapper.outerHTML;
    }

    const char = document.createElement("div");
    char.id = "character-data";
    char.classList.add("character-data");
    char.appendChild(noteElement.body);
    newContent.appendChild(char);

    if (poll) {
        // Fetch detailed poll data
        const pollResponse = await fetch(`https://mastodon.social/api/v1/polls/${poll.poll.id}`);
        const pollData = await pollResponse.json();

        // Generate progress bars for each poll option
        const totalVotes = pollData.options.reduce((total, option) => total + option.votes_count, 0);

        const countdown = document.createElement("div");
        countdown.id = "poll-countdown";
        const countDownDate = new Date(pollData.expires_at).getTime();
        countdown.innerHTML = generateCountdown(countDownDate);
        newContent.appendChild(countdown);

        const pollContent = document.createElement("div");
        pollContent.classList.add("poll-content");
        pollContent.innerHTML = `<h3>${DOMPurify.sanitize(poll.content)}</h3>`;
        newContent.appendChild(pollContent);

        const progressBarContainer = document.createElement("div");
        const votesCount = document.createElement("h3");
        votesCount.innerHTML = `Total Votes: ${
            pollData.votes_count > 0 ? DOMPurify.sanitize(pollData.votes_count) : "0"
        }`;
        progressBarContainer.appendChild(votesCount);
        progressBarContainer.classList.add("poll-votes");
        for (let option of pollData.options) {
            const optionWinning =
                option.votes_count === Math.max(...pollData.options.map((option) => option.votes_count));
            const progressBar = generateProgressBar(option, totalVotes, optionWinning);
            progressBarContainer.innerHTML += progressBar;
        }
        newContent.appendChild(progressBarContainer);

        const link = document.createElement("a");
        link.href = poll.url;
        link.title = "Vote now on Mastodon!";
        link.alt = "Vote now on Mastodon!";
        link.classList.add("button");
        link.classList.add("motion-safe-animate-wiggle-wrapper");
        link.innerHTML = `VOTE NOW ON&nbsp;&nbsp;&nbsp;<img src="icons/logo-full-white.svg" alt="Mastodon logo" height="23" class="mastodon-icon motion-safe-animate-wiggle"/>`;
        newContent.appendChild(link);
    }
    // saved as backup
    // <i class="mastodon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mastodon" viewBox="0 0 16 16"><path d="M11.19 12.195c2.016-.24 3.77-1.475 3.99-2.603.348-1.778.32-4.339.32-4.339 0-3.47-2.286-4.488-2.286-4.488C12.062.238 10.083.017 8.027 0h-.05C5.92.017 3.942.238 2.79.765c0 0-2.285 1.017-2.285 4.488l-.002.662c-.004.64-.007 1.35.011 2.091.083 3.394.626 6.74 3.78 7.57 1.454.383 2.703.463 3.709.408 1.823-.1 2.847-.647 2.847-.647l-.06-1.317s-1.303.41-2.767.36c-1.45-.05-2.98-.156-3.215-1.928a3.614 3.614 0 0 1-.033-.496s1.424.346 3.228.428c1.103.05 2.137-.064 3.188-.189zm1.613-2.47H11.13v-4.08c0-.859-.364-1.295-1.091-1.295-.804 0-1.207.517-1.207 1.541v2.233H7.168V5.89c0-1.024-.403-1.541-1.207-1.541-.727 0-1.091.436-1.091 1.296v4.079H3.197V5.522c0-.859.22-1.541.66-2.046.456-.505 1.052-.764 1.793-.764.856 0 1.504.328 1.933.983L8 4.39l.417-.695c.429-.655 1.077-.983 1.934-.983.74 0 1.336.259 1.791.764.442.505.661 1.187.661 2.046v4.203z"/></svg></i>

    // Replace the content with the new content
    icon.src = "icons/icon48.png";
    content.innerHTML = newContent.innerHTML;

    // Make all links open in a new tab
    const links = document.getElementById("app").querySelectorAll("a");
    links.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            chrome.tabs.create({ url: event.currentTarget.href });
        });
    });
}

async function getMastodonId(handle) {
    const dungeonsResponse = await fetch(`https://mastodon.social/api/v1/accounts/lookup?acct=${handle}`);
    const dungeonsData = await dungeonsResponse.json();
    return dungeonsData.id;
}

async function fetchLatestPoll(dungeonsId) {
    const statusResponse = await fetch(`https://mastodon.social/api/v1/accounts/${dungeonsId}/statuses`);
    const data = await statusResponse.json();
    return data.find((status) => status.poll && !status.poll.expired);
}

function generateProgressBar(option, totalVotes, optionWinning = false) {
    return `<div class="poll-option ${totalVotes > 0 && optionWinning ? "winning-container" : ""}">
        <span class="option-title">${DOMPurify.sanitize(option.title)} <span class="option-votes ${
        totalVotes > 0 && optionWinning ? "option-winning" : ""
    }">(votes: ${option.votes_count > 0 ? DOMPurify.sanitize(option.votes_count) : "0"})</span></span>
        <div class="progress-bar">
            <div class="progress-bar-fill" style="flex-grow: ${DOMPurify.sanitize(option.votes_count)};"></div>
            <div class="progress-bar-remaining" style="flex-grow: ${
                totalVotes - DOMPurify.sanitize(option.votes_count)
            };"></div>
        </div>
    </div>`;
}

function generateCountdown(countDownDate) {
    const x = setInterval(() => {
        const now = new Date().getTime();
        const distance = countDownDate - now;
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        const CD = document.getElementById("poll-countdown");
        const PB = document.createElement("div");
        PB.id = "countdown-progress-bar";
        PB.innerHTML = `<div class="progress-bar">
        <div class="progress-bar-fill" style="flex-grow: ${Math.round((distance / (1000 * 60 * 30)) * 100)};"></div>
        <div class="progress-bar-remaining" style="flex-grow: ${
            100 - Math.round((distance / (1000 * 60 * 30)) * 100)
        };"></div>
        </div>`;
        CD.innerHTML = `POLL ENDS IN: ${minutes}m ${seconds}s<br />` + PB.innerHTML;
        if (distance < 0) {
            clearInterval(x);
            CD.innerHTML = `POLL ENDED`;
        }
    }, 1000);
    return `<div class="lds-hourglass tiny"></div>`;
}
