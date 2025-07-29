// 全局配置
const CONFIG = {
    WEATHER_API_KEY: '6b71ae739f6663a800c85efde216d771',
    DEFAULT_CITY: '芜湖',
    DEFAULT_ADCODE: '340200', // 芜湖的行政区划代码
    HITOKOTO_API: 'https://v1.hitokoto.cn/',
    WEATHER_API: 'https://restapi.amap.com/v3/weather/weatherInfo',
    MUSIC_API: 'https://api.sayqz.com/tunefree/ncmapi'
};

// 当前城市信息
let currentCity = {
    name: CONFIG.DEFAULT_CITY,
    adcode: CONFIG.DEFAULT_ADCODE
};

// 音乐播放器状态
let musicPlayer = {
    audio: null,
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playlist: [],
    currentIndex: 0,
    userInteracted: false, // 用户是否已交互
    lyrics: [], // 歌词数组
    currentLyricIndex: -1 // 当前歌词索引
};

// DOM 元素
const elements = {
    // 一言相关
    hitokotoText: document.getElementById('hitokoto-text'),
    hitokotoAuthor: document.getElementById('hitokoto-author'),
    refreshHitokoto: document.getElementById('refresh-hitokoto'),
    
    // 时间相关
    currentDate: document.getElementById('current-date'),
    currentTime: document.getElementById('current-time'),
    
    // 天气相关
    weatherCity: document.getElementById('weather-city'),
    weatherTemp: document.getElementById('weather-temp'),
    weatherDesc: document.getElementById('weather-desc'),
    weatherHumidity: document.getElementById('weather-humidity'),
    changeCity: document.getElementById('change-city'),
    cityModal: document.getElementById('city-modal'),
    
    // 进度条相关
    todayProgress: document.getElementById('today-progress'),
    todayText: document.getElementById('today-text'),
    weekProgress: document.getElementById('week-progress'),
    weekText: document.getElementById('week-text'),
    monthProgress: document.getElementById('month-progress'),
    monthText: document.getElementById('month-text'),
    yearProgress: document.getElementById('year-progress'),
    yearText: document.getElementById('year-text'),
    
    // 音乐播放器相关
    playBtn: document.getElementById('play-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    musicCover: document.getElementById('music-cover'),
    musicTitle: document.getElementById('music-title'),
    musicArtist: document.getElementById('music-artist'),
    musicProgress: document.getElementById('music-progress'),
    currentTimeDisplay: document.getElementById('music-current-time'),
    totalTimeDisplay: document.getElementById('total-time'),
    musicSearch: document.getElementById('music-search'),
    searchBtn: document.getElementById('search-btn'),
    
    // 音乐搜索模态框
    musicModal: document.getElementById('music-modal'),
    musicSearchModal: document.getElementById('music-search-modal'),
    searchMusicBtn: document.getElementById('search-music-btn'),
    searchResults: document.getElementById('search-results'),
    
    // 播放列表模态框
    playlistModal: document.getElementById('playlist-modal'),
    playlistCount: document.getElementById('playlist-count'),
    playlistTracks: document.getElementById('playlist-tracks'),
    playlistBtn: document.getElementById('playlist-btn'),
    
    // 歌词相关
    lyricsContent: document.getElementById('lyrics-content'),
    lyricsScrollContainer: document.getElementById('lyrics-scroll-container')
};

// 背景切换功能
const backgroundList = [
    'images/backgrounds/background1.png',
    'images/backgrounds/background2.png',
    'images/backgrounds/background3.png',
    'images/backgrounds/background4.png',
    'images/backgrounds/background5.png',
    'images/backgrounds/background6.png'
];
let currentBgIndex = 0;

function setBackground(index) {
    const bgDiv = document.querySelector('.background');
    if (!bgDiv) return;
    // 平滑过渡
    bgDiv.style.transition = 'background-image 0.5s cubic-bezier(0.4,0,0.2,1)';
    bgDiv.style.backgroundImage = `url('${backgroundList[index]}')`;
}

function showBgBtnsIfCollected() {
    const grid = document.getElementById('content-grid');
    const nextBtn = document.getElementById('next-bg-btn');
    const prevBtn = document.getElementById('prev-bg-btn');
    if (grid.classList.contains('collected')) {
        nextBtn.style.display = 'flex';
        prevBtn.style.display = 'flex';
    } else {
        nextBtn.style.display = 'none';
        prevBtn.style.display = 'none';
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    // 初始化背景
    setBackground(currentBgIndex);
    // 按钮事件
    document.getElementById('next-bg-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        currentBgIndex = (currentBgIndex + 1) % backgroundList.length;
        setBackground(currentBgIndex);
    });
    document.getElementById('prev-bg-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        currentBgIndex = (currentBgIndex - 1 + backgroundList.length) % backgroundList.length;
        setBackground(currentBgIndex);
    });
    // 收集/展开时切换按钮显示
    const grid = document.getElementById('content-grid');
    const observer = new MutationObserver(showBgBtnsIfCollected);
    observer.observe(grid, { attributes: true, attributeFilter: ['class'] });
    showBgBtnsIfCollected();
});

