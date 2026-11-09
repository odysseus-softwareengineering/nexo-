# Modelo de acesso de dependentes

## Papéis
- `guardian`: responsável legal/administrador da família.
- `child`: criança.
- `teen`: adolescente.

## Modos configuráveis por dependente
- `managed`: sem conta própria; responsável registra as movimentações.
- `individual`: conta autenticada vinculada ao membro familiar; pode registrar e consultar apenas suas próprias movimentações. Responsável mantém visão familiar.

## Regras de produto
1. Somente responsáveis alteram papel, modo de acesso, mesada, orçamento e configuração familiar.
2. Uma conta individual nunca escolhe livremente o `family_id` para se vincular. O vínculo deve ocorrer por convite/token de uso único validado no servidor.
3. Menores não devem ter acesso a dados de outros membros nem permissões administrativas.
4. A interface deve explicar de forma clara ao menor e ao responsável quais dados são registrados e quem consegue visualizá-los.
5. O responsável pode desativar o acesso individual sem apagar o histórico financeiro.
6. Não armazenar senha de menor nem credenciais fora do Supabase Auth.

## Limites da implementação atual
A tela Família salva a escolha apenas no AsyncStorage. O SQL habilita RLS e fornece políticas iniciais, mas ainda exige fluxo seguro de convite, testes de autorização e revisão de segurança antes de produção.
