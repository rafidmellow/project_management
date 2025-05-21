import { ComponentType } from 'react';
import { PermissionGuard } from '@/components/permission-guard';

/**
 * Higher Order Component that wraps a component with a permission guard
 * @param Component The component to wrap
 * @param permission The permission required to render the component
 * @param fallback Optional fallback component to render if permission is denied
 */
export function withPermission<P extends object>(
  Component: ComponentType<P>,
  permission: string,
  fallback: React.ReactNode = null
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGuard permission={permission} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}
