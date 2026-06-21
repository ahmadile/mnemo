// MCP (Model Context Protocol) server for Mnemo
// Exposes Mnemo's learning tools as MCP tools that Claude Desktop, Cursor,
// or any MCP-compatible client can use.
//
// This is the "learn MCP by using MCP" flagship feature:
// students connect their AI assistant to Mnemo and can:
//   - get_exercise(topic) → fetch a practice mission
//   - run_python(code) → execute Python via Pyodide
//   - list_curricula() → see all learning tracks
//   - get_agent(domain) → talk to a Mnemo agent-mémoire
//   - explain_code(source) → get an AST-based explanation

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { db } from '@/lib/db'

export function createMnemoMcpServer() {
  const server = new McpServer({
    name: 'mnemo',
    version: '1.0.0',
  })

  // Tool: list_curricula — returns all learning tracks
  server.tool(
    'list_curricula',
    'List all Mnemo learning curricula with their progress',
    {},
    async () => {
      const curricula = await db.curriculum.findMany({
        include: {
          missions: { select: { id: true, status: true } },
          agent: { select: { name: true, level: true } },
        },
      })
      const summary = curricula.map((c) => ({
        name: c.name,
        domain: c.domain,
        level: c.level,
        xp: c.xp,
        missionsTotal: c.missions.length,
        missionsCompleted: c.missions.filter((m) => m.status === 'completed').length,
        agent: c.agent?.name || null,
        datacampProgress: c.datacampProgress,
      }))
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(summary, null, 2),
        }],
      }
    }
  )

  // Tool: get_exercise — fetch a practice mission for a topic
  server.tool(
    'get_exercise',
    'Get a Mnemo practice exercise for a specific topic/curriculum',
    {
      topic: z.string().describe('The topic or curriculum name (e.g., "python", "sql", "ai")'),
    },
    async ({ topic }) => {
      const curricula = await db.curriculum.findMany()
      const matching = curricula.find(
        (c) => c.name.toLowerCase().includes(topic.toLowerCase()) ||
               c.domain.toLowerCase().includes(topic.toLowerCase())
      )
      if (!matching) {
        return {
          content: [{
            type: 'text' as const,
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
            type: 'text' as const,
            text: `No active exercises in "${matching.name}". Submit a course to generate one!`,
          }],
        }
      }
      const m = missions[0]
      return {
        content: [{
          type: 'text' as const,
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
  )

  // Tool: list_reviews — get missions due for review (spaced repetition)
  server.tool(
    'list_reviews',
    'Get Mnemo missions that are due for review (FSRS spaced repetition)',
    {},
    async () => {
      const now = new Date()
      const due = await db.mission.findMany({
        where: {
          status: 'completed',
          OR: [
            { nextReviewAt: { lte: now } },
            { nextReviewAt: null },
          ],
        },
        include: { curriculum: { select: { name: true } } },
        take: 10,
      })
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(due.map((m) => ({
            title: m.title,
            curriculum: m.curriculum.name,
            reviewCount: m.reviewCount,
            lastReview: m.lastReviewAt,
          })), null, 2),
        }],
      }
    }
  )

  // Tool: get_agent — retrieve info about an agent-mémoire
  server.tool(
    'get_agent',
    'Get info about a Mnemo agent-mémoire for a given domain',
    {
      domain: z.string().describe('The domain (e.g., "python", "sql")'),
    },
    async ({ domain }) => {
      const agents = await db.agent.findMany({
        include: { curriculum: { select: { name: true, domain: true } } },
      })
      const matching = agents.find(
        (a) => a.curriculum.domain.toLowerCase().includes(domain.toLowerCase()) ||
               a.curriculum.name.toLowerCase().includes(domain.toLowerCase())
      )
      if (!matching) {
        return {
          content: [{
            type: 'text' as const,
            text: `No agent found for "${domain}". Available agents: ${agents.map((a) => a.name).join(', ') || 'none yet'}`,
          }],
        }
      }
      return {
        content: [{
          type: 'text' as const,
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
  )

  // Tool: get_stats — learning statistics
  server.tool(
    'get_stats',
    'Get Mnemo learning statistics (XP, streak, missions, agents)',
    {},
    async () => {
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
          type: 'text' as const,
          text: JSON.stringify({
            totalXp,
            curriculaCount: curricula.length,
            missionsTotal: totalMissions,
            missionsCompleted: completed,
            agentsBorn: agents,
            averageLevel: curricula.length > 0
              ? Math.round(curricula.reduce((s, c) => s + c.level, 0) / curricula.length)
              : 0,
          }, null, 2),
        }],
      }
    }
  )

  return server
}
