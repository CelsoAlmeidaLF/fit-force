# Fit Força — PWA (v1.6)

App de musculação: prontidão muscular por volume, biblioteca de 41 músculos, treino com carga e repetições por série, timer de descanso com dica de execução, troca de exercício, recordes e evolução de carga.

## Novidades da v1.6 — calorias explicadas
- **MET padrão 3,5 (Leve)**, o valor do Compêndio 2024 para musculação com vários exercícios e 8–15 repetições. Quem estava em 5,0 foi passado para 3,5.
- **MET visível em cada treino** (Histórico, PDF e CSV) e editável ao corrigir um treino.
- **Calorias por exercício** (estimativa: divide o total pelo tempo e tipo de cada exercício) no resumo, no Histórico, no PDF (coluna kcal) e no CSV (calorias por série).
- **Resumo ao concluir o treino**: duração, calorias, séries, recordes e calorias por exercício.
- **Ranking** "Exercícios que mais gastaram" na aba Semana.
- **Tela "Como calculamos as calorias"** com fórmula, seus números, tabela de MET com códigos do Compêndio, método por exercício, limites, referências com DOI/PubMed e data de revisão. Também permite recalcular treinos antigos com o MET atual.

## Novidades da v1.5 — status manual dos músculos
- Na ficha de cada músculo: **Alterar status** (Automático, Pronto, Quase pronto, Recuperando) por 24, 48 ou 72 h, ou até o próximo treino.
- Na aba Hoje: **Ajustar status dos músculos** muda vários de uma vez, com "Marcar todos como prontos" e "Voltar todos ao automático".
- O ajuste termina sozinho quando você registra um treino que usa o músculo.

## Novidades da v1.4 — personal, arquivos e progressão
- **Exportar (Treino › Fichas › Exportar):** fichas ou histórico em **PDF**, **CSV** (Excel, Google Planilhas, outros apps) ou **arquivo do Fit Força** (`.fitforca.json`). Campo "Personal responsável" (nome e CREF) sai no PDF e no arquivo. Botões **Compartilhar** (WhatsApp, e-mail, Drive) e **Baixar**.
- **Importar (Treino › Fichas › Importar):** arquivo `.fitforca.json` ou CSV. Cria os exercícios que faltam e aplica descansos e orientações do personal.
- **Backup em arquivo:** Configurações › Dados e backup › Salvar backup em arquivo / Restaurar de arquivo (o PIN não vai no arquivo).
- **Progressão automática:** se no último treino todas as séries chegaram nas repetições-alvo, o app sugere a carga + 1 / 2,5 / 5 kg (ajustável em Configurações › Treino).
- **Calorias:** MET do Compêndio de Atividades Físicas 2024 (Leve 3,5 · Moderado 5,0 · Vigoroso 6,0) × peso × duração do treino. O peso vem do Fit Systekna quando ele está no mesmo servidor; cada treino entra no diário dele (pode desligar).
- **RIR por série** (repetições de reserva) e **1RM estimado** (Epley) na evolução da aba Semana.
- **Prazo da ficha:** "Trocar a ficha em N semanas", com aviso na aba Treino quando faltar 7 dias ou vencer.
- **Calculadora de anilhas:** na aba Treino e durante o treino (barra 20/15/10 kg ou sem barra).

### Formato CSV de fichas (para importar de outro app)
Separador `;` (vírgula também é aceita), primeira linha com os títulos. Colunas reconhecidas:
`Ficha; Exercício; Grupo; Músculo principal; Séries; Repetições/tempo; Descanso (s); Orientação`. Só "Exercício" é obrigatória.

## Novidades da v1.3 — cadastros do treino
A aba **Treino** agora tem abas: **Hoje · Fichas · Histórico · Exercícios**.
- **Fichas:** criar, editar (nome, exercícios, séries, ordem), excluir (com desfazer) e "Usar hoje". O treino de hoje pode ser salvo como ficha.
- **Histórico:** "Registrar treino" (treino passado, com data e hora), tocar num treino para corrigir carga, repetições, séries e exercícios, ou excluir. Recordes e últimas cargas são recalculados.
- **Exercícios:** cadastrar novo (nome, grupo, músculo principal e secundários, séries, repetições/segundos/minutos, dica), editar ou corrigir qualquer um (renomear atualiza fichas, histórico e recordes), voltar ao original e excluir (o histórico é mantido; dá para restaurar).

## Novidades da v1.2 — intervalos editáveis
- **Descanso por exercício:** na aba Treino, toque no botão ⏱ do exercício para ajustar séries, descanso (passos de 15 s, de 0:15 a 10:00) e a **orientação do personal**. Fica salvo para os próximos treinos.
- **Durante o treino:** cada exercício tem − / + no descanso; o timer usa o descanso do exercício da série marcada.
- **Recuperação entre treinos:** na ficha do músculo, toque em "h de recuperação" para ajustar (12 a 168 h, passos de 6 h) ou voltar ao padrão.
- **Configurações → Treino:** descanso padrão e botões para restaurar descansos e recuperações ajustados.

## Instalação no servidor SHTTPS
1. Copie a pasta `forca/` para a raiz do servidor (ex.: `/forca/`).
2. Abra no celular: `https://localhost:8080/forca/`.
3. Chrome (Android): menu ⋮ → **Instalar app**. iPhone (Safari): Compartilhar → **Adicionar à Tela de Início**.

## Primeiro acesso
- O app pede para criar um **PIN** (teclado próprio) e oferece a **biometria** (digital/rosto) quando o aparelho suporta.
- Abre com 3 treinos de exemplo; o primeiro treino real (ou "Limpar exemplo") remove o exemplo.
- Quem usava a versão 1.0 mantém os treinos (as séries antigas ficam sem carga anotada).

## Atualizar
1. Substitua o `index.html`.
2. Em `sw.js`, mude o valor de `VERSAO`.
3. O app mostra **"Nova versão disponível · Atualizar"**.

## Observações
- Dados só neste aparelho (`localStorage`), separados do Fit Systekna. Use **Configurações → Copiar backup**.
- Os ícones são os mesmos do Fit Systekna; se quiser diferenciar os dois apps na tela inicial, envie um ícone próprio para o Fit Força.
- Pendências (ilustrações, mapa detalhado, validação por profissional): ver `Fit-Systekna-Musculacao-Pendencias.md`.
- Créditos: ilustração anatômica js-rich-body-highlighter (MIT); ícones Material Symbols (Apache 2.0); fonte Open Sans (OFL).
