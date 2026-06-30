const SUPABASE_URL = "https://xonietulfhwsowoptaid.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_exd-0pOYim4Nm_0SouXykA_pSDisouE";

const year = document.querySelector("#year");
const publicShell = document.querySelectorAll("[data-public-shell]");
const appShell = document.querySelector("#appShell");
const loginForm = document.querySelector("#loginForm");
const signupButton = document.querySelector("#signupButton");
const logoutButton = document.querySelector("#logoutButton");
const loginMessage = document.querySelector("#loginMessage");
const appUserEmail = document.querySelector("#appUserEmail");
const profileForm = document.querySelector("#profileForm");
const profileMessage = document.querySelector("#profileMessage");
const releaseForm = document.querySelector("#releaseForm");
const releaseArtistSelect = document.querySelector("#releaseArtistSelect");
const appSearch = document.querySelector("#appSearch");
const artistSearch = document.querySelector("#artistSearch");
const artistGenreFilter = document.querySelector("#artistGenreFilter");
const newArtistButton = document.querySelector("#newArtistButton");
const artistCatalogView = document.querySelector("#artistCatalogView");
const songCatalogSearch = document.querySelector("#songCatalogSearch");
const songStatusFilter = document.querySelector("#songStatusFilter");
const songStatusGrid = document.querySelector("#songStatusGrid");
const catalogSongList = document.querySelector("#catalogSongList");
const songCountLabel = document.querySelector("#songCountLabel");
const catalogSubtitle = document.querySelector("#catalogSubtitle");
const newSongButton = document.querySelector("#newSongButton");
const batchSongButton = document.querySelector("#batchSongButton");
const catalogBackButton = document.querySelector("#catalogBackButton");
const closeSongFormButton = document.querySelector("#closeSongFormButton");
const cancelSongFormButton = document.querySelector("#cancelSongFormButton");
const songArtistSelect = document.querySelector("#songArtistSelect");
const instrumentalToggle = document.querySelector("#instrumentalToggle");
const lyricsField = document.querySelector("#lyricsField");
const songFormTitle = document.querySelector("#songFormTitle");
const songFormEyebrow = document.querySelector("#songFormEyebrow");
const closeArtistFormButton = document.querySelector("#closeArtistFormButton");
const cancelArtistFormButton = document.querySelector("#cancelArtistFormButton");
const deleteArtistButton = document.querySelector("#deleteArtistButton");
const artistFormTitle = document.querySelector("#artistFormTitle");
const artistFormEyebrow = document.querySelector("#artistFormEyebrow");
const artistPhotoInput = document.querySelector("#artistPhotoInput");
const artistPhotoPreview = document.querySelector("#artistPhotoPreview");

const songStatuses = [
  { value: "rascunho", label: "Rascunho" },
  { value: "pronta", label: "Pronta" },
  { value: "em_analise", label: "Em análise" },
  { value: "agendada", label: "Agendada" },
  { value: "publicada", label: "Publicada" }
];

const appState = {
  session: null,
  selectedView: "dashboard",
  selectedArtistId: null,
  selectedSongId: null,
  calendarDate: new Date(),
  artists: [],
  releases: [],
  profile: {
    name: "",
    email: "",
    phone: "",
    country: "Brasil",
    currency: "BRL"
  },
  artistSearch: "",
  artistGenre: "",
  artistMode: "list",
  songCatalogSearch: "",
  songStatus: "",
  editingSongId: null,
  editingArtistId: null
};

if (year) {
  year.textContent = new Date().getFullYear();
}

function setMessage(element, text, type = "info") {
  if (!element) return;
  element.textContent = text;
  element.dataset.type = type;
}

