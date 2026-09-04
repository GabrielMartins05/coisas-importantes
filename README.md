# coisas-importantes

Painel pessoal de tarefas, tema preto e amarelo. Site 100% estático
(HTML + CSS + JavaScript) — sem PHP, sem banco de dados. Os dados ficam
salvos no `localStorage` do próprio navegador.

## Rodando

Não precisa de servidor nem instalação: é só abrir `index.html` direto no
navegador do computador, ou hospedar os arquivos em qualquer lugar
(GitHub Pages, Netlify, Vercel, etc.).

⚠️ Como os dados ficam salvos no `localStorage`, eles são por navegador/
dispositivo — o que você cria no computador não aparece automaticamente
no celular, e vice-versa, a menos que os dois acessem a mesma URL
publicada (ex: GitHub Pages) e usem o mesmo navegador/perfil.

## Vendo no celular

A forma mais simples é publicar o site (grátis) e abrir a URL pública no
celular, de qualquer rede:

**GitHub Pages** (usando este repositório):
1. No GitHub: Settings → Pages → Source → selecione a branch (ex: `main`) e a
   pasta raiz (`/`).
2. Aguarde a publicação; o GitHub te dará uma URL do tipo
   `https://SEU_USUARIO.github.io/coisas-importantes/`.
3. Abra essa URL no navegador do celular.

**Netlify/Vercel** também funcionam perfeitamente aqui, já que agora é só
HTML/CSS/JS estático — basta importar o repositório e publicar.

Se quiser só testar a responsividade rapidamente sem publicar nada, dá
para abrir o `index.html` local e usar o modo de emulação de dispositivo
do navegador (DevTools do Chrome/Firefox, `Ctrl+Shift+M` no Chrome).

O layout já é responsivo (o CSS ajusta o grid para 1 coluna e empilha os
formulários em telas menores).
