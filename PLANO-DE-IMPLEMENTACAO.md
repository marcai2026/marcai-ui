# Plano de implementação da Marcai Web

Este documento descreve o que construir no `marcai-ui`: a versão web da Marcai.
O app mobile fica fora deste plano.

Ele deve ser atualizado conforme as tarefas forem concluídas. O espelho de
domínio e de rotas é o `marcai-back/PLANO-DE-IMPLEMENTACAO.md` e o schema em
`marcai-back/src/database/schema`.

## Como usar este documento

- `[ ]` significa que a tarefa ainda não foi concluída.
- `[x]` significa que a tarefa foi concluída e validada.
- Siga as fases na ordem sugerida: cada uma depende de rotas da API.
- Uma fase só deve ser considerada pronta quando seus critérios de aceite forem
  atendidos.
- A interface não calcula preço, duração, fim do atendimento nem disponibilidade.
  Esses valores vêm do servidor.

## Estado atual

### O que já existe no `marcai-ui`

- [x] Projeto Next.js 16 com App Router, React 19 e TypeScript.
- [x] Tailwind CSS 4.
- [x] Página inicial do template `create-next-app`.

### O que a API já oferece para a web usar

- [x] Cadastro, login, recuperação de senha e redefinição de senha.
- [x] Perfil do usuário autenticado e troca de senha.
- [x] Onboarding que cria empresa e vínculo de `owner`.
- [x] CORS configurável por `CORS_ORIGIN`.

### O que a web ainda não tem

Não há layout de produto, sessão, cliente HTTP nem telas de negócio. A API
também ainda não expõe autorização por empresa, cadastros, agenda,
disponibilidade, dashboard, notificações nem assinatura.

## Escopo

Duas superfícies, ambas no navegador:

1. **Painel da empresa** — uso interno de `owner`, `professional` e
   `receptionist`.
2. **Página pública de agendamento** — o cliente escolhe serviço, profissional
   e horário pelo slug da empresa, sem precisar ser membro da equipe.

Fora deste plano:

- aplicativo mobile;
- login com Google, mesmo com `googleId` no schema, até a API expor o fluxo;
- múltiplas unidades;
- pagamento no momento da reserva;
- cálculo de slots, conflito de agenda ou preço no cliente.

## Papéis na interface

A autorização continua no backend. A web só esconde ações que o papel não pode
executar e trata `401` e `403`.

| Papel | O que a web mostra |
| --- | --- |
| `owner` | Tudo do painel, inclusive equipe, empresa e assinatura |
| `receptionist` | Agenda, clientes, criação e mudança de status de agendamentos |
| `professional` | A própria agenda, os próprios horários e os atendimentos sob sua responsabilidade |

A matriz fina de cada ação depende da autorização da API (Fase 2 do backend).
Enquanto ela não existir, o painel assume o usuário que acabou de fazer
onboarding como `owner`.

## Funcionalidades da web

### Acesso e conta

- Cadastro com nome, e-mail e senha.
- Login com e-mail e senha.
- Esqueci minha senha, com mensagem que não revela se o e-mail existe.
- Redefinição de senha a partir do link com token.
- Sessão com access token de curta duração e novo login quando ele expira.
- Perfil: ver e editar nome; trocar senha.
- Encerrar sessão no navegador.
- Redirecionar usuário sem empresa para o onboarding.
- Redirecionar usuário sem token para o login.

### Onboarding e empresa

- Criar a primeira empresa com nome e slug opcional.
- Exibir dados da empresa: nome, slug, descrição, logo, telefone, e-mail,
  timezone e status.
- Editar esses dados.
- Listar empresas do usuário, quando a API permitir mais de uma.
- Trocar a empresa ativa.
- Convidar ou adicionar membros.
- Alterar papel (`owner`, `professional`, `receptionist`) e status do membro.
- Remover membro.

### Clientes

- Listar clientes com paginação.
- Buscar por nome, telefone e e-mail.
- Criar cliente com nome, e-mail, telefone, data de nascimento e observações.
- Ver ficha do cliente.
- Editar cliente.
- Arquivar cliente em vez de apagar o histórico.
- Ver os agendamentos daquele cliente.

### Catálogo

- Criar, listar, editar e desativar categorias de serviço.
- Criar, listar, editar e desativar serviços, com nome, descrição, categoria e
  duração padrão.
