




// =====================================
// VRTX MUSIC - MAIN JAVASCRIPT
// =====================================

// HTML Elements
const allSongsBtn = document.getElementById("allSongsBtn");
const library = document.getElementById("library");
const appHome = document.getElementById("appHome");
const songList = document.getElementById("songList");
console.log("VRTX MUSIC JS LOADED");

const coverArt = document.getElementById("coverArt");
const trackTitle = document.getElementById("trackTitle");
const trackArtist = document.getElementById("trackArtist");
const progressFill = document.getElementById("progressFill");
const progressTrack = document.getElementById("progressTrack");

const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const equalizerBtn = document.getElementById("equalizerBtn");
const optionsBtn = document.getElementById("optionsBtn");
const equalizerMenu = document.getElementById("equalizerMenu");
const optionsMenu = document.getElementById("optionsMenu");

const repeatBtn = document.getElementById("repeatBtn");
const shuffleBtn = document.getElementById("shuffleBtn");

const selectionToolbar = document.getElementById("selectionToolbar");
const selectedCount = document.getElementById("selectedCount");
const selectionMenuBtn = document.getElementById("selectionMenuBtn");
const selectionMenu = document.getElementById("selectionMenu");

const createPlaylistBtn = document.getElementById("createPlaylistBtn");
const movePlaylistBtn = document.getElementById("movePlaylistBtn");
const deleteSongsBtn = document.getElementById("deleteSongsBtn");
const allSongsScreen = document.getElementById("allSongsScreen");
const backToLibraryBtn = document.getElementById("backToLibraryBtn");
const vrtxAiBtn = document.getElementById("vrtxAiBtn");
const vrtxAiScreen = document.getElementById("vrtxAiScreen");
const backFromAiBtn = document.getElementById("backFromAiBtn");

// App Data
let songs = [];
// =====================================
// VRTX MUSIC DATABASE
// =====================================

const DB_NAME = "VRTXMusicDB";
const DB_VERSION = 1;
const STORE_NAME = "songs";

function openSongsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function saveSongToDB(file) {
  const db = await openSongsDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const request = transaction.objectStore(STORE_NAME).add({
      name: file.name,
      file: file
    });

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function getSavedSongsFromDB() {
  const db = await openSongsDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}
let recentSongs = [];
let playlists = [];

let currentIndex = -1;
let selectedSongs = [];
let selectionMode = false;
let longPressIndex = -1;

let repeatMode = 0;
let shuffleOn = false;

// Audio
const audio = new Audio();

// File Picker
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "audio/*";
fileInput.multiple = true;
fileInput.hidden = true;
document.body.appendChild(fileInput);


// =====================================
// HOME TO LIBRARY NAVIGATION
// =====================================

if (allSongsBtn && library && appHome) {
  allSongsBtn.addEventListener("click", () => {
    appHome.style.display = "none";
    library.style.display = "block";
    window.scrollTo(0, 0);
  });
}
// VRTX AI NAVIGATION

if (vrtxAiBtn && vrtxAiScreen && library) {
  vrtxAiBtn.addEventListener("click", () => {
    library.style.display = "none";
    allSongsScreen.style.display = "none";
    vrtxAiScreen.style.display = "block";

    window.scrollTo(0, 0);
  });
}

if (backFromAiBtn && vrtxAiScreen && library) {
  backFromAiBtn.addEventListener("click", () => {
    vrtxAiScreen.style.display = "none";
    library.style.display = "block";

    window.scrollTo(0, 0);
  });
}


// =====================================
// LIBRARY TABS
// =====================================

const tabs = document.querySelectorAll(".music-tabs button");

function activateTab(type) {
  tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === type);
  });

  if (type === "songs") {
    library.style.display = "none";
    allSongsScreen.style.display = "block";
    showSongs();
  }

  if (type === "recent") {
    library.style.display = "none";
    allSongsScreen.style.display = "block";
    showRecent();
  }

  if (type === "playlists") {
    library.style.display = "none";
    allSongsScreen.style.display = "block";
    showPlaylists();
  }

  if (type === "add") {
    songList.style.display = "none";
    fileInput.click();
  }
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    activateTab(tab.dataset.tab);
  });
});
backToLibraryBtn.addEventListener("click", () => {
  allSongsScreen.style.display = "none";
  library.style.display = "block";
});