// 应用初始化
function initializeApp() {
    initializeTheme();
    loadHitokoto();
    startClock();
    loadWeather();
    updateProgressBars();
    initializeMusicPlayer();
    
    // 事件监听器
    elements.refreshHitokoto.addEventListener('click', loadHitokoto);
    elements.changeCity.addEventListener('click', openCityModal);
    
    // 一言操作按钮
    document.getElementById('like-hitokoto').addEventListener('click', likeHitokoto);
    document.getElementById('share-hitokoto').addEventListener('click', shareHitokoto);
    document.getElementById('copy-hitokoto').addEventListener('click', copyHitokoto);
    
    // 时光进度展开按钮
    document.getElementById('expand-progress').addEventListener('click', openProgressModal);
    
    // 音乐播放器事件
    elements.playBtn.addEventListener('click', function() {
        musicPlayer.userInteracted = true;
        togglePlay();
    });
    elements.prevBtn.addEventListener('click', function() {
        musicPlayer.userInteracted = true;
        playPrevious();
    });
    elements.nextBtn.addEventListener('click', function() {
        musicPlayer.userInteracted = true;
        playNext();
    });
    elements.searchBtn.addEventListener('click', openMusicSearch);
    elements.playlistBtn.addEventListener('click', openPlaylist);
    

    
    // 监听用户交互，允许自动播放
    document.addEventListener('click', function() {
        musicPlayer.userInteracted = true;
    }, { once: true });
    
    // 模态框事件
    const cityModal = elements.cityModal;
    const musicModal = elements.musicModal;
    const playlistModal = elements.playlistModal;
    const progressModal = document.getElementById('progress-modal');
    const closeBtns = document.querySelectorAll('.close');
    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            cityModal.style.display = 'none';
            musicModal.style.display = 'none';
            playlistModal.style.display = 'none';
            if (progressModal) progressModal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === cityModal) {
            closeCityModal();
        }
        if (event.target === musicModal) {
            closeMusicModal();
        }
        if (event.target === playlistModal) {
            closePlaylistModal();
        }
        if (event.target === progressModal) {
            closeProgressModal();
        }
    });
    
    // 初始化城市选择器
    initializeCitySelector();
    
    // 音乐搜索事件
    elements.searchMusicBtn.addEventListener('click', searchMusic);
    elements.musicSearchModal.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMusic();
        }
    });
    
    // 定期更新
    setInterval(updateProgressBars, 60000); // 每分钟更新进度条
    setInterval(loadWeather, 300000); // 每5分钟更新天气
    setInterval(updateMusicProgress, 1000); // 每秒更新音乐进度
    
    // 初始化收集按钮
    initializeCollectButton();
}

// 一言功能
async function loadHitokoto() {
    try {
        elements.hitokotoText.textContent = '正在加载一言...';
        elements.hitokotoAuthor.textContent = '—— 佚名';
        
        const response = await fetch(CONFIG.HITOKOTO_API);
        const data = await response.json();
        
        if (data && data.hitokoto) {
            elements.hitokotoText.textContent = data.hitokoto;
            elements.hitokotoAuthor.textContent = `—— ${data.from || '佚名'}`;
            
            // 更新一言统计信息
            const views = Math.floor(Math.random() * 1000) + 100;
            const likes = Math.floor(Math.random() * 500) + 50;
            const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
            
            document.getElementById('hitokoto-views').textContent = views;
            document.getElementById('hitokoto-likes').textContent = likes;
            document.getElementById('hitokoto-date').textContent = today;
            
            // 更新一言标签
            const types = ['生活', '感悟', '励志', '爱情', '友情', '工作', '学习'];
            const categories = ['人生', '哲理', '情感', '成长', '梦想', '坚持', '希望'];
            
            document.getElementById('hitokoto-type').textContent = types[Math.floor(Math.random() * types.length)];
            document.getElementById('hitokoto-category').textContent = categories[Math.floor(Math.random() * categories.length)];
            
            // 更新心情表情
            const moods = ['😊', '😄', '🤔', '💪', '🌟', '💖', '🎯', '🌈', '✨', '🔥'];
            document.getElementById('hitokoto-mood').textContent = moods[Math.floor(Math.random() * moods.length)];
            
        } else {
            throw new Error('一言数据格式错误');
        }
    } catch (error) {
        console.error('加载一言失败:', error);
        elements.hitokotoText.textContent = '生活就像一盒巧克力，你永远不知道下一颗是什么味道。';
        elements.hitokotoAuthor.textContent = '—— 《阿甘正传》';
        
        // 设置默认统计信息
        document.getElementById('hitokoto-views').textContent = '666';
        document.getElementById('hitokoto-likes').textContent = '233';
        document.getElementById('hitokoto-date').textContent = '今日';
        document.getElementById('hitokoto-type').textContent = '生活';
        document.getElementById('hitokoto-category').textContent = '感悟';
        document.getElementById('hitokoto-mood').textContent = '😊';
    }
}

// 一言操作功能
function likeHitokoto() {
    const likeBtn = document.getElementById('like-hitokoto');
    const likeCount = document.getElementById('hitokoto-likes');
    const currentLikes = parseInt(likeCount.textContent);
    
    if (likeBtn.classList.contains('liked')) {
        likeBtn.classList.remove('liked');
        likeCount.textContent = currentLikes - 1;
        likeBtn.innerHTML = '<i class="fas fa-heart"></i><span>喜欢</span>';
        // 恢复默认样式
        likeBtn.style.background = '';
        likeBtn.style.color = '';
    } else {
        likeBtn.classList.add('liked');
        likeCount.textContent = currentLikes + 1;
        likeBtn.innerHTML = '<i class="fas fa-heart"></i><span>已喜欢</span>';
        likeBtn.style.background = 'rgba(255, 105, 180, 0.4)';
        likeBtn.style.color = '#ff69b4';
    }
}

function shareHitokoto() {
    const text = elements.hitokotoText.textContent;
    const author = elements.hitokotoAuthor.textContent;
    const shareText = `${text} ${author}`;
    
    if (navigator.share) {
        navigator.share({
            title: '一言分享',
            text: shareText,
            url: window.location.href
        });
    } else {
        // 复制到剪贴板
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('一言已复制到剪贴板！');
        });
    }
}

function copyHitokoto() {
    const text = elements.hitokotoText.textContent;
    const author = elements.hitokotoAuthor.textContent;
    const copyText = `${text} ${author}`;
    
    navigator.clipboard.writeText(copyText).then(() => {
        showToast('一言已复制到剪贴板！');
    });
}

