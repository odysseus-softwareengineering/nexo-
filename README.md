Protótipo front-end de um aplicativo de organização financeira familiar, baseado no projeto integrador em PDF. Interface responsiva inspirada na referência visual enviada: tons de verde-oliva, verde-claro, cartões arredondados e visual minimalista.

## Funcionalidades implementadas
- Painel com saldo, receitas, despesas e economia calculados a partir das movimentações.
- Gráfico de colunas comparando receitas e despesas por semana ou por mês (semanas do mês).
- Distribuição das despesas por categoria.
- Cadastro de receitas e despesas, filtros e pesquisa de movimentações.
- Orçamento familiar com limites editáveis por categoria.
- Metas financeiras com criação e acompanhamento de progresso.
- Área de acompanhamento demonstrativo de gastos de crianças/adolescentes (Lucas e Sofia), com mesada e filtro.
- Área educativa sobre consumo consciente, poupança e juros.
- Simulador de compra à vista versus parcelada.
- Persistência dos dados no `localStorage` do navegador e opção de restaurar os dados demonstrativos.

## Observações importantes
- Os dados iniciais são fictícios e servem apenas para demonstrar o funcionamento do protótipo.
- Os registros ficam armazenados localmente no navegador utilizado. Não há login, sincronização entre dispositivos, integração bancária ou servidor.
- O monitoramento de menores foi desenhado para apoiar educação financeira e diálogo familiar, com transparência adequada à idade.
- Para uso real, seria necessário desenvolver autenticação, banco de dados seguro, controles de acesso por responsável, proteção de dados e avaliação de privacidade/LGPD.
- Os gráficos usam HTML/CSS/JavaScript nativo, sem bibliotecas de gráficos.