- Impedir, na interface, a escolha de serviço inativo na agenda.
- Criar, listar, editar e desativar profissionais, com nome, bio, foto e
  telefone.
- Associar os serviços que cada profissional executa.
- Informar preço e duração daquele profissional naquele serviço. O preço fica
  em `professional_services`, não no serviço.
- Vincular um profissional a um usuário, quando ele também acessa o painel.

### Horários e disponibilidade

- Definir o expediente da empresa por dia da semana.
- Definir o expediente de cada profissional, inclusive dia indisponível.
- Criar bloqueios de intervalo, almoço, folga, férias, evento ou motivo livre.
- Bloqueio da empresa inteira ou de um profissional.
- Listar e remover bloqueios.
- Consultar horários livres para um serviço, um profissional e uma data.
- Mostrar os horários no timezone da empresa (`America/Sao_Paulo` por padrão).
- Exibir estado vazio quando não houver slot.

### Agenda

- Visão do dia e da semana, filtrada por profissional, status e cliente.
- Criar agendamento escolhendo cliente, serviço, profissional e slot livre.
- O fim do atendimento, o preço e a duração exibidos vêm da API.
- Ver detalhe do agendamento, com observações.
- Confirmar, concluir, cancelar e marcar não comparecimento.
- Reagendar dentro da política definida pela API.
- Ver histórico de status: autor, status anterior, novo status, data e motivo.
- Impedir edição de agendamento concluído ou cancelado quando a API recusar.
- Tratar conflito de horário com mensagem clara, sem tentar reservar de novo
  em silêncio.

### Página pública

- Abrir `/{slug}` sem login de membro.
- Mostrar nome, descrição e logo da empresa.
- Escolher categoria e serviço ativos.
- Escolher profissional que executa o serviço, ou “qualquer um”, se a API
  permitir.
- Escolher data dentro do horizonte máximo.
- Escolher um slot já calculado pela API.
- Informar nome e telefone, e e-mail quando houver.
- Enviar o agendamento com origem pública.
- Tela de confirmação com serviço, profissional, data e horário.
- Estados de horário esgotado, serviço inativo e empresa inativa.
- Confirmação por código fica de fora até a decisão de produto e a rota da API.

### Dashboard

- Total de agendamentos do dia e do período.
- Agendamentos por status.
- Receita prevista e realizada, quando a API expuser esses números.
- Serviços mais agendados.
- Profissionais com mais atendimentos.
- Taxa de cancelamento e de não comparecimento.
- Próximos agendamentos.
- Filtro de período, sempre no contexto da empresa ativa.

### Notificações

- Listar notificações pendentes e enviadas.
- Ver canal (`email`, `sms`, `whatsapp`, `push`), horário previsto e horário
  de envio.
- Reenviar uma notificação que falhou.
- Ver e editar preferências de notificação da empresa.
- A web não envia e-mail, SMS nem WhatsApp. Ela só acompanha o que a API
  enfileirou.

### Assinatura

- Ver plano atual e status: `trialing`, `active`, `past_due` ou `cancelled`.
- Iniciar checkout no gateway e voltar para o painel.
- Abrir o portal de cobrança, se o gateway oferecer.
- Avisar quando a assinatura estiver em atraso ou cancelada e o painel precisar
  limitar ações.
- A web nunca coleta nem guarda dados de cartão.

## Mapa de rotas da interface

Rotas autenticadas ficam sob um layout com navegação. A página pública fica
fora desse layout.

| Rota | Uso |
| --- | --- |
| `/login` | Entrar |
| `/cadastro` | Criar conta |
| `/esqueci-senha` | Pedir redefinição |
| `/redefinir-senha` | Definir nova senha com o token |
| `/onboarding` | Criar a primeira empresa |
| `/painel` | Dashboard |
| `/painel/agenda` | Agenda do dia e da semana |
| `/painel/agenda/[appointmentId]` | Detalhe, status e histórico |
| `/painel/clientes` | Lista e busca |
| `/painel/clientes/[customerId]` | Ficha e histórico |
| `/painel/servicos` | Categorias e serviços |
| `/painel/profissionais` | Profissionais e serviços associados |
| `/painel/profissionais/[professionalId]` | Expediente do profissional |
| `/painel/horarios` | Expediente da empresa e bloqueios |
| `/painel/notificacoes` | Fila e preferências |
| `/painel/equipe` | Membros e papéis |
| `/painel/empresa` | Dados da empresa |
| `/painel/assinatura` | Plano e cobrança |
| `/painel/conta` | Perfil e senha |
| `/{slug}` | Agendamento público |