function showToast(message) {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        animation: toastSlideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // 3秒后移除
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 添加toast动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes toastSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 时钟功能
function startClock() {
    function updateClock() {
        const now = new Date();
        
        // 更新日期
        const dateOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        elements.currentDate.textContent = now.toLocaleDateString('zh-CN', dateOptions);
        
        // 更新时间
        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false
        };
        elements.currentTime.textContent = now.toLocaleTimeString('zh-CN', timeOptions);
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

// 天气功能
async function loadWeather() {
    try {
        const url = `${CONFIG.WEATHER_API}?city=${currentCity.adcode}&key=${CONFIG.WEATHER_API_KEY}&extensions=base`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === '1' && data.lives && data.lives.length > 0) {
            const weather = data.lives[0];
            
            elements.weatherCity.textContent = weather.city;
            elements.weatherTemp.textContent = `${weather.temperature}°C`;
            elements.weatherDesc.textContent = weather.weather;
            elements.weatherHumidity.textContent = `湿度: ${weather.humidity}%`;
        } else {
            throw new Error('天气数据获取失败');
        }
    } catch (error) {
        console.error('加载天气失败:', error);
        elements.weatherTemp.textContent = '--°C';
        elements.weatherDesc.textContent = '获取失败';
        elements.weatherHumidity.textContent = '湿度: --%';
    }
}

// 时光进度条功能
function updateProgressBars() {
    const now = new Date();
    
    // 今日进度
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const todayProgress = ((now - todayStart) / (todayEnd - todayStart)) * 100;
    
    // 本周进度
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekProgress = ((now - weekStart) / (weekEnd - weekStart)) * 100;
    
    // 本月进度
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthProgress = ((now - monthStart) / (monthEnd - monthStart)) * 100;
    
    // 今年进度
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    const yearProgress = ((now - yearStart) / (yearEnd - yearStart)) * 100;
    
    // 更新进度条
    updateProgressBar(elements.todayProgress, elements.todayText, todayProgress);
    updateProgressBar(elements.weekProgress, elements.weekText, weekProgress);
    updateProgressBar(elements.monthProgress, elements.monthText, monthProgress);
    updateProgressBar(elements.yearProgress, elements.yearText, yearProgress);
    
    // 更新详情模态框的数据
    updateProgressDetails(todayProgress, weekProgress, monthProgress, yearProgress);
}

function updateProgressBar(progressElement, textElement, percentage) {
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
    progressElement.style.width = `${clampedPercentage}%`;
    textElement.textContent = `${clampedPercentage.toFixed(1)}%`;
}

// 时光进度详情功能
function updateProgressDetails(todayProgress, weekProgress, monthProgress, yearProgress) {
    const now = new Date();
    
    // 更新详情模态框的进度条
    updateProgressBar(
        document.getElementById('detail-today-progress'),
        document.getElementById('detail-today-text'),
        todayProgress
    );
    updateProgressBar(
        document.getElementById('detail-week-progress'),
        document.getElementById('detail-week-text'),
        weekProgress
    );
    updateProgressBar(
        document.getElementById('detail-month-progress'),
        document.getElementById('detail-month-text'),
        monthProgress
    );
    updateProgressBar(
        document.getElementById('detail-year-progress'),
        document.getElementById('detail-year-text'),
        yearProgress
    );
    
    // 计算并显示详细时间信息
    updateTimeDetails(now);
}

function updateTimeDetails(now) {
    // 今日时间详情
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const todayElapsed = now - todayStart;
    const todayRemaining = todayEnd - now;
    
    document.getElementById('today-elapsed').textContent = formatTimeDetail(todayElapsed);
    document.getElementById('today-remaining').textContent = formatTimeDetail(todayRemaining);
    
    // 本周时间详情
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekElapsed = now - weekStart;
    const weekRemaining = weekEnd - now;
    
    document.getElementById('week-elapsed').textContent = formatTimeDetail(weekElapsed, true);
    document.getElementById('week-remaining').textContent = formatTimeDetail(weekRemaining, true);
    
    // 本月时间详情
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthElapsed = now - monthStart;
    const monthRemaining = monthEnd - now;
    
    document.getElementById('month-elapsed').textContent = formatTimeDetail(monthElapsed, true);
    document.getElementById('month-remaining').textContent = formatTimeDetail(monthRemaining, true);
    
    // 今年时间详情
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    const yearElapsed = now - yearStart;
    const yearRemaining = yearEnd - now;
    
    document.getElementById('year-elapsed').textContent = formatTimeDetail(yearElapsed, true);
    document.getElementById('year-remaining').textContent = formatTimeDetail(yearRemaining, true);
}

function formatTimeDetail(milliseconds, showDays = false) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (showDays) {
        if (days > 0) {
            return `${days}天${hours % 24}小时`;
        } else {
            return `${hours}小时${minutes % 60}分钟`;
        }
    } else {
        return `${hours}小时${minutes % 60}分钟`;
    }
}

function openProgressModal() {
    const progressModal = document.getElementById('progress-modal');
    if (progressModal) {
        progressModal.style.display = 'block';
        // 立即更新一次详情数据
        updateProgressBars();
    }
}

function closeProgressModal() {
    const progressModal = document.getElementById('progress-modal');
    if (progressModal) {
        progressModal.style.display = 'none';
    }
}

// 城市选择功能
let cityData = {
    provinces: [],
    cities: {},
    districts: {},
    selectedProvince: null,
    selectedCity: null,
    selectedDistrict: null
};

