import { handleAnimalsRequest } from '#lib/api/mock/handler.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => handleAnimalsRequest(request);
