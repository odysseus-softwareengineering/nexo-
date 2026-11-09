# Finanças em Família — aplicativo mobile

Base inicial em React Native + Expo + JavaScript, planejada para Android e iOS. O pacote contém uma demonstração local e o primeiro esquema SQL para Supabase.

## Modelo de acesso familiar decidido

O responsável pode configurar cada dependente individualmente:
- **Gerenciado pelo responsável (`managed`)**: o filho não precisa de login; o responsável registra e acompanha os gastos.
- **Conta individual (`individual`)**: o filho terá login próprio e poderá registrar movimentações vinculadas ao seu perfil. O responsável mantém acesso de gestão familiar.
- A tela Família demonstra a configuração e a experiência. Nesta versão, as opções ainda são armazenadas localmente; não alteram permissões reais até a integração com Supabase.

## O que já funciona nesta versão
- Navegação entre Início, Movimentos, Família, Metas e Aprender.
- Painel com receitas, despesas e saldo calculados a partir dos registros.
- Cadastro local de movimentações e seleção de responsável/categoria.
- Perfis de demonstração Lucas e Sofia, mesada e gastos.
- Configuração demonstrativa do modelo de acesso de cada filho.
- Metas e conteúdos educativos.
- Persistência local via AsyncStorage.

Os dados de exemplo são fictícios. Não há login, sincronização, conexão Supabase nem permissões de produção implementadas no aplicativo ainda.

## Executar no VS Code

1. Instale Node.js LTS e o aplicativo Expo Go no celular.
2. No terminal, crie o projeto Expo:
   ```bash
   npx create-expo-app@latest financas-em-familia --template blank
   cd financas-em-familia
   ```
3. Copie o `App.js` deste pacote para a raiz do projeto.
4. Instale a persistência local:
   ```bash
   npx expo install @react-native-async-storage/async-storage
   ```
5. Inicie:
   ```bash
   npx expo start
   ```
6. Leia o QR Code pelo Expo Go. Para problemas de rede, tente `npx expo start --tunnel`.

## Preparar o Supabase

1. Crie um projeto no painel do Supabase.
2. Abra SQL Editor e revise/executa `supabase-schema-inicial.sql` em um projeto de desenvolvimento vazio.
3. Configure Auth e fluxo de convite/vinculação de dependentes antes de criar contas individuais.
4. Use somente a URL do projeto e a chave `anon`/publishable no app. **Nunca** inclua `service_role` no aplicativo.
5. Antes de dados reais, teste RLS com: responsável da família A, criança com conta individual da família A, dependente gerenciado sem conta e usuário da família B.

O SQL é um ponto de partida, não uma certificação de segurança. Convites, criação da primeira família, associação segura de contas e revisão completa das políticas precisam ser implementados e testados. Não use dados financeiros reais até concluir esses passos.

## Próximas entregas

1. Wireframes finais e componentes reutilizáveis.
2. Autenticação Supabase e criação da família.
3. Convites seguros para contas individuais de menores, com consentimento e controles do responsável.
4. Sincronização de movimentações, orçamentos, metas e relatórios.
5. Testes Android/iOS, privacidade/LGPD e preparação das lojas.
