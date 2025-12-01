import { FinanciamentoDados, Parcela, AmortizacaoExtraordinaria, SimulacaoResultado } from '@/types/financiamento';

export class CalculadoraFinanciamento {
  static formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  static calcularFinanciamento(
    dados: FinanciamentoDados,
    amortizacoesExtraordinarias: AmortizacaoExtraordinaria[] = []
  ): SimulacaoResultado {
    if (!dados.valorFinanciado || !dados.prazoMeses || !dados.taxaJurosNominal) {
      throw new Error('Dados essenciais do financiamento não fornecidos');
    }

    const taxaMensal = dados.taxaJurosNominal / 100 / 12;
    const parcelas: Parcela[] = [];
    let saldoDevedor = dados.valorFinanciado;

    // Calcular componentes mensais
    const seguroDFIMensal = dados.seguroDFI || 0;
    const seguroMIPMensal = dados.seguroMIP || 0;
    const taxaAdmMensal = dados.taxaAdministracao || 0;
    const taxaRiscoMensal = dados.taxaRiscoCredito || 0;
    const taxaOperacionalMensal = dados.taxaOperacionalMensal || 0;

    // Calcular parcelas baseado no sistema
    for (let mes = 1; mes <= dados.prazoMeses; mes++) {
      let amortizacao = 0;
      let juros = 0;
      let prestacao = 0;

      if (dados.sistema === 'PRICE' || dados.sistema === 'PRICE TR') {
        // Sistema PRICE - prestação fixa
        prestacao = this.calcularPrestacaoPRICE(
          dados.valorFinanciado,
          taxaMensal,
          dados.prazoMeses
        );
        juros = saldoDevedor * taxaMensal;
        amortizacao = prestacao - juros;
      } else if (dados.sistema === 'SAC') {
        // Sistema SAC - amortização constante
        amortizacao = dados.valorFinanciado / dados.prazoMeses;
        juros = saldoDevedor * taxaMensal;
        prestacao = amortizacao + juros;
      }

      // Aplicar amortizações extraordinárias
      let amortizacaoExtraordinaria = 0;
      const amortizacaoExtra = amortizacoesExtraordinarias.find(a => a.mes === mes);
      if (amortizacaoExtra) {
        amortizacaoExtraordinaria = amortizacaoExtra.valor;
        saldoDevedor -= amortizacaoExtraordinaria;
      }

      const totalSeguros = seguroDFIMensal + seguroMIPMensal;
      const totalTaxas = taxaAdmMensal + taxaRiscoMensal + taxaOperacionalMensal;
      const prestacaoTotal = prestacao + totalSeguros + totalTaxas + amortizacaoExtraordinaria;

      const saldoDevedorAnterior = saldoDevedor;
      saldoDevedor = saldoDevedor - amortizacao;

      // Garantir que saldo não fique negativo
      if (saldoDevedor < 0.01) saldoDevedor = 0;

      const dataVencimento = new Date();
      dataVencimento.setMonth(dataVencimento.getMonth() + mes - 1);

      parcelas.push({
        mes,
        dataVencimento,
        saldoDevedorAnterior,
        amortizacao,
        juros,
        prestacao,
        seguroDFI: seguroDFIMensal,
        seguroMIP: seguroMIPMensal,
        taxaAdministracao: taxaAdmMensal,
        taxaRiscoCredito: taxaRiscoMensal,
        taxaOperacionalMensal,
        prestacaoTotal,
        saldoDevedorAtual: saldoDevedor,
        amortizacaoExtraordinaria: amortizacaoExtraordinaria > 0 ? amortizacaoExtraordinaria : undefined
      });
    }

    // Calcular totais
    const valorTotalJuros = parcelas.reduce((sum, p) => sum + p.juros, 0);
    const valorTotalAmortizacao = parcelas.reduce((sum, p) => sum + p.amortizacao, 0);
    const valorTotalSeguros = parcelas.reduce((sum, p) => sum + p.seguroDFI + p.seguroMIP, 0);
    const valorTotalTaxas = parcelas.reduce((sum, p) => sum + p.taxaAdministracao + p.taxaRiscoCredito + p.taxaOperacionalMensal, 0);
    const valorTotalPago = parcelas.reduce((sum, p) => sum + p.prestacaoTotal, 0);

    // Calcular economia das amortizações extraordinárias
    const economiaTotal = amortizacoesExtraordinarias.reduce((sum, a) => sum + a.valor, 0);

    return {
      dados,
      parcelas,
      valorTotalJuros,
      valorTotalAmortizacao,
      valorTotalSeguros,
      valorTotalTaxas,
      valorTotalPago,
      prazoRealMeses: dados.prazoMeses,
      amortizacoesExtraordinarias,
      economiaTotal
    };
  }

  private static calcularPrestacaoPRICE(
    principal: number,
    taxaMensal: number,
    prazo: number
  ): number {
    if (taxaMensal === 0) return principal / prazo;
    
    return principal * (taxaMensal * Math.pow(1 + taxaMensal, prazo)) / (Math.pow(1 + taxaMensal, prazo) - 1);
  }

  static validarDadosCaixa(dados: FinanciamentoDados): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (!dados.valorImovel || dados.valorImovel <= 0) {
      erros.push('Valor do imóvel é inválido');
    }

    if (!dados.valorFinanciado || dados.valorFinanciado <= 0) {
      erros.push('Valor financiado é inválido');
    }

    if (!dados.prazoMeses || dados.prazoMeses <= 0) {
      erros.push('Prazo é inválido');
    }

    if (!dados.taxaJurosNominal || dados.taxaJurosNominal <= 0) {
      erros.push('Taxa de juros é inválida');
    }

    if (!dados.sistema) {
      erros.push('Sistema de amortização não definido');
    }

    // Validações lógicas
    if (dados.valorFinanciado && dados.valorImovel && dados.valorFinanciado > dados.valorImovel) {
      erros.push('Valor financiado não pode ser maior que o valor do imóvel');
    }

    if (dados.valorEntrada && dados.valorFinanciado && dados.valorImovel) {
      const totalFinanciamento = dados.valorEntrada + dados.valorFinanciado;
      if (totalFinanciamento > dados.valorImovel * 1.1) {
        erros.push('Soma de entrada + financiamento parece inconsistente com o valor do imóvel');
      }
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }
}