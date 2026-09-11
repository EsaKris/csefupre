import { handleEnquiries } from '../server/handlers/enquiries.js'
import { defaultDeps } from '../server/deps.js'

export async function POST(request: Request): Promise<Response> {
  return handleEnquiries(request, defaultDeps())
}
