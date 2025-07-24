import { RoleAttributes } from "./role.type";

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  roleId?: number;
  role?: RoleAttributes | any;
  password?: string;
  createdAt?: Date;
}

export interface EncryptionResult {
  iv: string;
  encryptedData: string;
}

export interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface UserResponseBody {
  token?: string;
  data?: UserAttributes | EncryptionResult | UserAttributes[];
  success: boolean;
  user?: UserAttributes;
}

export interface AuthenticatedPayload {
  id: number;
  role: string;
}
