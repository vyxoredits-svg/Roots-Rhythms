// ==================== DOM ELEMENTS ==================== //
const navLinks = document.querySelectorAll('.nav-link');
const ctaButton = document.querySelector('.cta-button');
const activitiesGrid = document.getElementById('activitiesGrid');
const noPosts = document.getElementById('noPosts');
const POSTS_ENDPOINT = 'REPLACE_WITH_YOUR_GOOGLE_APPS_SCRIPT_URL';

function loadPostsViaJsonp(url) {
    return new Promise((resolve, reject) => {
        const callbackName = `rrPosts_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const script = document.createElement('script');
        const cleanup = () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            delete window[callbackName];
        };

        window[callbackName] = (data) => {
            cleanup();
            resolve(data);
        };

        script.onerror = () => {
            cleanup();
            reject(new Error('Unable to load posts.'));
        };

        script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${callbackName}`;
        document.head.appendChild(script);
    });
}

// ==================== SMOOTH SCROLLING ==================== //
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

async function renderPosts() {
    if (!activitiesGrid || !noPosts) {
        return;
    }

    const data = await loadPostsViaJsonp(POSTS_ENDPOINT);
    const posts = Array.isArray(data.posts) ? data.posts : [];

    activitiesGrid.innerHTML = '';
    if (!posts.length) {
        noPosts.style.display = 'block';
        return;
    }

    noPosts.style.display = 'none';

    posts.forEach(post => {
        const card = document.createElement('article');
        card.className = 'post-card glass-effect';
        card.innerHTML = `
            <div class="post-card__top" style="background: ${post.accentColor || '#E07656'}"></div>
            <div class="post-card__body">
                <div class="post-card__meta">
                    <span class="category-badge ${post.category || 'heritage'}">${post.categoryLabel || 'Heritage'}</span>
                </div>
                <h3>${post.title}</h3>
                <p>${post.summary}</p>
                <div class="activity-stats">
                    <span>📅 ${post.date}</span>
                    <span>👥 ${post.audience}</span>
                </div>
            </div>
        `;
        activitiesGrid.appendChild(card);
    });
}

// ==================== CTA BUTTON INTERACTIONS ==================== //
if (ctaButton) {
    ctaButton.addEventListener('click', function(event) {
        const ripple = createRipple(event);
        this.appendChild(ripple);

        setTimeout(() => {
            document.getElementById('activities').scrollIntoView({
                behavior: 'smooth'
            });
        }, 300);
    });

    ctaButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
    });

    ctaButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
}

// ==================== RIPPLE EFFECT ==================== //
function createRipple(event) {
    const circle = document.createElement('span');
    const diameter = Math.max(event.clientX, event.clientY) * 2;
    const radius = diameter / 2;

    circle.style.width = circle.style.height = diameter + 'px';
    circle.style.left = event.clientX - radius + 'px';
    circle.style.top = event.clientY - radius + 'px';
    circle.classList.add('ripple');

    circle.style.position = 'absolute';
    circle.style.borderRadius = '50%';
    circle.style.backgroundColor = 'rgba(224, 118, 86, 0.5)';
    circle.style.transform = 'scale(0)';
    circle.style.animation = 'ripple-animation 0.6s ease-out';

    if (!document.querySelector('style[data-ripple]')) {
        const style = document.createElement('style');
        style.setAttribute('data-ripple', 'true');
        style.textContent = `
            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            .ripple {
                position: absolute;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }

    return circle;
}


// ==================== SCROLL ANIMATIONS FOR NAV ==================== //
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 5px 30px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.08)';
    }
});

// ==================== ACTIVE NAV LINK HIGHLIGHTING ==================== //
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${current}`) {
            link.style.color = 'var(--primary-orange)';
        } else {
            link.style.color = 'var(--dark-gray)';
        }
    });
});

// ==================== PARALLAX EFFECT ==================== //
const hero = document.querySelector('.hero');
window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY;
    if (hero) {
        hero.style.backgroundPosition = `0 ${scrollPos * 0.5}px`;
    }
});

// ==================== KEYBOARD NAVIGATION ==================== //


// ==================== PERFORMANCE: LAZY LOADING ==================== //
if ('IntersectionObserver' in window) {
    const images = document.querySelectorAll('img');
    const imgObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.style.opacity = '1';
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        imgObserver.observe(img);
    });
}

// ==================== DYNAMIC FOOTER YEAR ==================== //
document.addEventListener('DOMContentLoaded', () => {
    const currentYear = new Date().getFullYear();
    const footerText = document.querySelector('.footer-text p');
    if (footerText) {
        footerText.textContent = `© ${currentYear} Roots & Rhythms. Preserving our past. Inspiring our future.`;
    }
    renderPosts().catch(() => {
        if (noPosts) {
            noPosts.style.display = 'block';
        }
    });
});

// ==================== ACCESSIBILITY ENHANCEMENTS ==================== //
document.addEventListener('keydown', (e) => {
    // Tab navigation
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
});

// Add focus styles
const focusStyle = document.createElement('style');
focusStyle.textContent = `
    .keyboard-nav a:focus,
    .keyboard-nav button:focus {
        outline: 3px solid #E07656;
        outline-offset: 2px;
    }
`;
document.head.appendChild(focusStyle);
