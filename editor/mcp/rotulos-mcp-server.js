#!/usr/bin/env node
/**
 * ============================================================
 * 🔌 rotulos-mcp-server.js — Servidor MCP Headless sobre stdio
 * Rótulos Web / Memexicanísimos Studio v5.2
 * ============================================================
 * Implementa el protocolo Model Context Protocol (JSON-RPC 2.0 sobre stdio)
 * sin procesos daemon residentes (cumple Regla 10 de AGENTS.md).
 */

'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const readline = require('readline');
const coreEngine = require('../server/core-engine');
const { ERROR_CODES } = require('../server/error-codes');

const MCP_SERVER_INFO = {
  name: 'rotulos-mcp',
  version: '5.2.0'
};

const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

function resolveProjectsBase() {
  if (process.env.ROTULOS_PROJECTS_DIR) {
    return path.resolve(process.env.ROTULOS_PROJECTS_DIR);
  }
  const homeProjects = path.join(os.homedir(), 'RotulosProjects');
  if (fs.existsSync(homeProjects)) return homeProjects;
  return path.resolve(__dirname, '../../RotulosProjects');
}

function resolveProjectDir(projectPathOrName) {
  const base = resolveProjectsBase();
  if (!projectPathOrName) {
    const defaultMemex = path.join(base, 'memexicanisimos');
    return fs.existsSync(defaultMemex) ? defaultMemex : base;
  }
  if (fs.existsSync(projectPathOrName)) {
    return path.resolve(projectPathOrName);
  }
  const candidate = path.join(base, path.basename(projectPathOrName));
  if (fs.existsSync(candidate)) {
    return candidate;
  }
  return path.resolve(projectPathOrName);
}

/**
 * Definición de las 8 herramientas MCP de Rótulos Web (V5-A2).
 */
const MCP_TOOLS = [
  {
    name: 'rotulos_list_projects',
    description: 'Lista todos los proyectos web locales disponibles en RotulosProjects.',
    inputSchema: {
      type: 'object',
      properties: {
        projectsBaseDir: {
          type: 'string',
          description: 'Directorio base opcional de proyectos.'
        }
      }
    }
  },
  {
    name: 'rotulos_load_project',
    description: 'Carga el código HTML y CSS de un proyecto local de Rótulos Web.',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Nombre del proyecto en RotulosProjects o ruta absoluta del directorio.'
        }
      },
      required: ['project']
    }
  },
  {
    name: 'rotulos_list_catalog',
    description: 'Lista el catálogo de plantillas y bloques de diseño (incluyendo Rótulos Tradicionales Mexicanos).',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['all', 'templates', 'blocks'],
          description: 'Tipo de elementos a consultar (all, templates, blocks).'
        },
        category: {
          type: 'string',
          description: 'Filtro opcional de categoría para bloques (ej. rotulos_mexicanos, rotulos_web, blog, portafolio, landing).'
        }
      }
    }
  },
  {
    name: 'rotulos_apply_template',
    description: 'Aplica una plantilla oficial o mexicana a un proyecto con respaldo automático FIFO.',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Ruta o nombre del proyecto destino.'
        },
        templateId: {
          type: 'string',
          description: 'ID de la plantilla (ej. memexicanisimos, todos-santos, rotulo-ferreteria, cartel-sonidero, blog, landing, portfolio).'
        }
      },
      required: ['project', 'templateId']
    }
  },
  {
    name: 'rotulos_inject_block',
    description: 'Inyecta un bloque del catálogo (incluidos rótulos mexicanos) en un selector CSS del proyecto y guarda con respaldo FIFO.',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Ruta o nombre del proyecto destino.'
        },
        blockId: {
          type: 'string',
          description: 'ID del bloque a insertar (ej. rotulo-sonidero-baile, rotulo-pizarron-taqueria, rotulo-oferta-ferreteria, card-noticia).'
        },
        selector: {
          type: 'string',
          description: 'Selector CSS destino (por defecto: body).'
        },
        position: {
          type: 'string',
          enum: ['beforeend', 'afterbegin', 'beforebegin', 'afterend', 'replace'],
          description: 'Posición relativa al selector CSS.'
        },
        props: {
          type: 'object',
          description: 'Textos opcionales para personalizar el bloque (title, subtitle, ctaText, ctaHref).'
        }
      },
      required: ['project', 'blockId']
    }
  },
  {
    name: 'rotulos_update_section',
    description: 'Actualiza el texto, HTML interno o atributos de una sección o elemento por selector CSS con guardado atómico FIFO.',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Ruta o nombre del proyecto destino.'
        },
        selector: {
          type: 'string',
          description: 'Selector CSS del elemento a modificar.'
        },
        text: {
          type: 'string',
          description: 'Nuevo texto plano para el elemento.'
        },
        html: {
          type: 'string',
          description: 'Nuevo HTML interno para el elemento.'
        },
        attributes: {
          type: 'object',
          description: 'Mapa clave-valor de atributos HTML a actualizar o eliminar (null).'
        }
      },
      required: ['project', 'selector']
    }
  },
  {
    name: 'rotulos_audit_page',
    description: 'Ejecuta una auditoría determinista de DOM, SEO y Accesibilidad WCAG sobre el proyecto.',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Ruta o nombre del proyecto a auditar.'
        }
      },
      required: ['project']
    }
  },
  {
    name: 'rotulos_backup_restore',
    description: 'Lista los respaldos FIFO de un proyecto o restaura un respaldo específico.',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Ruta o nombre del proyecto.'
        },
        action: {
          type: 'string',
          enum: ['list', 'restore'],
          description: 'Acción a ejecutar: list o restore.'
        },
        backupName: {
          type: 'string',
          description: 'Nombre opcional del archivo de respaldo a restaurar (si se omite, restaura el más reciente).'
        }
      },
      required: ['project']
    }
  }
];