// =====================================
// ADD SONGS
// =====================================

fileInput.addEventListener("change", async event => {
  const files = Array.from(event.target.files);

  for (const file of files) {
    try {
      const id = await saveSongToDB(file);

      songs.push({
        id: id,
        name: file.name,
        url: URL.createObjectURL(file)
      });
    } catch (error) {
      console.error("Song save failed:", error);
    }
  }

  fileInput.value = "";

  activateTab("songs");
});


// =====================================
// SELECTION TOOLBAR
// =====================================

function updateSelectionUI() {
  if (!selectionToolbar || !selectedCount) return;

  selectionToolbar.style.display =
    selectionMode ? "flex" : "none";

  selectedCount.textContent =
    selectedSongs.length + " Selected";
}

if (selectionMenuBtn && selectionMenu) {
  selectionMenuBtn.addEventListener("click", () => {
    selectionMenu.style.display =
      selectionMenu.style.display === "block" ? "none" : "block";
  });
}


// =====================================
// DISPLAY SONGS
// =====================================

function showSongs() {
  if (!songList) return;

  songList.style.display = "block";
  songList.innerHTML = "";

  if (songs.length === 0) {
    selectionMode = false;
    selectedSongs = [];
    updateSelectionUI();

    songList.innerHTML = `
      <div class="empty-library">
        <div class="empty-icon">♫</div>
        <h3>No Songs Yet</h3>
        <p>Add your favourite songs to start listening.</p>
      </div>
    `;
    return;
  }

  songs.forEach((song, index) => {
    const item = document.createElement("button");

    item.className = "song-item";
    item.textContent = "♫  " + song.name;

    let pressTimer = null;

    item.addEventListener("pointerdown", () => {
      pressTimer = setTimeout(() => {
        longPressIndex = index;
        selectionMode = true;

        if (!selectedSongs.includes(index)) {
          selectedSongs.push(index);
        }

        showSongs();
      }, 500);
    });

    function cancelLongPress() {
      if (pressTimer !== null) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }

    item.addEventListener("pointerup", cancelLongPress);
    item.addEventListener("pointerleave", cancelLongPress);
    item.addEventListener("pointercancel", cancelLongPress);

    item.addEventListener("click", () => {
      if (longPressIndex === index) {
        longPressIndex = -1;
        return;
      }

      if (selectionMode) {
        if (selectedSongs.includes(index)) {
          selectedSongs = selectedSongs.filter(i => i !== index);
        } else {
          selectedSongs.push(index);
        }

        if (selectedSongs.length === 0) {
          selectionMode = false;
        }

        showSongs();
      } else {
        playSong(index);
      }
    });

    if (selectedSongs.includes(index)) {
      item.textContent = "✓  " + song.name;
      item.style.border = "2px solid #35A8FF";
    }

    songList.appendChild(item);
  });

  updateSelectionUI();
}


// =====================================
// RECENTLY PLAYED
// =====================================

function showRecent() {
  if (!songList) return;

  songList.style.display = "block";
  songList.innerHTML = "";

  if (recentSongs.length === 0) {
    songList.textContent = "No recently played songs yet.";
    return;
  }

  recentSongs.forEach(song => {
    const item = document.createElement("button");

    item.className = "song-item";
    item.textContent = "◷  " + song.name;

    item.addEventListener("click", () => {
      const index = songs.indexOf(song);

      if (index !== -1) {
        playSong(index);
      }
    });

    songList.appendChild(item);
  });
}


// =====================================
// PLAYLISTS
// =====================================

