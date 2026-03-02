/**
 * YouTube Clone - Main Application Script
 * Complete functionality for all buttons and video playback
 */

document.addEventListener('DOMContentLoaded', () => {
  // ============ DOM ELEMENTS ============
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  const categoryBar = document.getElementById('categoryBar');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const voiceBtn = document.getElementById('voiceBtn');
  const notifBtn = document.getElementById('notifBtn');
  const notifBadge = document.getElementById('notifBadge');
  const notifPanel = document.getElementById('notifPanel');
  const profileBtn = document.getElementById('profileBtn');
  const profilePanel = document.getElementById('profilePanel');
  const videoGrid = document.getElementById('videoGrid');
  const noResults = document.getElementById('noResults');
  const playerModal = document.getElementById('playerModal');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const playerFrame = document.getElementById('playerFrame');
  const themeToggle = document.getElementById('themeToggle');
  const bottomNav = document.getElementById('bottomNav');

  // ============ APP STATE ============
  const API_BASE = 'http://localhost:5000/api';
  let renderedCount = 0;
  const PAGE_SIZE = 8;
  let activeCategory = 'All';
  let currentViewMode = 'home'; // home, history, watch-later, playlists, you
  let currentTitle = 'Home'; // For header display
  let allVideos = [];
  let isLoading = false;

  // Local Storage Keys
  const LS_HISTORY = 'youtube_watch_history';
  const LS_WATCH_LATER = 'youtube_watch_later';
  const LS_THEME = 'youtube_theme';
  const LS_SUBSCRIPTIONS = 'youtube_subscriptions';

  // ============ UTILITIES ============
  const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // LocalStorage Manager
  const Storage = {
    getHistory: () => JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'),
    addToHistory: (video) => {
      const history = Storage.getHistory();
      const existing = history.findIndex(v => v.id === video.id);
      if (existing > -1) history.splice(existing, 1);
      history.unshift(video);
      localStorage.setItem(LS_HISTORY, JSON.stringify(history.slice(0, 50)));
    },
    getWatchLater: () => JSON.parse(localStorage.getItem(LS_WATCH_LATER) || '[]'),
    addToWatchLater: (video) => {
      const wl = Storage.getWatchLater();
      if (!wl.find(v => v.id === video.id)) {
        wl.unshift(video);
        localStorage.setItem(LS_WATCH_LATER, JSON.stringify(wl.slice(0, 100)));
      }
    },
    removeFromWatchLater: (videoId) => {
      const wl = Storage.getWatchLater();
      const filtered = wl.filter(v => v.id !== videoId);
      localStorage.setItem(LS_WATCH_LATER, JSON.stringify(filtered));
    },
    getSubscriptions: () => JSON.parse(localStorage.getItem(LS_SUBSCRIPTIONS) || '[]'),
    addSubscription: (channel) => {
      const subs = Storage.getSubscriptions();
      if (!subs.find(c => c.id === channel.id)) {
        subs.push(channel);
        localStorage.setItem(LS_SUBSCRIPTIONS, JSON.stringify(subs));
      }
    },
    setTheme: (theme) => localStorage.setItem(LS_THEME, theme),
    getTheme: () => localStorage.getItem(LS_THEME) || 'dark'
  };

  // ============ UI STATE MANAGEMENT ============
  function updateHeaderTitle(title) {
    currentTitle = title;
    const titleEl = document.querySelector('main h1, main .section-title');
    if (titleEl) titleEl.textContent = title;
  }

  function setActiveNavItem(name) {
    document.querySelectorAll('.sidebar .nav-section li').forEach(li => {
      li.classList.remove('active');
      if (li.textContent.toLowerCase().includes(name.toLowerCase())) {
        li.classList.add('active');
      }
    });
  }

  // ============ NOTIFICATION SYSTEM ============
  function showNotification(msg, duration = 2500) {
    const notif = document.createElement('div');
    notif.textContent = msg;
    notif.style.cssText = 'position:fixed; bottom:20px; right:20px; background:var(--accent-red); color:white; padding:12px 20px; border-radius:8px; z-index:9999; animation:fadeInUp .3s ease;animation-duration:0.3s;animation-fill-mode:forwards;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.4);max-width:300px;word-wrap:break-word';
    document.body.appendChild(notif);
    setTimeout(() => {
      notif.style.animation = 'fadeOutDown .3s ease forwards';
      setTimeout(() => notif.remove(), 300);
    }, duration);
  }

  // ============ RENDER HELPERS ============
  function createCard(v, index) {
    const article = document.createElement('article');
    article.className = 'card';
    article.style.animationDelay = (index * 40) + 'ms';

    const html = `
      <div class="thumb-wrap">
        ${v.live ? '<div class="live-pill">LIVE</div>' : ''}
        <img class="thumb" src="${v.thumbnail}" alt="${escapeHtml(v.title)}" data-id="${v.id}" style="cursor:pointer;width:100%;height:100%;object-fit:cover;display:block">
        <div class="duration">${v.duration}</div>
        <div class="progress"><div class="bar" style="width:${Math.round(v.progress * 100)}%"></div></div>
      </div>
      <div class="meta">
        <div class="info">
          <p class="title" style="line-height:1.4;margin:8px 0">${escapeHtml(v.title)}</p>
          <div class="channel">${escapeHtml(v.channel)} ${v.verified ? '<span class="material-icons verified" title="Verified" style="font-size:14px;vertical-align:middle">check_circle</span>' : ''}</div>
          <div class="views">${v.views} • ${v.time}</div>
        </div>
        <div class="more ripple" title="More options" style="cursor:pointer;user-select:none">⋮</div>
      </div>
    `;

    article.innerHTML = html;

    // Click thumb to play
    article.querySelector('.thumb').addEventListener('click', () => {
      console.log('Opening video:', v.title, 'YouTube ID:', v.youtubeId);
      openModal(v);
    });

    // More menu
    article.querySelector('.more').addEventListener('click', (e) => {
      e.stopPropagation();
      showCardMenu(v, e);
    });

    return article;
  }

  function showCardMenu(video, event) {
    // Remove existing menus
    document.querySelectorAll('.card-menu').forEach(m => m.remove());

    const menu = document.createElement('div');
    menu.className = 'card-menu';
    menu.style.cssText = 'position:fixed; background:var(--bg-secondary); border-radius:8px; padding:8px 0; min-width:200px; z-index:999; box-shadow:0 8px 20px rgba(0,0,0,0.6); border:1px solid var(--bg-hover)';
    
    const menuItems = [
      { 
        label: '⏱️ Add to Watch Later', 
        action: () => { 
          Storage.addToWatchLater(video); 
          closeCardMenu(); 
          showNotification('✅ Added to Watch Later'); 
        } 
      },
      { 
        label: '📑 Add to Playlist', 
        action: () => { 
          closeCardMenu(); 
          showNotification('📑 Create Playlist - Coming Soon'); 
        } 
      },
      { 
        label: '❤️ Add to Favorites', 
        action: () => { 
          closeCardMenu(); 
          showNotification('❤️ Added to Favorites'); 
        } 
      },
      { 
        label: '🔗 Share', 
        action: () => { 
          closeCardMenu();
          const url = `${window.location.origin}?video=${video.id}`;
          navigator.clipboard.writeText(url).then(() => {
            showNotification('🔗 Link copied to clipboard');
          }).catch(() => {
            showNotification('🔗 Share - Coming Soon');
          });
        } 
      },
      {
        label: '🔔 Subscribe', 
        action: () => {
          closeCardMenu();
          Storage.addSubscription({ id: video.channelId, name: video.channel });
          showNotification(`🔔 Subscribed to ${video.channel}`);
        }
      }
    ];

    menuItems.forEach(item => {
      const div = document.createElement('div');
      div.style.cssText = 'padding:12px 16px; cursor:pointer; color:var(--text-primary); border-bottom:1px solid rgba(255,255,255,0.05); transition:background .15s ease; font-size:14px';
      div.textContent = item.label;
      div.onmouseover = () => div.style.background = 'var(--bg-hover)';
      div.onmouseout = () => div.style.background = 'transparent';
      div.onclick = item.action;
      menu.appendChild(div);
    });

    function closeCardMenu() { 
      if (menu.parentNode) menu.remove(); 
    }
    
    document.body.appendChild(menu);
    
    // Position menu at mouse cursor
    let left = event.clientX;
    let top = event.clientY;
    
    // Adjust if menu goes off-screen
    setTimeout(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        left = window.innerWidth - rect.width - 10;
      }
      if (rect.bottom > window.innerHeight) {
        top = window.innerHeight - rect.height - 10;
      }
      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
    }, 0);
    
    // Close on outside click
    const closeHandler = (e) => {
      if (!menu.contains(e.target)) closeCardMenu();
    };
    document.addEventListener('click', closeHandler, { once: true });
  }

  function toggleNoResults(state) {
    noResults.classList.toggle('hidden', !state);
  }

  // ============ FETCH & RENDER ============
  async function fetchVideosFromAPI() {
    if (isLoading) return;
    isLoading = true;

    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE,
        offset: renderedCount,
        ...(activeCategory !== 'All' && { category: activeCategory }),
        ...(searchInput.value && { search: searchInput.value })
      });

      const url = `${API_BASE}/videos?${params}`;
      console.log('Fetching from:', url);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const responseData = await response.json();
      const videos = responseData.data || [];
      
      if (renderedCount === 0) allVideos = videos;

      if (videos.length === 0 && renderedCount === 0) {
        toggleNoResults(true);
        isLoading = false;
        return;
      }

      videos.forEach((v, i) => {
        const card = createCard(v, renderedCount + i);
        videoGrid.appendChild(card);
      });

      renderedCount += videos.length;
      toggleNoResults(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      if (renderedCount === 0) {
        const msg = document.createElement('div');
        msg.style.cssText = 'color:#aaa;padding:40px;text-align:center;grid-column:1/-1;font-size:14px';
        msg.textContent = '❌ Failed to load videos. Make sure backend is running on http://localhost:5000';
        videoGrid.appendChild(msg);
        toggleNoResults(true);
      }
    } finally {
      isLoading = false;
    }
  }

  function renderVideoList(videos, title = '') {
    if (title) {
      const titleEl = document.createElement('h2');
      titleEl.style.cssText = 'color:var(--text-primary); padding:20px; margin:0; font-size:24px; font-weight:500; grid-column:1/-1';
      titleEl.textContent = title;
      videoGrid.appendChild(titleEl);
    }

    if (videos.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.cssText = 'color:var(--text-secondary);padding:40px;text-align:center;grid-column:1/-1;grid-row:2';
      emptyMsg.textContent = title.includes('History') ? '📺 No videos watched yet' : title.includes('Watch Later') ? '⏱️ No videos saved yet' : '📚 No playlists yet';
      videoGrid.appendChild(emptyMsg);
      toggleNoResults(false);
      return;
    }

    videos.slice(0, PAGE_SIZE).forEach((v, i) => {
      const card = createCard(v, i);
      videoGrid.appendChild(card);
    });
    toggleNoResults(false);
  }

  function rerenderAll() {
    videoGrid.innerHTML = '';
    renderedCount = 0;
    activeCategory = 'All';
    categoryBar.querySelectorAll('.cat-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.cat === 'All') btn.classList.add('active');
    });
    renderNext();
  }

  function renderNext() {
    if (currentViewMode === 'home') {
      fetchVideosFromAPI();
    } else if (currentViewMode === 'history') {
      renderVideoList(Storage.getHistory(), '📺 Watch History');
    } else if (currentViewMode === 'watch-later') {
      renderVideoList(Storage.getWatchLater(), '⏱️ Watch Later');
    } else if (currentViewMode === 'subscriptions') {
      const subs = Storage.getSubscriptions();
      const subsMsg = document.createElement('div');
      subsMsg.style.cssText = 'color:var(--text-secondary);padding:40px;text-align:center;grid-column:1/-1';
      if (subs.length === 0) {
        subsMsg.textContent = '🔔 No subscriptions yet. Subscribe to channels from videos!';
      } else {
        subsMsg.textContent = `🔔 Subscribed to ${subs.length} channel${subs.length > 1 ? 's' : ''}`;
      }
      videoGrid.appendChild(subsMsg);
      toggleNoResults(false);
    } else if (currentViewMode === 'playlists') {
      const playlistMsg = document.createElement('div');
      playlistMsg.style.cssText = 'color:var(--text-secondary);padding:40px;text-align:center;grid-column:1/-1';
      playlistMsg.textContent = '📑 Create playlists from the "Add to Playlist" option on videos';
      videoGrid.appendChild(playlistMsg);
      toggleNoResults(false);
    } else if (currentViewMode === 'you') {
      const youMsg = document.createElement('div');
      youMsg.style.cssText = 'color:var(--text-secondary);padding:40px;text-align:center;grid-column:1/-1;font-size:16px';
      youMsg.innerHTML = `
        <div style="margin-bottom:20px;font-size:32px">👤</div>
        <div style="margin:10px 0"><strong>Your Channel</strong></div>
        <div style="margin:10px 0;font-size:14px;color:var(--text-secondary)">Build your own channel and upload videos</div>
        <button style="margin-top:20px;padding:8px 16px;background:var(--accent-red);color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500">Create Channel</button>
      `;
      videoGrid.appendChild(youMsg);
      toggleNoResults(false);
    }
  }

  // Initial load with skeletons
  function initialLoad() {
    videoGrid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('div');
      s.className = 'skeleton';
      s.style.minHeight = '180px';
      videoGrid.appendChild(s);
    }
    setTimeout(() => {
      videoGrid.innerHTML = '';
      renderNext();
    }, 700);
  }

  // ============ MODAL PLAYER ============
  function openModal(video) {
    if (!video || !video.youtubeId) {
      showNotification('❌ Unable to load video');
      return;
    }

    modalTitle.textContent = video.title;
    
    // Create YouTube embed URL with autoplay
    const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&controls=1`;
    playerFrame.src = embedUrl;
    
    playerModal.classList.remove('hidden');
    Storage.addToHistory(video);
    
    console.log('Video playing:', video.title);
  }

  function closeModal() {
    playerModal.classList.add('hidden');
    if (playerFrame) playerFrame.src = '';
  }

  // ============ EVENT LISTENERS ============

  // Modal controls
  modalClose.addEventListener('click', closeModal);
  playerModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !playerModal.classList.contains('hidden')) closeModal();
  });

  // Ripple effect for buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.ripple');
    if (!btn) return;
    const ink = document.createElement('span');
    ink.className = 'ripple-ink';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ink.style.width = ink.style.height = size + 'px';
    ink.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ink.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ink);
    setTimeout(() => ink.remove(), 600);
  });

  // Sidebar toggle
  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // Sidebar navigation - HOME, SHORTS, SUBSCRIPTIONS, YOU, HISTORY, PLAYLISTS, WATCH LATER
  const navSections = sidebar.querySelectorAll('nav.nav-section');
  const homeShortsSubs = navSections[0].querySelectorAll('li');
  const youItems = navSections[1] ? navSections[1].querySelectorAll('li') : [];
  
  const allNavItems = [...homeShortsSubs, ...youItems];
  
  allNavItems.forEach((li) => {
    li.addEventListener('click', () => {
      const text = li.textContent.toLowerCase().trim();
      
      if (text.includes('history')) {
        currentViewMode = 'history';
        updateHeaderTitle('📺 Watch History');
        setActiveNavItem('history');
        rerenderAll();
      } else if (text.includes('watch later')) {
        currentViewMode = 'watch-later';
        updateHeaderTitle('⏱️ Watch Later');
        setActiveNavItem('watch later');
        rerenderAll();
      } else if (text.includes('playlists')) {
        currentViewMode = 'playlists';
        updateHeaderTitle('📑 Playlists');
        setActiveNavItem('playlists');
        rerenderAll();
      } else if (text.includes('you')) {
        currentViewMode = 'you';
        updateHeaderTitle('👤 You');
        setActiveNavItem('you');
        rerenderAll();
      } else if (text.includes('shorts')) {
        showNotification('🎞️ Shorts - Coming Soon');
      } else if (text.includes('subscriptions') && !text.includes('subscriptions (')) {
        currentViewMode = 'subscriptions';
        updateHeaderTitle('🔔 Subscriptions');
        setActiveNavItem('subscriptions');
        rerenderAll();
      } else if (text.includes('home')) {
        currentViewMode = 'home';
        updateHeaderTitle('Home');
        activeCategory = 'All';
        categoryBar.querySelectorAll('.cat-btn').forEach(btn => {
          btn.classList.remove('active');
          if (btn.dataset.cat === 'All') btn.classList.add('active');
        });
        setActiveNavItem('home');
        rerenderAll();
      }
      
      // Close sidebar on mobile
      if (window.innerWidth < 640) {
        sidebar.classList.add('collapsed');
      }
    });
  });

  // Category selection
  categoryBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    categoryBar.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.cat || 'All';
    renderedCount = 0;
    videoGrid.innerHTML = '';
    renderNext();
  });

  // Search functionality
  function doSearch() {
    renderedCount = 0;
    videoGrid.innerHTML = '';
    activeCategory = 'All';
    categoryBar.querySelectorAll('.cat-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.cat === 'All') btn.classList.add('active');
    });
    renderNext();
  }
  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  // Voice search button
  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      showNotification('🎤 Voice Search - Coming Soon');
    });
  }

  // Notifications dropdown
  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const hidden = notifPanel.classList.contains('hidden');
    [notifPanel, profilePanel].forEach(p => p.classList.add('hidden'));
    if (hidden) {
      notifPanel.classList.remove('hidden');
      if (notifPanel.style.animation) {
        notifPanel.style.animation = 'dropdownShow .12s ease forwards';
      }
    }
  });

  // Profile dropdown
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const hidden = profilePanel.classList.contains('hidden');
    [notifPanel, profilePanel].forEach(p => p.classList.add('hidden'));
    if (hidden) {
      profilePanel.classList.remove('hidden');
      if (profilePanel.style.animation) {
        profilePanel.style.animation = 'dropdownShow .12s ease forwards';
      }
    }
  });

  // Profile menu actions
  const profileMenuHandler = (e) => {
    const item = e.target.closest('.dropdown-item');
    if (!item) return;
    const text = item.textContent;
    if (text.includes('Logout')) {
      if (confirm('👋 Are you sure you want to logout?')) {
        localStorage.clear();
        showNotification('👋 Logged out successfully');
        setTimeout(() => location.reload(), 500);
      }
    } else if (text.includes('Settings')) {
      showNotification('⚙️ Settings - Coming Soon');
    } else if (text.includes('Channel')) {
      currentViewMode = 'you';
      updateHeaderTitle('👤 Your Channel');
      profilePanel.classList.add('hidden');
      rerenderAll();
    }
  };
  profilePanel.addEventListener('click', profileMenuHandler);

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-wrap') && !e.target.closest('.avatar-wrap')) {
      [notifPanel, profilePanel].forEach(p => p.classList.add('hidden'));
    }
  });

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    Storage.setTheme(isLight ? 'light' : 'dark');
    const icon = themeToggle.querySelector('.material-icons');
    if (icon) icon.textContent = isLight ? 'light_mode' : 'dark_mode';
    showNotification(isLight ? '☀️ Light mode' : '🌙 Dark mode');
  });

  // Load saved theme
  const savedTheme = Storage.getTheme();
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    const icon = themeToggle.querySelector('.material-icons');
    if (icon) icon.textContent = 'light_mode';
  }

  // Infinite scroll
  window.addEventListener('scroll', () => {
    if (currentViewMode === 'home' && (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 800)) {
      fetchVideosFromAPI();
    }
  }, { passive: true });

  // Bottom nav (mobile) - HOME, EXPLORE, SHORTS, SUBSCRIPTIONS, LIBRARY
  if (bottomNav) {
    const bottomNavButtons = bottomNav.querySelectorAll('.bn-btn');
    bottomNavButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        bottomNavButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (index === 0) { 
          currentViewMode = 'home';
          updateHeaderTitle('Home');
          rerenderAll(); 
        }
        else if (index === 1) { 
          showNotification('🔍 Explore - Coming Soon'); 
        }
        else if (index === 2) { 
          showNotification('🎞️ Shorts - Coming Soon'); 
        }
        else if (index === 3) { 
          currentViewMode = 'subscriptions';
          updateHeaderTitle('🔔 Subscriptions');
          rerenderAll();
        }
        else if (index === 4) { 
          showNotification('📚 Library - Coming Soon'); 
        }
      });
    });
  }

  // ============ DEBUGGING ============
  window.DEBUG = {
    state: () => ({ currentViewMode, renderedCount, activeCategory, allVideos: allVideos.length }),
    fetchVideos: () => fetchVideosFromAPI(),
    history: () => Storage.getHistory(),
    watchLater: () => Storage.getWatchLater(),
    subscriptions: () => Storage.getSubscriptions()
  };
  console.log('🎬 YouTube Clone Script Loaded. Debug info available in window.DEBUG');

  // ============ INITIALIZATION ============
  initialLoad();
});

