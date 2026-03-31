import { buildLayout } from "./layout";

export default async function main(game) {
    const container = buildLayout(game.app);
    const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

    game.stage.aim.visible = false;

    // Configura o listener para receber mensagens do worker.
    // Quando o worker enviar uma predição, esta função será chamada.
    // O worker envia mensagens com um tipo "prediction" e as coordenadas x e y.
    // O container é atualizado com os dados da predição, a mira é posicionada e 
    // o clique é simulado no jogo.
    worker.onmessage = ({ data }) => {
        const { type, x, y } = data;

        if (type === 'prediction') {
            console.log(`🎯 AI predicted at: (${x}, ${y})`);
            container.updateHUD(data);
            game.stage.aim.visible = true;

            game.stage.aim.setPosition(data.x, data.y);
            const position = game.stage.aim.getGlobalPosition();

            game.handleClick({
                global: position,
            });

        }

    };

    setInterval(async () => {
        // Extrai o canvas do jogo e cria um ImageBitmap para enviar ao worker.
        const canvas = game.app.renderer.extract.canvas(game.stage);
        const bitmap = await createImageBitmap(canvas);

        // Envia a imagem para o worker processar. 
        // O segundo argumento transfere a propriedade do bitmap, 
        // evitando a necessidade de cloná-lo e melhorando a performance.
        worker.postMessage({
            type: 'predict',
            image: bitmap,
        }, [bitmap]);

    }, 200); // every 200ms

    return container;
}