/**
 * Ejecuta una herramienta MCP por nombre y argumentos.
 * @param {string} toolName
 * @param {object} args
 */
async function executeMcpTool(toolName, args = {}) {
  switch (toolName) {
    case 'rotulos_list_projects': {
      const base = args.projectsBaseDir ? path.resolve(args.projectsBaseDir) : resolveProjectsBase();
      return coreEngine.listProjects(base);
    }

    case 'rotulos_load_project': {
      const projectDir = resolveProjectDir(args.project);
      return coreEngine.loadProject(projectDir);
    }

    case 'rotulos_list_catalog': {
      const queryType = args.type || 'all';
      const resultData = {};

      if (queryType === 'all' || queryType === 'templates') {
        const tplRes = coreEngine.listTemplates(TEMPLATES_DIR);
        resultData.templates = tplRes.success ? tplRes.data : [];
      }

      if (queryType === 'all' || queryType === 'blocks') {
        const blkRes = await coreEngine.listBlocksCatalog();
        let blocks = blkRes.success ? blkRes.data : [];
        if (args.category) {
          blocks = blocks.filter(b => b.category === args.category);
        }
        resultData.blocks = blocks.map(b => ({
          id: b.id,
          label: b.label,
          category: b.category,
          categoryLabel: b.categoryLabel
        }));
      }

      return coreEngine.createApiResponse(true, resultData, null, 'Catálogo de Rótulos Web consultado con éxito');
    }

    case 'rotulos_apply_template': {
      const projectDir = resolveProjectDir(args.project);
      return coreEngine.applyTemplate({
        projectDir,
        templateId: args.templateId,
        templatesDir: TEMPLATES_DIR
      });
    }

    case 'rotulos_inject_block': {
      const projectDir = resolveProjectDir(args.project);
      return await coreEngine.injectBlock({
        projectDir,
        blockId: args.blockId,
        selector: args.selector || 'body',
        position: args.position || 'beforeend',
        props: args.props || {}
      });
    }

    case 'rotulos_update_section': {
      const projectDir = resolveProjectDir(args.project);
      return coreEngine.updateSection({
        projectDir,
        selector: args.selector,
        text: args.text,
        html: args.html,
        attributes: args.attributes || {}
      });
    }

    case 'rotulos_audit_page': {
      const projectDir = resolveProjectDir(args.project);
      return coreEngine.auditDomAndA11y({ projectDir });
    }

    case 'rotulos_backup_restore': {
      const projectDir = resolveProjectDir(args.project);
      return coreEngine.manageBackups({
        projectDir,
        action: args.action || 'list',
        backupName: args.backupName || null
      });
    }

    default:
      return coreEngine.createApiResponse(
        false,
        null,
        ERROR_CODES.INVALID_PARAMS.code,
        `Herramienta MCP desconocida: "${toolName}"`
      );
  }
}

/**
 * Procesa un mensaje JSON-RPC 2.0 y devuelve la respuesta JSON-RPC (o null si es notificación).
 * @param {object} request
 */
async function handleRpcRequest(request) {
  if (!request || typeof request !== 'object') {
    return {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32600, message: 'Invalid Request' }
    };
  }

  const { id, method, params } = request;

  // Notificaciones sin id no esperan respuesta
  if (id === undefined && method && method.startsWith('notifications/')) {
    return null;
  }

  try {
    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: MCP_SERVER_INFO
        }
      };
    }

    if (method === 'ping') {
      return {
        jsonrpc: '2.0',
        id,
        result: {}
      };
    }

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS
        }
      };
    }

    if (method === 'tools/call') {
      const toolName = params && params.name;
      const toolArgs = (params && params.arguments) || {};
      const apiResponse = await executeMcpTool(toolName, toolArgs);

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(apiResponse, null, 2)
            }
          ],
          isError: !apiResponse.success
        }
      };
    }

    return {
      jsonrpc: '2.0',
      id: id !== undefined ? id : null,
      error: {
        code: -32601,
        message: `Method not found: ${method}`
      }
    };
  } catch (err) {
    return {
      jsonrpc: '2.0',
      id: id !== undefined ? id : null,
      error: {
        code: -32603,
        message: err.message
      }
    };
  }
}

/**
 * Inicia el transporte stdio para comunicación MCP por líneas JSON-RPC.
 */
function startStdioServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('Content-Length:')) return;
    try {
      const msg = JSON.parse(trimmed);
      const response = await handleRpcRequest(msg);
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (_err) {
      const errResp = {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' }
      };
      process.stdout.write(JSON.stringify(errResp) + '\n');
    }
  });
}

if (require.main === module) {
  startStdioServer();
}

module.exports = {
  MCP_SERVER_INFO,
  MCP_TOOLS,
  executeMcpTool,
  handleRpcRequest,
  startStdioServer
};
