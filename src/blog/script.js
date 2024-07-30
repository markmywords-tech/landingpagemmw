const client = contentful.createClient({
    space: '6j13pe3v15im',
    accessToken: 'ck2DGaEM6eSsV8hDiH9vUaSW8poK6H6Votm0HBJNnYA'
});

const ITEMS_PER_PAGE = 9;
let currentContentType = 'resourcePostLiteracy'; // Default to Study Guides
let currentPage = 1;

function getImageUrl(imageField) {
    return imageField && imageField.fields && imageField.fields.file
        ? imageField.fields.file.url
        : null;
}

function renderContentListItem(item) {
    const coverImageUrl = getImageUrl(item.fields.coverImage);
    return `
        <div class="content-list-item">
            ${coverImageUrl ? `<img src="${coverImageUrl}" alt="${item.fields.title}">` : ''}
            <h3>${item.fields.title || 'Untitled'}</h3>
            <p>${item.fields.excerpt || ''}</p>
            <a href="/post/${item.sys.id}" class="read-more">Read More</a>
        </div>
    `;
}

function fetchContentList() {
    console.log('Fetching content list for:', currentContentType);
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<div class="loader">Loading...</div>';

    let query = {
        content_type: currentContentType,
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        order: '-sys.createdAt'
    };

    client.getEntries(query)
        .then(response => {
            console.log('Contentful response:', response);
            if (response.items.length === 0) {
                contentArea.innerHTML = '<p>No content available for this category.</p>';
                return;
            }

            contentArea.innerHTML = `
                <div class="content-list-grid">
                    ${response.items.map(renderContentListItem).join('')}
                </div>
            `;

            renderPagination(response.total);
        })
        .catch(error => {
            console.error('Error fetching Contentful data:', error);
            console.error('Error details:', error.details);
            contentArea.innerHTML = `<p>Error loading content: ${JSON.stringify(error)}</p>`;
        });
}

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';

    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.addEventListener('click', () => {
            currentPage--;
            fetchContentList();
        });
        paginationElement.appendChild(prevButton);
    }

    // Add page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage);
        pageButton.addEventListener('click', () => {
            currentPage = i;
            fetchContentList();
        });
        paginationElement.appendChild(pageButton);
    }

    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.addEventListener('click', () => {
            currentPage++;
            fetchContentList();
        });
        paginationElement.appendChild(nextButton);
    }
}

// Set up navigation buttons
document.querySelectorAll('#resource-nav button').forEach(button => {
    button.addEventListener('click', () => {
        switch(button.textContent.trim()) {
            case 'Study Guides':
                currentContentType = 'resourcePostLiteracy';
                break;
            case 'Resource Posts':
                currentContentType = 'post';
                break;
            case 'AI Literacy Resources':
                currentContentType = 'article';
                break;
        }
        currentPage = 1;
        fetchContentList();
        
        // Update active button
        document.querySelectorAll('#resource-nav button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update page title
        document.querySelector('h1').textContent = button.textContent.trim();
    });
});

// Initialize the application
fetchContentList();

// Handle clicks on "Read More" links
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('read-more')) {
        event.preventDefault();
        const postId = event.target.getAttribute('href').split('/').pop();
        fetchSinglePost(postId);
    }
});

function fetchSinglePost(postId) {
    client.getEntry(postId)
        .then(entry => {
            displaySinglePost(entry);
        })
        .catch(error => {
            console.error('Error fetching single post:', error);
        });
}

function displaySinglePost(entry) {
    const contentArea = document.getElementById('content-area');
    const coverImageUrl = getImageUrl(entry.fields.coverImage);
    
    contentArea.innerHTML = `
        <article class="single-post">
            <h2>${entry.fields.title || 'Untitled'}</h2>
            ${coverImageUrl ? `<img src="${coverImageUrl}" alt="${entry.fields.title}">` : ''}
            <div class="post-content">
                ${entry.fields.content ? renderRichText(entry.fields.content) : ''}
                ${entry.fields.content2 ? renderRichText(entry.fields.content2) : ''}
                ${entry.fields.content3 ? renderRichText(entry.fields.content3) : ''}
            </div>
            <button id="back-to-list">Back to List</button>
        </article>
    `;

    document.getElementById('back-to-list').addEventListener('click', () => {
        fetchContentList();
    });
}

function renderRichText(richTextContent) {
    if (!richTextContent || !richTextContent.content) return '';
    return richTextContent.content.map(item => {
        if (item.nodeType === 'paragraph') {
            return `<p>${item.content.map(text => text.value).join('')}</p>`;
        }
        return '';
    }).join('');
}