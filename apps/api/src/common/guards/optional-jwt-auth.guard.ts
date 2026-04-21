import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * A JWT guard that extracts the user from the token if present,
 * but does NOT reject unauthenticated requests. Useful for endpoints
 * that serve both public viewers and authenticated members.
 *
 * Sets `req.user` to the authenticated user or `undefined` if no token.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // Return the user if authentication succeeded, otherwise null (no rejection)
    return user || null;
  }
}
