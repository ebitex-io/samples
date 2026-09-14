import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next 16 writes an AGENTS.md and a CLAUDE.md into the project on every build, describing its own
  // conventions for coding agents. Useful in an application; wrong in a sample, where every file is
  // meant to be one somebody wrote deliberately and can read as an explanation of a decision. A
  // generated file nobody here authored, appearing in a diff after a build, is noise in the one
  // repository whose whole product is its source.
  agentRules: false,
}

export default nextConfig
