import { handlePaystackWebhook } from '../../server/handlers/payments.js'
import { defaultDeps } from '../../server/deps.js'

export async function POST(request: Request): Promise<Response> {
  return handlePaystackWebhook(request, defaultDeps())
}