// 拼音转换映射表
const pinyinMap = {
    '阿': 'a', '八': 'ba', '把': 'ba', '爸': 'ba', '白': 'bai', '百': 'bai', '北': 'bei', '本': 'ben', '比': 'bi', '边': 'bian',
    '变': 'bian', '便': 'bian', '表': 'biao', '别': 'bie', '病': 'bing', '不': 'bu', '部': 'bu', '才': 'cai', '菜': 'cai', '参': 'can',
    '草': 'cao', '层': 'ceng', '产': 'chan', '长': 'chang', '常': 'chang', '场': 'chang', '车': 'che', '成': 'cheng', '城': 'cheng', '吃': 'chi',
    '出': 'chu', '处': 'chu', '传': 'chuan', '春': 'chun', '从': 'cong', '村': 'cun', '大': 'da', '但': 'dan', '当': 'dang', '到': 'dao',
    '道': 'dao', '得': 'de', '的': 'de', '等': 'deng', '地': 'di', '第': 'di', '点': 'dian', '电': 'dian', '东': 'dong', '动': 'dong',
    '都': 'dou', '读': 'du', '对': 'dui', '多': 'duo', '儿': 'er', '二': 'er', '发': 'fa', '方': 'fang', '房': 'fang', '放': 'fang',
    '飞': 'fei', '分': 'fen', '风': 'feng', '服': 'fu', '父': 'fu', '高': 'gao', '告': 'gao', '哥': 'ge', '歌': 'ge', '给': 'gei',
    '工': 'gong', '公': 'gong', '共': 'gong', '狗': 'gou', '古': 'gu', '关': 'guan', '观': 'guan', '管': 'guan', '光': 'guang', '国': 'guo',
    '过': 'guo', '海': 'hai', '好': 'hao', '号': 'hao', '和': 'he', '河': 'he', '黑': 'hei', '很': 'hen', '红': 'hong', '后': 'hou',
    '花': 'hua', '话': 'hua', '回': 'hui', '会': 'hui', '火': 'huo', '机': 'ji', '几': 'ji', '家': 'jia', '见': 'jian', '建': 'jian',
    '江': 'jiang', '叫': 'jiao', '教': 'jiao', '进': 'jin', '近': 'jin', '经': 'jing', '九': 'jiu', '就': 'jiu', '开': 'kai', '看': 'kan',
    '科': 'ke', '可': 'ke', '口': 'kou', '来': 'lai', '老': 'lao', '乐': 'le', '里': 'li', '力': 'li', '两': 'liang', '亮': 'liang',
    '路': 'lu', '妈': 'ma', '马': 'ma', '吗': 'ma', '买': 'mai', '卖': 'mai', '满': 'man', '毛': 'mao', '没': 'mei', '门': 'men',
    '们': 'men', '面': 'mian', '名': 'ming', '明': 'ming', '母': 'mu', '那': 'na', '哪': 'na', '内': 'nei', '你': 'ni', '年': 'nian',
    '牛': 'niu', '农': 'nong', '女': 'nv', '怕': 'pa', '跑': 'pao', '朋': 'peng', '片': 'pian', '平': 'ping', '七': 'qi', '起': 'qi',
    '气': 'qi', '千': 'qian', '前': 'qian', '钱': 'qian', '强': 'qiang', '桥': 'qiao', '亲': 'qin', '轻': 'qing', '清': 'qing', '情': 'qing',
    '请': 'qing', '秋': 'qiu', '去': 'qu', '全': 'quan', '然': 'ran', '让': 'rang', '人': 'ren', '认': 'ren', '日': 'ri', '三': 'san',
    '山': 'shan', '上': 'shang', '少': 'shao', '社': 'she', '身': 'shen', '生': 'sheng', '师': 'shi', '十': 'shi', '时': 'shi', '识': 'shi',
    '实': 'shi', '世': 'shi', '事': 'shi', '是': 'shi', '手': 'shou', '书': 'shu', '树': 'shu', '水': 'shui', '说': 'shuo', '四': 'si',
    '送': 'song', '岁': 'sui', '他': 'ta', '她': 'ta', '太': 'tai', '天': 'tian', '听': 'ting', '同': 'tong', '头': 'tou', '外': 'wai',
    '完': 'wan', '万': 'wan', '王': 'wang', '为': 'wei', '位': 'wei', '文': 'wen', '问': 'wen', '我': 'wo', '五': 'wu', '午': 'wu',
    '西': 'xi', '息': 'xi', '习': 'xi', '下': 'xia', '先': 'xian', '现': 'xian', '向': 'xiang', '小': 'xiao', '校': 'xiao', '笑': 'xiao',
    '写': 'xie', '新': 'xin', '信': 'xin', '星': 'xing', '行': 'xing', '学': 'xue', '雪': 'xue', '言': 'yan', '眼': 'yan', '羊': 'yang',
    '样': 'yang', '要': 'yao', '也': 'ye', '一': 'yi', '衣': 'yi', '医': 'yi', '以': 'yi', '已': 'yi', '意': 'yi', '因': 'yin',
    '音': 'yin', '应': 'ying', '用': 'yong', '有': 'you', '又': 'you', '右': 'you', '鱼': 'yu', '雨': 'yu', '语': 'yu', '元': 'yuan',
    '远': 'yuan', '月': 'yue', '云': 'yun', '再': 'zai', '在': 'zai', '早': 'zao', '造': 'zao', '怎': 'zen', '站': 'zhan', '张': 'zhang',
    '找': 'zhao', '这': 'zhe', '真': 'zhen', '正': 'zheng', '知': 'zhi', '直': 'zhi', '只': 'zhi', '中': 'zhong', '种': 'zhong', '重': 'zhong',
    '主': 'zhu', '住': 'zhu', '字': 'zi', '自': 'zi', '走': 'zou', '最': 'zui', '作': 'zuo', '坐': 'zuo', '做': 'zuo',
    // 省份名称拼音
    '北京': 'beijing', '天津': 'tianjin', '河北': 'hebei', '山西': 'shanxi', '内蒙古': 'neimenggu', '辽宁': 'liaoning', '吉林': 'jilin', '黑龙江': 'heilongjiang',
    '上海': 'shanghai', '江苏': 'jiangsu', '浙江': 'zhejiang', '安徽': 'anhui', '福建': 'fujian', '江西': 'jiangxi', '山东': 'shandong',
    '河南': 'henan', '湖北': 'hubei', '湖南': 'hunan', '广东': 'guangdong', '广西': 'guangxi', '海南': 'hainan',
    '重庆': 'chongqing', '四川': 'sichuan', '贵州': 'guizhou', '云南': 'yunnan', '西藏': 'xizang',
    '陕西': 'shaanxi', '甘肃': 'gansu', '青海': 'qinghai', '宁夏': 'ningxia', '新疆': 'xinjiang',
    '台湾': 'taiwan', '香港': 'xianggang', '澳门': 'aomen'
};