## Fases

Cada fase da web começa quando as rotas correspondentes da API existirem.
Autenticação e onboarding já podem ser integrados.

### Fase 0 — Base do front

- [ ] Trocar metadados, idioma `pt-BR` e título da aplicação.
- [ ] Definir `NEXT_PUBLIC_API_URL` e documentar no exemplo de ambiente.
- [ ] Criar cliente HTTP com base URL, JSON e header `Authorization`.
- [ ] Guardar o access token de forma explícita e limpá-lo no logout e no `401`.
- [ ] Tratar o formato de erro da API de um jeito único na interface.
- [ ] Criar layout público (acesso) e layout do painel.
- [ ] Proteger rotas do painel: sem token, volta ao login.

### Fase 1 — Acesso e perfil

Depende das rotas de auth e de usuário, que já existem.

- [ ] Tela de cadastro.
- [ ] Tela de login.
- [ ] Tela de esqueci a senha.
- [ ] Tela de redefinir senha.
- [ ] Tela de perfil e troca de senha.
- [ ] Mensagens de validação iguais às regras da API: e-mail válido e senha
      entre 5 e 128 caracteres.

Critério de aceite:

- [ ] Cadastro seguido de login entra no fluxo de onboarding.
- [ ] Login com senha errada mostra erro sem vazar se o e-mail existe na
      recuperação.
- [ ] Token ausente ou expirado devolve o usuário ao login.
- [ ] Troca de senha exige novo login.

### Fase 2 — Onboarding, empresa e equipe

Depende de `POST /api/onboarding` (já existe) e, para o restante, das rotas de
empresas e membros.

- [ ] Formulário de criação da empresa.
- [ ] Depois do onboarding, entrar no painel com a empresa criada.
- [ ] Tela de dados da empresa.
- [ ] Seletor de empresa ativa, quando houver mais de uma.
- [ ] Lista de membros, convite, mudança de papel e remoção.
- [ ] Esconder ações de equipe e empresa para quem não for `owner`.

Critério de aceite:

- [ ] Usuário autenticado sem empresa não acessa o painel.
- [ ] Slug inválido é explicado antes do envio.
- [ ] Trocar de empresa recarrega os dados da empresa escolhida.

### Fase 3 — Cadastros

Depende das rotas de clientes, categorias, serviços e profissionais.

- [ ] Lista, busca, criação, edição e arquivamento de clientes.
- [ ] Lista, criação, edição e desativação de categorias e serviços.
- [ ] Lista, criação, edição e desativação de profissionais.
- [ ] Associação de serviços ao profissional, com preço e duração.
- [ ] Estados de lista vazia, carregando e erro em todas as listagens.
- [ ] Paginação nas listagens.

Critério de aceite:

- [ ] Um serviço inativo não aparece como opção de novo agendamento.
- [ ] Um profissional inativo não aparece como opção de novo agendamento.
- [ ] Busca de cliente funciona por nome, telefone e e-mail.

### Fase 4 — Horários

Depende das rotas de expediente, bloqueio e disponibilidade.

- [ ] Grade semanal do expediente da empresa.
- [ ] Grade semanal do expediente do profissional.
- [ ] Formulário de bloqueio com tipo, início, fim e motivo.
- [ ] Lista de bloqueios com remoção.
- [ ] Pré-visualização dos slots de um serviço em uma data.

Critério de aceite:

- [ ] Horários são exibidos no timezone da empresa.
- [ ] Dia sem expediente ou totalmente bloqueado não oferece horário.
- [ ] A pré-visualização usa somente a resposta de `GET /api/availability`.

### Fase 5 — Agenda

Depende das rotas de agendamentos.

- [ ] Agenda do dia e da semana.
- [ ] Filtros por período, status, cliente e profissional.
- [ ] Fluxo de novo agendamento em passos: cliente, serviço, profissional, slot.
- [ ] Detalhe com ações de confirmar, concluir, cancelar e não comparecimento.
- [ ] Reagendamento.
- [ ] Histórico de status.
- [ ] Mensagem específica quando o horário acabar de ser ocupado.

Critério de aceite:

- [ ] A tela não envia preço, duração nem status inventados pelo navegador.
- [ ] `endsAt` exibido é o retornado pela API.
- [ ] Cancelar ou concluir atualiza a agenda sem recarregar a aplicação inteira.

### Fase 6 — Página pública

Depende de disponibilidade e da criação pública de agendamento. Pode exigir
rotas públicas que o plano da API ainda descreve como autenticadas; isso precisa
ser fechado no backend antes desta fase.

- [ ] Página `/{slug}` com identidade da empresa.
- [ ] Seleção de serviço, profissional, data e horário.
- [ ] Formulário curto do cliente.
- [ ] Tela de confirmação.
- [ ] Página utilizável em tela estreita, porque o cliente final abre o link no
      celular mesmo sem app.

Critério de aceite:

- [ ] Dá para concluir um agendamento sem conta de membro.
- [ ] Horário ocupado entre a consulta e o envio mostra erro e pede outra
      escolha.
- [ ] Empresa ou serviço inativo não oferece reserva.

### Fase 7 — Dashboard

Depende de `GET /api/dashboard/summary`, `/appointments` e `/revenue`.

- [ ] Cartões do dia e do período.
- [ ] Distribuição por status.
- [ ] Receita prevista e realizada.
- [ ] Rankings de serviços e profissionais.
- [ ] Taxas de cancelamento e não comparecimento.
- [ ] Lista de próximos agendamentos com atalho para o detalhe.
- [ ] Filtro de período.

Critério de aceite:

- [ ] Todas as métricas respeitam a empresa ativa e o período escolhido.
- [ ] Período sem movimento mostra zero, não tela quebrada.

### Fase 8 — Notificações e assinatura

Depende das fases 6 e 8 da API. Entram depois da agenda funcionar.

- [ ] Lista de notificações com status de envio e ação de retry.
- [ ] Tela de preferências.
- [ ] Tela do plano atual.
- [ ] Botão de checkout e retorno.
- [ ] Botão do portal de cobrança.
- [ ] Faixa de aviso para `past_due` e `cancelled`.

Critério de aceite:

- [ ] Falha de notificação não aparece como falha do agendamento.
- [ ] Nenhum campo de cartão existe no `marcai-ui`.

### Fase 9 — Qualidade da interface

- [ ] Cobrir os fluxos críticos com teste de componente ou de ponta a ponta:
      login, onboarding, criar agendamento e agendamento público.
- [ ] Revisar foco, rótulos e contraste dos formulários.
- [ ] Garantir que listas longas continuem utilizáveis.
- [ ] Tratar loading, vazio, erro de rede e erro de validação em toda tela
      nova.

## Decisões que mudam a interface

Estas perguntas já estão em aberto no plano da API. A tela correspondente não
deve ser desenhada como definitiva antes da resposta:

- [ ] Um usuário pode pertencer a várias empresas? Define o seletor de empresa.
- [ ] O cliente público agenda sem conta? A página `/{slug}` assume que sim.
- [ ] O agendamento público exige código de confirmação?
- [ ] O profissional entra no painel com o próprio usuário?
- [ ] O cliente pode escolher qualquer profissional?
- [ ] A empresa aceita encaixe manual por cima da disponibilidade?
- [ ] Quem, na prática, confirma, cancela e conclui?
- [ ] Quais canais de notificação aparecem nas preferências?
- [ ] O que cada plano libera ou bloqueia no painel?

## Ordem prática

1. Base do front e sessão.
2. Login, cadastro, senha e perfil, já integrados à API atual.
3. Onboarding da primeira empresa.
4. Casca do painel, ainda sem métricas reais.
5. Clientes, serviços e profissionais, quando a API entregar o CRUD.
6. Expediente, bloqueios e slots.
7. Agenda interna.
8. Página pública.
9. Dashboard.
10. Notificações e assinatura.
11. Testes dos fluxos críticos.

## Definição de pronto para cada tela

Uma tela só está pronta quando:

- [ ] conversa com a rota real da API, sem dados fixos no lugar da resposta;
- [ ] respeita o papel do membro;
- [ ] mostra carregando, vazio, sucesso e erro;
- [ ] não calcula regra de negócio que o servidor já decide;
- [ ] funciona no fluxo principal com o teclado;
- [ ] está em português;
- [ ] foi exercitada no navegador no fluxo completo, não só pela aparência.
