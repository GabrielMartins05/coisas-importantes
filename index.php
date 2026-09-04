<?php
// 1. Conexão com o banco de dados
$conexao = mysqli_connect("localhost", "root", "", "meu_painel");

if (!$conexao) {
    die("Erro ao conectar ao banco de dados: " . mysqli_connect_error());
}

// Controla se exibe ou esconde os itens concluídos
session_start();
if (isset($_GET['mostrar_concluidos'])) {
    $_SESSION['mostrar_concluidos'] = $_GET['mostrar_concluidos'] === '1';
    header("Location: " . strtok($_SERVER["REQUEST_URI"], '?'));
    exit;
}
$mostrar_concluidos = $_SESSION['mostrar_concluidos'] ?? false;

// 2. PROCESSAR AÇÕES (CRIAR, EDITAR, STATUS, PRAZO)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $acao = $_POST['acao'] ?? '';

    // Criar Tópico
    if ($acao === 'criar_topico') {
        $nome = trim($_POST['nome_topico']);
        $data_inicio = $_POST['data_inicio'] ?? '';
        $data_limite = $_POST['data_limite'] ?? '';

        if (empty($data_inicio)) {
            $data_inicio = date('Y-m-d');
        }
        $data_limite = !empty($data_limite) ? $data_limite : null;

        if (!empty($nome)) {
            $stmt = mysqli_prepare($conexao, "INSERT INTO topicos (nome, data_inicio, data_limite) VALUES (?, ?, ?)");
            mysqli_stmt_bind_param($stmt, "sss", $nome, $data_inicio, $data_limite);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
    }

    // Criar Item
    if ($acao === 'criar_item') {
        $topico_id = (int)$_POST['topico_id'];
        $titulo = trim($_POST['titulo']);
        if (!empty($titulo)) {
            $stmt = mysqli_prepare($conexao, "INSERT INTO itens (topico_id, titulo) VALUES (?, ?)");
            mysqli_stmt_bind_param($stmt, "is", $topico_id, $titulo);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
    }

    // Editar Item
    if ($acao === 'editar_item') {
        $id = (int)$_POST['item_id'];
        $titulo = trim($_POST['titulo']);
        if (!empty($titulo)) {
            $stmt = mysqli_prepare($conexao, "UPDATE itens SET titulo = ? WHERE id = ?");
            mysqli_stmt_bind_param($stmt, "si", $titulo, $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
    }

    // Alternar Concluído / Pendente
    if ($acao === 'alternar_status') {
        $id = (int)$_POST['item_id'];
        $status_atual = (int)$_POST['status_atual'];
        $novo_status = ($status_atual === 1) ? 0 : 1;

        $stmt = mysqli_prepare($conexao, "UPDATE itens SET concluido = ? WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "ii", $novo_status, $id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }

    // Definir Prazo do Tópico
    if ($acao === 'definir_prazo') {
        $topico_id = (int)$_POST['topico_id'];
        $data_limite = $_POST['data_limite'] ?? '';
        if (!empty($data_limite)) {
            $stmt = mysqli_prepare(
                $conexao,
                "UPDATE topicos SET data_inicio = COALESCE(data_inicio, CURDATE()), data_limite = ? WHERE id = ?"
            );
            mysqli_stmt_bind_param($stmt, "si", $data_limite, $topico_id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
    }

    header("Location: " . $_SERVER['PHP_SELF']);
    exit;
}

// 3. PROCESSAR EXCLUSÕES (GET)
if (isset($_GET['apagar_topico'])) {
    $id = (int)$_GET['apagar_topico'];
    $stmt = mysqli_prepare($conexao, "DELETE FROM topicos WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);
    header("Location: " . $_SERVER['PHP_SELF']);
    exit;
}

if (isset($_GET['apagar_item'])) {
    $id = (int)$_GET['apagar_item'];
    $stmt = mysqli_prepare($conexao, "DELETE FROM itens WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);
    header("Location: " . $_SERVER['PHP_SELF']);
    exit;
}

// Buscar Tópicos
$res_topicos = mysqli_query($conexao, "SELECT * FROM topicos ORDER BY id ASC");
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IMPORTANTE</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div class="container">

        <!-- HEADER -->
        <div class="header-box">
            <div class="header-title">
                <h1>Apenas comece</h1>
                <p>Seu painel pessoal de tarefas e lembretes</p>
            </div>

            <div class="header-actions">
                <a href="?mostrar_concluidos=<?= $mostrar_concluidos ? '0' : '1' ?>" class="btn btn-secondary">
                    <?= $mostrar_concluidos ? 'Ocultar Concluídos' : 'Mostrar Concluídos' ?>
                </a>

                <form action="" method="POST" class="form-inline" style="gap: 8px;">
                    <input type="hidden" name="acao" value="criar_topico">
                    <input type="text" name="nome_topico" placeholder="Novo Tópico..." required style="width: 160px;">
                    <input type="date" name="data_inicio" title="Data de início (padrão: hoje)" value="<?= date('Y-m-d') ?>">
                    <input type="date" name="data_limite" title="Data de término (opcional)">
                    <button type="submit">➕ Criar</button>
                </form>
            </div>
        </div>

        <!-- GRID DE TÓPICOS -->
        <div class="grid-container">

            <?php while ($topico = mysqli_fetch_assoc($res_topicos)): ?>
                <div class="card">
                    <!-- BOTÃO FLUTUANTE DE APAGAR TÓPICO -->
                    <a href="?apagar_topico=<?= $topico['id'] ?>"
                       class="btn-del-topico"
                       title="Apagar Tópico"
                       onclick="return confirm('Apagar o tópico \'<?= htmlspecialchars($topico['nome']) ?>\' e todos os seus itens?')">
                        ✕
                    </a>

                    <div class="card-header">
                        <h2><?= htmlspecialchars($topico['nome']) ?></h2>
                    </div>

                    <!-- LINHA DE PRAZO DO TÓPICO -->
                    <?php
                    $classe_prazo = '';
                    $texto_prazo = '';
                    if (!empty($topico['data_limite'])) {
                        $hoje = new DateTime('today');
                        $limite = new DateTime($topico['data_limite']);
                        $dias = (int)$hoje->diff($limite)->format('%r%a');

                        if ($dias < 0) {
                            $classe_prazo = 'prazo-vencido';
                            $texto_prazo = 'Prazo estourado há ' . abs($dias) . ' dia(s)';
                        } elseif ($dias === 0) {
                            $classe_prazo = 'prazo-atencao';
                            $texto_prazo = 'Vence hoje!';
                        } elseif ($dias <= 2) {
                            $classe_prazo = 'prazo-atencao';
                            $texto_prazo = 'Faltam ' . $dias . ' dia(s)';
                        } else {
                            $classe_prazo = 'prazo-ok';
                            $texto_prazo = 'Faltam ' . $dias . ' dia(s)';
                        }
                    }
                    ?>

                    <div class="prazo-linha">
                        <?php if ($texto_prazo): ?>
                            <span class="prazo-badge <?= $classe_prazo ?>">
                                <?= $texto_prazo ?>
                                <?php if (!empty($topico['data_inicio'])): ?>
                                    <small class="prazo-datas">
                                        (<?= (new DateTime($topico['data_inicio']))->format('d/m') ?> → <?= (new DateTime($topico['data_limite']))->format('d/m') ?>)
                                    </small>
                                <?php endif; ?>
                            </span>
                        <?php endif; ?>
                    </div> <!-- Fechamento da div prazo-linha corrigido -->

                    <!-- FORMULÁRIO DE ADICIONAR ITEM -->
                    <form action="" method="POST" class="form-inline" style="gap: 8px; margin-bottom: 16px;">
                        <input type="hidden" name="acao" value="criar_item">
                        <input type="hidden" name="topico_id" value="<?= $topico['id'] ?>">
                        <input type="text" name="titulo" placeholder="Adicionar item..." required style="flex-grow: 1;">
                        <button type="submit">+</button>
                    </form>

                    <!-- CONSULTA ITENS (COM PREPARED STATEMENT POR SEGURANÇA) -->
                    <?php
                    $topico_id = (int)$topico['id'];
                    $sql_itens = "SELECT *, DATE_FORMAT(criado_em, '%d/%m/%Y') as data_f FROM itens WHERE topico_id = ?";

                    if (!$mostrar_concluidos) {
                        $sql_itens .= " AND concluido = 0";
                    }
                    $sql_itens .= " ORDER BY concluido ASC, id DESC";

                    $stmt_itens = mysqli_prepare($conexao, $sql_itens);
                    mysqli_stmt_bind_param($stmt_itens, "i", $topico_id);
                    mysqli_stmt_execute($stmt_itens);
                    $res_itens = mysqli_stmt_get_result($stmt_itens);
                    ?>

                    <table>
                        <?php if (mysqli_num_rows($res_itens) > 0): ?>
                            <?php while ($item = mysqli_fetch_assoc($res_itens)): ?>
                                <tr>
                                    <td style="width: 65%;">
                                        <form action="" method="POST" class="form-inline" style="width: 100%;">
                                            <input type="hidden" name="acao" value="editar_item">
                                            <input type="hidden" name="item_id" value="<?= $item['id'] ?>">
                                            <input type="text"
                                                   name="titulo"
                                                   value="<?= htmlspecialchars($item['titulo']) ?>"
                                                   class="item-input <?= $item['concluido'] ? 'item-concluido' : '' ?>"
                                                   onchange="this.form.submit()">
                                        </form>
                                        <span class="data-item"><?= $item['data_f'] ?></span>
                                    </td>
                                    <td style="text-align: right; padding-right: 8px;">
                                        <form action="" method="POST" class="form-inline">
                                            <input type="hidden" name="acao" value="alternar_status">
                                            <input type="hidden" name="item_id" value="<?= $item['id'] ?>">
                                            <input type="hidden" name="status_atual" value="<?= $item['concluido'] ?>">

                                            <button type="submit" class="badge badge-status status-<?= $item['concluido'] ?>">
                                                <?= $item['concluido'] ? '✓ Feito' : ' Fazer' ?>
                                            </button>
                                        </form>
                                    </td>
                                    <td style="width: 20px; text-align: right;">
                                        <a href="?apagar_item=<?= $item['id'] ?>"
                                           class="btn-excluir-item"
                                           onclick="return confirm('Excluir este item?')"
                                           title="Excluir">
                                            ×
                                        </a>
                                    </td>
                                </tr>
                            <?php endwhile; ?>
                        <?php else: ?>
                            <tr><td colspan="3" class="empty-state">Nenhum item por aqui.</td></tr>
                        <?php endif; ?>
                        <?php mysqli_stmt_close($stmt_itens); ?>
                    </table>
                </div>
            <?php endwhile; ?>

        </div>

    </div>

</body>
</html>
