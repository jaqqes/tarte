// Configuração básica do Phaser
const config = {
    type: Phaser.AUTO,
    width: 720,
    height: 1280,
    backgroundColor: '#1d212d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }, // Gravidade global
            debug: false // Desativado para uma aparência limpa
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
        { key: 'spatula', path: 'images/spatula.png' }, // Usando 'spatula' como jogador
        { key: 'life_icon', path: 'images/life_icon.png' },
        { key: 'mouse', path: 'images/mouse.png' },
        { key: 'sugar', path: 'images/sugar.png' }
        // Removemos 'bowl' porque não temos 'bowl.png'
    ];

    imagens.forEach(img => {
        this.load.image(img.key, img.path);
    });

    // Adicionar eventos de erro de carregamento
    this.load.on('loaderror', (file) => {
        console.error(`Erro ao carregar a imagem: ${file.key} de ${file.src}`);
    });
}

function create() {
    // Adicionar o plano de fundo
    this.add.image(360, 640, 'background');

    // Adicionar a espátula como jogador
    espatula = this.physics.add.sprite(360, 1200, 'spatula')
        .setCollideWorldBounds(true)
        .setScale(0.5); // Ajustado o tamanho da espátula

    // Criar grupo de ingredientes
    ingredientes = this.physics.add.group();

    // Gerar os ingredientes periodicamente
    this.time.addEvent({
        delay: 800,
        callback: () => spawnIngredientes(this),
        loop: true
    });

    // Configurar controles do jogador
    cursors = this.input.keyboard.createCursorKeys();

    // Texto de pontuação
    scoreText = this.add.text(16, 16, 'Pontuação: 0', { fontSize: '32px', fill: '#fff' });

    // Texto de vidas
    livesText = this.add.text(130, 60, 'Vidas:', { fontSize: '32px', fill: '#fff' }); // Reposicionado

    // Adicionar os ícones de vida antes do texto "Vidas:"
    addLifeIcons(this);

    // Colisão entre espátula e ingredientes
    this.physics.add.overlap(espatula, ingredientes, collectIngrediente, null, this);

    // Criar um sensor na parte inferior da tela para detectar ingredientes que atingem o fundo
    let bottomSensor = this.physics.add.staticImage(360, 1280, null).setDisplaySize(720, 10);
    bottomSensor.visible = false; // Tornar invisível

    // Detectar colisão entre ingredientes e o sensor inferior
    this.physics.add.overlap(ingredientes, bottomSensor, ingredienteAtingiuFundo, null, this);
}

function update(time) {
    if (cursors.left.isDown) {
        espatula.setVelocityX(-300);
    } else if (cursors.right.isDown) {
        espatula.setVelocityX(300);
    } else {
        espatula.setVelocityX(0);
    }

    if (time - lastSpeedIncrease > 20000) {
        aumentarVelocidade();
        lastSpeedIncrease = time;
    }

    if (vidas <= 0 && !gameOver) {
        gameOver = true;
        this.add.text(200, 600, 'Game Over!', { fontSize: '64px', fill: '#ff0000' });
        this.physics.pause();
    }
}

function spawnIngredientes(scene) {
    let ingredientesBons = ['egg', 'flour', 'almond', 'sugar']; // Removido 'bowl'
    let ingredientesMaus = ['fly', 'chili_pepper', 'mouse'];
    let randomX = Phaser.Math.Between(50, 670);
    let randomIngrediente;

    if (Phaser.Math.Between(0, 10) > 3) {
        randomIngrediente = ingredientesBons[Phaser.Math.Between(0, ingredientesBons.length - 1)];
    } else {
        randomIngrediente = ingredientesMaus[Phaser.Math.Between(0, ingredientesMaus.length - 1)];
    }

    let ingrediente = scene.physics.add.sprite(randomX, -50, randomIngrediente)
        .setScale(0.15) // Ajustado o tamanho dos ingredientes
        .setCollideWorldBounds(false)
        .setBounce(0);

    ingrediente.body.allowGravity = true; // Ativar gravidade no ingrediente

    ingredientes.add(ingrediente);
}

function collectIngrediente(espatula, ingrediente) {
    ingrediente.disableBody(true, true);

    switch (ingrediente.texture.key) {
        case 'egg':
        case 'flour':
        case 'sugar':
            score += 10;
            break;
        case 'almond':
            score += 30;
            break;
        case 'fly':
            score -= 15;
            velocityMultiplier = Math.min(velocityMultiplier * 1.5, 5);
            break;
        case 'chili_pepper':
            score -= 20;
            break;
        case 'mouse':
            vidas--;
            if (vidas < 0) vidas = 0;
            updateLivesText();
            removeLifeIcon();
            break;
        case 'secret':
            if (vidas < maxLives) {
                vidas++;
                updateLivesText();
                addLifeIcon(this);
            }
            secretActive = false;
            break;
    }

    scoreText.setText('Pontuação: ' + score);

    if (score % 100 === 0 && score > 0 && !secretActive) {
        spawnSecret(this);
        secretActive = true;
    }
}

function ingredienteAtingiuFundo(ingrediente, sensor) {
    if (ingrediente.texture.key !== 'mouse') {
        vidas--;
        if (vidas < 0) vidas = 0;
        updateLivesText();
        removeLifeIcon();
    }
    ingrediente.destroy();
    if (vidas <= 0 && !gameOver) {
        gameOver = true;
        this.add.text(200, 600, 'Game Over!', { fontSize: '64px', fill: '#ff0000' });
        this.physics.pause();
    }
}

function spawnSecret(scene) {
    let randomX = Phaser.Math.Between(50, 670);

    let secret = scene.physics.add.sprite(randomX, -50, 'secret')
        .setScale(0.15) // Ajustado o tamanho
        .setCollideWorldBounds(false)
        .setBounce(0);

    secret.body.allowGravity = true; // Ativar gravidade no ingrediente

    ingredientes.add(secret);
}

function aumentarVelocidade() {
    velocityMultiplier += 0.2;
}

function updateLivesText() {
    livesText.setText('Vidas:');
}

function addLifeIcons(scene) {
    let startX = 16; // Posicionado antes do texto "Vidas:"
    let startY = 60;
    let spacing = 30; // Espaçamento entre os ícones

    for (let i = 0; i < vidas; i++) {
        let lifeIcon = scene.add.image(startX + i * spacing, startY + 16​⬤
