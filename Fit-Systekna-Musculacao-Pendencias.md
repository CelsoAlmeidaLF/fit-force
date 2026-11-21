# Fit Systekna — Musculação: o que foi feito e o que ficou pendente

**Data:** 20/11/2026 · **Versão do app:** 1.3 (MVP + módulo de musculação)

## 1. O que foi implementado nesta versão

| # | Melhoria | Onde está no app |
|---|---|---|
| 1 | Catálogo de **41 músculos** (o JSON enviado, com as correções da seção 3) integrado ao Fit Systekna | Treino › Músculos |
| 2 | **Catálogo de exercícios sem duplicatas** (117 itens): os 46 que já existiam + 71 vindos do JSON. Cada exercício tem **músculo principal** e **secundários** | Cadastros › Exercícios |
| 3 | Migração automática: quem já usava o app recebe os novos exercícios, e os antigos ganham o músculo principal | Automático, na primeira abertura |
| 4 | **Carga e repetições por série**, com check por série, "+ Série" e a última carga/repetições já preenchidas | Treino › Fichas › Começar treino |
| 5 | **Fadiga proporcional ao volume**: recuperação = tempo do músculo × (0,45 + 0,18 × séries), entre 60% e 140%. Secundários contam com metade das séries | Treino › Músculos › Prontidão |
| 6 | **Timer de descanso com a dica de execução** do próximo exercício e da próxima série | Tela do treino |
| 7 | **Trocar exercício** só naquele treino, por outro do mesmo músculo (ou do mesmo grupo) | Botão "Trocar" no treino |
| 8 | **Treino sugerido sem repetição**: escolhe músculos prontos por prioridade e um exercício diferente para cada um, preferindo os que já estão nas suas fichas | Treino › Músculos |
| 9 | **Status não só por cor**: ícone + cor + texto (✓ pronto, ampulheta quase pronto, lua recuperando) no mapa, nos cards e na ficha do músculo | Treino › Músculos |
| 10 | Ficha do músculo: ilustração, região, padrão de movimento, tempo de recuperação, barra de recuperação, exercícios (principal e secundário) com "adicionar na ficha", sinergistas clicáveis e dica | Toque num card |
| 11 | Recorde e evolução usando a maior carga das séries concluídas; volume (kg × reps) guardado para relatórios futuros | Treino › Evolução |
| 12 | Cadastro de exercício com **músculo principal** (busca ao digitar); os secundários vêm dos sinergistas | Cadastros › Exercícios |

O app Fit Força (proposta separada) continua publicado só como referência visual; a evolução segue no Fit Systekna.

---

## 2. Pendências que não dá para resolver por aqui

### P-01 · Ilustrações dos 23 músculos que faltam
- **Situação:** 18 dos 41 músculos têm ilustração. Os outros 23 usam o mapa do corpo com a região destacada.
- **Faltam:** deltoide anterior, deltoide lateral, romboides, quadrado lombar, supraespinal, infraespinal, redondo menor, transverso do abdômen, serrátil anterior, coracobraquial e cabeça curta do bíceps, braquial, cabeça longa do tríceps, braquiorradial, flexores do antebraço, extensores do antebraço, glúteo máximo, glúteo médio, tensor da fáscia lata, quadríceps, vasto medial, grácil, sartório e sóleo.
- **Padrão para manter a consistência:** fundo cinza-claro (#F0F1F3), corpo cinza liso (#5F6368 a #9AA0A6), músculo em vermelho (#E8453C) com contorno branco, sem sombras nem textura, enquadramento quadrado de 1024 × 1024 px.
- **Refazer** no estilo plano as duas ilustrações da canela, que hoje são realistas e destoam das demais.
- **Como entregar:** um arquivo por músculo, com o `id` do JSON no nome (ex.: `romboides.jpg`). Eu recorto, comprimo e encaixo automaticamente.

### P-02 · Mapa do corpo mais detalhado e vistas laterais
- **Situação:** o mapa atual (biblioteca MIT) tem 18 regiões, só de frente e costas. Músculos vizinhos dividem a mesma região (ex.: deltoide anterior e lateral; quadríceps, adutores, grácil e sartório).
- **Precisa de:** uma ilustração anatômica vetorial (SVG) com um caminho por músculo, nas vistas frontal, posterior, lateral direita e lateral esquerda, com licença de uso comercial.
- **Opções:** comprar um pacote vetorial licenciado ou contratar um ilustrador usando o padrão da P-01.

### P-03 · Sinergistas fora do catálogo
- Escalenos, Platisma, Levantador da Escápula, Iliopsoas e Extensores longos dos dedos aparecem como sinergistas, mas não têm ficha.
- **Precisa de:** descrição, região, padrão de movimento, tempo de recuperação, exercícios e dica de cada um (mesmo formato do JSON), mais a ilustração.

### P-04 · Validação por profissional de educação física
- Tempos de recuperação, exercícios recomendados, dicas de execução, a fórmula de fadiga por volume e a faixa de 10 a 20 séries por semana são **referências gerais**.
- **Precisa de:** revisão de um profissional com registro no CREF antes de publicar o app na Play Store, e o nome dele nos créditos, se ele autorizar.

### P-05 · Testes em aparelhos reais
- Testado apenas em navegador simulado. Faltam:
  - vibração e som do timer de descanso com a tela bloqueada;
  - tela acesa durante o treino (Wake Lock);
  - digitação de carga e repetições em telas pequenas;
  - biometria no Android e no iPhone;
  - desempenho do mapa com muitos treinos registrados.

### P-06 · Recursos que dependem do app empacotado (Capacitor)
- Timer de descanso em segundo plano com notificação, quando você sai do app.
- Lembrete de treino no dia do plano.
- Exportar o histórico de treinos em arquivo (CSV ou PDF).

---

## 3. Correções feitas no JSON (para atualizar o arquivo original)

| Campo | Antes | Depois |
|---|---|---|
| `tensor-da-fascia-lata.vista_recomendada` | posterior | anterior |
| `extensores-do-antebraco.vista_recomendada` | anterior | posterior |
| Sinergista "Tríceps Braquial" (peitoral, deltoides) | Tríceps Braquial | Tríceps Braquial (Geral) |
| Sinergista "Supraespinal" (deltoide lateral) | Supraespinal | Supraespinal (Manguito Rotador) |

---

## 4. Próximos passos sugeridos
1. Enviar as ilustrações da P-01 (mesmo que aos poucos).
2. Agendar a revisão da P-04.
3. Usar 2 semanas no celular e anotar o que incomoda (P-05).
4. Depois disso, empacotar com Capacitor para a P-06 e a Play Store.