if (!window.supabase) {
  setMessage(loginMessage, "Não foi possível carregar o Supabase. Recarregue a página em alguns segundos.", "error");
  throw new Error("Supabase client library was not loaded.");
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(value || 0);
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function getUserId() {
  return appState.session?.user?.id;
}

function getArtist(artistId) {
  return appState.artists.find((artist) => artist.id === artistId);
}

function getAllSongs() {
  return appState.artists.flatMap((artist) =>
    artist.songs.map((song) => ({
      ...song,
      artistId: artist.id,
      artistName: artist.name
    }))
  );
}

function getSongTotal(song) {
  return song.streams.reduce((total, item) => total + item.streams, 0);
}

function getInitials(name) {
  return String(name || "FM")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getSongStatusLabel(status) {
  return songStatuses.find((item) => item.value === status)?.label || "Rascunho";
}

function getFilteredCatalogSongs(artist) {
  const searchTerm = appState.songCatalogSearch.toLowerCase();
  return artist.songs.filter((song) => {
    const matchesSearch = !searchTerm ||
      song.title.toLowerCase().includes(searchTerm) ||
      song.distributor.toLowerCase().includes(searchTerm) ||
      song.isrc.toLowerCase().includes(searchTerm) ||
      song.upc.toLowerCase().includes(searchTerm);
    const matchesStatus = !appState.songStatus || song.status === appState.songStatus;
    return matchesSearch && matchesStatus;
  });
}

function getFileName(formData, key) {
  const file = formData.get(key);
  return file && typeof file.name === "string" ? file.name : "";
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function uploadArtistPhoto(file) {
  if (!file || !file.size) return "";
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "artist-photo";
  const path = `${getUserId()}/${crypto.randomUUID()}-${safeName}.${extension}`;

  const { error } = await supabaseClient.storage
    .from("artist-photos")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) throw error;

  const { data } = supabaseClient.storage.from("artist-photos").getPublicUrl(path);
  return data.publicUrl || "";
}

function getSong(songId) {
  return getAllSongs().find((song) => song.id === songId);
}

function setSelectValue(select, value) {
  if (!select) return;
  select.value = value || "";
}

function closeSongForm() {
  const songForm = document.querySelector("#songForm");
  if (songForm) songForm.hidden = true;
  appState.editingSongId = null;
}

function openSongForm(song = null) {
  const songForm = document.querySelector("#songForm");
  if (!songForm) return;

  appState.editingSongId = song?.id || null;
  songForm.reset();

  if (songFormTitle) songFormTitle.textContent = song ? "Editar música" : "Cadastrar música";
  if (songFormEyebrow) songFormEyebrow.textContent = song ? "Editar lançamento" : "Novo lançamento";

  const selectedArtist = getArtist(song?.artistId || appState.selectedArtistId);
  if (songArtistSelect) {
    songArtistSelect.innerHTML = appState.artists
      .map((artist) => `<option value="${artist.id}" ${artist.id === selectedArtist?.id ? "selected" : ""}>${artist.name}</option>`)
      .join("");
  }

  if (song) {
    songForm.elements.title.value = song.title || "";
    songForm.elements.isrc.value = song.isrc || "";
    songForm.elements.upc.value = song.upc || "";
    setSelectValue(songForm.elements.artistId, song.artistId);
    setSelectValue(songForm.elements.type, song.type || "Single");
    setSelectValue(songForm.elements.distributor, song.distributor || "");
    songForm.elements.releaseDate.value = song.releaseDate || "";
    setSelectValue(songForm.elements.aiPlatform, song.aiPlatform || "Não se aplica");
    songForm.elements.isInstrumental.checked = Boolean(song.isInstrumental);
    songForm.elements.lyrics.value = song.lyrics || "";
  }

  syncLyricsVisibility();
  songForm.hidden = false;
  requestAnimationFrame(() => {
    songForm.querySelector("input[name='title']")?.focus();
  });
}

function closeArtistForm() {
  const artistForm = document.querySelector("#artistForm");
  if (artistForm) artistForm.hidden = true;
  appState.editingArtistId = null;
}

function setArtistPhotoPreview(imageUrl, fallbackName = "FM") {
  if (!artistPhotoPreview) return;
  artistPhotoPreview.innerHTML = "";
  artistPhotoPreview.classList.toggle("has-image", Boolean(imageUrl));

  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = "Prévia da foto do artista";
    artistPhotoPreview.appendChild(image);
  } else {
    artistPhotoPreview.textContent = getInitials(fallbackName);
  }
}

function openArtistForm(artist = null) {
  const artistForm = document.querySelector("#artistForm");
  if (!artistForm) return;

  appState.editingArtistId = artist?.id || null;
  artistForm.reset();

  if (artistFormTitle) artistFormTitle.textContent = artist ? "Editar artista" : "Novo artista";
  if (artistFormEyebrow) artistFormEyebrow.textContent = artist ? "Perfil do artista" : "Artista";
  if (deleteArtistButton) deleteArtistButton.hidden = !artist;

  if (artist) {
    artistForm.elements.photoUrl.value = artist.photoUrl || "";
    setArtistPhotoPreview(artist.photoUrl, artist.name);
    artistForm.elements.displayName.value = artist.name || "";
    artistForm.elements.displayGenre.value = artist.genre || "";
    artistForm.elements.instagram.value = artist.socials.instagram || "";
    artistForm.elements.spotifyProfile.value = artist.socials.spotify || "";
    artistForm.elements.instagramFollowers.value = artist.instagramFollowers || 0;
    artistForm.elements.spotifyFollowers.value = artist.spotifyFollowers || 0;
    artistForm.elements.bio.value = artist.bio || "";
  } else {
    setArtistPhotoPreview("", "FM");
    artistForm.elements.photoUrl.value = "";
  }

  artistForm.hidden = false;
  requestAnimationFrame(() => {
    artistForm.querySelector("input[name='displayName']")?.focus();
  });
}

function syncLyricsVisibility() {
  if (!lyricsField || !instrumentalToggle) return;
  lyricsField.hidden = instrumentalToggle.checked;
}

function setLoading(isLoading) {
  const buttons = [loginForm?.querySelector("button[type='submit']"), signupButton, logoutButton];
  buttons.forEach((button) => {
    if (button) button.disabled = isLoading;
  });
}

function getCredentials() {
  const formData = new FormData(loginForm);
  return {
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || "")
  };
}

