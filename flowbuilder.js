#!/usr/bin/env node

/**
 * Globalbot Flow Builder
 * Ferramenta CLI para criação padronizada de fluxos de chatbot
 * Projeto Integrador – Laboratório de Programação
 * Gestão de TI – UNISA 2026
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ─── Cores ANSI para terminal ───────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  blue:   '\x1b[34m',
  gray:   '\x1b[90m',
};

function log(msg)    { console.log(msg); }
function ok(msg)     { console.log(`${C.green}✔ ${msg}${C.reset}`); }
function info(msg)   { console.log(`${C.cyan}ℹ ${msg}${C.reset}`); }
function warn(msg)   { console.log(`${C.yellow}⚠ ${msg}${C.reset}`); }
function title(msg)  { console.log(`\n${C.bold}${C.blue}${msg}${C.reset}\n`); }
function sep()       { console.log(`${C.gray}${'─'.repeat(50)}${C.reset}`); }

// ─── Interface readline ──────────────────────────────────────────────────────
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(`${C.cyan}? ${C.reset}${question} `, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function askRequired(question) {
  let answer = '';
  while (!answer) {
    answer = await ask(question);
    if (!answer) warn('Este campo é obrigatório. Por favor, preencha.');
  }
  return answer;
}

async function askOptions(question, options) {
  const opts = options.map((o, i) => `  ${C.bold}${i + 1}${C.reset}. ${o}`).join('\n');
  log(`${C.cyan}? ${C.reset}${question}`);
  log(opts);
  let choice = null;
  while (choice === null) {
    const raw = await ask('Digite o número da opção:');
    const n = parseInt(raw);
    if (n >= 1 && n <= options.length) {
      choice = n - 1;
    } else {
      warn(`Opção inválida. Escolha entre 1 e ${options.length}.`);
    }
  }
  return options[choice];
}

async function askMultiple(question, options) {
  const opts = options.map((o, i) => `  ${C.bold}${i + 1}${C.reset}. ${o}`).join('\n');
  log(`${C.cyan}? ${C.reset}${question} ${C.gray}(ex: 1,3 ou "todos")${C.reset}`);
  log(opts);
  let selected = [];
  while (selected.length === 0) {
    const raw = await ask('Sua escolha:');
    if (raw.toLowerCase() === 'todos') {
      selected = [...options];
    } else {
      const nums = raw.split(',').map(s => parseInt(s.trim()));
      selected = nums
        .filter(n => n >= 1 && n <= options.length)
        .map(n => options[n - 1]);
      if (selected.length === 0) warn('Nenhuma opção válida. Tente novamente.');
    }
  }
  return selected;
}

async function askYesNo(question) {
  let answer = '';
  while (!['s', 'n'].includes(answer.toLowerCase())) {
    answer = await ask(`${question} ${C.gray}(s/n)${C.reset}`);
    if (!['s', 'n'].includes(answer.toLowerCase())) warn('Responda s ou n.');
  }
  return answer.toLowerCase() === 's';
}

// ─── Gerador de nós do fluxo ─────────────────────────────────────────────────
let nodeCounter = 1;

function createNode(type, label, content, options = {}) {
  return {
    id: `node_${String(nodeCounter++).padStart(3, '0')}`,
    type,
    label,
    content,
    ...options,
  };
}

// ─── Builder principal ────────────────────────────────────────────────────────
async function buildFlow() {

  console.clear();
  title('════════════════════════════════════════');
  title('   GLOBALBOT FLOW BUILDER v1.0');
  log(`${C.gray}   Ferramenta de criação padronizada de fluxos de chatbot${C.reset}`);
  title('════════════════════════════════════════');

  info('Este assistente irá guiá-lo na criação de um fluxo de chatbot seguindo');
  info('o modelo padronizado TO-BE da Globalbot (BPMN).\n');

  // ── ETAPA 1: Dados do cliente ──────────────────────────────────────────────
  sep();
  title('ETAPA 1 — Dados do Cliente');

  const clientName    = await askRequired('Nome do cliente / empresa:');
  const clientSegment = await askOptions('Segmento de atuação:', [
    'Varejo / E-commerce',
    'Saúde',
    'Educação',
    'Financeiro / Seguros',
    'Serviços / B2B',
    'Outro',
  ]);
  const channels = await askMultiple('Canais de atendimento contratados:', [
    'WhatsApp',
    'Instagram',
    'Telegram',
    'Chat no site',
  ]);
  const plan = await askOptions('Plano contratado:', [
    'Starter',
    'Professional',
    'Enterprise',
  ]);

  ok(`Cliente: ${clientName} | ${clientSegment} | ${plan}`);

  // ── ETAPA 2: Objetivo principal do bot ────────────────────────────────────
  sep();
  title('ETAPA 2 — Objetivo Principal do Bot');

  const botObjective = await askOptions('Qual é o objetivo principal deste chatbot?', [
    'Atendimento ao cliente (SAC)',
    'Vendas e conversão',
    'Agendamento de serviços',
    'Suporte técnico',
    'Captação de leads',
    'Misto (atendimento + vendas)',
  ]);

  const hasHumanTransfer = await askYesNo('O bot deve permitir transferência para atendente humano?');
  const hasAI = await askYesNo('O cliente contratou o módulo de IA Generativa (ChatGPT)?');

  ok(`Objetivo: ${botObjective}`);

  // ── ETAPA 3: Mensagens obrigatórias ───────────────────────────────────────
  sep();
  title('ETAPA 3 — Mensagens Obrigatórias');
  info('Defina as mensagens dos nós obrigatórios do fluxo padrão.\n');

  const greetingMsg = await askRequired(
    'Mensagem de saudação inicial (ex: Olá! Bem-vindo à [empresa]...):'
  );
  const menuMsg = await askRequired(
    'Mensagem do menu principal (ex: Como posso ajudar? Digite uma opção...):'
  );
  const fallbackMsg = await askRequired(
    'Mensagem de fallback/não entendimento (ex: Não entendi, pode repetir?):'
  );
  const closingMsg = await askRequired(
    'Mensagem de encerramento (ex: Obrigado pelo contato! Até logo!):'
  );

  // ── ETAPA 4: Opções do menu ───────────────────────────────────────────────
  sep();
  title('ETAPA 4 — Opções do Menu Principal');

  const menuOptions = [];
  let addingOptions = true;
  let optionCount = 1;

  info('Adicione as opções que aparecerão no menu principal do chatbot.');
  info('Mínimo: 2 opções. Máximo recomendado: 5 opções.\n');

  while (addingOptions) {
    log(`${C.bold}Opção ${optionCount}:${C.reset}`);
    const optLabel = await askRequired(`  Título da opção ${optionCount} (ex: Falar com atendente):`);
    const optResponse = await askRequired(`  Resposta automática para esta opção:`);
    menuOptions.push({ label: optLabel, response: optResponse });
    optionCount++;

    if (optionCount > 2) {
      addingOptions = await askYesNo(`Adicionar mais uma opção? (você já tem ${optionCount - 1})`);
    }
  }

  ok(`${menuOptions.length} opções de menu criadas.`);

  // ── ETAPA 5: Coleta de dados do usuário ──────────────────────────────────
  sep();
  title('ETAPA 5 — Coleta de Dados do Usuário');

  const collectData = await askMultiple('Quais dados o bot deve coletar do usuário?', [
    'Nome',
    'E-mail',
    'Telefone',
    'CPF / CNPJ',
    'Número do pedido',
    'Nenhum',
  ]);

  // ── ETAPA 6: Validação final ──────────────────────────────────────────────
  sep();
  title('ETAPA 6 — Validação do Fluxo');

  const errors = [];

  if (!greetingMsg) errors.push('Mensagem de saudação ausente');
  if (!menuMsg) errors.push('Mensagem de menu ausente');
  if (menuOptions.length < 2) errors.push('Menu deve ter ao menos 2 opções');
  if (!closingMsg) errors.push('Mensagem de encerramento ausente');
  if (hasHumanTransfer && !menuOptions.find(o =>
    o.label.toLowerCase().includes('atend') ||
    o.label.toLowerCase().includes('human') ||
    o.label.toLowerCase().includes('agent')
  )) {
    warn('Sugestão: adicione uma opção de menu para transferência humana.');
  }

  if (errors.length > 0) {
    errors.forEach(e => warn(`Erro: ${e}`));
    log(`\n${C.red}Fluxo incompleto. Corrija os erros acima.${C.reset}`);
    rl.close();
    return;
  }

  ok('Fluxo validado com sucesso! Todos os nós obrigatórios estão presentes.');

  // ── CONSTRUÇÃO DO JSON ────────────────────────────────────────────────────
  sep();
  title('Gerando arquivos...');

  nodeCounter = 1;

  const nodes = [];

  // Nó 1: Saudação (obrigatório)
  nodes.push(createNode('message', 'Saudação Inicial', greetingMsg, { required: true }));

  // Nó 2: Coleta de dados (se houver)
  if (!collectData.includes('Nenhum')) {
    collectData.forEach(field => {
      nodes.push(createNode('input', `Coleta: ${field}`, `Por favor, informe seu(sua) ${field}:`, {
        field,
        required: true,
      }));
    });
  }

  // Nó 3: Menu principal (obrigatório)
  const menuNode = createNode('menu', 'Menu Principal', menuMsg, {
    required: true,
    options: menuOptions.map((o, i) => ({
      key: String(i + 1),
      label: o.label,
      next: `node_${String(nodeCounter + i).padStart(3, '0')}`,
    })),
  });
  nodes.push(menuNode);

  // Nós de resposta do menu
  menuOptions.forEach(o => {
    nodes.push(createNode('message', `Resposta: ${o.label}`, o.response));
  });

  // Nó IA (se contratado)
  if (hasAI) {
    nodes.push(createNode('ai', 'Módulo IA Generativa', 'Processando com IA...', {
      provider: 'ChatGPT',
      enabled: true,
    }));
  }

  // Nó transferência humana (se contratado)
  if (hasHumanTransfer) {
    nodes.push(createNode('transfer', 'Transferência Humana',
      'Aguarde, vou transferir você para um de nossos atendentes.', {
        required: true,
        queueEnabled: true,
      }));
  }

  // Nó fallback (obrigatório)
  nodes.push(createNode('fallback', 'Mensagem de Fallback', fallbackMsg, {
    required: true,
    retryLimit: 3,
  }));

  // Nó encerramento (obrigatório)
  nodes.push(createNode('closing', 'Encerramento', closingMsg, { required: true }));

  // Objeto final do fluxo
  const flow = {
    metadata: {
      tool: 'Globalbot Flow Builder v1.0',
      createdAt: new Date().toISOString(),
      standard: 'TO-BE BPMN v1.0',
    },
    client: {
      name: clientName,
      segment: clientSegment,
      plan,
      channels,
    },
    bot: {
      objective: botObjective,
      hasHumanTransfer,
      hasAI,
    },
    validation: {
      isValid: true,
      requiredNodes: ['message', 'menu', 'fallback', 'closing'],
      presentNodes: [...new Set(nodes.map(n => n.type))],
    },
    nodes,
  };

  // ── Salvar JSON ───────────────────────────────────────────────────────────
  const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const jsonPath = path.join(__dirname, `fluxo_${safeName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(flow, null, 2), 'utf-8');
  ok(`Arquivo JSON gerado: fluxo_${safeName}.json`);

  // ── Salvar Relatório TXT ──────────────────────────────────────────────────
  const now = new Date().toLocaleString('pt-BR');
  const lines = [
    '═══════════════════════════════════════════════════',
    '   GLOBALBOT FLOW BUILDER — RELATÓRIO DE FLUXO',
    '═══════════════════════════════════════════════════',
    '',
    `Data/Hora: ${now}`,
    `Padrão aplicado: TO-BE BPMN v1.0`,
    '',
    '── DADOS DO CLIENTE ────────────────────────────────',
    `Cliente:   ${clientName}`,
    `Segmento:  ${clientSegment}`,
    `Plano:     ${plan}`,
    `Canais:    ${channels.join(', ')}`,
    '',
    '── CONFIGURAÇÃO DO BOT ─────────────────────────────',
    `Objetivo:           ${botObjective}`,
    `Transferência humana: ${hasHumanTransfer ? 'Sim' : 'Não'}`,
    `Módulo IA:          ${hasAI ? 'Sim (ChatGPT)' : 'Não'}`,
    '',
    '── MENU PRINCIPAL ──────────────────────────────────',
    ...menuOptions.map((o, i) => `  ${i + 1}. ${o.label}`),
    '',
    '── DADOS COLETADOS DO USUÁRIO ──────────────────────',
    collectData.includes('Nenhum') ? '  Nenhum' : collectData.map(d => `  • ${d}`).join('\n'),
    '',
    '── NÓS DO FLUXO GERADOS ────────────────────────────',
    ...nodes.map(n => `  [${n.type.toUpperCase()}] ${n.label}`),
    '',
    '── VALIDAÇÃO ───────────────────────────────────────',
    '  ✔ Saudação inicial: presente',
    '  ✔ Menu principal: presente',
    '  ✔ Fallback: presente',
    '  ✔ Encerramento: presente',
    `  ✔ Total de nós: ${nodes.length}`,
    '',
    '═══════════════════════════════════════════════════',
    '  Fluxo gerado com sucesso pelo Globalbot Flow Builder',
    '═══════════════════════════════════════════════════',
  ];

  const reportPath = path.join(__dirname, `relatorio_${safeName}.txt`);
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
  ok(`Relatório gerado: relatorio_${safeName}.txt`);

  // ── Resumo final ──────────────────────────────────────────────────────────
  sep();
  title('✅ FLUXO CRIADO COM SUCESSO!');
  log(`${C.bold}Arquivos gerados:${C.reset}`);
  log(`  📄 ${C.cyan}fluxo_${safeName}.json${C.reset}   → estrutura do fluxo`);
  log(`  📋 ${C.cyan}relatorio_${safeName}.txt${C.reset} → relatório para o cliente`);
  log('');
  log(`${C.bold}Resumo:${C.reset} ${nodes.length} nós | ${menuOptions.length} opções de menu | ${channels.length} canal(is)`);
  log('');

  rl.close();
}

// ─── Entry point ─────────────────────────────────────────────────────────────
buildFlow().catch(err => {
  console.error(`${C.red}Erro inesperado: ${err.message}${C.reset}`);
  rl.close();
  process.exit(1);
});
