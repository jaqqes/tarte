// Configuração básica do Phaser
const config = {
    type: Phaser.AUTO,
    width: 720,
    height: 1280,
    backgroundColor: '#1d212d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }, // Mantém a gravidade para a queda dos ingredientes
            debug: false // Desativado para eliminar o rasto verde
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
let bowlPlayer; // Substituído de espatula para bowlPlayer
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
        { key: 'bowl_player', path: 'images/bowl.png' }, // Renomeado para bowl_player
        { key: 'life_icon', path: 'images/life_icon.png' },
        { key: 'mouse', path: 'images/mouse.png' },
        { key: 'sugar', path: 'images/sugar.png' },
        { key: 'bowl_ingredient', path: 'images/bowl_ingredient.png' } // Separa o bowl do player
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

    // Adicionar o Bowl como Player
    bowlPlayer = this.physics.add.sprite(360, 1200, 'bowl_player') // Ajustei y para 1200 para ficar na parte inferior
        .setCollideWorldBounds(true)
        .setScale(0.4); // Ajuste o scale conforme necessário para torná-lo visível
    console.log('Bowl Player criado:', bowlPlayer);

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

    // Colisão entre Bowl Player e ingredientes
    this.physics.add.overlap(bowlPlayer, ingredientes, collectIngrediente, null, this);
    console.log('Colisão entre Bowl Player e ingredientes configurada.');

    // Colisão dos ingredientes com o fundo do ecrã
    ingredientes.children.iterate(function (child) {
        child.body.setCollideWorldBounds(true);
        child.body.onWorldBounds = true;
    });

    this.physics.world.on('worldbounds', function (body) {
        if (body.gameObject && ingredientes.contains(body.gameObject)) {
            // Ingrediente alcançou o fundo do ecrã sem ser apanhado
            console.log(`Ingrediente perdido: ${body.gameObject.texture.key}`);
            if (body.gameObject.texture.key !== 'mouse') { // Se não for 'mouse', decrementa vida
                vidas--;
                if (vidas < 0) vidas = 0;
                livesText.setText('Vidas:'); // Manter 'Vidas:' fixo
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
        console.log('Movendo Bowl Player para a esquerda');
        bowlPlayer.setVelocityX(-300); // Aumentei para 300
    } else if (cursors.right.isDown) {
        console.log('Movendo Bowl Player para a direita');
        bowlPlayer.setVelocityX(300); // Aumentei para 300
    } else {
        bowlPlayer.setVelocityX(0);
    }

    if (time - lastSpeedIncrease > 20000) {
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
    console.log('Tentando criar novo ingrediente');
    let ingredientesBons = ['egg', 'flour', 'almond', 'sugar', 'bowl_ingredient'];
    let ingredientesMaus = ['fly', 'chili_pepper', 'mouse'];
    let randomX = Phaser.Math.Between(50, 670);
    let randomIngrediente;

    if (Phaser.Math.Between(0, 10) > 3) {
        randomIngrediente = ingredientesBons[Phaser.Math.Between(0, ingredientesBons.length - 1)];
    } else {
        randomIngrediente = ingredientesMaus[Phaser.Math.Between(0, ingredientesMaus.length - 1)];
    }

    console.log(`Spawnando ingrediente: ${randomIngrediente} na posição X: ${randomX}`);

    let ingrediente = scene.physics.add.sprite(randomX, 0, randomIngrediente)
        .setScale(0.12) // Ajuste o scale conforme necessário para torná-lo visível
        .setVelocityY(200 * velocityMultiplier); // Aumentei a velocidade
    ingredientes.add(ingrediente);
    console.log(`Ingrediente criado: ${randomIngrediente}`);

    // Adicionar colisão com o fundo do ecrã
    ingrediente.body.setCollideWorldBounds(true);
    ingrediente.body.onWorldBounds = true;
}

function collectIngrediente(bowl, ingrediente) {
    console.log(`Ingrediente coletado: ${ingrediente.texture.key}`);
    ingrediente.disableBody(true, true);

    switch (ingrediente.texture.key) {
        case 'egg':
        case 'flour':
        case 'bowl_ingredient':
        case 'sugar':
            score += 10;
            break;
        case 'almond':
            score += 30;
            break;
        case 'fly':
            score -= 15;
            velocityMultiplier *= 1.5; // Ajustei para 1.5 para evitar aumento muito rápido
            break;
        case 'chili_pepper':
            score -= 20;
            break;
        case 'mouse':
            vidas--; // Decrementa a vida
            if (vidas < 0) vidas = 0; // Garantir que vidas não sejam negativas
            livesText.setText('Vidas:'); // Manter 'Vidas:' fixo
            removeLifeIcon();
            break;
        case 'secret':
            if (vidas < maxLives) { // Verifica se não excede o máximo de vidas
                vidas++;
                livesText.setText('Vidas:'); // Manter 'Vidas:' fixo
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
    let randomX = Phaser.Math​⬤