// 将中文转换为拼音
function chineseToPinyin(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (pinyinMap[char]) {
            result += pinyinMap[char];
        } else {
            result += char;
        }
    }
    return result;
}

// 按拼音排序
function sortByPinyin(items) {
    return items.sort((a, b) => {
        const pinyinA = chineseToPinyin(a.name);
        const pinyinB = chineseToPinyin(b.name);
        return pinyinA.localeCompare(pinyinB);
    });
}

function openCityModal() {
    elements.cityModal.style.display = 'block';
    if (cityData.provinces.length === 0) {
        loadProvinces();
    }
}

function closeCityModal() {
    elements.cityModal.style.display = 'none';
}

async function initializeCitySelector() {
    // 加载省份数据
    await loadProvinces();
}

async function loadProvinces() {
    try {
        // 使用高德地图的行政区划查询接口
        const response = await fetch(`https://restapi.amap.com/v3/config/district?key=${CONFIG.WEATHER_API_KEY}&keywords=中国&subdistrict=1&extensions=base`);
        const data = await response.json();
        
        if (data.status === '1' && data.districts && data.districts.length > 0) {
            // 获取省份列表
            const provinces = data.districts[0].districts || [];
            if (provinces.length > 0) {
                // 按拼音排序
                const sortedProvinces = sortByPinyin(provinces);
                cityData.provinces = sortedProvinces;
                displayProvinces(sortedProvinces);
                return;
            }
        }
        console.log('API返回数据为空');
    } catch (error) {
        console.error('加载省份失败:', error);
    }
}



function displayProvinces(provinces) {
    const provinceList = document.getElementById('province-list');
    provinceList.innerHTML = '';
    
    console.log('显示省份列表:', provinces);
    
    provinces.forEach(province => {
        const item = document.createElement('div');
        item.className = 'province-item';
        item.textContent = province.name;
        item.addEventListener('click', () => selectProvince(province));
        provinceList.appendChild(item);
    });
}

async function selectProvince(province) {
    cityData.selectedProvince = province;
    cityData.selectedCity = null;
    cityData.selectedDistrict = null;
    
    // 更新UI
    updateCitySelectorUI();
    
    // 加载城市
    await loadCities(province.adcode);
}

async function loadCities(provinceCode) {
    try {
        // 使用高德地图的行政区划查询接口
        const response = await fetch(`https://restapi.amap.com/v3/config/district?key=${CONFIG.WEATHER_API_KEY}&keywords=${provinceCode}&subdistrict=1&extensions=base`);
        const data = await response.json();
        
        if (data.status === '1' && data.districts && data.districts.length > 0) {
            const cities = data.districts[0].districts || [];
            if (cities.length > 0) {
                // 按拼音排序
                const sortedCities = sortByPinyin(cities);
                cityData.cities[provinceCode] = sortedCities;
                displayCities(sortedCities);
                return;
            }
        }
        console.log('城市API返回数据为空');
    } catch (error) {
        console.error('加载城市失败:', error);
    }
}



function displayCities(cities) {
    const cityList = document.getElementById('city-list');
    cityList.innerHTML = '';
    
    cities.forEach(city => {
        const item = document.createElement('div');
        item.className = 'city-item';
        item.textContent = city.name;
        item.addEventListener('click', () => selectCity(city));
        cityList.appendChild(item);
    });
    
    // 清空区县列表
    document.getElementById('district-list').innerHTML = '';
}

async function selectCity(city) {
    cityData.selectedCity = city;
    cityData.selectedDistrict = null;
    
    // 更新UI
    updateCitySelectorUI();
    
    // 加载区县
    await loadDistricts(city.adcode);
}

async function loadDistricts(cityCode) {
    try {
        // 使用高德地图的行政区划查询接口
        const response = await fetch(`https://restapi.amap.com/v3/config/district?key=${CONFIG.WEATHER_API_KEY}&keywords=${cityCode}&subdistrict=1&extensions=base`);
        const data = await response.json();
        
        if (data.status === '1' && data.districts && data.districts.length > 0) {
            const districts = data.districts[0].districts || [];
            if (districts.length > 0) {
                // 按拼音排序
                const sortedDistricts = sortByPinyin(districts);
                cityData.districts[cityCode] = sortedDistricts;
                displayDistricts(sortedDistricts);
                return;
            }
        }
        console.log('区县API返回数据为空');
    } catch (error) {
        console.error('加载区县失败:', error);
    }
}



function displayDistricts(districts) {
    const districtList = document.getElementById('district-list');
    districtList.innerHTML = '';
    
    districts.forEach(district => {
        const item = document.createElement('div');
        item.className = 'district-item';
        item.textContent = district.name;
        item.addEventListener('click', () => selectDistrict(district));
        districtList.appendChild(item);
    });
}

function selectDistrict(district) {
    cityData.selectedDistrict = district;
    
    // 更新UI
    updateCitySelectorUI();
    
    // 应用选择
    applyCitySelection();
}

function updateCitySelectorUI() {
    // 更新省份选择状态
    document.querySelectorAll('.province-item').forEach(item => {
        item.classList.remove('active');
        if (cityData.selectedProvince && item.textContent === cityData.selectedProvince.name) {
            item.classList.add('active');
        }
    });
    
    // 更新城市选择状态
    document.querySelectorAll('.city-item').forEach(item => {
        item.classList.remove('active');
        if (cityData.selectedCity && item.textContent === cityData.selectedCity.name) {
            item.classList.add('active');
        }
    });
    
    // 更新区县选择状态
    document.querySelectorAll('.district-item').forEach(item => {
        item.classList.remove('active');
        if (cityData.selectedDistrict && item.textContent === cityData.selectedDistrict.name) {
            item.classList.add('active');
        }
    });
    
    // 更新选择显示
    updateSelectedLocation();
}

