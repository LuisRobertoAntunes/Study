import { DefaultSession } from 'next-auth';

/** Extensão do contrato de sessão usado pelo armazenamento por usuário. */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
  }
}