async function loadAppData() {
  const userId = getUserId();
  if (!userId) return;

  const [
    profileResult,
    artistsResult,
    songsResult,
    streamsResult,
    releasesResult
  ] = await Promise.all([
    supabaseClient.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabaseClient.from("artists").select("*").order("created_at", { ascending: true }),
    supabaseClient.from("songs").select("*").order("created_at", { ascending: true }),
    supabaseClient.from("song_streams").select("*").order("month", { ascending: true }),
    supabaseClient.from("releases").select("*").order("release_date", { ascending: true })
  ]);

  const firstError = [
    profileResult.error,
    artistsResult.error,
    songsResult.error,
    streamsResult.error,
    releasesResult.error
  ].find(Boolean);

  if (firstError) {
    setMessage(loginMessage, firstError.message, "error");
    return;
  }

  if (!profileResult.data) {
    await supabaseClient.from("profiles").upsert({
      id: userId,
      name: appState.session.user.email?.split("@")[0] || "Flex Music Admin",
      country: "Brasil",
      currency: "BRL"
    });
  }

  const profile = profileResult.data || {};
  const songsByArtist = new Map();
  const streamsBySong = new Map();

  streamsResult.data.forEach((stream) => {
    const list = streamsBySong.get(stream.song_id) || [];
    list.push({
      id: stream.id,
      month: stream.month,
      streams: Number(stream.streams || 0)
    });
    streamsBySong.set(stream.song_id, list);
  });

  songsResult.data.forEach((song) => {
    const list = songsByArtist.get(song.artist_id) || [];
    list.push({
      id: song.id,
      title: song.title,
      distributor: song.distributor || "",
      releaseDate: song.release_date,
      status: song.status || "rascunho",
      isrc: song.isrc || "",
      upc: song.upc || "",
      coverUrl: song.cover_url || "",
      type: song.song_type || "Single",
      aiPlatform: song.ai_platform || "Não se aplica",
      lyrics: song.lyrics || "",
      isInstrumental: Boolean(song.is_instrumental),
      coverFileName: song.cover_file_name || "",
      audioFileName: song.audio_file_name || "",
      streams: streamsBySong.get(song.id) || []
    });
    songsByArtist.set(song.artist_id, list);
  });

  appState.profile = {
    name: profile.name || "",
    email: appState.session.user.email || "",
    phone: profile.phone || "",
    country: profile.country || "Brasil",
    currency: profile.currency || "BRL"
  };

  appState.artists = artistsResult.data.map((artist) => ({
    id: artist.id,
    name: artist.name,
    genre: artist.genre || "",
    avatar: artist.avatar || getInitials(artist.name),
    bio: artist.bio || "",
    instagramFollowers: Number(artist.instagram_followers || 0),
    spotifyFollowers: Number(artist.spotify_followers || 0),
    photoUrl: artist.photo_url || "",
    socials: {
      instagram: artist.instagram || "",
      spotify: artist.spotify_profile || "",
      tiktok: artist.tiktok || "",
      youtube: artist.youtube || ""
    },
    songs: songsByArtist.get(artist.id) || []
  }));

  appState.releases = releasesResult.data.map((release) => ({
    id: release.id,
    date: release.release_date,
    title: release.title,
    artistId: release.artist_id,
    distributor: release.distributor || "",
    status: release.status
  }));

  if (!appState.selectedArtistId && appState.artists[0]) {
    appState.selectedArtistId = appState.artists[0].id;
  }

  const selectedArtist = getArtist(appState.selectedArtistId);
  if (selectedArtist && !selectedArtist.songs.some((song) => song.id === appState.selectedSongId)) {
    appState.selectedSongId = selectedArtist.songs[0]?.id || null;
  }
}

async function renderSession(session) {
  const userEmail = session?.user?.email || "";
  const isLoggedIn = Boolean(userEmail);

  appState.session = session;
  appState.profile.email = userEmail || appState.profile.email;

  publicShell.forEach((element) => {
    element.hidden = isLoggedIn;
  });

  if (appShell) appShell.hidden = !isLoggedIn;
  if (appUserEmail) appUserEmail.textContent = userEmail || "Sessão conectada";

  if (isLoggedIn) {
    setMessage(loginMessage, "");
    await loadAppData();
    renderApp();
  }
}

async function signIn(email, password) {
  setLoading(true);
  setMessage(loginMessage, "Conectando ao Supabase...");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setMessage(loginMessage, error.message, "error");
  }

  setLoading(false);
}

async function signUp(email, password) {
  setLoading(true);
  setMessage(loginMessage, "Criando conta...");

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.href
    }
  });

  if (error) {
    setMessage(loginMessage, error.message, "error");
  } else if (data.session) {
    setMessage(loginMessage, "Conta criada e sessão iniciada.", "success");
  } else {
    setMessage(loginMessage, "Conta criada. Confira seu e-mail para confirmar o acesso.", "success");
  }

  setLoading(false);
}