function showPlaylists() {
  if (!songList) return;

  songList.style.display = "block";
  songList.innerHTML = "";

  if (playlists.length === 0) {
    songList.textContent = "No playlists yet. Create one from selected songs.";
    return;
  }

  playlists.forEach((playlist, index) => {
    const item = document.createElement("button");

    item.className = "song-item";
    item.textContent =
      "☷  " + playlist.name + " (" + playlist.songs.length + ")";

    item.addEventListener("click", () => {
      showPlaylistSongs(index);
    });

    songList.appendChild(item);
  });
}

function showPlaylistSongs(playlistIndex) {
  const playlist = playlists[playlistIndex];

  if (!playlist || !songList) return;

  songList.innerHTML = "";

  const backButton = document.createElement("button");
  backButton.className = "song-item";
  backButton.textContent = "← Back to Playlists";

  backButton.addEventListener("click", showPlaylists);

  songList.appendChild(backButton);

  if (playlist.songs.length === 0) {
    songList.append("This playlist is empty.");
    return;
  }

  playlist.songs.forEach(song => {
    const item = document.createElement("button");

    item.className = "song-item";
    item.textContent = "♫  " + song.name;

    item.addEventListener("click", () => {
      const index = songs.indexOf(song);

      if (index !== -1) {
        playSong(index);
      }
    });

    songList.appendChild(item);
  });
}


// =====================================
// CREATE PLAYLIST
// =====================================

if (createPlaylistBtn) {
  createPlaylistBtn.addEventListener("click", () => {
    if (selectedSongs.length === 0) return;

    const name = prompt("Enter playlist name:");

    if (!name || !name.trim()) return;

    const selected = selectedSongs.map(index => songs[index]);

    playlists.push({
      name: name.trim(),
      songs: selected
    });

    selectedSongs = [];
    selectionMode = false;

    if (selectionMenu) selectionMenu.style.display = "none";

    updateSelectionUI();
    activateTab("playlists");
  });
}


// =====================================
// MOVE TO PLAYLIST
// =====================================

if (movePlaylistBtn) {
  movePlaylistBtn.addEventListener("click", () => {
    if (selectedSongs.length === 0) return;

    if (playlists.length === 0) {
      alert("Create a playlist first.");
      return;
    }

    const names = playlists
      .map((playlist, index) => (index + 1) + ". " + playlist.name)
      .join("\n");

    const choice = prompt("Choose playlist number:\n" + names);

    const index = Number(choice) - 1;

    if (!Number.isInteger(index) || !playlists[index]) return;

    selectedSongs.forEach(songIndex => {
      const song = songs[songIndex];

      if (song && !playlists[index].songs.includes(song)) {
        playlists[index].songs.push(song);
      }
    });

    selectedSongs = [];
    selectionMode = false;

    if (selectionMenu) selectionMenu.style.display = "none";

    updateSelectionUI();
    activateTab("playlists");
  });
}


// =====================================
// DELETE SELECTED SONGS
// =====================================

if (deleteSongsBtn) {
  deleteSongsBtn.addEventListener("click", () => {
    if (selectedSongs.length === 0) return;

    const confirmed = confirm(
      "Remove selected songs from VRTX MUSIC? Original device files will not be deleted."
    );

    if (!confirmed) return;

    const indexes = [...selectedSongs].sort((a, b) => b - a);

    indexes.forEach(index => {
      const removedSong = songs[index];

      if (removedSong) {
        if (currentIndex === index) {
          audio.pause();
          audio.src = "";
          currentIndex = -1;

          trackTitle.textContent = "No song selected";
          trackArtist.textContent = "Choose a song to play";
          playBtn.textContent = "▶";
        } else if (currentIndex > index) {
          currentIndex--;
        }

        recentSongs = recentSongs.filter(song => song !== removedSong);

        playlists.forEach(playlist => {
          playlist.songs = playlist.songs.filter(song => song !== removedSong);
        });

        songs.splice(index, 1);
      }
    });

    selectedSongs = [];
    selectionMode = false;

    if (selectionMenu) selectionMenu.style.display = "none";

    updateSelectionUI();
    showSongs();
  });
}


