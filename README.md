# Meu Fluxo

Aplicação pessoal para acompanhar receitas, despesas e investimentos. O frontend foi feito para ser hospedado gratuitamente no GitHub Pages e os dados ficam protegidos no Supabase.

## O que já está pronto

- Login por e-mail e senha, para uma única conta pessoal.
- Lançamentos de receitas e despesas por categoria.
- Resumo mensal, saldo, categorias de despesas e análises automáticas.
- Cadastro do valor atual dos investimentos.
- Segurança por linha (RLS): cada conta só lê e altera os próprios dados.

## Configurar o Supabase

1. Crie um projeto em [Supabase](https://supabase.com/dashboard).
2. Em **SQL Editor**, execute todo o conteúdo de `supabase/schema.sql`.
3. Em **Authentication > Providers > Email**, mantenha o provedor Email ativo.
4. Em **Authentication > Users**, use **Add user** para criar manualmente sua única conta, escolhendo seu e-mail e senha. Não habilite o cadastro público.
5. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.
6. Preencha a URL e a chave ANON em `config.js`. Esse arquivo pode ser publicado: a chave ANON foi feita para uso no navegador, desde que as políticas RLS estejam ativas.

> Nunca use a chave `service_role` no navegador ou no GitHub. A chave `anon` só é segura porque o banco usa as políticas RLS criadas no passo 2.

## Rodar localmente

Abra a pasta com um servidor estático. Por exemplo, com a extensão Live Server do VS Code, abra `index.html` usando **Open with Live Server**. Não abra apenas o arquivo diretamente (`file://`), pois módulos JavaScript externos podem ser bloqueados pelo navegador.

## Publicar no GitHub Pages

1. Crie um repositório privado no GitHub e envie estes arquivos.
2. Confirme que `config.js` contém a URL e a chave **anon public** do seu projeto; ele precisa ir junto com o site.
3. No repositório, abra **Settings > Pages**, selecione **Deploy from a branch**, a branch `main` e a pasta `/ (root)`.
4. No Supabase, em **Authentication > URL Configuration**, inclua a URL final do GitHub Pages em **Site URL** e em **Redirect URLs**.

Para um projeto estritamente pessoal, você também pode manter o repositório privado. A URL do site é pública quando publicada pelo GitHub Pages; o acesso aos dados continua exigindo login e é isolado pelas políticas do Supabase.
