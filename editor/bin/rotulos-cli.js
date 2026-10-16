#!/usr/bin/env node
/**
 * ============================================================
 * 🛠️ rotulos-cli.js — CLI Headless para Rótulos Web
 * Rótulos Web / Memexicanísimos Studio v5.2
 * ============================================================
 * Permite administrar proyectos, plantillas, bloques de rótulos mexicanos,
 * auditorías WCAG/SEO, respaldos FIFO y exportación ZIP desde la terminal.
 */

'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const coreEngine = require('../server/core-engine');
const { ERROR_CODES } = require('../server/error-codes');

/**
 * Resuelve el directorio base de proyectos (compatible con server.js).
 */
function resolveProjectsBase() {
  if (process.env.ROTULOS_PROJECTS_DIR) {
    return path.resolve(process.env.ROTULOS_PROJECTS_DIR);
  }
  const homeProjects = path.join(os.homedir(), 'RotulosProjects');
  if (fs.existsSync(homeProjects)) return homeProjects;
  return path.resolve(__dirname, '../../RotulosProjects');
}

/**
 * Resuelve la ruta de un proyecto por nombre corto o ruta absoluta/relativa.
 * @param {string} projectArg
 */
function resolveTargetProject(projectArg) {
  const base = resolveProjectsBase();
  if (!projectArg) {
    const defaultMemex = path.join(base, 'memexicanisimos');
    return fs.existsSync(defaultMemex) ? defaultMemex : base;
  }
  if (fs.existsSync(projectArg)) {
    return path.resolve(projectArg);
  }
  const inBase = path.join(base, path.basename(projectArg));
  if (fs.existsSync(inBase)) {
    return inBase;
  }
  return path.resolve(projectArg);
}

/**
 * Parsea argumentos CLI en formato comando + flags (--key val o --flag).
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const args = argv.slice(2);
  let command = 'help';
  const flags = {};
  let i = 0;

  if (args.length > 0 && !args[0].startsWith('-')) {
    command = args[0];
    i = 1;
  }

  for (; i < args.length; i++) {
    const token = args[i];
    if (token.startsWith('--')) {
      const eqIdx = token.indexOf('=');
      if (eqIdx !== -1) {
        const key = token.slice(2, eqIdx);
        flags[key] = token.slice(eqIdx + 1);
      } else {
        const key = token.slice(2);
        const next = args[i + 1];
        if (next !== undefined && !next.startsWith('--')) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else if (token === '-j') {
      flags.json = true;
    } else if (token === '-h') {
      command = 'help';
    }
  }

  return { command, flags };
}

/**
 * Imprime salida formateada en texto o JSON canónico.
 * @param {object} apiResult
 * @param {boolean} asJson
 */
