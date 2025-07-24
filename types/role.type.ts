import { UserAttributes } from "./user.type";

export interface Permissions {
    [key: string]: string[];
}

export interface RoleAttributes {
    id?: number;
    role: string;
    permissions: Permissions;
}

export interface RoleResponseBody {
    success: boolean;
    data?: RoleAttributes | UserAttributes | RoleAttributes[];
}