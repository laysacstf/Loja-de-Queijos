const express = require('express');
const fs = require('fs').promises; 
const path = require('path');

const FILE_PATH = path.join(__dirname, 'queijos.json');
const PORT = 3000;

let queijosIniciais = [{
        id: 1,
        nome: 'Queijo Mussarela',
        tipo: 'Fresco',
        preco: 20.50,
        peso: 500,
        origem: 'Brasil',
        dataCadastro: '2023-01-15T12:00:00Z'
    },
    {
        id: 2,
        nome: 'Queijo Cheddar',
        tipo: 'Curado',
        preco: 35.00,
        peso: 300,
        origem: 'Inglaterra',
        dataCadastro: '2023-02-20T14:30:00Z'
    },
    {
        id: 3,
        nome: 'Queijo Gorgonzola',
        tipo: 'Azul',
        preco: 45.75,
        peso: 400,
        origem: 'Itália',
        dataCadastro: '2023-03-10T09:15:00Z'
    },
    {
        id: 4,
        nome: 'Queijo Brie',
        tipo: 'Fresco',
        preco: 28.90,
        peso: 200,
        origem: 'França',
        dataCadastro: '2023-04-05T11:45:00Z'
    }
]; 
let currentId = 1; 


async function loadData() {
    try {
        const data = await fs.readFile(FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Arquivo queijos.json não encontrado. Iniciando com array vazio.');
            return []; 
        } else if (error instanceof SyntaxError) {
            console.error('Erro ao parsear queijos.json. Retornando array vazio.');
            return [];
        } else {
            throw error; 
        }
    }
}

async function saveData(data) {
    try {
        await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        throw error; 
    }
}
async function init() {
    try {
        queijos = await loadData(); 
        if (queijos.length === 0) {  
            queijos = queijosIniciais;  
            await saveData(queijos);  
        }
        if (queijos.length > 0) {
            currentId = Math.max(...queijos.map(q => q.id)) + 1;
        }
    } catch (error) {
        console.error('Erro durante a inicialização:', error);
        queijos = queijosIniciais;  
        await saveData(queijos);
    }
}


const app = express();
app.use(express.json());

app.get('/queijos', (req, res) => {
    res.json(queijos);
});

app.get('/queijos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const queijo = queijos.find(q => q.id === id);
    if (queijo) {
        res.json(queijo);
    } else {
        res.status(404).json({ error: 'Queijo não encontrado' });
    }
});

app.post('/queijos', async (req, res) => {
    const { nome, tipo, preco, peso } = req.body;
    
    if (!nome || !preco) {
        return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }
    
    if (isNaN(parseFloat(preco))) {
        return res.status(400).json({ error: 'Preço deve ser um número válido' });
    }
    
    const novoQueijo = {
        id: currentId++,
        nome,
        tipo: tipo || 'Não especificado',
        preco: parseFloat(preco),
        peso: peso || 0,
        origem: 'Não especificada',
        dataCadastro: new Date().toISOString()
    };
    
    queijos.push(novoQueijo);
    
    try {
        await saveData(queijos); 
        res.status(201).json(novoQueijo);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar o novo queijo' });
    }
});

app.put('/queijos/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { nome, tipo, preco, peso } = req.body;
    
    if (!nome || !preco) {
        return res.status(400).json({ error: 'Nome e preço são obrigatórios para atualização' });
    }
    
    if (isNaN(parseFloat(preco))) {
        return res.status(400).json({ error: 'Preço deve ser um número válido' });
    }
    
    const index = queijos.findIndex(q => q.id === id);
    
    if (index !== -1) {
        queijos[index] = {
            ...queijos[index],
            nome,
            tipo: tipo || queijos[index].tipo,
            preco: parseFloat(preco),
            peso: peso || queijos[index].peso
        };
        
        try {
            await saveData(queijos); 
            res.json(queijos[index]);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao salvar a atualização' });
        }
    } else {
        res.status(404).json({ error: 'Queijo não encontrado' });
    }
});

app.delete('/queijos/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const index = queijos.findIndex(q => q.id === id);
    
    if (index !== -1) {
        const deletedQueijo = queijos.splice(index, 1)[0];
        
        try {
            await saveData(queijos); 
            res.json(deletedQueijo);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao salvar após exclusão' });
        }
    } else {
        res.status(404).json({ error: 'Queijo não encontrado' });
    }
});

app.post('/queijos/lote', async (req, res) => {
    const lote = req.body; 
    
    if (!Array.isArray(lote) || lote.length === 0) {
        return res.status(400).json({ error: 'O lote deve ser um array de queijos' });
    }
    
    for (const item of lote) {
        if (!item.nome || !item.preco) {
            return res.status(400).json({ error: 'Cada item do lote deve ter nome e preço' });
        }
        
        if (isNaN(parseFloat(item.preco))) {
            return res.status(400).json({ error: 'Preço em um item do lote deve ser um número válido' });
        }
        
        const novoQueijo = {
            id: currentId++,
            nome: item.nome,
            tipo: item.tipo || 'Não especificado',
            preco: parseFloat(item.preco),
            peso: item.peso || 0,
            origem: 'Não especificada',
            dataCadastro: new Date().toISOString()
        };
        
        queijos.push(novoQueijo);
    }
    
    try {
        await saveData(queijos); 
        res.status(201).json(queijos.slice(-lote.length)); 
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar o lote' });
    }
});

(async () => {
    await init();
    app.listen(PORT, () => {
        console.log(`API Loja de Queijos rodando na porta ${PORT}`);
    });
})();
