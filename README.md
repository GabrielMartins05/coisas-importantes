# coisas-importantes

Painel pessoal de tarefas (PHP + MySQL), com tema preto e amarelo.

## Rodando localmente

Requisitos: PHP com extensão `mysqli` e um servidor MySQL/MariaDB.

1. Crie o banco e as tabelas:
   ```bash
   mysql -u root -p < schema.sql
   ```
   (ajuste usuário/senha se não usar `root` sem senha, como está em `index.php`)

2. Suba o servidor embutido do PHP escutando em todas as interfaces de rede,
   não só em `localhost`:
   ```bash
   php -S 0.0.0.0:8000
   ```

3. Descubra o IP local do computador na sua rede Wi-Fi:
   - Linux/Mac: `ifconfig` ou `ip a` (procure algo como `192.168.x.x`)
   - Windows: `ipconfig` (campo "Endereço IPv4")

## Vendo no celular

Com o servidor rodando (`0.0.0.0:8000`) e o celular **na mesma rede Wi-Fi**
do computador, abra no navegador do celular:

```
http://SEU_IP_LOCAL:8000
```

Exemplo: `http://192.168.0.15:8000`

Isso funciona porque `php -S 0.0.0.0:8000` expõe o servidor para a rede
local (usar `localhost` ou `127.0.0.1` só funcionaria no próprio computador).
O layout já é responsivo (o CSS tem `@media` que reduz o grid para 1 coluna
em telas menores), então nesse endereço o site já deve aparecer adaptado ao
celular.

Se preferir apenas testar a responsividade sem usar o celular físico, dá
para usar o modo de emulação de dispositivo do navegador (DevTools do
Chrome/Firefox, ícone de celular/tablet, `Ctrl+Shift+M` no Chrome).

Para acesso fora da rede local (sem estar no mesmo Wi-Fi), é necessário
publicar o site em um servidor com PHP e MySQL (hospedagem compartilhada,
VPS, etc.) ou usar um túnel temporário como `ngrok`/`cloudflared` apontando
para a porta 8000.
