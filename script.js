// Funcionalidad de filtrado
document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const gameCards = document.querySelectorAll('.game-card');
    
    // Función para filtrar juegos
    function filterGames(category) {
        gameCards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.classList.remove('hidden');
                card.style.animation = 'fadeInUp 0.6s ease-out';
            } else {
                card.classList.add('hidden');
            }
        });
    }
    
    // Event listeners para botones de navegación
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase active de todos los botones
            navButtons.forEach(btn => btn.classList.remove('active'));
            
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            // Filtrar juegos
            const category = this.dataset.category;
            filterGames(category);
        });
    });
});

// Función para abrir resúmenes de juegos
function openGame(gameId) {
    switch(gameId) {
        case 'warhammer40k-combat-patrol':
            window.open('games/warhammer40k-combat-patrol.html', '_blank');
            break;
        case 'dnd5e-basic':
            alert('🚧 Próximamente disponible');
            break;
        case 'mtg-basic':
            alert('🚧 Próximamente disponible');
            break;
        case 'warmaster-revolution':
            window.open('games/warmaster-revolution.html', '_blank');
            break;
        default:
            alert('🚧 Resumen en desarrollo');
    }
}

// Efectos adicionales
document.addEventListener('DOMContentLoaded', function() {
    // Efecto de typing en el título
    const title = document.querySelector('.title');
    const originalText = title.textContent;
    title.textContent = '';
    
    let i = 0;
    const typeWriter = () => {
        if (i < originalText.length) {
            title.textContent += originalText.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    };
    
    setTimeout(typeWriter, 500);
});

// Funcionalidad de búsqueda
const searchInput = document.getElementById('searchInput');
const gamesGrid = document.getElementById('gamesGrid');
const filterButtons = document.querySelectorAll('.filter-btn');

// Función de búsqueda
searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const gameCards = document.querySelectorAll('.game-card:not(.placeholder)');
    
    gameCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
        
        const matches = title.includes(searchTerm) || 
                       description.includes(searchTerm) || 
                       tags.some(tag => tag.includes(searchTerm));
        
        card.style.display = matches ? 'block' : 'none';
    });
});

// Función de filtrado
filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remover clase active de todos los botones
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Agregar clase active al botón clickeado
        this.classList.add('active');
        
        const filter = this.getAttribute('data-filter');
        const gameCards = document.querySelectorAll('.game-card');
        
        gameCards.forEach(card => {
            if (filter === 'all') {
                card.style.display = 'block';
            } else {
                const category = card.getAttribute('data-category');
                card.style.display = category === filter ? 'block' : 'none';
            }
        });
        
        // Limpiar búsqueda al filtrar
        searchInput.value = '';
    });
});

// Función para abrir resúmenes de juegos
document.addEventListener('click', function(e) {
    // Manejar clics en las cartas de juego
    document.addEventListener('click', function(e) {
        const gameCard = e.target.closest('.game-card');
        if (gameCard && !gameCard.classList.contains('placeholder')) {
            const gameName = gameCard.dataset.game;
            if (gameName === 'warhammer40k-combat-patrol') {
                window.location.href = 'games/warhammer40k-combat-patrol.html';
            } else if (gameName === 'warhammer-fantasy-8th') {
                window.location.href = 'games/warhammer-fantasy-8th.html';
            } else if (gameName === 'catan') {
                window.location.href = 'games/catan.html';
            }
        }
    });
    const gameCard = e.target.closest('.game-card:not(.placeholder)');
    if (gameCard) {
        const gameId = gameCard.getAttribute('data-game');
        if (gameId) {
            navigateToGame(gameId);
        }
    }
});

// Efectos hover para las cartas
document.querySelectorAll('.game-card:not(.placeholder)').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translate(-2px, -2px)';
        this.style.boxShadow = '8px 8px 0px #000000';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translate(0, 0)';
        this.style.boxShadow = '6px 6px 0px #000000';
    });
});

// Animación de entrada para las cartas
window.addEventListener('load', function() {
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Inicializar opacidad de las cartas para la animación
document.querySelectorAll('.game-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});

function navigateToGame(gameId) {
    const gamePages = {
        'catan': 'games/catan.html',
        'warhammer40k-combat-patrol': 'games/warhammer40k-combat-patrol.html',
        'warhammer-fantasy-8th': 'games/warhammer-fantasy-8th.html',
        'survive-the-island': 'games/survive-the-island.html',
        'warmaster-revolution': 'games/warmaster-revolution.html',
        'aventuras-marca-este': 'games/aventuras-marca-este.html'
    };
    
    if (gamePages[gameId]) {
        window.location.href = gamePages[gameId];
    }
}