function renderApp() {
  renderNavigation();
  renderDashboard();
  renderArtists();
  renderCalendar();
  renderProfile();
}

function renderNavigation() {
  document.querySelectorAll(".app-nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === appState.selectedView);
  });

  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === appState.selectedView);
  });
}

function focusArtistForm() {
  appState.artistMode = "list";
  renderArtists();
  openArtistForm();
}

function renderDashboard() {
  const songs = getAllSongs();
  const totalStreams = songs.reduce((total, song) => total + getSongTotal(song), 0);

  document.querySelector("#metricArtists").textContent = formatNumber(appState.artists.length);
  document.querySelector("#metricSongs").textContent = formatNumber(songs.length);
  document.querySelector("#metricReleases").textContent = formatNumber(appState.releases.length);
  document.querySelector("#metricStreams").textContent = formatNumber(totalStreams);

  const topSongs = document.querySelector("#topSongs");
  topSongs.innerHTML = songs.length
    ? songs
        .sort((a, b) => getSongTotal(b) - getSongTotal(a))
        .slice(0, 5)
        .map((song) => `
          <button class="song-row" type="button" data-view-song="${song.artistId}:${song.id}">
            <span>
              <strong>${song.title}</strong>
              <small>${song.artistName}</small>
            </span>
            <b>${formatNumber(getSongTotal(song))}</b>
          </button>
        `)
        .join("")
    : "<p class='empty-state'>Cadastre artistas e músicas para ver o ranking.</p>";

  document.querySelector("#dashboardReleases").innerHTML = appState.releases.length
    ? renderReleaseItems(appState.releases.slice(0, 4))
    : "<p class='empty-state'>Nenhum lançamento agendado ainda.</p>";
}

function renderArtists() {
  const artistList = document.querySelector("#artistList");
  const artistCountLabel = document.querySelector("#artistCountLabel");
  const artistHeading = document.querySelector("#artistsView > .artists-heading");
  const artistFilterBar = document.querySelector("#artistsView > .artist-filter-bar");
  const artistForm = document.querySelector("#artistForm");
  const selectedArtist = getArtist(appState.selectedArtistId);

  if (appState.artistMode === "catalog" && selectedArtist) {
    if (artistHeading) artistHeading.hidden = true;
    if (artistFilterBar) artistFilterBar.hidden = true;
    if (artistList) artistList.hidden = true;
    if (artistForm) artistForm.hidden = true;
    if (artistCatalogView) artistCatalogView.hidden = false;
    renderArtistCatalog(selectedArtist);
    return;
  }

  appState.artistMode = "list";
  if (artistHeading) artistHeading.hidden = false;
  if (artistFilterBar) artistFilterBar.hidden = false;
  if (artistList) artistList.hidden = false;
  if (artistCatalogView) artistCatalogView.hidden = true;

  const genres = [...new Set(appState.artists.map((artist) => artist.genre).filter(Boolean))].sort();
  const searchTerm = appState.artistSearch.toLowerCase();
  const filteredArtists = appState.artists.filter((artist) => {
    const matchesSearch = !searchTerm ||
      artist.name.toLowerCase().includes(searchTerm) ||
      artist.genre.toLowerCase().includes(searchTerm);
    const matchesGenre = !appState.artistGenre || artist.genre === appState.artistGenre;
    return matchesSearch && matchesGenre;
  });

  if (artistGenreFilter) {
    artistGenreFilter.innerHTML = [
      "<option value=''>Todos os gêneros</option>",
      ...genres.map((genre) => `<option value="${genre}" ${genre === appState.artistGenre ? "selected" : ""}>${genre}</option>`)
    ].join("");
  }

  artistCountLabel.textContent = `${filteredArtists.length} artistas`;

  artistList.innerHTML = filteredArtists.length
    ? filteredArtists
        .map((artist) => `
          <article class="artist-summary-card">
            <div class="artist-card-head">
              ${artist.photoUrl
                ? `<img class="artist-photo" src="${artist.photoUrl}" alt="${artist.name}">`
                : `<span class="artist-photo avatar">${artist.avatar}</span>`}
              <div>
                <h3>${artist.name}</h3>
                <p>${artist.genre || "Gênero não informado"}</p>
              </div>
            </div>
            <p class="artist-bio">${artist.bio || "Sem biografia cadastrada."}</p>
            <div class="artist-stats">
              <span><strong>${formatNumber(artist.songs.filter((song) => song.status === "publicada").length)}/${formatNumber(artist.songs.length)}</strong><small>Lanç.</small></span>
              <span><strong>${formatNumber(artist.songs.reduce((total, song) => total + getSongTotal(song), 0))}</strong><small>Streams</small></span>
              <span><strong>${formatNumber(artist.instagramFollowers)}</strong><small>Instagram</small></span>
              <span><strong>${formatNumber(artist.spotifyFollowers)}</strong><small>Spotify</small></span>
            </div>
            <div class="artist-card-footer">
              <small>IG: ${artist.socials.instagram || "sem @ cadastrado"}</small>
              <div class="artist-card-actions">
                <button class="catalog-link" type="button" data-edit-artist="${artist.id}">Editar</button>
                <button class="catalog-link" type="button" data-open-catalog="${artist.id}">Ver catálogo →</button>
              </div>
            </div>
          </article>
        `)
        .join("")
    : "<div class='empty-panel'><h3>Nenhum artista encontrado</h3><p>Crie um novo artista ou ajuste a busca/filtro.</p></div>";
}

