(function () {
    'use strict';

    const CHAVE_PERFIL = 'academia_perfil';
    const CHAVE_REGISTROS = 'academia_registros';
    const KCAL_POR_KG = 7700;

    function carregarPerfil() {
        try {
            const bruto = localStorage.getItem(CHAVE_PERFIL);
            return bruto ? JSON.parse(bruto) : null;
        } catch (e) {
            return null;
        }
    }

    function salvarPerfil(perfil) {
        localStorage.setItem(CHAVE_PERFIL, JSON.stringify(perfil));
    }

    function carregarRegistros() {
        try {
            const bruto = localStorage.getItem(CHAVE_REGISTROS);
            return bruto ? JSON.parse(bruto) : {};
        } catch (e) {
            return {};
        }
    }

    function salvarRegistros(registros) {
        localStorage.setItem(CHAVE_REGISTROS, JSON.stringify(registros));
    }

    let perfil = carregarPerfil();
    let registros = carregarRegistros();

    function hojeISO() {
        const d = new Date();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mes}-${dia}`;
    }

    function paraDataLocal(iso) {
        const [ano, mes, dia] = iso.split('-').map(Number);
        return new Date(ano, mes - 1, dia);
    }

    function formatarDDMMYYYY(iso) {
        const d = paraDataLocal(iso);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    function numeroBR(valor, casas) {
        return Number(valor).toLocaleString('pt-BR', {
            minimumFractionDigits: casas,
            maximumFractionDigits: casas,
        });
    }

    function calcularStats() {
        const peso_atual = parseFloat(perfil.peso_atual);
        const peso_meta = parseFloat(perfil.peso_meta);
        const altura = parseInt(perfil.altura, 10);
        const idade = parseInt(perfil.idade, 10);
        const sexo = perfil.sexo;
        const nivel_atividade = parseFloat(perfil.nivel_atividade);
        const deficit_diario = parseInt(perfil.deficit_diario, 10);

        let tmb;
        if (sexo === 'M') {
            tmb = (10 * peso_atual) + (6.25 * altura) - (5 * idade) + 5;
        } else {
            tmb = (10 * peso_atual) + (6.25 * altura) - (5 * idade) - 161;
        }
        const get = tmb * nivel_atividade;
        const meta_calorica = get - deficit_diario;

        const historico = Object.keys(registros)
            .map((data) => ({ data, ...registros[data] }))
            .sort((a, b) => (a.data < b.data ? 1 : -1));

        const comCalorias = historico.filter((r) => r.calorias !== undefined && r.calorias !== null);
        let deficit_medio_real = deficit_diario;
        if (comCalorias.length > 0) {
            const soma = comCalorias.reduce((acc, r) => acc + (get - r.calorias), 0);
            deficit_medio_real = soma / comCalorias.length;
        }

        const diferenca_peso = peso_atual - peso_meta;
        let dias_necessarios = 0;
        let semanas_estimadas = 0;
        if (diferenca_peso > 0 && deficit_medio_real > 0) {
            dias_necessarios = Math.ceil((diferenca_peso * KCAL_POR_KG) / deficit_medio_real);
            semanas_estimadas = Math.ceil(dias_necessarios / 7);
        }

        return {
            peso_atual, peso_meta, meta_calorica, deficit_diario,
            dias_registrados: comCalorias.length, deficit_medio_real,
            diferenca_peso, dias_necessarios, semanas_estimadas,
            historico, get,
        };
    }

    function renderizarDashboard() {
        const stats = calcularStats();

        document.getElementById('saudacao').textContent = `Bem-vindo, ${perfil.nome}!`;
        document.getElementById('stat-peso-atual').textContent = `${numeroBR(stats.peso_atual, 2)} kg`;
        document.getElementById('stat-peso-meta').textContent = `${numeroBR(stats.peso_meta, 2)} kg`;
        document.getElementById('stat-meta-calorica').textContent = `${numeroBR(stats.meta_calorica, 0)} kcal`;
        document.getElementById('stat-deficit-planejado').textContent = `${stats.deficit_diario} kcal`;

        const linhaReal = document.getElementById('linha-deficit-real');
        if (stats.dias_registrados > 0) {
            linhaReal.hidden = false;
            document.getElementById('label-deficit-real').textContent =
                `Déficit médio real (últimos ${stats.dias_registrados} dias)`;
            document.getElementById('stat-deficit-real').textContent = `${numeroBR(stats.deficit_medio_real, 0)} kcal`;
        } else {
            linhaReal.hidden = true;
        }

        const destaque = document.getElementById('destaque-meta');
        if (stats.diferenca_peso <= 0) {
            destaque.textContent = 'Você atingiu sua meta!';
        } else if (stats.dias_necessarios > 0) {
            destaque.textContent =
                `Faltam aproximadamente ${stats.dias_necessarios} dias (≈ ${stats.semanas_estimadas} semanas) ` +
                `para atingir sua meta${stats.dias_registrados > 0 ? ', com base no seu ritmo real' : ' (estimativa inicial)'}.`;
        } else {
            destaque.textContent = 'Aumente seu déficit calórico diário para conseguirmos estimar quando você atinge a meta.';
        }

        const semRegistros = document.getElementById('sem-registros');
        const tabela = document.getElementById('tabela-historico');
        const corpo = document.getElementById('corpo-historico');
        corpo.innerHTML = '';

        if (stats.historico.length === 0) {
            semRegistros.hidden = false;
            tabela.hidden = true;
        } else {
            semRegistros.hidden = true;
            tabela.hidden = false;

            stats.historico.forEach((reg) => {
                const tr = document.createElement('tr');

                const tdData = document.createElement('td');
                tdData.textContent = formatarDDMMYYYY(reg.data);
                tr.appendChild(tdData);

                const tdPeso = document.createElement('td');
                tdPeso.textContent = (reg.peso !== undefined && reg.peso !== null) ? `${numeroBR(reg.peso, 1)} kg` : '-';
                tr.appendChild(tdPeso);

                const tdConsumido = document.createElement('td');
                const temCalorias = reg.calorias !== undefined && reg.calorias !== null;
                tdConsumido.textContent = temCalorias ? `${reg.calorias} kcal` : '-';
                tr.appendChild(tdConsumido);

                const tdMeta = document.createElement('td');
                tdMeta.textContent = `${numeroBR(stats.meta_calorica, 0)} kcal`;
                tr.appendChild(tdMeta);

                const tdStatus = document.createElement('td');
                if (temCalorias) {
                    const bateu = reg.calorias <= stats.meta_calorica;
                    const span = document.createElement('span');
                    span.className = `badge ${bateu ? 'badge-ok' : 'badge-fora'}`;
                    span.textContent = bateu ? 'Bateu a meta' : 'Passou da meta';
                    tdStatus.appendChild(span);
                } else {
                    tdStatus.textContent = '-';
                }
                tr.appendChild(tdStatus);

                const tdAcao = document.createElement('td');
                tdAcao.className = 'acoes-registro';

                const btnEditar = document.createElement('button');
                btnEditar.type = 'button';
                btnEditar.className = 'btn-editar';
                btnEditar.textContent = 'Editar';
                btnEditar.addEventListener('click', () => editarRegistro(reg));
                tdAcao.appendChild(btnEditar);

                const btnExcluir = document.createElement('button');
                btnExcluir.type = 'button';
                btnExcluir.className = 'btn-excluir';
                btnExcluir.textContent = 'Excluir';
                btnExcluir.addEventListener('click', () => excluirRegistro(reg.data));
                tdAcao.appendChild(btnExcluir);

                tr.appendChild(tdAcao);
                corpo.appendChild(tr);
            });
        }
    }

    function mostrarTela(tela) {
        document.getElementById('tela-cadastro').hidden = tela !== 'cadastro';
        document.getElementById('tela-dashboard').hidden = tela !== 'dashboard';
    }

    function render() {
        if (!perfil) {
            document.getElementById('form-cadastro').reset();
            document.getElementById('btn-cancelar-cadastro').hidden = true;
            mostrarTela('cadastro');
            return;
        }
        renderizarDashboard();
        mostrarTela('dashboard');
    }

    function editarRegistro(reg) {
        document.getElementById('reg-data').value = reg.data;
        document.getElementById('reg-peso').value = (reg.peso !== undefined && reg.peso !== null) ? reg.peso : '';
        document.getElementById('reg-calorias').value = (reg.calorias !== undefined && reg.calorias !== null) ? reg.calorias : '';
        document.getElementById('btn-cancelar-registro').hidden = false;
        document.getElementById('form-registro').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function excluirRegistro(data) {
        if (!confirm(`Tem certeza que deseja apagar o registro do dia ${formatarDDMMYYYY(data)}?`)) return;
        delete registros[data];
        salvarRegistros(registros);
        render();
    }

    document.getElementById('form-cadastro').addEventListener('submit', (e) => {
        e.preventDefault();
        const dados = new FormData(e.target);
        perfil = {
            nome: dados.get('nome').trim(),
            peso_atual: parseFloat(dados.get('peso')),
            peso_meta: parseFloat(dados.get('peso_meta')),
            altura: parseInt(dados.get('altura'), 10),
            idade: parseInt(dados.get('idade'), 10),
            sexo: dados.get('sexo'),
            nivel_atividade: parseFloat(dados.get('atividade')),
            deficit_diario: parseInt(dados.get('deficit'), 10),
        };
        if (!perfil.nome) return;
        salvarPerfil(perfil);
        render();
    });

    document.getElementById('btn-editar-perfil').addEventListener('click', () => {
        document.getElementById('nome').value = perfil.nome;
        document.getElementById('peso').value = perfil.peso_atual;
        document.getElementById('peso_meta').value = perfil.peso_meta;
        document.getElementById('altura').value = perfil.altura;
        document.getElementById('idade').value = perfil.idade;
        document.getElementById('sexo').value = perfil.sexo;
        document.getElementById('atividade').value = perfil.nivel_atividade;
        document.getElementById('deficit').value = perfil.deficit_diario;
        document.getElementById('btn-cancelar-cadastro').hidden = false;
        mostrarTela('cadastro');
    });

    document.getElementById('btn-cancelar-cadastro').addEventListener('click', () => {
        render();
    });

    document.getElementById('form-registro').addEventListener('submit', (e) => {
        e.preventDefault();
        const dados = new FormData(e.target);
        const data = dados.get('data');
        const pesoRaw = dados.get('peso');
        const caloriasRaw = dados.get('calorias');
        if (!data) return;

        const registro = {};
        if (pesoRaw !== '') {
            registro.peso = parseFloat(pesoRaw);
            perfil.peso_atual = registro.peso;
            salvarPerfil(perfil);
        }
        if (caloriasRaw !== '') {
            registro.calorias = parseInt(caloriasRaw, 10);
        }
        registros[data] = { ...(registros[data] || {}), ...registro };

        salvarRegistros(registros);
        e.target.reset();
        document.getElementById('reg-data').value = hojeISO();
        document.getElementById('btn-cancelar-registro').hidden = true;
        render();
    });

    document.getElementById('btn-cancelar-registro').addEventListener('click', () => {
        document.getElementById('form-registro').reset();
        document.getElementById('reg-data').value = hojeISO();
        document.getElementById('btn-cancelar-registro').hidden = true;
    });

    document.getElementById('reg-data').value = hojeISO();
    render();
})();
