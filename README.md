# Meu Fluxo

Aplicação pessoal para acompanhar receitas, despesas e investimentos. Ela funciona gratuitamente no GitHub Pages e salva os dados apenas no navegador em uso.

## O que já está pronto

- Sem login, senha ou e-mail.
- Lançamentos de receitas e despesas por categoria.
- Resumo mensal, saldo, categorias de despesas e análises automáticas.
- Cadastro do valor atual dos investimentos.
- Backup em arquivo JSON, para guardar e restaurar os dados quando precisar.

## Rodar localmente

Abra a pasta com um servidor estático. Por exemplo, com a extensão Live Server do VS Code, abra `index.html` usando **Open with Live Server**. Não abra apenas o arquivo diretamente (`file://`), pois módulos JavaScript externos podem ser bloqueados pelo navegador.

## Publicar no GitHub Pages

1. Crie um repositório privado no GitHub e envie estes arquivos.
2. Nenhuma configuração adicional é necessária.
3. No repositório, abra **Settings > Pages**, selecione **Deploy from a branch**, a branch `main` e a pasta `/ (root)`.
Os dados ficam salvos no navegador. Use **Exportar backup** regularmente e guarde o arquivo JSON em um local seguro. Para restaurar depois ou em outro computador, use **Importar backup**.