function renderArtistCatalog(artist) {
  const filteredSongs = getFilteredCatalogSongs(artist);
  const counts = songStatuses.reduce((total, status) => {
    total[status.value] = artist.songs.filter((song) => song.status === status.value).length;
    return total;
  }, {});

  if (catalogSubtitle) {
    catalogSubtitle.textContent = `${artist.name} • ${artist.genre || "Artista virtual"} • ${formatNumber(artist.songs.length)} faixas`;
  }

  if (songArtistSelect) {
    songArtistSelect.innerHTML = appState.artists
      .map((item) => `<option value="${item.id}" ${item.id === artist.id ? "selected" : ""}>${item.name}</option>`)
      .join("");
  }

  if (songCatalogSearch && songCatalogSearch.value !== appState.songCatalogSearch) {
    songCatalogSearch.value = appState.songCatalogSearch;
  }

  if (songStatusFilter && songStatusFilter.value !== appState.songStatus) {
    songStatusFilter.value = appState.songStatus;
  }

  if (songStatusGrid) {
    songStatusGrid.innerHTML = songStatuses
      .map((status) => `
        <button class="song-status-card ${appState.songStatus === status.value ? "active" : ""}" type="button" data-song-status="${status.value}">
          <span>${status.label}</span>
          <strong>${formatNumber(counts[status.value] || 0)}</strong>
        </button>
      `)
      .join("");
  }

  if (songCountLabel) {
    songCountLabel.textContent = `${formatNumber(filteredSongs.length)} faixas`;
  }

  if (!catalogSongList) return;

  catalogSongList.innerHTML = filteredSongs.length
    ? filteredSongs
        .slice()
        .sort((a, b) => String(b.releaseDate || "").localeCompare(String(a.releaseDate || "")))
        .map((song) => `
          <article class="song-table-row">
            <div class="song-release-cell">
              ${song.coverUrl
                ? `<img class="song-cover" src="${song.coverUrl}" alt="Capa de ${song.title}">`
                : `<span class="song-cover song-cover-placeholder">♪</span>`}
              <div>
                <h3>${song.title}</h3>
                <p>${artist.name} • ${song.type || "Single"}</p>
                <div class="song-identifiers">
                  <button class="song-edit-button" type="button" data-song-edit="${song.id}">Editar</button>
                  <span>ISRC ${song.isrc || "a definir"}</span>
                  <span>UPC ${song.upc || "a definir"}</span>
                </div>
              </div>
            </div>
            <span class="status-pill status-${song.status}">${getSongStatusLabel(song.status)}</span>
            <span class="song-date">${song.releaseDate ? formatDate(song.releaseDate) : "A definir"}</span>
            <span class="distributor-pill">${song.distributor || "Sem distribuidora"}</span>
            <button class="streams-link" type="button" data-song-id="${song.id}">
              ${formatNumber(getSongTotal(song))} streams
            </button>
          </article>
        `)
        .join("")
    : "<div class='empty-panel'><h3>Nenhuma música encontrada</h3><p>Adicione uma nova música ou ajuste a busca/filtro.</p></div>";
}

function renderSongInsights(song) {
  const streams = song.streams.length ? song.streams : [];
  const maxStreams = Math.max(...streams.map((item) => item.streams), 1);

  return `
    <div class="panel-header">
      <h3>${song.title}</h3>
      <span>${formatNumber(getSongTotal(song))} streams</span>
    </div>
    <div class="stream-chart">
      ${streams.length ? streams.map((item) => {
        const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(new Date(`${item.month}T12:00:00`));
        return `
          <div class="bar-row">
            <span>${monthLabel}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${(item.streams / maxStreams) * 100}%"></div>
            </div>
            <strong>${formatNumber(item.streams)}</strong>
          </div>
        `;
      }).join("") : "<p class='empty-state'>Sem streams registrados para esta música.</p>"}
    </div>
  `;
}

