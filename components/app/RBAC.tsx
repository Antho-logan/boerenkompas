"use client"

import { Role } from "@/lib/types";
import { useTenant } from "./TenantProvider";

interface RBACProps {
    roles: Role[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function Can({ roles, children, fallback = null }: RBACProps) {
    const { role } = useTenant();

    if (roles.includes(role)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}
