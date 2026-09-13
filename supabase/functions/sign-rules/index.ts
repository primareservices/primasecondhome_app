import { handle } from './handler.js';
Deno.serve((req: Request) => handle(req));
