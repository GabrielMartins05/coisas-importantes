(function () {
    'use strict';

    const STORAGE_KEY = 'painel_dados';
    const STORAGE_KEY_CONCLUIDOS = 'painel_mostrar_concluidos';

    function estadoPadrao() {
        return { topicos: [], itens: [], proximoTopicoId: 1, proximoItemId: 1 };
    }

    function carregarEstado() {
        try {
            const bruto = localStorage.getItem(STORAGE_KEY);
            if (!bruto) return estadoPadrao();
            const dados = JSON.parse(bruto);
            return Object.assign(estadoPadrao(), dados);
        } catch (e) {
            return estadoPadrao();
        }
    }

    function salvarEstado() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    }

    function carregarMostrarConcluidos() {
        return localStorage.getItem(STORAGE_KEY_CONCLUIDOS) === '1';
    }

    function salvarMostrarConcluidos(valor) {
        localStorage.setItem(STORAGE_KEY_CONCLUIDOS, valor ? '1' : '0');
    }

    let estado = carregarEstado();
    let mostrarConcluidos = carregarMostrarConcluidos();

    function hojeISO() {
        const d = new Date();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mes}-${dia}`;
    }

    function paraDataLocal(iso) {
        // evita o bug de fuso horário ao usar "new Date('yyyy-mm-dd')"
        const [ano, mes, dia] = iso.split('-').map(Number);
        return new Date(ano, mes - 1, dia);
    }

    function formatarDDMM(iso) {
        const d = paraDataLocal(iso);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    function formatarDDMMYYYY(iso) {
        const d = paraDataLocal(iso);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    function diasEntre(hojeIso, limiteIso) {
        const hoje = paraDataLocal(hojeIso);
        const limite = paraDataLocal(limiteIso);
        const msPorDia = 24 * 60 * 60 * 1000;
        return Math.round((limite - hoje) / msPorDia);
    }

    function calcularPrazo(topico) {
        if (!topico.data_limite) return null;

        const dias = diasEntre(hojeISO(), topico.data_limite);
        let classe, texto;

        if (dias < 0) {
            classe = 'prazo-vencido';
            texto = `Prazo estourado há ${Math.abs(dias)} dia(s)`;
        } else if (dias === 0) {
            classe = 'prazo-atencao';
            texto = 'Vence hoje!';
        } else if (dias <= 2) {
            classe = 'prazo-atencao';
            texto = `Faltam ${dias} dia(s)`;
        } else {
            classe = 'prazo-ok';
            texto = `Faltam ${dias} dia(s)`;
        }

        return { classe, texto };
    }

    function criarTopico(nome, dataInicio, dataLimite) {
        const id = estado.proximoTopicoId++;
        estado.topicos.push({
            id,
            nome,
            data_inicio: dataInicio || hojeISO(),
            data_limite: dataLimite || null,
        });
        salvarEstado();
        renderizar();
    }

    function apagarTopico(topicoId) {
        estado.topicos = estado.topicos.filter((t) => t.id !== topicoId);
        estado.itens = estado.itens.filter((i) => i.topico_id !== topicoId);
        salvarEstado();
        renderizar();
    }

    function criarItem(topicoId, titulo) {
        const id = estado.proximoItemId++;
        estado.itens.push({
            id,
            topico_id: topicoId,
            titulo,
            concluido: 0,
            criado_em: hojeISO(),
        });
        salvarEstado();
        renderizar();
    }

    function editarItem(itemId, novoTitulo) {
        const item = estado.itens.find((i) => i.id === itemId);
        if (item && novoTitulo.trim()) {
            item.titulo = novoTitulo.trim();
            salvarEstado();
        }
    }

    function apagarItem(itemId) {
        estado.itens = estado.itens.filter((i) => i.id !== itemId);
        salvarEstado();
        renderizar();
    }

    function alternarStatus(itemId) {
        const item = estado.itens.find((i) => i.id === itemId);
        if (item) {
            item.concluido = item.concluido ? 0 : 1;
            salvarEstado();
            renderizar();
        }
    }

    function itensDoTopico(topicoId) {
        let itens = estado.itens.filter((i) => i.topico_id === topicoId);
        if (!mostrarConcluidos) {
            itens = itens.filter((i) => !i.concluido);
        }
        itens.sort((a, b) => {
            if (a.concluido !== b.concluido) return a.concluido - b.concluido;
            return b.id - a.id;
        });
        return itens;
    }

    function el(tag, props, filhos) {
        const elemento = document.createElement(tag);
        if (props) {
            for (const chave in props) {
                if (chave === 'class') elemento.className = props[chave];
                else if (chave === 'text') elemento.textContent = props[chave];
                else elemento.setAttribute(chave, props[chave]);
            }
        }
        (filhos || []).forEach((filho) => filho && elemento.appendChild(filho));
        return elemento;
    }

    function renderizarTopico(topico) {
        const card = el('div', { class: 'card' });

        const btnDel = el('a', { class: 'btn-del-topico', title: 'Apagar Tópico', href: '#' }, [
            document.createTextNode('✕'),
        ]);
        btnDel.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm(`Apagar o tópico "${topico.nome}" e todos os seus itens?`)) {
                apagarTopico(topico.id);
            }
        });
        card.appendChild(btnDel);

        const header = el('div', { class: 'card-header' }, [
            el('h2', { text: topico.nome }),
        ]);
        card.appendChild(header);

        const prazoLinha = el('div', { class: 'prazo-linha' });
        const prazo = calcularPrazo(topico);
        if (prazo) {
            const badge = el('span', { class: `prazo-badge ${prazo.classe}` }, [
                document.createTextNode(prazo.texto + ' '),
            ]);
            if (topico.data_inicio) {
                const small = el('small', { class: 'prazo-datas' }, [
                    document.createTextNode(
                        `(${formatarDDMM(topico.data_inicio)} → ${formatarDDMM(topico.data_limite)})`
                    ),
                ]);
                badge.appendChild(small);
            }
            prazoLinha.appendChild(badge);
        }
        card.appendChild(prazoLinha);

        const formItem = el('form', { class: 'form-inline', style: 'gap: 8px; margin-bottom: 16px;' });
        const inputTitulo = el('input', {
            type: 'text',
            placeholder: 'Adicionar item...',
            required: 'required',
            style: 'flex-grow: 1;',
        });
        const btnAdd = el('button', { type: 'submit', text: '+' });
        formItem.appendChild(inputTitulo);
        formItem.appendChild(btnAdd);
        formItem.addEventListener('submit', (e) => {
            e.preventDefault();
            const titulo = inputTitulo.value.trim();
            if (titulo) criarItem(topico.id, titulo);
        });
        card.appendChild(formItem);

        const tabela = el('table');
        const itens = itensDoTopico(topico.id);

        if (itens.length === 0) {
            tabela.appendChild(
                el('tr', {}, [el('td', { colspan: '3', class: 'empty-state', text: 'Nenhum item por aqui.' })])
            );
        } else {
            itens.forEach((item) => {
                const tr = el('tr');

                const tdTitulo = el('td', { style: 'width: 65%;' });
                const inputEdit = el('input', {
                    type: 'text',
                    value: item.titulo,
                    class: `item-input ${item.concluido ? 'item-concluido' : ''}`,
                });
                inputEdit.value = item.titulo;
                inputEdit.addEventListener('change', () => editarItem(item.id, inputEdit.value));
                tdTitulo.appendChild(inputEdit);
                tdTitulo.appendChild(
                    el('span', { class: 'data-item', text: formatarDDMMYYYY(item.criado_em) })
                );
                tr.appendChild(tdTitulo);

                const tdStatus = el('td', { style: 'text-align: right; padding-right: 8px;' });
                const btnStatus = el('button', {
                    type: 'button',
                    class: `badge badge-status status-${item.concluido}`,
                    text: item.concluido ? '✓ Feito' : ' Fazer',
                });
                btnStatus.addEventListener('click', () => alternarStatus(item.id));
                tdStatus.appendChild(btnStatus);
                tr.appendChild(tdStatus);

                const tdExcluir = el('td', { style: 'width: 20px; text-align: right;' });
                const linkExcluir = el('a', {
                    class: 'btn-excluir-item',
                    title: 'Excluir',
                    href: '#',
                    text: '×',
                });
                linkExcluir.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Excluir este item?')) apagarItem(item.id);
                });
                tdExcluir.appendChild(linkExcluir);
                tr.appendChild(tdExcluir);

                tabela.appendChild(tr);
            });
        }

        card.appendChild(tabela);
        return card;
    }

    function renderizar() {
        const grid = document.getElementById('grid-topicos');
        grid.innerHTML = '';
        estado.topicos.forEach((topico) => grid.appendChild(renderizarTopico(topico)));

        const btnToggle = document.getElementById('btn-toggle-concluidos');
        btnToggle.textContent = mostrarConcluidos ? 'Ocultar Concluídos' : 'Mostrar Concluídos';
    }

    document.getElementById('form-criar-topico').addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('input-nome-topico').value.trim();
        const dataInicio = document.getElementById('input-data-inicio').value;
        const dataLimite = document.getElementById('input-data-limite').value;
        if (!nome) return;
        criarTopico(nome, dataInicio, dataLimite);
        e.target.reset();
    });

    document.getElementById('btn-toggle-concluidos').addEventListener('click', () => {
        mostrarConcluidos = !mostrarConcluidos;
        salvarMostrarConcluidos(mostrarConcluidos);
        renderizar();
    });

    document.getElementById('input-data-inicio').value = hojeISO();

    renderizar();
})();
