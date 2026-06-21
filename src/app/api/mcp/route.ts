import { NextRequest, NextResponse } from 'next/server'
import { createMnemoMcpServer } from '@/lib/mcp/mnemo-server'

// POST /api/mcp
// MCP (Model Context Protocol) endpoint for Mnemo
// Allows Claude Desktop, Cursor, or any MCP client to connect to Mnemo
// and use its learning tools (get_exercise, list_reviews, get_agent, etc.)
//
// To connect from Claude Desktop, add to claude_desktop_config.json:
// {
//   "mcpServers": {
//     "mnemo": {
//       "url": "http://localhost:3000/api/mcp"
//     }
//   }
// }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Simple MCP JSON-RPC handler
    const { jsonrpc, id, method, params } = body

    if (jsonrpc !== '2.0') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32600, message: 'Invalid Request — expected JSON-RPC 2.0' },
      })
    }

    const server = createMnemoMcpServer()

    // Handle MCP methods
    switch (method) {
      case 'initialize': {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
            },
            serverInfo: {
              name: 'mnemo',
              version: '1.0.0',
            },
          },
        })
      }

      case 'tools/list': {
        // Return the list of available tools
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              {
                name: 'list_curricula',
                description: 'List all Mnemo learning curricula with their progress',
                inputSchema: { type: 'object', properties: {}, additionalProperties: false },
              },
              {
                name: 'get_exercise',
                description: 'Get a Mnemo practice exercise for a specific topic/curriculum',
                inputSchema: {
                  type: 'object',
                  properties: {
                    topic: { type: 'string', description: 'The topic or curriculum name (e.g., "python", "sql", "ai")' },
                  },
                  required: ['topic'],
                },
              },
              {
                name: 'list_reviews',
                description: 'Get Mnemo missions that are due for review (FSRS spaced repetition)',
                inputSchema: { type: 'object', properties: {}, additionalProperties: false },
              },
              {
                name: 'get_agent',
                description: 'Get info about a Mnemo agent-mémoire for a given domain',
                inputSchema: {
                  type: 'object',
                  properties: {
                    domain: { type: 'string', description: 'The domain (e.g., "python", "sql")' },
                  },
                  required: ['domain'],
                },
              },
              {
                name: 'get_stats',
                description: 'Get Mnemo learning statistics (XP, streak, missions, agents)',
                inputSchema: { type: 'object', properties: {}, additionalProperties: false },
              },
            ],
          },
        })
      }

      case 'tools/call': {
        // Execute the requested tool
        const { name, arguments: args } = params
        try {
          // We use the server's internal tool registry to execute
          // For simplicity, we handle each tool directly
          const result = await handleToolCall(name, args || {})
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            result,
          })
        } catch (e: any) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32603, message: e.message },
          })
        }
      }

      default:
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        })
    }
  } catch (e: any) {
    console.error('POST /api/mcp error:', e)
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error: ' + e.message },
    }, { status: 500 })
  }
}

// GET /api/mcp — returns info about the MCP server
export async function GET() {
  return NextResponse.json({
    name: 'mnemo',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    description: 'Mnemo MCP Server — expose learning tools to AI assistants',
    tools: [
      'list_curricula',
      'get_exercise',
      'list_reviews',
      'get_agent',
      'get_stats',
    ],
    config: {
      claudeDesktop: {
        mcpServers: {
          mnemo: {
            url: 'http://localhost:3000/api/mcp',
          },
        },
      },
    },
  })
}

// Handle tool calls directly (simpler than full MCP SDK for HTTP)
async function handleToolCall(name: string, args: any): Promise<any> {
  const { db } = await import('@/lib/db')

  switch (name) {
    case 'list_curricula': {
      const curricula = await db.curriculum.findMany({
        include: {
          missions: { select: { id: true, status: true } },
          agent: { select: { name: true, level: true } },
        },
      })
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(curricula.map((c) => ({
            name: c.name,
            domain: c.domain,
            level: c.level,
            xp: c.xp,
            missionsTotal: c.missions.length,
            missionsCompleted: c.missions.filter((m) => m.status === 'completed').length,
            agent: c.agent?.name || null,
          })), null, 2),
        }],
      }
    }

    case 'get_exercise': {
      const { topic } = args
      const curricula = await db.curriculum.findMany()
      const matching = curricula.find(
        (c) => c.name.toLowerCase().includes(topic?.toLowerCase() || '') ||
               c.domain.toLowerCase().includes(topic?.toLowerCase() || '')
      )
      if (!matching) {
        return {
          content: [{
            type: 'text',
            text: `No curriculum found matching "${topic}". Available: ${curricula.map((c) => c.name).join(', ')}`,
          }],
        }
      }
      const missions = await db.mission.findMany({
        where: { curriculumId: matching.id, status: 'active' },
        take: 1,
      })
      if (missions.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No active exercises in "${matching.name}".`,
          }],
        }
      }
      const m = missions[0]
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            title: m.title,
            briefing: m.briefing,
            objectives: JSON.parse(m.objectives),
            starterCode: m.starterCode,
            language: m.language,
            difficulty: m.difficulty,
            hint: m.hint,
            curriculum: matching.name,
          }, null, 2),
        }],
      }
    }

    case 'list_reviews': {
      const now = new Date()
      const due = await db.mission.findMany({
        where: {
          status: 'completed',
          OR: [{ nextReviewAt: { lte: now } }, { nextReviewAt: null }],
        },
        include: { curriculum: { select: { name: true } } },
        take: 10,
      })
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(due.map((m) => ({
            title: m.title,
            curriculum: m.curriculum.name,
            reviewCount: m.reviewCount,
          })), null, 2),
        }],
      }
    }

    case 'get_agent': {
      const { domain } = args
      const agents = await db.agent.findMany({
        include: { curriculum: { select: { name: true, domain: true } } },
      })
      const matching = agents.find(
        (a) => a.curriculum.domain.toLowerCase().includes(domain?.toLowerCase() || '') ||
               a.curriculum.name.toLowerCase().includes(domain?.toLowerCase() || '')
      )
      if (!matching) {
        return {
          content: [{
            type: 'text',
            text: `No agent found for "${domain}".`,
          }],
        }
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            name: matching.name,
            persona: matching.persona,
            level: matching.level,
            skills: JSON.parse(matching.skills),
            curriculum: matching.curriculum.name,
          }, null, 2),
        }],
      }
    }

    case 'get_stats': {
      const curricula = await db.curriculum.findMany({
        include: { missions: true, agent: true },
      })
      const totalXp = curricula.reduce((s, c) => s + c.xp, 0)
      const totalMissions = curricula.reduce((s, c) => s + c.missions.length, 0)
      const completed = curricula.reduce(
        (s, c) => s + c.missions.filter((m) => m.status === 'completed').length, 0
      )
      const agents = curricula.filter((c) => c.agent).length
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            totalXp,
            curriculaCount: curricula.length,
            missionsTotal: totalMissions,
            missionsCompleted: completed,
            agentsBorn: agents,
          }, null, 2),
        }],
      }
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      }
  }
}