function renderCalendar() {
  const calendarGrid = document.querySelector("#calendarGrid");
  const calendarTitle = document.querySelector("#calendarTitle");
  const month = appState.calendarDate.getMonth();
  const yearValue = appState.calendarDate.getFullYear();
  const firstDay = new Date(yearValue, month, 1);
  const daysInMonth = new Date(yearValue, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(firstDay);

  calendarTitle.textContent = monthName;

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const blanks = Array.from({ length: startOffset }, () => "<span class='calendar-empty'></span>");
  const days = Array.from({ length: daysInMonth }, (_item, index) => {
    const day = index + 1;
    const date = `${yearValue}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const releases = appState.releases.filter((release) => release.date === date);
    return `
      <button class="calendar-day" type="button" data-calendar-date="${date}">
        <strong>${day}</strong>
        ${releases.map((release) => `<span>${release.title}</span>`).join("")}
      </button>
    `;
  });

  calendarGrid.innerHTML = [
    ...dayNames.map((day) => `<b class="calendar-weekday">${day}</b>`),
    ...blanks,
    ...days
  ].join("");

  releaseArtistSelect.innerHTML = appState.artists.length
    ? appState.artists.map((artist) => `<option value="${artist.id}">${artist.name}</option>`).join("")
    : "<option value=''>Cadastre um artista primeiro</option>";
  releaseArtistSelect.disabled = !appState.artists.length;

  document.querySelector("#releaseQueue").innerHTML = appState.releases.length
    ? renderReleaseItems(appState.releases)
    : "<p class='empty-state'>Nenhum lançamento na fila.</p>";
}

function renderReleaseItems(releases) {
  return releases
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((release) => {
      const artist = getArtist(release.artistId);
      return `
        <article class="release-item">
          <strong>${release.title}</strong>
          <span>${formatDate(release.date)} • ${artist?.name || "Artista removido"} • ${release.distributor || "Sem distribuidora"}</span>
        </article>
      `;
    })
    .join("");
}

function renderProfile() {
  if (!profileForm) return;
  profileForm.elements.name.value = appState.profile.name;
  profileForm.elements.email.value = appState.profile.email;
  profileForm.elements.phone.value = appState.profile.phone;
  profileForm.elements.country.value = appState.profile.country;
  profileForm.elements.currency.value = appState.profile.currency;
}

async function createInitialStreamRows(songId) {
  const userId = getUserId();
  const today = new Date();
  const rows = Array.from({ length: 6 }, (_item, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    return {
      owner_id: userId,
      song_id: songId,
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`,
      streams: 0
    };
  });

  await supabaseClient.from("song_streams").insert(rows);
}

document.addEventListener("click", (event) => {
  const navButton = event.target.closest("[data-view]");
  const artistButton = event.target.closest("[data-artist-id]");
  const catalogButton = event.target.closest("[data-open-catalog]");
  const songButton = event.target.closest("[data-song-id]");
  const statusButton = event.target.closest("[data-song-status]");
  const editSongButton = event.target.closest("[data-song-edit]");
  const editArtistButton = event.target.closest("[data-edit-artist]");
  const dashboardSong = event.target.closest("[data-view-song]");
  const calendarDay = event.target.closest("[data-calendar-date]");

  if (navButton) {
    appState.selectedView = navButton.dataset.view;
    if (navButton.dataset.view === "artists" && !navButton.classList.contains("app-create-button")) {
      appState.artistMode = "list";
    }
    renderApp();
    if (navButton.classList.contains("app-create-button")) {
      focusArtistForm();
    }
  }

  if (artistButton) {
    appState.selectedArtistId = artistButton.dataset.artistId;
    appState.selectedSongId = getArtist(appState.selectedArtistId).songs[0]?.id || null;
    renderArtists();
  }

  if (catalogButton) {
    appState.selectedArtistId = catalogButton.dataset.openCatalog;
    appState.selectedSongId = getArtist(appState.selectedArtistId).songs[0]?.id || null;
    appState.artistMode = "catalog";
    appState.songCatalogSearch = "";
    appState.songStatus = "";
    renderArtists();
  }

  if (songButton) {
    appState.selectedSongId = songButton.dataset.songId;
    renderArtists();
  }

  if (statusButton) {
    appState.songStatus = appState.songStatus === statusButton.dataset.songStatus ? "" : statusButton.dataset.songStatus;
    renderArtists();
  }

  if (editSongButton) {
    const song = getSong(editSongButton.dataset.songEdit);
    if (song) {
      appState.selectedSongId = song.id;
      appState.selectedArtistId = song.artistId;
      openSongForm(song);
    }
  }

  if (editArtistButton) {
    const artist = getArtist(editArtistButton.dataset.editArtist);
    if (artist) {
      appState.selectedArtistId = artist.id;
      openArtistForm(artist);
    }
  }

  if (dashboardSong) {
    const [artistId, songId] = dashboardSong.dataset.viewSong.split(":");
    appState.selectedView = "artists";
    appState.selectedArtistId = artistId;
    appState.selectedSongId = songId;
    appState.artistMode = "catalog";
    renderApp();
  }

  if (calendarDay && releaseForm) {
    releaseForm.date.value = calendarDay.dataset.calendarDate;
    releaseForm.title.focus();
  }
});

if (newArtistButton) {
  newArtistButton.addEventListener("click", focusArtistForm);
}

