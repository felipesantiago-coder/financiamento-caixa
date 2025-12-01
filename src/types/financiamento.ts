export interface FinanciamentoDados {
  // Dados básicos
  valorImovel: number | null;
  valorFinanciado: number | null;
  valorAvaliacao: number | null;
  valorEntrada: number | null;
  taxaJurosNominal: number | null;
  taxaJurosEfetiva: number | null;
  prazoMeses: number | null;
  prazoObra?: number | null;
  carenciaMeses?: number | null;
  sistema: 'PRICE' | 'SAC' | 'PRICE TR' | null;
  cotacaoMaxFinanciamento: number | null;

  // Dados do cliente
  rendaFamiliar: number | null;
  numeroParticipantes: number | null;
  tipoPessoa: 'Fisica' | 'Juridica' | null;
  categoriaPessoa: string | null;

  // Dados do financiamento
  origemRecurso: 'SBPE' | 'FGTS' | null;
  tipoFinanciamento: string | null;
  categoriaImovel: string | null;
  cidade: string | null;
  uf: string | null;

  // Componentes mensais
  seguroDFI: number | null;
  seguroMIP: number | null;
  taxaAdministracao: number | null;
  taxaRiscoCredito: number | null;
  taxaOperacionalMensal: number | null;

  // Despesas
  despesaCartoraria: number | null;
  despesaLeiloeiro: number | null;
  apoliceSeguro: number | null;
  incorporarTarifas: boolean | null;

  // Taxas à vista
  seguroVista: number | null;
  tarifas: number | null;
  iof: number | null;
}

export interface Parcela {
  mes: number;
  dataVencimento: Date;
  saldoDevedorAnterior: number;
  amortizacao: number;
  juros: number;
  prestacao: number;
  seguroDFI: number;
  seguroMIP: number;
  taxaAdministracao: number;
  taxaRiscoCredito: number;
  taxaOperacionalMensal: number;
  prestacaoTotal: number;
  saldoDevedorAtual: number;
  amortizacaoExtraordinaria?: number;
}

export interface AmortizacaoExtraordinaria {
  mes: number;
  valor: number;
  tipo: 'reduzir_prazo' | 'reduzir_prestacao';
}

export interface SimulacaoResultado {
  dados: FinanciamentoDados;
  parcelas: Parcela[];
  valorTotalJuros: number;
  valorTotalAmortizacao: number;
  valorTotalSeguros: number;
  valorTotalTaxas: number;
  valorTotalPago: number;
  prazoRealMeses: number;
  amortizacoesExtraordinarias: AmortizacaoExtraordinaria[];
  economiaTotal: number;
}

export interface ResumoFinanciamento {
  valorImovel: number;
  valorFinanciado: number;
  valorEntrada: number;
  valorTotalJuros: number;
  valorTotalSeguros: number;
  valorTotalTaxas: number;
  valorTotalPago: number;
  prazoOriginal: number;
  prazoReal: number;
  economiaJuros: number;
  economiaMeses: number;
  primeiraPrestacao: number;
  ultimaPrestacao: number;
}

export interface DadosCaixa {
  // Metadados
  numeroSimulacao?: string;
  dataSimulacao?: string;
  
  // Dados principais
  valorImovel: number;
  prazoMaximo: number;
  sistemaAmortizacao: string;
  cotacaoMaxFinanciamento: number;
  valorEntrada: number;
  entradaAtualizada: boolean;
  prazo: number;
  valorFinanciamento: number;
  despesaCartorariaLeiloeiro: number;
  apoliceSeguro: number;
  incorporarTarifas: boolean;
  
  // Primeira prestação
  primeiraPrestacao: number;
  jurosNominais: number;
  jurosEfetivos: number;
  
  // Taxas à vista
  seguroVista?: number;
  tarifas?: number;
  iof?: number;
  totalTaxasVista?: number;
  
  // Componentes da prestação
  amortizacaoJuros?: number;
  seguroDFI?: number;
  seguroMIP?: number;
  totalSeguros?: number;
  taxaAdministracao?: number;
  taxaRiscoCredito?: number;
  taxaOperacionalMensal?: number;
  totalPrestacao?: number;
  
  // Resumo
  origemRecurso: string;
  tipoPessoa: string;
  categoriaPessoa?: string;
  tipoFinanciamento?: string;
  categoriaImovel?: string;
  cidade?: string;
  uf?: string;
  prazoObra?: number;
  rendaFamiliar?: number;
  numeroParticipantes?: number;
  pactuacaoNascimento?: number;
  dataNascimento?: string;
}