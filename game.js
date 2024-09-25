// Configuração básica do Phaser
const config = {
    type: Phaser.AUTO,
    width: 720,
    height: 1280,
    backgroundColor: '#1d212d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }, // Aumentei a gravidade para tornar a queda mais rápida
            debug: true // Ativado para visualizar as caixas de colisão, pode desativar depois
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Variáveis do jogo
let espatula;
let ingredientes;
let cursors;
let vidas = 3;
let score = 0;
let gameOver = false;
let scoreText;
let livesText;
let velocityMultiplier = 1;
let lastSpeedIncrease = 0;
let secretActive = false;

// Array para armazenar os ícones de vida
let lifeIcons = [];
const maxLives = 5; // Definindo um máximo de vidas

function preload() {
    const imagens = [
        { key: 'background', path: 'images/background.png' },
        { key: 'egg', path: 'images/egg.png' },
        { key: 'flour', path: 'images/flour.png' },
        { key: 'almond', path: 'images/almond.png' },
        { key: 'fly', path: 'images/fly.png' },
        { key: 'chili_pepper', path: 'images/chili_pepper.png' },
        { key: 'secret', path: 'images/secret.png' },
        { key: 'spatula', path: 'images/spatula.png' },
        { key: 'life_icon', path: 'images/life_icon.png' },
        { key: 'mouse', path: 'images/mouse.png' },
        { key: 'sugar', path: 'images/sugar.png' },
        { key: 'bowl', path: 'images/bowl.png' }
    ];

    imagens.forEach(img => {
        console.log(`Carregando imagem: ${img.key} de ${img.path}`);
        this.load.image(img.key, img.path);
    });

    this.load.on('complete', () => {
        console.log('Todas as imagens foram carregadas com sucesso.');
    });

    this.load.on('filecomplete', (key, type, data) => {
        console.log(`Imagem carregada com sucesso: ${key}`);
    });

    this.load.on('loaderror', (fileObj) => {
        console.error(`Erro ao carregar a imagem: ${fileObj.key} de ${fileObj.src}`);
    });
}

function create() {
    console.log('Criando a cena do jogo.');

    // Adicionar o plano de fundo
    this.add.image(360, 640, 'background').setScale(1);
    console.log('Plano de fundo adicionado.');

    // Adicionar a espátula
    espatula = this.physics.add.sprite(360, 1200, 'spatula') // Ajustei y para 1200
        .setCollideWorldBounds(true)
        .setScale(0.3); // Reduzido para 0.3 (dobro de 0.15)
    console.log('Espátula criada:', espatula);

    // Criar grupo de ingredientes
    ingredientes = this.physics.add.group();
    console.log('Grupo de ingredientes criado.');

    // Gerar os ingredientes periodicamente
    this.time.addEvent({
        delay: 800, // Intervalo mais curto para maior cadência
        callback: () => spawnIngredientes(this),
        loop: true
    });
    console.log('Evento de spawn de ingredientes configurado.');

    // Configurar controles do jogador
    cursors = this.input.keyboard.createCursorKeys();
    console.log('Controles do jogador configurados.');

    // Texto de pontuação
    scoreText = this.add.text(16, 16, 'Pontuação: 0', { fontSize: '32px', fill: '#fff' });
    console.log('Texto de pontuação adicionado.');

    // Texto de vidas
    livesText = this.add.text(16, 60, 'Vidas:', { fontSize: '32px', fill: '#fff' });
    console.log('Texto de vidas adicionado.');

    // Adicionar os ícones de vida no canto superior esquerdo
    addLifeIcons(this);
    console.log('Ícones de vida adicionados.');

    // Colisão entre espátula e ingredientes
    this.physics.add.overlap(espatula, ingredientes, collectIngrediente, null, this);
    console.log('Colisão entre espátula e​⬤