function updateSelectedLocation() {
    const selectedLocation = document.getElementById('selected-location');
    let locationText = '未选择';
    
    if (cityData.selectedProvince) {
        locationText = cityData.selectedProvince.name;
        if (cityData.selectedCity) {
            locationText = cityData.selectedCity.name;
            if (cityData.selectedDistrict) {
                locationText = cityData.selectedDistrict.name;
            }
        }
    }
    
    selectedLocation.textContent = locationText;
}

function applyCitySelection() {
    const selectedLocation = cityData.selectedDistrict || cityData.selectedCity || cityData.selectedProvince;
    
    if (selectedLocation) {
        currentCity.name = selectedLocation.name;
        currentCity.adcode = selectedLocation.adcode;
        
        elements.weatherCity.textContent = selectedLocation.name;
        closeCityModal();
        loadWeather();
        
        // 保存到本地存储
        localStorage.setItem('selectedCity', JSON.stringify(currentCity));
    }
}

// 音乐播放器功能
function initializeMusicPlayer() {
    // 创建音频对象
    musicPlayer.audio = new Audio();
    
    // 音频事件监听
    musicPlayer.audio.addEventListener('loadedmetadata', function() {
        musicPlayer.duration = musicPlayer.audio.duration;
        elements.totalTimeDisplay.textContent = formatTime(musicPlayer.duration);
    });
    
    musicPlayer.audio.addEventListener('ended', function() {
        // 如果当前是《使一颗心免于哀伤》，则播放热榜
        if (musicPlayer.currentTrack && musicPlayer.currentTrack.name.includes('使一颗心免于哀伤')) {
            loadDefaultPlaylist();
        } else {
            playNext();
        }
    });
    
    musicPlayer.audio.addEventListener('error', function() {
        console.error('音频加载失败');
        elements.musicTitle.textContent = '播放失败';
        elements.musicArtist.textContent = '请重试';
    });
    
            // 设置默认状态
        elements.musicTitle.textContent = '点击播放按钮开始';
        elements.musicArtist.textContent = '《使一颗心免于哀伤》';
    
    // 尝试加载默认播放列表
    setTimeout(() => {
        playSpecialSong();
    }, 1000);
}

async function loadDefaultPlaylist() {
    try {
        // 获取热榜歌单（热歌榜）
        const response = await fetch(`${CONFIG.MUSIC_API}/playlist/detail?id=3778678`);
        const data = await response.json();
        
        if (data.playlist && data.playlist.tracks) {
            musicPlayer.playlist = data.playlist.tracks;
            if (musicPlayer.playlist.length > 0) {
                playTrack(0);
            }
        } else {
            // 如果热榜获取失败，尝试获取推荐歌单
            const recommendResponse = await fetch(`${CONFIG.MUSIC_API}/recommend/resource`);
            const recommendData = await recommendResponse.json();
            
            if (recommendData.result && recommendData.result.length > 0) {
                const playlistId = recommendData.result[0].id;
                await loadPlaylistTracks(playlistId);
            }
        }
    } catch (error) {
        console.error('加载默认播放列表失败:', error);
    }
}

async function loadPlaylistTracks(playlistId) {
    try {
        const response = await fetch(`${CONFIG.MUSIC_API}/playlist/track/all?id=${playlistId}&limit=20`);
        const data = await response.json();
        
        if (data.songs) {
            musicPlayer.playlist = data.songs;
            if (musicPlayer.playlist.length > 0) {
                playTrack(0);
            }
        }
    } catch (error) {
        console.error('加载歌单失败:', error);
    }
}

function playTrack(index) {
    if (index < 0 || index >= musicPlayer.playlist.length) return;
    
    musicPlayer.currentIndex = index;
    musicPlayer.currentTrack = musicPlayer.playlist[index];
    
    // 重置歌词状态
    musicPlayer.currentLyricIndex = -1;
    musicPlayer.lyrics = [];
    
    // 更新界面
    elements.musicTitle.textContent = musicPlayer.currentTrack.name;
    elements.musicArtist.textContent = musicPlayer.currentTrack.ar[0].name;
    
    // 加载封面
    if (musicPlayer.currentTrack.al.picUrl) {
        elements.musicCover.src = musicPlayer.currentTrack.al.picUrl;
    }
    
    // 更新播放列表显示
    if (elements.playlistModal.style.display === 'block') {
        updatePlaylistDisplay();
    }
    
    // 获取播放链接
    loadMusicUrl(musicPlayer.currentTrack.id);
}

async function loadMusicUrl(songId) {
    try {
        const response = await fetch(`${CONFIG.MUSIC_API}/song/url/v1?id=${songId}&level=standard`);
        const data = await response.json();
        
        if (data.data && data.data[0] && data.data[0].url) {
            musicPlayer.audio.src = data.data[0].url;
            musicPlayer.audio.load();
            
            // 加载歌词
            await loadLyrics(songId);
            
            // 自动播放（需要用户交互）
            musicPlayer.audio.addEventListener('canplay', function() {
                if (musicPlayer.userInteracted) {
                    play();
                }
            }, { once: true });
        } else {
            throw new Error('无法获取播放链接');
        }
    } catch (error) {
        console.error('获取音乐链接失败:', error);
        elements.musicTitle.textContent = '播放失败';
        elements.musicArtist.textContent = '请重试';
    }
}

function togglePlay() {
    if (musicPlayer.isPlaying) {
        pause();
    } else {
        play();
    }
}

function play() {
    if (musicPlayer.audio.src && musicPlayer.userInteracted) {
        musicPlayer.audio.play().then(() => {
            musicPlayer.isPlaying = true;
            elements.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }).catch(error => {
            console.error('播放失败:', error);
            musicPlayer.isPlaying = false;
            elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        });
    }
}

function pause() {
    musicPlayer.audio.pause();
    musicPlayer.isPlaying = false;
    elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
}

function playPrevious() {
    const newIndex = musicPlayer.currentIndex - 1;
    if (newIndex >= 0) {
        playTrack(newIndex);
    }
}

