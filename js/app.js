const API_URL = 'https://jsonplaceholder.typicode.com';
let allPhotos = [];
let filteredPhotos = [];
let albums = {};
let currentPage = 1;
const photosPerPage = 20;

const gallery = document.getElementById('gallery');
const albumFilter = document.getElementById('album-filter');
const sortBy = document.getElementById('sort-by');
const searchInput = document.getElementById('search');
const searchBtn = document.getElementById('search-btn');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const showingCount = document.getElementById('showing-count');
const totalCount = document.getElementById('total-count');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalAlbum = document.getElementById('modal-album');
const modalId = document.getElementById('modal-id');
const closeModal = document.querySelector('.close');

async function initApp() {
    try {
        gallery.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading photos...</p>
            </div>
        `;
        
        const response = await fetch(`${API_URL}/photos`);
        if (!response.ok) {
            throw new Error('Failed to fetch photos');
        }
        
        allPhotos = await response.json();
        filteredPhotos = [...allPhotos];
        
        populateAlbumFilter();
        
        totalCount.textContent = allPhotos.length;
        
        updateGallery();
        
        setupEventListeners();
        
    } catch (error) {
        handleError(error);
    }
}

function populateAlbumFilter() {
    allPhotos.forEach(photo => {
        if (!albums[photo.albumId]) {
            albums[photo.albumId] = `Album ${photo.albumId}`;
            
            const option = document.createElement('option');
            option.value = photo.albumId;
            option.textContent = `Album ${photo.albumId}`;
            albumFilter.appendChild(option);
        }
    });
}

function setupEventListeners() {
    albumFilter.addEventListener('change', filterPhotos);
    
    sortBy.addEventListener('change', filterPhotos);
    
    searchBtn.addEventListener('click', filterPhotos);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            filterPhotos();
        }
    });
    
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateGallery();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < Math.ceil(filteredPhotos.length / photosPerPage)) {
            currentPage++;
            updateGallery();
        }
    });
    
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

function filterPhotos() {
    currentPage = 1;
    
    const selectedAlbum = albumFilter.value;
    const selectedSort = sortBy.value;
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    filteredPhotos = allPhotos.filter(photo => {
        const matchesAlbum = selectedAlbum === "0" || photo.albumId.toString() === selectedAlbum;
        const matchesSearch = !searchTerm || photo.title.toLowerCase().includes(searchTerm);
        
        return matchesAlbum && matchesSearch;
    });
    
    sortPhotos(selectedSort);
    
    updateGallery();
}

function sortPhotos(sortCriteria) {
    switch (sortCriteria) {
        case 'title-asc':
            filteredPhotos.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            filteredPhotos.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'id-asc':
            filteredPhotos.sort((a, b) => a.id - b.id);
            break;
        case 'id-desc':
            filteredPhotos.sort((a, b) => b.id - a.id);
            break;
        default:
            filteredPhotos.sort((a, b) => a.id - b.id);
    }
}

function updateGallery() {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.remove();
    }
    
    gallery.innerHTML = '';
    
    const startIndex = (currentPage - 1) * photosPerPage;
    const endIndex = Math.min(startIndex + photosPerPage, filteredPhotos.length);
    
    showingCount.textContent = filteredPhotos.length;
    
    if (filteredPhotos.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <p>No photos match your search criteria.</p>
            <button onclick="resetFilters()">Reset Filters</button>
        `;
        gallery.appendChild(noResults);
    } else {
        for (let i = startIndex; i < endIndex; i++) {
            createPhotoElement(filteredPhotos[i]);
        }
    }
    
    updatePagination();
}

function createPhotoElement(photo) {
    const photoElement = document.createElement('div');
    photoElement.className = 'gallery-item';
    
    const imgContainer = document.createElement('div');
    imgContainer.className = 'gallery-img';
    
    let colorCode = '92c952'; 
    try {
        colorCode = photo.thumbnailUrl.split('/').pop();
    } catch (error) {
        console.warn('Could not extract color code from URL:', photo.thumbnailUrl);
    }
    
    imgContainer.style.backgroundColor = `#${colorCode}`;
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'gallery-item-info';
    infoDiv.innerHTML = `
        <h3>${photo.title}</h3>
        <p>Album: ${albums[photo.albumId]}</p>
    `;
    
    photoElement.appendChild(imgContainer);
    photoElement.appendChild(infoDiv);
    
    photoElement.addEventListener('click', () => {
        openPhotoModal(photo);
    });
    
    gallery.appendChild(photoElement);
}

function openPhotoModal(photo) {
    let colorCode = '92c952'; 
    try {
        colorCode = photo.url.split('/').pop();
    } catch (error) {
        console.warn('Could not extract color code from URL:', photo.url);
    }
    
    const modalImgContainer = document.querySelector('.modal-image-container');
    modalImgContainer.innerHTML = '';
    
    const coloredDiv = document.createElement('div');
    coloredDiv.id = 'modal-image';
    coloredDiv.style.backgroundColor = `#${colorCode}`;
    coloredDiv.style.width = '100%';
    coloredDiv.style.height = '100%';
    
    modalImgContainer.appendChild(coloredDiv);
    
    modalTitle.textContent = photo.title;
    modalAlbum.textContent = albums[photo.albumId];
    modalId.textContent = photo.id;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function updatePagination() {
    const totalPages = Math.ceil(filteredPhotos.length / photosPerPage);
    
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
}

function resetFilters() {
    albumFilter.value = "0";
    sortBy.value = "default";
    searchInput.value = "";
    
    filterPhotos();
}

function handleError(error) {
    console.error('Error:', error);
    
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.remove();
    }
    
    gallery.innerHTML = `
        <div class="error-message">
            <h3>Oops! Something went wrong</h3>
            <p>${error.message || 'Failed to load photos. Please try again later.'}</p>
            <button onclick="initApp()">Try Again</button>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', initApp); 