function formatOutput(apiResult, asJson) {
  if (asJson) {
    return JSON.stringify(apiResult, null, 2);
  }
  if (!apiResult.success) {
    return `❌ [${apiResult.error_code || 'ERROR'}] ${apiResult.message}`;
  }

  const lines = [`✅ ${apiResult.message}`];
  const data = apiResult.data;

  if (Array.isArray(data)) {
    data.forEach(item => {
      if (item.id && item.label) {
        lines.push(`  • [${item.category}] ${item.id} — ${item.label}`);
      } else if (item.id && item.name) {
        lines.push(`  • [${item.category}] ${item.id}: ${item.description || item.name}`);
      } else if (item.name && item.path) {
        lines.push(`  • ${item.name} (${item.path})`);
      }
    });
  } else if (data && typeof data === 'object') {
    if (data.score !== undefined && data.grade) {
      lines.push(`  📊 Puntaje: ${data.score}/100 (Grado ${data.grade}) | Problemas: ${data.summary.issuesCount}`);
      if (Array.isArray(data.issues)) {
        data.issues.forEach(iss => {
          lines.push(`     - [${iss.severity.toUpperCase()}] (${iss.code}) ${iss.message}`);
        });
      }
    } else if (Array.isArray(data.backups)) {
      lines.push(`  📦 Total respaldos: ${data.total}`);
      data.backups.forEach(b => {
        lines.push(`     - ${b.name} (${b.sizeBytes} bytes)`);
      });
    } else {
      for (const [k, v] of Object.entries(data)) {
        lines.push(`  • ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Ejecuta un comando CLI y devuelve el objeto ApiResponse<T> resultante.
 * @param {string[]} argv
 */
async function runCli(argv = process.argv) {
  const { command, flags } = parseArgs(argv);
  const templatesDir = path.resolve(__dirname, '../templates');
  const projectsBase = resolveProjectsBase();

  switch (command) {
    case 'projects': {
      return coreEngine.listProjects(projectsBase);
    }

    case 'templates': {
      return coreEngine.listTemplates(templatesDir);
    }

    case 'blocks': {
      const catRes = await coreEngine.listBlocksCatalog();
      if (!catRes.success) return catRes;
      const categoryFilter = typeof flags.category === 'string' ? flags.category.trim() : null;
      const filtered = categoryFilter
        ? catRes.data.filter(b => b.category === categoryFilter)
        : catRes.data;
      return coreEngine.createApiResponse(
        true,
        filtered,
        null,
        `Listando ${filtered.length} bloques disponibles${categoryFilter ? ` en categoría "${categoryFilter}"` : ''}`
      );
    }

    case 'apply-template': {
      const projectDir = resolveTargetProject(flags.project);
      const templateId = flags.template;
      return coreEngine.applyTemplate({
        projectDir,
        templateId,
        templatesDir
      });
    }

    case 'inject-block': {
      const projectDir = resolveTargetProject(flags.project);
      const blockId = flags.block;
      const selector = typeof flags.selector === 'string' ? flags.selector : 'body';
      const position = typeof flags.position === 'string' ? flags.position : 'beforeend';
      const props = {};
      if (flags.title) props.title = flags.title;
      if (flags.subtitle) props.subtitle = flags.subtitle;
      if (flags['cta-text']) props.ctaText = flags['cta-text'];
      if (flags['cta-href']) props.ctaHref = flags['cta-href'];

      return await coreEngine.injectBlock({
        projectDir,
        blockId,
        selector,
        position,
        props
      });
    }

    case 'update-section': {
      const projectDir = resolveTargetProject(flags.project);
      const selector = flags.selector;
      const text = typeof flags.text === 'string' ? flags.text : undefined;
      const html = typeof flags.html === 'string' ? flags.html : undefined;
      const attributes = {};
      if (typeof flags.attr === 'string' && flags.attr.includes('=')) {
        const eq = flags.attr.indexOf('=');
        attributes[flags.attr.slice(0, eq)] = flags.attr.slice(eq + 1);
      }
      return coreEngine.updateSection({
        projectDir,
        selector,
        text,
        html,
        attributes
      });
    }

    case 'audit': {
      const projectDir = resolveTargetProject(flags.project);
      return coreEngine.auditDomAndA11y({ projectDir });
    }

    case 'backup': {
      const projectDir = resolveTargetProject(flags.project);
      if (flags.restore) {
        const backupName = typeof flags.restore === 'string' ? flags.restore : null;
        return coreEngine.manageBackups({ projectDir, action: 'restore', backupName });
      }
      return coreEngine.manageBackups({ projectDir, action: 'list' });
    }

    case 'export': {
      const projectDir = resolveTargetProject(flags.project);
      const outputPath = typeof flags.output === 'string' ? flags.output : undefined;
      return coreEngine.exportProjectZip({ projectDir, outputPath });
    }

    case 'help': {
      return coreEngine.createApiResponse(
        true,
        {
          commands: [
            'projects [--json]',
            'templates [--json]',
            'blocks [--category rotulos_mexicanos] [--json]',
            'apply-template --project <dir> --template <id> [--json]',
            'inject-block --project <dir> --block <id> [--selector body] [--position beforeend] [--title "..."] [--json]',
            'update-section --project <dir> --selector <css> [--text "..."] [--html "..."] [--json]',
            'audit --project <dir> [--json]',
            'backup --project <dir> [--restore [nombre_backup.html]] [--json]',
            'export --project <dir> [--output archivo.zip] [--json]'
          ]
        },
        null,
        'Rótulos Web CLI v5.2 — Comandos disponibles'
      );
    }

    default: {
      return coreEngine.createApiResponse(
        false,
        null,
        ERROR_CODES.INVALID_PARAMS.code,
        `Comando desconocido: "${command}". Usa "rotulos-cli help" para ver opciones.`
      );
    }
  }
}

if (require.main === module) {
  const { flags } = parseArgs(process.argv);
  runCli(process.argv)
    .then(result => {
      console.log(formatOutput(result, Boolean(flags.json)));
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      const fallback = coreEngine.createApiResponse(false, null, ERROR_CODES.SERVER_ERROR.code, err.message);
      console.error(formatOutput(fallback, Boolean(flags.json)));
      process.exit(1);
    });
}

module.exports = { runCli, parseArgs, formatOutput };