// =====================================
// AUDIO EFFECTS / EQUALIZER
// =====================================

let audioContext;
let sourceNode;
let bassFilter;
let vocalFilter;
let trebleFilter;

function setupAudioEffects() {
  if (audioContext) return;

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return;

  audioContext = new AudioContextClass();
  sourceNode = audioContext.createMediaElementSource(audio);

  bassFilter = audioContext.createBiquadFilter();
  bassFilter.type = "lowshelf";
  bassFilter.frequency.value = 200;

  vocalFilter = audioContext.createBiquadFilter();
  vocalFilter.type = "peaking";
  vocalFilter.frequency.value = 1500;
  vocalFilter.Q.value = 1;

  trebleFilter = audioContext.createBiquadFilter();
  trebleFilter.type = "highshelf";
  trebleFilter.frequency.value = 4000;

  sourceNode.connect(bassFilter);
  bassFilter.connect(vocalFilter);
  vocalFilter.connect(trebleFilter);
  trebleFilter.connect(audioContext.destination);
}

function setEqualizer(preset) {
  setupAudioEffects();

  if (!audioContext) return;

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  bassFilter.gain.value = 0;
  vocalFilter.gain.value = 0;
  trebleFilter.gain.value = 0;

  if (preset === "bass") {
    bassFilter.gain.value = 9;
  } else if (preset === "vocal") {
    vocalFilter.gain.value = 5;
  } else if (preset === "treble") {
    trebleFilter.gain.value = 8;
  }

  document.querySelectorAll("[data-eq]").forEach(button => {
    button.classList.toggle(
      "selected",
      button.dataset.eq === preset
    );
  });
}


// =====================================
// PLAY SONG
// =====================================

function playSong(index) {
  if (index < 0 || index >= songs.length) return;

  currentIndex = index;

  audio.src = songs[index].url;

  trackTitle.textContent = songs[index].name;
  trackArtist.textContent = "Local audio";

  coverArt.src =
    "https://placehold.co/600x600/102B49/35A8FF?text=VRTX+MUSIC";

  recentSongs = [
    songs[index],
    ...recentSongs.filter(song => song !== songs[index])
  ];

  setupAudioEffects();

  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }

  audio.play().then(() => {
    playBtn.textContent = "Ⅱ";
  }).catch(() => {
    playBtn.textContent = "▶";
  });
}


// =====================================
// PLAY / PAUSE
// =====================================

playBtn.addEventListener("click", () => {
  if (currentIndex === -1) {
    if (songs.length > 0) playSong(0);
    return;
  }

  if (audio.paused) {
    audio.play().then(() => {
      playBtn.textContent = "Ⅱ";
    }).catch(() => {
      playBtn.textContent = "▶";
    });
  } else {
    audio.pause();
    playBtn.textContent = "▶";
  }
});


// =====================================
// PREVIOUS SONG
// =====================================

prevBtn.addEventListener("click", () => {
  if (songs.length === 0) return;

  const previous = currentIndex <= 0
    ? songs.length - 1
    : currentIndex - 1;

  playSong(previous);
});


// =====================================
// NEXT SONG
// =====================================

function playNext() {
  if (songs.length === 0) return;

  let next;

  if (shuffleOn && songs.length > 1) {
    do {
      next = Math.floor(Math.random() * songs.length);
    } while (next === currentIndex);
  } else {
    next = currentIndex + 1;
  }

  if (next >= songs.length) {
    if (repeatMode === 1) {
      next = 0;
    } else {
      playBtn.textContent = "▶";
      return;
    }
  }

  playSong(next);
}

nextBtn.addEventListener("click", playNext);


// =====================================
// PROGRESS BAR
// =====================================

progressTrack.addEventListener("click", event => {
  if (!audio.duration) return;

  const rect = progressTrack.getBoundingClientRect();
  const percentage = (event.clientX - rect.left) / rect.width;

  audio.currentTime = percentage * audio.duration;
});

audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = progress + "%";
  }
});


// =====================================
// SONG ENDED
// =====================================

audio.addEventListener("ended", () => {
  if (repeatMode === 2) {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  playNext();
});


// =====================================
// EQUALIZER MENU
// =====================================

equalizerBtn.addEventListener("click", () => {
  equalizerMenu.classList.toggle("show");
  optionsMenu.classList.remove("show");
});

optionsBtn.addEventListener("click", () => {
  optionsMenu.classList.toggle("show");
  equalizerMenu.classList.remove("show");
});

document.querySelectorAll("[data-eq]").forEach(button => {
  button.addEventListener("click", () => {
    setEqualizer(button.dataset.eq);
  });
});


// =====================================
// REPEAT
// =====================================

repeatBtn.addEventListener("click", () => {
  repeatMode = (repeatMode + 1) % 3;

  const labels = [
    "Repeat: Off",
    "Repeat: All",
    "Repeat: One"
  ];

  repeatBtn.textContent = labels[repeatMode];
  repeatBtn.classList.toggle("selected", repeatMode !== 0);
});


// =====================================
// SHUFFLE
// =====================================

shuffleBtn.addEventListener("click", () => {
  shuffleOn = !shuffleOn;

  shuffleBtn.textContent =
    "Shuffle: " + (shuffleOn ? "On" : "Off");

  shuffleBtn.classList.toggle("selected", shuffleOn);
});



// =====================================
// INITIAL SETUP
// =====================================

songList.style.display = "none";
// =====================================
// VRTX AI CHAT
// =====================================

const aiChatBox = document.getElementById("aiChatBox");
const aiInput = document.getElementById("aiInput");
const aiSendBtn = document.getElementById("aiSendBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
let aiPreviewAudio = null;
let libraryWasPlaying = false;

function addChatMessage(message, sender) {
  const chatMessage = document.createElement("div");

  chatMessage.className =
    sender === "user" ? "user-message" : "ai-message";

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.textContent = message;

  chatMessage.appendChild(bubble);
  aiChatBox.appendChild(chatMessage);

  // Save chat history
  const chatHistory = JSON.parse(
    localStorage.getItem("vrtxChatHistory") || "[]"
  );

  chatHistory.push({ message, sender });

  localStorage.setItem(
    "vrtxChatHistory",
    JSON.stringify(chatHistory)
  );

  aiChatBox.scrollTop = aiChatBox.scrollHeight;
}

// Load previous chat history
function loadChatHistory() {
  const chatHistory = JSON.parse(
    localStorage.getItem("vrtxChatHistory") || "[]"
  );

  chatHistory.forEach((chat) => {
    const chatMessage = document.createElement("div");

    chatMessage.className =
      chat.sender === "user" ? "user-message" : "ai-message";

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = chat.message;

    chatMessage.appendChild(bubble);
    aiChatBox.appendChild(chatMessage);
  });

  aiChatBox.scrollTop = aiChatBox.scrollHeight;
}

loadChatHistory();

function showTypingIndicator() {
  const typing = document.createElement("div");

  typing.className = "ai-message";
  typing.id = "typingIndicator";

  typing.innerHTML = `
    <div class="chat-bubble">
      VRTX AI is typing...
    </div>
  `;

  aiChatBox.appendChild(typing);
  aiChatBox.scrollTop = aiChatBox.scrollHeight;
}
// =====================================
// VRTX AI SONG SEARCH
// =====================================

async function searchVrtxSongs(query) {

  // Search in app library
  const localMatches = songs.filter(song =>
    song.name.toLowerCase().includes(query.toLowerCase())
  );

if (localMatches.length > 0) {

  addChatMessage(
    "🎵 Found in your VRTX library:\n" +
    localMatches.map(song => "• " + song.name).join("\n"),
    "ai"
  );

  const bubble = aiChatBox.lastElementChild.querySelector(".chat-bubble");

  localMatches.forEach(song => {

    const playButton = document.createElement("button");

    playButton.textContent = "▶ PLAY " + song.name;

    playButton.addEventListener("click", () => {
      const index = songs.indexOf(song);

      if (index !== -1) {
        playSong(index);
      }
    });

    bubble.appendChild(document.createElement("br"));
    bubble.appendChild(playButton);

  });

  return;
}

  // Search internet music catalogue
  try {
    const response = await fetch(
      "https://itunes.apple.com/search?term=" +
      encodeURIComponent(query) +
      "&entity=song&limit=5"
    );

    const data = await response.json();

    if (data.results.length === 0) {
      addChatMessage("Sorry! No matching songs found.", "ai");
      return;
    }

    const results = data.results;

addChatMessage(
  "🌐 Internet song results:",
  "ai"
);

const bubble = aiChatBox.lastElementChild.querySelector(".chat-bubble");

results.forEach((song, index) => {

  const songInfo = document.createElement("p");

  songInfo.textContent =
    `${index + 1}. ${song.trackName} - ${song.artistName}`;

  const previewButton = document.createElement("button");

  previewButton.textContent = "▶ PREVIEW";

  previewButton.addEventListener("click", () => {

    if (!song.previewUrl) {
      addChatMessage("Preview not available for this song.", "ai");
      return;
    }

    const shouldResumeLibrary =
  libraryWasPlaying || (!audio.paused && !audio.ended);

if (aiPreviewAudio) {
  aiPreviewAudio.pause();
  aiPreviewAudio.currentTime = 0;
}

libraryWasPlaying = shouldResumeLibrary;

if (!audio.paused && !audio.ended) {
  audio.pause();
}

    aiPreviewAudio = new Audio(song.previewUrl);

    aiPreviewAudio.play().catch(() => {
      addChatMessage("Unable to play preview.", "ai");
    });

    previewButton.textContent = "▶ PLAYING";

    aiPreviewAudio.onended = () => {
  previewButton.textContent = "▶ PREVIEW";

  if (libraryWasPlaying) {
    audio.play().catch(() => {});
    libraryWasPlaying = false;
  }
};

  });
    bubble.appendChild(songInfo);
  bubble.appendChild(previewButton);

});
      } catch (error) {
    addChatMessage(
      "Internet search failed. Please check your connection.",
      "ai"
    );
  }
}

// =====================================
// VRTX AI SEND MESSAGE
// =====================================

aiSendBtn.addEventListener("click", async () => {
  const message = aiInput.value.trim();

  if (!message) return;

  addChatMessage(message, "user");

  aiInput.value = "";

  showTypingIndicator();

  try {
    await searchVrtxSongs(message);
  } catch (error) {
    console.error("VRTX AI Error:", error);

    addChatMessage(
      "Something went wrong. Please try again!",
      "ai"
    );
  }

  const typing = document.getElementById("typingIndicator");

  if (typing) {
    typing.remove();
  }
});

// =====================================
// ENTER KEY SEND
// =====================================

aiInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    aiSendBtn.click();
  }
});
// CLEAR VRTX AI CHAT

clearChatBtn.addEventListener("click", () => {
  const confirmClear = confirm(
    "Are you sure you want to clear all chat messages?"
  );

  if (!confirmClear) return;

  localStorage.removeItem("vrtxChatHistory");

  aiChatBox.innerHTML = `
    <p>Hi! I'm VRTX AI 🎵</p>
    <p>How can I help you?</p>
  `;
});
// =====================================
// LOAD SAVED SONGS
// =====================================

async function loadSavedSongs() {
  try {
    const savedSongs = await getSavedSongsFromDB();

    songs = savedSongs.map(song => ({
      id: song.id,
      name: song.name,
      url: URL.createObjectURL(song.file)
    }));

    showSongs();

  } catch (error) {
    console.error("Failed to load saved songs:", error);
  }
}
loadSavedSongs();
      
