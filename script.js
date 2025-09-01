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