function playNext() {
    const newIndex = musicPlayer.currentIndex + 1;
    if (newIndex < musicPlayer.playlist.length) {
        playTrack(newIndex);
    }
}

function updateMusicProgress() {
    if (musicPlayer.audio && !isNaN(musicPlayer.audio.duration)) {
        const currentTime = musicPlayer.audio.currentTime;
        const duration = musicPlayer.audio.duration;
        const progress = (currentTime / duration) * 100;
        
        elements.musicProgress.style.width = `${progress}%`;
        elements.currentTimeDisplay.textContent = formatTime(currentTime);
        
        // 更新歌词同步
        updateCurrentLyric(currentTime);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 音乐搜索功能
function openMusicSearch() {
    elements.musicModal.style.display = 'block';
    elements.musicSearchModal.focus();
}

function closeMusicModal() {
    elements.musicModal.style.display = 'none';
    elements.musicSearchModal.value = '';
    elements.searchResults.innerHTML = '';
}

// 播放列表功能
function openPlaylist() {
    elements.playlistModal.style.display = 'block';
    updatePlaylistDisplay();
}

function closePlaylistModal() {
    elements.playlistModal.style.display = 'none';
}

function updatePlaylistDisplay() {
    if (!musicPlayer.playlist || musicPlayer.playlist.length === 0) {
        elements.playlistCount.textContent = '共 0 首歌曲';
        elements.playlistTracks.innerHTML = '<div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.7);">暂无播放列表</div>';
        return;
    }
    
    elements.playlistCount.textContent = `共 ${musicPlayer.playlist.length} 首歌曲`;
    elements.playlistTracks.innerHTML = '';
    
    musicPlayer.playlist.forEach((track, index) => {
        const trackItem = document.createElement('div');
        trackItem.className = 'playlist-track-item';
        if (index === musicPlayer.currentIndex) {
            trackItem.classList.add('active');
        }
        
        trackItem.innerHTML = `
            <div class="playlist-track-cover">
                <img src="${track.al.picUrl}" alt="封面" onerror="this.src='images/default-cover.jpg'">
            </div>
            <div class="playlist-track-info">
                <div class="playlist-track-title">${track.name}</div>
                <div class="playlist-track-artist">${track.ar[0].name}</div>
            </div>
            <div class="playlist-track-duration">${formatDuration(track.dt)}</div>
        `;
        
        trackItem.addEventListener('click', () => {
            playTrack(index);
            updatePlaylistDisplay();
        });
        
        elements.playlistTracks.appendChild(trackItem);
    });
}

function formatDuration(duration) {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function searchMusic() {
    const query = elements.musicSearchModal.value.trim();
    if (!query) return;
    
    try {
        elements.searchResults.innerHTML = '<div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.7);">搜索中...</div>';
        
        const response = await fetch(`${CONFIG.MUSIC_API}/cloudsearch?keywords=${encodeURIComponent(query)}&type=1&limit=20`);
        const data = await response.json();
        
        if (data.result && data.result.songs) {
            displaySearchResults(data.result.songs);
        } else {
            elements.searchResults.innerHTML = '<div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.7);">未找到相关音乐</div>';
        }
    } catch (error) {
        console.error('搜索音乐失败:', error);
        elements.searchResults.innerHTML = '<div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.7);">搜索失败，请重试</div>';
    }
}

function displaySearchResults(songs) {
    elements.searchResults.innerHTML = '';
    
    songs.forEach(song => {
        const resultItem = document.createElement('div');
        resultItem.className = 'music-result-item';
        resultItem.innerHTML = `
            <div class="music-result-cover">
                <img src="${song.al.picUrl}" alt="封面" onerror="this.src='images/default-cover.jpg'">
            </div>
            <div class="music-result-info">
                <div class="music-result-title">${song.name}</div>
                <div class="music-result-artist">${song.ar[0].name}</div>
            </div>
        `;
        
        resultItem.addEventListener('click', () => {
            // 添加到播放列表并播放
            musicPlayer.playlist = [song];
            playTrack(0);
            closeMusicModal();
        });
        
        elements.searchResults.appendChild(resultItem);
    });
}

// 优先播放《使一颗心免于哀伤》
async function playSpecialSong() {
    try {
        const response = await fetch(`${CONFIG.MUSIC_API}/cloudsearch?keywords=使一颗心免于哀伤&type=1&limit=1`);
        const data = await response.json();
        if (data.result && data.result.songs && data.result.songs.length > 0) {
            musicPlayer.playlist = data.result.songs;
            playTrack(0);
        } else {
            // 搜索不到则直接播放热榜
            loadDefaultPlaylist();
        }
    } catch (e) {
        loadDefaultPlaylist();
    }
}

// 工具函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 加载保存的城市设置
function loadSavedCity() {
    const savedCity = localStorage.getItem('selectedCity');
    if (savedCity) {
        try {
            currentCity = JSON.parse(savedCity);
            elements.weatherCity.textContent = currentCity.name;
        } catch (error) {
            console.error('加载保存的城市设置失败:', error);
        }
    }
}

// 页面加载时恢复城市设置
loadSavedCity();

// 添加一些动画效果
function addAnimations() {
    // 为卡片添加进入动画
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

// 页面加载完成后添加动画
window.addEventListener('load', addAnimations);

// 页面加载动画隐藏
window.addEventListener('load', function() {
    setTimeout(() => {
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            // 先让进度条和文字消失
            const loadingContent = loading.querySelector('.loading-content');
            if (loadingContent) {
                loadingContent.style.opacity = '0';
            }
            
            // 短暂延迟后开始半屏打开动画
            setTimeout(() => {
                loading.classList.add('hide');
                setTimeout(() => {
                    if (loading) loading.style.display = 'none';
                }, 1000);
            }, 300);
        }
    }, 2500); // 延长到2.5秒
});

// 添加键盘快捷键
document.addEventListener('keydown', function(event) {
    // ESC键关闭模态框
    if (event.key === 'Escape') {
        closeCityModal();
        closeMusicModal();
    }
    
    // R键刷新一言
    if (event.key === 'r' || event.key === 'R') {
        loadHitokoto();
    }
    
    // 空格键控制音乐播放
    if (event.key === ' ' && !event.target.matches('input, textarea')) {
        event.preventDefault();
        togglePlay();
    }
    
    // 左右箭头键控制音乐
    if (event.key === 'ArrowLeft') {
        playPrevious();
    }
    if (event.key === 'ArrowRight') {
        playNext();
    }
});

// 添加触摸支持
if ('ontouchstart' in window) {
    // 为移动设备优化触摸体验
    document.addEventListener('touchstart', function() {}, {passive: true});
}

// 错误处理
window.addEventListener('error', function(event) {
    console.error('页面错误:', event.error);
});

// 网络状态监听
window.addEventListener('online', function() {
    console.log('网络已连接');
    loadWeather();
    loadHitokoto();
});

window.addEventListener('offline', function() {
    console.log('网络已断开');
});



// 加载歌词
async function loadLyrics(songId) {
    try {
        const response = await fetch(`${CONFIG.MUSIC_API}/lyric?id=${songId}`);
        const data = await response.json();
        
        if (data.code === 200 && data.lrc && data.lrc.lyric) {
            musicPlayer.lyrics = parseLyrics(data.lrc.lyric);
            displayLyrics();
        } else {
            musicPlayer.lyrics = [];
            displayLyrics();
        }
    } catch (error) {
        console.error('加载歌词失败:', error);
        musicPlayer.lyrics = [];
        displayLyrics();
    }
}

// 解析歌词
function parseLyrics(lyricText) {
    const lines = lyricText.split('\n');
    const lyrics = [];
    
    for (let line of lines) {
        const timeMatch = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/);
        if (timeMatch) {
            const minutes = parseInt(timeMatch[1]);
            const seconds = parseInt(timeMatch[2]);
            const milliseconds = parseInt(timeMatch[3].padEnd(3, '0'));
            const time = minutes * 60 + seconds + milliseconds / 1000;
            const text = line.replace(/\[.*?\]/g, '').trim();
            
            if (text) {
                lyrics.push({ time, text });
            }
        }
    }
    
    return lyrics.sort((a, b) => a.time - b.time);
}

// 显示歌词
function displayLyrics() {
    const lyricsScrollContainer = elements.lyricsScrollContainer;
    
    if (musicPlayer.lyrics.length === 0) {
        lyricsScrollContainer.innerHTML = '<div class="lyrics-placeholder">暂无歌词</div>';
        return;
    }
    
    let html = '';
    for (let i = 0; i < musicPlayer.lyrics.length; i++) {
        const lyric = musicPlayer.lyrics[i];
        html += `<div class="lyrics-line" data-index="${i}">${lyric.text}</div>`;
    }
    
    lyricsScrollContainer.innerHTML = html;
}

// 更新当前歌词
function updateCurrentLyric(currentTime) {
    if (musicPlayer.lyrics.length === 0) return;
    
    let newIndex = -1;
    for (let i = 0; i < musicPlayer.lyrics.length; i++) {
        if (currentTime >= musicPlayer.lyrics[i].time) {
            newIndex = i;
        } else {
            break;
        }
    }
    
    if (newIndex !== musicPlayer.currentLyricIndex) {
        // 移除之前的激活状态
        const prevActive = elements.lyricsScrollContainer.querySelector('.lyrics-line.active');
        if (prevActive) {
            prevActive.classList.remove('active');
        }
        
        // 添加新的激活状态
        if (newIndex >= 0) {
            const currentActive = elements.lyricsScrollContainer.querySelector(`[data-index="${newIndex}"]`);
            if (currentActive) {
                currentActive.classList.add('active');
                // 平滑滚动到当前歌词
                const container = elements.lyricsScrollContainer;
                const lineHeight = currentActive.offsetHeight;
                const containerHeight = container.offsetHeight;
                const scrollTop = currentActive.offsetTop - containerHeight / 2 + lineHeight / 2;
                
                container.scrollTo({
                    top: scrollTop,
                    behavior: 'smooth'
                });
            }
        }
        
        musicPlayer.currentLyricIndex = newIndex;
    }
}

// 主题切换功能
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // 设置初始主题
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // 添加点击事件
    themeToggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');
    
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        icon.title = '切换到亮色模式';
    } else {
        icon.className = 'fas fa-moon';
        icon.title = '切换到暗色模式';
    }
}

