import { Pile, gameUser, getClientSideGameUpdate, initGame, piles, requestPileAdd, requestPileRemove, turn, turnState } from './game.js';
import { addMessage } from './log.js';
import { initUser, users, peer, broadcastMessage, isHost, broadcast, host } from './networking.js';
//@ts-ignore
let b = bootstrap;
document.addEventListener("DOMContentLoaded", () => {
    // init send message
    document.getElementById("messageToSend").addEventListener("keyup", (event) => {
        if (event.code !== "Enter") {
            return;
        }
        let messageText = document.getElementById("messageToSend").value;
        document.getElementById("messageToSend").value = "";
        if (messageText.trim().length == 0) {
            return;
        }
        addMessage(users.get(peer.id).name, messageText);
        broadcastMessage(messageText);
    });
    // init name submission button and enter key
    document.getElementById("nameJoinButton").onclick = () => {
        let nameValue = document.getElementById("nameInput").value;
        if (nameValue.trim().length == 0) {
            document.getElementById("errorNameLabel").hidden = false;
        }
        else {
            b.Modal.getOrCreateInstance('#nameModal').hide();
            initUser(nameValue.trim());
        }
    };
    document.getElementById("nameInput").addEventListener("keyup", (event) => {
        if (event.code !== "Enter") {
            return;
        }
        submitName();
    });
    // init copy link
    document.getElementById("copyLinkButton").onclick = function () {
        navigator.clipboard.writeText(location.protocol + '//' + location.host + location.pathname + "?host=" + host);
        b.Toast.getOrCreateInstance(document.getElementById("copiedToast")).show();
    };
    // ask for name
    b.Modal.getOrCreateInstance("#nameModal").show();
    // init start game
    document.getElementById("startGameButton").disabled = true;
    document.getElementById("startGameButton").onclick = startGame;
    // game panel time
    // card submit init
    document.getElementById("cardSubmitButton").onclick = () => {
        let cardIndices = Array.from(document.getElementById("cardPanel").querySelectorAll("input")).map((c, i) => [i, c]).filter(c => c[1].checked).map(c => c[0]);
        let isSuccessful = requestPileAdd("discard", cardIndices);
        if (!isSuccessful) {
            b.Toast.getOrCreateInstance(document.getElementById("illegalPlayToast")).show();
        }
    };
});
export function updateUserPanel(users, user) {
    let usersPanel = document.getElementById("usersPanel");
    usersPanel.replaceChildren(...[...users].map(([, u]) => {
        let userDiv = document.createElement("div");
        userDiv.innerText = u.name;
        if (u.id == user) {
            userDiv.style.fontWeight = "bold";
        }
        userDiv.style.whiteSpace = "nowrap";
        return userDiv;
    }));
}
function submitName() {
    let nameValue = document.getElementById("nameInput").value;
    if (nameValue.trim().length == 0) {
        document.getElementById("errorNameLabel").hidden = false;
    }
    else {
        b.Modal.getOrCreateInstance('#nameModal').hide();
        initUser(nameValue.trim());
    }
}
export function updatePlayPanel() {
    let cardPanel = document.getElementById("cardPanel");
    cardPanel.replaceChildren(...gameUser.hand.map(c => {
        let cardDiv = document.createElement("div");
        let checkBox = document.createElement("input");
        checkBox.type = "checkbox";
        cardDiv.append(checkBox);
        let label = document.createElement("p");
        label.innerText = c.toString;
        cardDiv.append(label);
        return cardDiv;
    }));
    let turnLabel = document.getElementById("turnLabel");
    console.log(turnState);
    document.getElementById("cardSubmitButton").disabled = peer.id != turn || !turnState.includes("discard");
    if (peer.id == turn) {
        turnLabel.innerText = "Your Turn";
    }
    else {
        turnLabel.innerText = users.get(turn).name + "'s Turn";
    }
    updatePiles();
    [].slice.call(document.getElementById("pilePanel").getElementsByTagName("button")).forEach(e => {
        e.disabled = peer.id != turn || !turnState.includes("draw");
    });
}
export function startGame() {
    document.getElementById("lobbyPanel").hidden = true;
    document.getElementById("gamePanel").hidden = false;
    if (isHost) {
        let data = {
            source: peer.id,
            type: "startGame",
            value: "gg"
        };
        broadcast(data);
    }
    initGame();
}
export function updateLobbyPanel() {
    if (isHost && users.size > 1) {
        document.getElementById("startGameButton").disabled = false;
    }
}
function updatePiles() {
    let actualPiles = isHost ? new Map(getClientSideGameUpdate().piles.map(([string, cards]) => {
        let pile = new Pile(string, Pile.CLIENT_SHOWN(1, cards[0] !== null));
        pile.addCards(...cards);
        return [string, pile];
    })) : piles;
    document.getElementById("pilePanel").replaceChildren(...[...actualPiles.entries()].map(([k, v]) => {
        let button = document.createElement("button");
        let label = document.createElement("label");
        let div = document.createElement("div");
        let pile = v;
        button.innerText = pile.size > 1 ? "..." : (pile.size > 0 ? pile.pile[0].toString : "");
        button.onclick = () => {
            if (peer.id != turn || !turnState.includes("draw")) {
                return;
            }
            requestPileRemove(k, [0]);
        };
        label.innerText = k;
        div.appendChild(button);
        div.appendChild(label);
        return div;
    }));
}
