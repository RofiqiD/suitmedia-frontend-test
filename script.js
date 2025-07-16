document.addEventListener('DOMContentLoaded', () => {

    const header = document.getElementById('main-header');
    const bannerBackground = document.querySelector('.banner-background');
    const bannerContent = document.querySelector('.banner-content');
    const showPerPageSelect = document.getElementById('show-per-page');
    const sortBySelect = document.getElementById('sort-by');
    const postGrid = document.getElementById('post-grid');
    const showingInfo = document.getElementById('showing-info');
    const paginationContainer = document.getElementById('pagination');

    let lastScrollY = window.scrollY;

    const PROXY_URL = 'http://localhost:3000/api/ideas';

    const getInitialState = () => {
        const params = new URLSearchParams(window.location.search);
        return {
            currentPage: parseInt(params.get('page')) || 1,
            itemsPerPage: parseInt(params.get('limit')) || 10,
            sortOrder: params.get('sort') || 'desc'
        };
    };

    let state = getInitialState();
    const updateURL = () => {
        const params = new URLSearchParams();
        params.set('page', state.currentPage);
        params.set('limit', state.itemsPerPage);
        params.set('sort', state.sortOrder);
        history.replaceState(null, '', `?${params.toString()}`);
    };


    const fetchPosts = async () => {
        postGrid.innerHTML = '<p>Loading posts...</p>';
        const params = new URLSearchParams();
        params.set('page[number]', state.currentPage);
        params.set('page[size]', state.itemsPerPage);
        params.set('sort', state.sortOrder === 'desc' ? '-published_at' : 'published_at');

        try {
            const response = await fetch(`${PROXY_URL}?${params.toString()}`);
            if (!response.ok) {
               
                const errorJson = await response.json().catch(() => ({ message: 'Could not parse error response from proxy.' }));
                console.error("Error response from proxy:", errorJson);
                
                throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorJson.message || response.statusText}`);
            }

          
            const json = await response.json();
            if (json.data && Array.isArray(json.data)) {
                renderPosts(json.data); // Panggil renderPosts hanya jika data valid
                renderPagination(json.meta); // Render pagination jika data valid
                renderInfo(json.meta);       // Render info jika data valid
            } else {
                console.warn("Received data is not an array or is missing 'data' property:", json);
                postGrid.innerHTML = `<p>Tidak ada data posts yang tersedia atau format data tidak valid.</p>`;
                return;
            }

        } catch (error) {
            console.error("Could not fetch posts:", error);
            postGrid.innerHTML = `<p>Gagal memuat data. ${error.message}. Coba lagi nanti.</p>`;
        }
    };

    const renderPosts = (posts) => {
        postGrid.innerHTML = ''; 
        if (posts.length === 0) {
            postGrid.innerHTML = '<p>Tidak ada postingan yang ditemukan.</p>';
            return;
        }

        posts.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            let imageUrl = 'https://via.placeholder.com/400x225?text=No+Image'; 
             const tempDiv = document.createElement('div');
        tempDiv.innerHTML = post.content;
        const imgElement = tempDiv.querySelector('img'); 

        if (imgElement && imgElement.src) {
            imageUrl = imgElement.src;
        }
            postCard.innerHTML = `
                <img src="${imageUrl}" alt="${post.title}" loading="lazy">
                <div class="card-content">
                    <p class="date">${new Date(post.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <h3 class="title">${post.title}</h3>
                </div>
            `;
            postGrid.appendChild(postCard);
        });
        updateURL();
    };
    const renderInfo = (meta) => {
        const { from, to, total } = meta;
        showingInfo.textContent = `Menampilkan ${from} - ${to} dari ${total}`;
    };

    const renderPagination = (meta) => {
        const { current_page, last_page } = meta;
        state.currentPage = current_page;
        paginationContainer.innerHTML = '';
        const createButton = (label, page, isDisabled = false, isActive = false) => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.innerHTML = label;
            button.disabled = isDisabled;
            if (isActive) button.classList.add('active');
            button.addEventListener('click', () => {
                state.currentPage = page;
                fetchPosts();
            });
            li.appendChild(button);
            return li;
        };
    paginationContainer.appendChild(createButton('&laquo;', current_page - 1, current_page === 1));
    const maxPagesToShow = 5; 
    let startPage, endPage;

    if (last_page <= maxPagesToShow) {
        startPage = 1;
        endPage = last_page;
    } else {

        const pagesBefore = Math.floor(maxPagesToShow / 2);
        const pagesAfter = maxPagesToShow - 1 - pagesBefore;
        startPage = current_page - pagesBefore;
        endPage = current_page + pagesAfter;

        if (startPage < 1) {
            startPage = 1;
            endPage = maxPagesToShow;
        }

        if (endPage > last_page) {
            endPage = last_page;
            startPage = last_page - maxPagesToShow + 1;
            if (startPage < 1) startPage = 1;
        }
    }
    if (startPage > 1) {
        paginationContainer.appendChild(createButton(1, 1));
        if (startPage > 2) {
            const liEllipsis = document.createElement('li');
            liEllipsis.textContent = '...';
            liEllipsis.classList.add('ellipsis');
            paginationContainer.appendChild(liEllipsis);
        }
    }
    for (let i = startPage; i <= endPage; i++) {
        paginationContainer.appendChild(createButton(i, i, false, i === current_page));
    }
    if (endPage < last_page) {
        if (endPage < last_page - 1) { 
            const liEllipsis = document.createElement('li');
            liEllipsis.textContent = '...';
            liEllipsis.classList.add('ellipsis');
            paginationContainer.appendChild(liEllipsis);
        }
        paginationContainer.appendChild(createButton(last_page, last_page));
    }
    paginationContainer.appendChild(createButton('&raquo;', current_page + 1, current_page === last_page));
};
    showPerPageSelect.addEventListener('change', (e) => {
        state.itemsPerPage = parseInt(e.target.value);
        state.currentPage = 1;
        fetchPosts();
    });

    sortBySelect.addEventListener('change', (e) => {
        state.sortOrder = e.target.value;
        state.currentPage = 1;
        fetchPosts();
    });


    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > header.clientHeight) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
        if (currentScrollY > 50) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
        lastScrollY = currentScrollY;

        if (bannerBackground && currentScrollY < window.innerHeight) {
            bannerBackground.style.transform = `translateY(${currentScrollY * 0.5}px)`;
            bannerContent.style.transform = `translateY(${currentScrollY * 0.3}px)`;
        }
    });

    
    const initializeApp = () => {
        const initialState = getInitialState(); 
        showPerPageSelect.value = initialState.itemsPerPage;
        sortBySelect.value = initialState.sortOrder;
        fetchPosts(); 
    };

    initializeApp();
});