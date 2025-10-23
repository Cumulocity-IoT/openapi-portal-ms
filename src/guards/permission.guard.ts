import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../service/permission.service';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector, private permissionService: PermissionService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @Permissions decorator, skip check
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const base64Credentials = authHeader.replace('Basic ', '').trim();
    const decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');

    const [username, password] = decoded.split(':');
    if (!username || !password) {
      throw new UnauthorizedException('Invalid BasicAuth format');
    }

    return this.permissionService
      .hasPermission({ user: username, password: password })
      .then((hasPermission) => {
        if (!hasPermission) {
          throw new UnauthorizedException('Insufficient permissions');
        }
        return true;
      });
  }
}