if (artistSearch) {
  artistSearch.addEventListener("input", () => {
    appState.artistSearch = artistSearch.value.trim();
    renderArtists();
  });
}

if (artistGenreFilter) {
  artistGenreFilter.addEventListener("change", () => {
    appState.artistGenre = artistGenreFilter.value;
    renderArtists();
  });
}

if (catalogBackButton) {
  catalogBackButton.addEventListener("click", () => {
    appState.artistMode = "list";
    appState.songCatalogSearch = "";
    appState.songStatus = "";
    renderArtists();
  });
}

if (newSongButton) {
  newSongButton.addEventListener("click", () => {
    openSongForm();
  });
}

if (closeSongFormButton) {
  closeSongFormButton.addEventListener("click", closeSongForm);
}

if (cancelSongFormButton) {
  cancelSongFormButton.addEventListener("click", closeSongForm);
}

if (closeArtistFormButton) {
  closeArtistFormButton.addEventListener("click", closeArtistForm);
}

if (cancelArtistFormButton) {
  cancelArtistFormButton.addEventListener("click", closeArtistForm);
}

if (artistPhotoInput) {
  artistPhotoInput.addEventListener("change", async () => {
    const file = artistPhotoInput.files?.[0];
    const artistForm = document.querySelector("#artistForm");
    if (!file || !artistForm) return;

    try {
      const imageData = await readImageFile(file);
      artistForm.elements.photoUrl.value = imageData;
      setArtistPhotoPreview(imageData, artistForm.elements.displayName.value || "FM");
    } catch (_error) {
      setMessage(profileMessage, "Não foi possível carregar a imagem selecionada.", "error");
    }
  });
}

if (instrumentalToggle) {
  instrumentalToggle.addEventListener("change", syncLyricsVisibility);
}

if (deleteArtistButton) {
  deleteArtistButton.addEventListener("click", async () => {
    const artist = getArtist(appState.editingArtistId);
    if (!artist) return;
    const confirmed = window.confirm(`Excluir ${artist.name}? As músicas e streams desse artista também serão removidos.`);
    if (!confirmed) return;

    const { error } = await supabaseClient.from("artists").delete().eq("id", artist.id);
    if (error) {
      setMessage(profileMessage, error.message, "error");
      return;
    }

    closeArtistForm();
    appState.selectedArtistId = null;
    appState.selectedSongId = null;
    await loadAppData();
    renderApp();
  });
}

if (batchSongButton) {
  batchSongButton.addEventListener("click", () => {
    setMessage(profileMessage, "Importação em lote será a próxima função desta área.", "success");
  });
}

if (songCatalogSearch) {
  songCatalogSearch.addEventListener("input", () => {
    appState.songCatalogSearch = songCatalogSearch.value.trim();
    renderArtists();
  });
}

if (songStatusFilter) {
  songStatusFilter.addEventListener("change", () => {
    appState.songStatus = songStatusFilter.value;
    renderArtists();
  });
}

if (appSearch) {
  appSearch.addEventListener("input", () => {
    const term = appSearch.value.trim().toLowerCase();
    if (!term) return;

    const artist = appState.artists.find((item) =>
      item.name.toLowerCase().includes(term) ||
      item.genre.toLowerCase().includes(term)
    );

    const song = getAllSongs().find((item) =>
      item.title.toLowerCase().includes(term) ||
      item.artistName.toLowerCase().includes(term)
    );

    if (artist || song) {
      appState.selectedView = "artists";
      appState.selectedArtistId = song?.artistId || artist.id;
      appState.selectedSongId = song?.id || getArtist(appState.selectedArtistId).songs[0]?.id || null;
      appState.artistMode = song ? "catalog" : "list";
      renderApp();
    }
  });
}

document.querySelector("#prevMonth")?.addEventListener("click", () => {
  appState.calendarDate.setMonth(appState.calendarDate.getMonth() - 1);
  renderCalendar();
});

document.querySelector("#nextMonth")?.addEventListener("click", () => {
  appState.calendarDate.setMonth(appState.calendarDate.getMonth() + 1);
  renderCalendar();
});

