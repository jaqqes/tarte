// Configuração básica do Phaser
const config = {
    type: Phaser.AUTO,
    width: 720,
    height: 1280,
    backgroundColor: '#1d212d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }, // Gravidade para os ingredientes caírem
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
        { key: 'sugar', path: 'images/sugar.png' },
        { key: 'bowl', path: 'images/bowl.png' } // Mantendo 'bowl' como ingrediente
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

    // Adicionar a espátula como jogador
    espatula = this.physics.add.sprite(360, 1200, 'spatula') // Posicionado na parte inferior
        .setCollideWorldBounds(true)
        .setScale(0.5); // Ajuste o scale conforme necessário
    console.log('Espátula criada:', espatula);

    // Criar grupo de ingredientes
    ingredientes = this.physics.add.group({
        allowGravity: true,
        gravityY: 300
    });
    console.log('Grupo de ingredientes criado.');

    // Gerar os ingredientes periodicamente
    this.time.addEvent({
        delay: 800, // Intervalo entre os spawns
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

    // Adicionar os ícones de vida
    addLifeIcons(this);
    console.log('Ícones de vida adicionados.');

    // Colisão entre espátula e ingredientes
    this.physics.add.overlap(espatula, ingredientes, collectIngrediente, null, this);
    console.log('Colisão entre espátula e ingredientes configurada.');

    // Evento para ingredientes que saem dos limites do mundo
    this.physics.world.on('worldbounds', function (body) {
        if (body.gameObject && ingredientes.contains(body.gameObject)) {
            // Ingrediente alcançou o fundo da tela sem ser apanhado
            console.log(`Ingrediente perdido: ${body.gameObject.texture.key}`);
            if (body.gameObject.texture.key !== 'mouse') { // Se não for 'mouse', decrementa vida
                vidas--;
                if (vidas < 0) vidas = 0;
                updateLivesText();
                removeLifeIcon();
            }
            body.gameObject.destroy();
            if (vidas <= 0 && !gameOver) {
                gameOver = true;
                this.add.text(200, 600, 'Game Over!', { fontSize: '64px', fill: '#ff0000' });
                this.physics.pause();
                console.log('Game Over!');
            }
        }
    }, this);
}

function update(time) {
    if (cursors.left.isDown) {
        espatula.setVelocityX(-300);
    } else if (cursors.right.isDown) {
        espatula.setVelocityX(300);
    } else {
        espatula.setVelocityX(0);
    }

    if (time - lastSpeedIncrease > 20000) { // Aumentar velocidade a cada 20 segundos
        aumentarVelocidade();
        lastSpeedIncrease = time;
    }

    if (vidas <= 0 && !gameOver) {
        gameOver = true;
        this.add.text(200, 600, 'Game Over!', { fontSize: '64px', fill: '#ff0000' });
        this.physics.pause();
        console.log('Game Over!');
    }
}

function spawnIngredientes(scene) {
    let ingredientesBons = ['egg', 'flour', 'almond', 'sugar', 'bowl'];
    let ingredientesMaus = ['fly', 'chili_pepper', 'mouse'];
    let randomX = Phaser.Math.Between(50, 670);
    let randomIngrediente;

    if (Phaser.Math.Between(0, 10) > 3) {
        randomIngrediente = ingredientesBons[Phaser.Math.Between(0, ingredientesBons.length - 1)];
    } else {
        randomIngrediente = ingredientesMaus[Phaser.Math.Between(0, ingredientesMaus.length - 1)];
    }

    let ingrediente = scene.physics.add.sprite(randomX, -50, randomIngrediente)
        .setScale(0.12) // Ajuste o scale conforme necessário
        .setVelocityY(200 * velocityMultiplier)
        .setCollideWorldBounds(true)
        .setBounce(0);

    ingrediente.body.onWorldBounds = true;
    ingrediente.body.allowGravity = true;

    ingredientes.add(ingrediente);
}

function collectIngrediente(espatula, ingrediente) {
    ingrediente.disableBody(true, true);

    switch (ingrediente.texture.key) {
        case 'egg':
        case 'flour':
        case 'bowl':
        case 'sugar':
            score += 10;
            break;
        case 'almond':
            score += 30;
            break;
        case 'fly':
            score -= 15;
            velocityMultiplier = Math.min(velocityMultiplier * 1.5, 5); // Limitar o multiplier
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

function spawnSecret(scene) {
    let randomX = Phaser.Math.Between(50, 670);

    let secret = scene.physics.add.sprite(randomX, -50, 'secret')
        .setScale(0.12)
        .setVelocityY(200 * velocityMultiplier)
        .setCollideWorldBounds(true)
        .setBounce(0);

    secret.body.onWorldBounds = true;
    secret.body.allowGravity = true;

    ingredientes.add(secret);
}

function aumentarVelocidade() {
    velocityMultiplier += 0.2;
    console.log(`Aumentando velocidade. Novo multiplier: ${velocityMultiplier}`);
}

function updateLivesText() {
    livesText.setText('Vidas:');
}

function addLifeIcons(scene) {
    let startX = 120; // Após 'Vidas:'
    let startY = 60;
    let spacing = 20;

    for (let i = 0; i < vidas; i++) {
        let lifeIcon = scene.add.image(startX + i * spacing, startY, 'life_icon').setScale(0.02);
        lifeIcons.push(lifeIcon);
    }
}

function removeLifeIcon() {
    if (lifeIcons.length > 0) {
        let lifeIcon = lifeIcons.pop();
        lifeIcon.destroy();
    }
}

function addLifeIcon(scene) {
    if (lifeIcons.length < maxLives) {
        let startX = 120;
        let startY = 60;
        let spacing = 20;
        let lifeIcon = scene.add.image(startX + lifeIcons.length * spacing, startY, 'life_icon').setScale(0.02);
        lifeIcons.push(lifeIcon);
    }
}
