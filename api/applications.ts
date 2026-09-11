import { handleApplications } from '../server/handlers/applications.js'
import { defaultDeps } from '../server/deps.js'

export async function POST(request: Request): Promise<Response> {
  return handleApplications(request, defaultDeps())
}
