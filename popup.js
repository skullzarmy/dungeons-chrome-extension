window.onload = () => {
    // Fetch the note
    fetchAndDisplayData();
    setInterval(fetchAndDisplayData, 15000); // fetch and update data every 15 seconds
};

async function fetchAndDisplayData() {
    const dungeonsId = await getDungeonsId();
    const poll = await fetchLatestPoll(dungeonsId);
    const content = document.getElementById("content");

    // Fetch the account note
    const response = await fetch("https://botsin.space/api/v1/accounts/lookup?acct=dungeons@mastodon.social");
    const data = await response.json();

    const newContent = document.createElement("div");

    const char = document.createElement("div");
    char.id = "character-data";
    char.classList.add("character-data");
    char.innerHTML = DOMPurify.sanitize(data.note);
    newContent.appendChild(char);

    if (poll) {
        // Fetch detailed poll data
        const pollResponse = await fetch(`https://botsin.space/api/v1/polls/${poll.poll.id}`);
        const pollData = await pollResponse.json();

        // Generate progress bars for each poll option
        const totalVotes = pollData.options.reduce((total, option) => total + option.votes_count, 0);

        const countdown = document.createElement("h4");
        countdown.id = "countdown";
        countdown.innerHTML = "Checking for new poll data...";
        const countDownDate = new Date(pollData.expires_at).getTime();
        countdown.innerHTML = generateCountdown(countDownDate);
        newContent.appendChild(countdown);

        const pollContent = document.createElement("div");
        pollContent.classList.add("poll-content");
        pollContent.innerHTML = `<h3>${DOMPurify.sanitize(poll.content)}</h3>`;
        newContent.appendChild(pollContent);

        const votesCount = document.createElement("h3");
        votesCount.innerHTML = `Votes: ${DOMPurify.sanitize(pollData.votes_count)}`;
        newContent.appendChild(votesCount);

        const progressBarContainer = document.createElement("div");
        for (let option of pollData.options) {
            const optionWinning =
                option.votes_count === Math.max(...pollData.options.map((option) => option.votes_count));
            const progressBar = generateProgressBar(option, totalVotes, optionWinning);
            progressBarContainer.innerHTML += progressBar;
        }
        newContent.appendChild(progressBarContainer);

        const link = document.createElement("a");
        link.href = poll.url;
        link.classList.add("button");
        link.innerHTML = `VOTE NOW ON&nbsp;<i class="mastodon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mastodon" viewBox="0 0 16 16"><path d="M11.19 12.195c2.016-.24 3.77-1.475 3.99-2.603.348-1.778.32-4.339.32-4.339 0-3.47-2.286-4.488-2.286-4.488C12.062.238 10.083.017 8.027 0h-.05C5.92.017 3.942.238 2.79.765c0 0-2.285 1.017-2.285 4.488l-.002.662c-.004.64-.007 1.35.011 2.091.083 3.394.626 6.74 3.78 7.57 1.454.383 2.703.463 3.709.408 1.823-.1 2.847-.647 2.847-.647l-.06-1.317s-1.303.41-2.767.36c-1.45-.05-2.98-.156-3.215-1.928a3.614 3.614 0 0 1-.033-.496s1.424.346 3.228.428c1.103.05 2.137-.064 3.188-.189zm1.613-2.47H11.13v-4.08c0-.859-.364-1.295-1.091-1.295-.804 0-1.207.517-1.207 1.541v2.233H7.168V5.89c0-1.024-.403-1.541-1.207-1.541-.727 0-1.091.436-1.091 1.296v4.079H3.197V5.522c0-.859.22-1.541.66-2.046.456-.505 1.052-.764 1.793-.764.856 0 1.504.328 1.933.983L8 4.39l.417-.695c.429-.655 1.077-.983 1.934-.983.74 0 1.336.259 1.791.764.442.505.661 1.187.661 2.046v4.203z"/></svg></i>`;
        newContent.appendChild(link);
    }

    // Replace the content with the new content
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

async function getDungeonsId() {
    const dungeonsResponse = await fetch("https://botsin.space/api/v1/accounts/lookup?acct=dungeons@mastodon.social");
    const dungeonsData = await dungeonsResponse.json();
    return dungeonsData.id;
}

async function fetchLatestPoll(dungeonsId) {
    const statusResponse = await fetch(`https://botsin.space/api/v1/accounts/${dungeonsId}/statuses`);
    const data = await statusResponse.json();
    return data.find((status) => status.poll && !status.poll.expired);
}

function generateProgressBar(option, totalVotes, optionWinning = false) {
    return `<div class="poll-option ${optionWinning ? "winning-container" : ""}">
        <span class="option-title">${DOMPurify.sanitize(option.title)} <span class="option-votes ${
        optionWinning ? "option-winning" : ""
    }">(votes: ${DOMPurify.sanitize(option.votes_count)})</span></span>
        <div class="progress-bar">
            <div class="progress-bar-fill" style="flex-grow: ${DOMPurify.sanitize(option.votes_count)}"></div>
            <div class="progress-bar-remaining" style="flex-grow: ${
                totalVotes - DOMPurify.sanitize(option.votes_count)
            }"></div>
        </div>
    </div>`;
}

function generateCountdown(countDownDate) {
    const x = setInterval(() => {
        const now = new Date().getTime();
        const distance = countDownDate - now;
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        document.getElementById("countdown").innerHTML = `ENDS IN: ${minutes}m ${seconds}s`;
        if (distance < 0) {
            clearInterval(x);
            document.getElementById("countdown").innerHTML = `ENDED`;
        }
    }, 1000);
    return "Checking for poll expiration...";
}
