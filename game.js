// Configuração básica do Phaser
const config = {
    type: Phaser.AUTO,
    width: 720, // Para telemóvel, ajustado para 9:16
    height: 1280,
    backgroundColor: '#1d212d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 }, // Gravidade para os objetos que caem
            debug: false
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
let vidas = 3; // 3 vidas
let score = 0;
let gameOver = false;
let scoreText;
let livesText;
let velocityMultiplier = 1; // Controla o aumento da velocidade
let lastSpeedIncrease = 0;
let secretActive = false; // Controla se o secret pode aparecer

function preload() {
    // Carregar imagens com logs para verificar o carregamento
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
        { key: 'mouse', path: 'images/mouse.png' }, // Adiciona o rato
        { key: 'sugar', path: 'images/sugar.png' }, // Adiciona o açúcar
        { key: 'bowl', path: 'images/bowl.png' } // Adiciona o bowl
    ];

    imagens.forEach(img => {
        console.log(`Carregando imagem: ${img.key} de ${img.path}`);
        this.load.image(img.key, img.path);
    });

    // Adicionar um evento para verificar se todas as imagens foram carregadas
    this.load.on('complete', () => {
        console.log('Todas as imagens foram carregadas com sucesso.');
    });

    this.load.on('filecomplete', (key, type, data) => {
        console.log(`Imagem carregada: ${key}`);
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
    espatula = this.physics.add.sprite(360, 1100, 'spatula')
        .setCollideWorldBounds(true)
        .setScale(0.5); // Ajusta a escala da espátula
    console.log('Espátula adicionada:', espatula);

    // Criar grupo de ingredientes
    ingredientes = this.physics.add.group();
    console.log('Grupo de ingredientes criado.');

    // Gerar os primeiros ingredientes periodicamente
    this.time.addEvent({
        delay: 1000,  // Intervalo de 1 segundo entre ingredientes
        callback: () => spawnIngredientes(this),
        loop: true
    });
    console.log('Evento de spawn de ingredientes configurado.');

    // Controles do jogador (movimento da espátula)
    cursors = this.input.keyboard.createCursorKeys();
    console.log('Controles do jogador configurados.');

    // Texto de pontuação e vidas
    scoreText = this.add.text(16, 16, 'Pontuação: 0', { fontSize: '32px', fill: '#fff' });
    livesText = this.add.text(500, 16, 'Vidas: 3', { fontSize: '32px', fill: '#fff' });
    console.log('Textos de pontuação e vidas adicionados.');

    // Colisão entre espátula e ingredientes
    this.physics.add.overlap(espatula, ingredientes, collectIngrediente, null, this);
    console.log('Colisão entre espátula e ingredientes configurada.');
}

function update(time) {
    // Movimento da espátula
    if (cursors.left.isDown) {
        espatula.setVelocityX(-200); // Aumenta um pouco a velocidade
    } else if (cursors.right.isDown) {
        espatula.setVelocityX(200);
    } else {
        espatula.setVelocityX(0); // Para a espátula se não houver input
    }

    // Aumentar a velocidade a cada 20 segundos
    if (time - lastSpeedIncrease > 20000) {
        aumentarVelocidade();
        lastSpeedIncrease = time;
    }

    // Verificar fim de jogo
    if (vidas <= 0 && !gameOver) {
        gameOver = true;
        this.add.text(200, 600, 'Game Over!', { fontSize: '64px', fill: '#ff0000' });
        this.physics.pause();
        console.log('Game Over!');
    }
}

// Função para gerar os ingredientes
function spawnIngredientes(scene) {
    let ingredientesBons = ['egg', 'flour', 'almond', 'sugar', 'bowl'];
    let ingredientesMaus = ['fly', 'chili_pepper', 'mouse'];
    let randomX = Phaser.Math.Between(50, 670); // Geração aleatória de posição
    let randomIngrediente;

    // Decide aleatoriamente se gera um bom ou mau ingrediente
    if (Phaser.Math.Between(0, 10) > 3) {
        randomIngrediente = ingredientesBons[Phaser.Math.Between(0, ingredientesBons.length - 1)];
    } else {
        randomIngrediente = ingredientesMaus[Phaser.Math.Between(0, ingredientesMaus.length - 1)];
    }

    console.log(`Spawnando ingrediente: ${randomIngrediente} na posição X: ${randomX}`);

    let ingrediente = scene.physics.add.sprite(randomX, 0, randomIngrediente)
        .setScale(0.2) // Ajusta a escala dos ingredientes
        .setVelocityY(150 * velocityMultiplier); // Controla a velocidade com base no tempo
    ingredientes.add(ingrediente);
}

// Função de colisão com os ingredientes
function collectIngrediente(espatula, ingrediente) {
    console.log(`Ingrediente coletado: ${ingrediente.texture.key}`);
    ingrediente.disableBody(true, true); // Desativar o ingrediente quando apanhado

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
            velocityMultiplier *= 2; // Aumenta a velocidade em 2x
            break;
        case 'chili_pepper':
            score -= 20;
            break;
        case 'mouse':
            vidas--;
            livesText.setText('Vidas: ' + vidas);
            break;
        case 'secret':
            vidas++;
            livesText.setText('Vidas: ' + vidas);
            secretActive = false; // Secret já foi apanhado
            break;
    }

    scoreText.setText('Pontuação: ' + score);

    // Verifica se é hora de aparecer o "secret" a cada 100 pontos
    if (score % 100 === 0 && score > 0 && !secretActive) {
        spawnSecret(this); // Gera o "secret"
        secretActive = true; // Ativa o "secret"
    }
}

// Função para gerar o "secret" que concede uma nova vida
function spawnSecret(scene) {
    let randomX = Phaser.Math.Between(50, 670);
    console.log(`Spawnando secret na posição X: ${randomX}`);
    let secret = scene.physics.add.sprite(randomX, 0, 'secret')
        .setScale(0.2) // Ajusta a escala do secret
        .setVelocityY(150 * velocityMultiplier);
    ingredientes.add(secret);
}

// Função para aumentar a velocidade
function aumentarVelocidade() {
    velocityMultiplier += 0.2; // Aumenta a velocidade gradualmente a cada 20 segundos
    console.log(`Aumentando velocidade. Novo multiplier: ${velocityMultiplier}`);
    ingredientes.getChildren().forEach(function (child) {
        child.setVelocityY(150 * velocityMultiplier);
    });
}