document.addEventListener("submit", async (event) => {
  if (event.target.id === "artistForm") {
    event.preventDefault();
    const formData = new FormData(event.target);
    const artistName = String(formData.get("displayName") || "").trim();
    const editingArtist = getArtist(appState.editingArtistId);
    const photoFile = formData.get("photoFile");
    let uploadedPhotoUrl = "";

    try {
      uploadedPhotoUrl = await uploadArtistPhoto(photoFile);
    } catch (error) {
      setMessage(profileMessage, error.message || "Não foi possível enviar a foto do artista.", "error");
      return;
    }

    const payload = {
      owner_id: getUserId(),
      name: artistName,
      genre: String(formData.get("displayGenre") || ""),
      avatar: getInitials(artistName),
      bio: String(formData.get("bio") || ""),
      instagram: String(formData.get("instagram") || ""),
      spotify_profile: String(formData.get("spotifyProfile") || ""),
      instagram_followers: Number(formData.get("instagramFollowers") || 0),
      spotify_followers: Number(formData.get("spotifyFollowers") || 0),
      photo_url: uploadedPhotoUrl || editingArtist?.photoUrl || ""
    };

    const query = appState.editingArtistId
      ? supabaseClient.from("artists").update(payload).eq("id", appState.editingArtistId).select().single()
      : supabaseClient.from("artists").insert(payload).select().single();

    const { data, error } = await query;

    if (error) {
      setMessage(profileMessage, error.message, "error");
      return;
    }

    appState.selectedArtistId = data.id;
    appState.selectedSongId = null;
    event.target.reset();
    event.target.hidden = true;
    appState.editingArtistId = null;
    await loadAppData();
    renderApp();
  }

  if (event.target.id === "songForm") {
    event.preventDefault();
    const formData = new FormData(event.target);
    const artistId = String(formData.get("artistId") || appState.selectedArtistId || "");
    const isInstrumental = formData.get("isInstrumental") === "on";
    const editingSong = getSong(appState.editingSongId);
    const coverFileName = getFileName(formData, "coverFile") || editingSong?.coverFileName || "";
    const audioFileName = getFileName(formData, "audioFile") || editingSong?.audioFileName || "";
    const payload = {
      owner_id: getUserId(),
      artist_id: artistId,
      title: String(formData.get("title")),
      release_date: String(formData.get("releaseDate")),
      distributor: String(formData.get("distributor")),
      status: editingSong?.status || "rascunho",
      isrc: String(formData.get("isrc") || ""),
      upc: String(formData.get("upc") || ""),
      cover_url: editingSong?.coverUrl || "",
      song_type: String(formData.get("type") || "Single"),
      ai_platform: String(formData.get("aiPlatform") || "Não se aplica"),
      lyrics: isInstrumental ? "" : String(formData.get("lyrics") || ""),
      is_instrumental: isInstrumental,
      cover_file_name: coverFileName,
      audio_file_name: audioFileName
    };

    const query = appState.editingSongId
      ? supabaseClient.from("songs").update(payload).eq("id", appState.editingSongId).select().single()
      : supabaseClient.from("songs").insert(payload).select().single();

    const { data, error } = await query;

    if (error) {
      setMessage(profileMessage, error.message, "error");
      return;
    }

    if (!appState.editingSongId) {
      await createInitialStreamRows(data.id);
    }
    appState.selectedSongId = data.id;
    appState.selectedArtistId = data.artist_id;
    appState.artistMode = "catalog";
    event.target.reset();
    event.target.hidden = true;
    appState.editingSongId = null;
    await loadAppData();
    renderApp();
  }
});

if (releaseForm) {
  releaseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(releaseForm);
    const artistId = String(formData.get("artistId") || "");
    if (!artistId) {
      setMessage(profileMessage, "Cadastre um artista antes de agendar lançamentos.", "error");
      return;
    }

    const { error } = await supabaseClient.from("releases").insert({
      owner_id: getUserId(),
      release_date: String(formData.get("date")),
      title: String(formData.get("title")),
      artist_id: artistId,
      distributor: String(formData.get("distributor"))
    });

    if (error) {
      setMessage(profileMessage, error.message, "error");
      return;
    }

    releaseForm.reset();
    await loadAppData();
    renderApp();
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(profileForm);
    const newPassword = String(formData.get("newPassword") || "");

    const profilePayload = {
      id: getUserId(),
      name: String(formData.get("name") || ""),
      phone: String(formData.get("phone") || ""),
      country: String(formData.get("country") || ""),
      currency: String(formData.get("currency") || "BRL")
    };

    const { error } = await supabaseClient.from("profiles").upsert(profilePayload);
    if (error) {
      setMessage(profileMessage, error.message, "error");
      return;
    }

    const email = String(formData.get("email") || "");
    if (email && email !== appState.session.user.email) {
      const { error: emailError } = await supabaseClient.auth.updateUser({ email });
      if (emailError) {
        setMessage(profileMessage, emailError.message, "error");
        return;
      }
    }

    if (newPassword) {
      const { error: passwordError } = await supabaseClient.auth.updateUser({ password: newPassword });
      if (passwordError) {
        setMessage(profileMessage, passwordError.message, "error");
        return;
      }
    }

    profileForm.elements.newPassword.value = "";
    await loadAppData();
    renderProfile();
    setMessage(profileMessage, "Perfil salvo com sucesso.", "success");
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const { email, password } = getCredentials();
    await signIn(email, password);
  });
}

if (signupButton) {
  signupButton.addEventListener("click", async () => {
    const { email, password } = getCredentials();
    await signUp(email, password);
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    setLoading(true);
    await supabaseClient.auth.signOut();
    setLoading(false);
  });
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
  renderSession(session);
});

supabaseClient.auth.getSession().then(({ data }) => {
  renderSession(data.session);
});
