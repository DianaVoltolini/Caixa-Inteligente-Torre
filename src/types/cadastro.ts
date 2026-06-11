// src/types/cadastro.ts

export type CadastroTipo =
  | "cliente"
  | "fornecedor"
  | "servico"
  | "categoria"

export interface CadastroItem {

  id: string

  tipo: CadastroTipo

  descricao: string

  extra: string

  notes: string

  raw: unknown

}