// 收集/展开按钮功能
function initializeCollectButton() {
    const collectBtn = document.getElementById('collect-btn');
    const contentGrid = document.getElementById('content-grid');
    let isCollected = false;
    
    collectBtn.addEventListener('click', function() {
        if (!isCollected) {
            // 收集模块
            collectModules();
        } else {
            // 展开模块
            expandModules();
        }
        isCollected = !isCollected;
    });
}

function collectModules() {
    const collectBtn = document.getElementById('collect-btn');
    const contentGrid = document.getElementById('content-grid');
    const icon = collectBtn.querySelector('i');
    
    // 更新按钮状态
    collectBtn.classList.add('collected');
    icon.className = 'fas fa-expand-alt';
    collectBtn.title = '展开模块';
    
    // 添加收集动画类
    contentGrid.classList.add('collecting');
    
    // 延迟后添加收集状态
    setTimeout(() => {
        contentGrid.classList.add('collected');
        contentGrid.classList.remove('collecting');
    }, 800);
}

function expandModules() {
    const collectBtn = document.getElementById('collect-btn');
    const contentGrid = document.getElementById('content-grid');
    const icon = collectBtn.querySelector('i');
    
    // 更新按钮状态
    collectBtn.classList.remove('collected');
    icon.className = 'fas fa-compress-alt';
    collectBtn.title = '收集模块';
    
    // 移除收集状态，添加展开动画
    contentGrid.classList.remove('collected');
    contentGrid.classList.add('expanding');
    
    // 延迟后移除展开动画类
    setTimeout(() => {
        contentGrid.classList.remove('expanding');
    }, 800);
} 