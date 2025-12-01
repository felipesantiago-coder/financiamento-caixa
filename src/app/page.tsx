'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PDFUpload } from '@/components/financiamento/PDFUpload';
import { CalculadoraFinanciamento } from '@/lib/calculos/financiamento';
import { FinanciamentoDados, SimulacaoResultado, AmortizacaoExtraordinaria } from '@/types/financiamento';
import { 
  Calculator, 
  BarChart3, 
  Home, 
  Upload, 
  FileText, 
  RotateCcw,
  Zap,
  TrendingUp,
  Shield,
  Activity,
  Calendar
} from 'lucide-react';

export default function App() {
  const [dadosFinanciamento, setDadosFinanciamento] = useState<FinanciamentoDados | null>(null);
  const [amortizacoesExtraordinarias, setAmortizacoesExtraordinarias] = useState<AmortizacaoExtraordinaria[]>([]);
  const [simulacao, setSimulacao] = useState<SimulacaoResultado | null>(null);

  useEffect(() => {
    if (dadosFinanciamento) {
      calcularSimulacao();
    }
  }, [dadosFinanciamento, amortizacoesExtraordinarias]);

  const calcularSimulacao = () => {
    if (!dadosFinanciamento) return;
    
    const resultado = CalculadoraFinanciamento.calcularFinanciamento(
      dadosFinanciamento,
      amortizacoesExtraordinarias
    );
    setSimulacao(resultado);
  };

  const handleDadosExtraidosDoPDF = (dados: FinanciamentoDados) => {
    setDadosFinanciamento(dados);
  };

  const limparTodosDados = () => {
    // Limpar todos os dados
    setDadosFinanciamento(null);
    setAmortizacoesExtraordinarias([]);
    setSimulacao(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header Principal */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Simulador Caixa</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {dadosFinanciamento ? 'Financiamento imobiliário com amortizações extraordinárias' : 'Carregue um PDF para começar'}
                </p>
              </div>
              {simulacao && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Simulação Ativa</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {simulacao && dadosFinanciamento && (
                <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Parcela</p>
                    <p className="text-sm font-bold text-primary">
                      {CalculadoraFinanciamento.formatarMoeda(simulacao.parcelas[0]?.prestacaoTotal || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Economia</p>
                    <p className="text-sm font-bold text-green-600">
                      {CalculadoraFinanciamento.formatarMoeda(simulacao.economiaTotal)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Prazo</p>
                    <p className="text-sm font-bold text-blue-600">
                      {simulacao.prazoRealMeses} meses
                    </p>
                  </div>
                </div>
              )}
              <Button
                onClick={limparTodosDados}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-red-200 hover:border-red-300 hover:bg-red-50"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegação por Abas */}
      <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-12 bg-transparent">
              <TabsTrigger 
                value="upload" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Importar</span>
                <span className="sm:hidden">PDF</span>
              </TabsTrigger>
              <TabsTrigger 
                value="formulario" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Dados</span>
                <span className="sm:hidden">Form</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tabela" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                disabled={!simulacao}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Tabela</span>
                <span className="sm:hidden">Tab</span>
              </TabsTrigger>
              <TabsTrigger 
                value="amortizacoes" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                disabled={!simulacao}
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Amort. Extra</span>
                <span className="sm:hidden">Extra</span>
              </TabsTrigger>
              <TabsTrigger 
                value="graficos" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                disabled={!simulacao}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Gráficos</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
            </TabsList>

            {/* Conteúdo das Abas */}
            <TabsContent value="upload" className="mt-0">
              <div className="py-6">
                <PDFUpload onDadosExtraidos={handleDadosExtraidosDoPDF} />
                
                {simulacao && (
                  <div className="mt-8 max-w-4xl mx-auto">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <TrendingUp className="h-4 w-4 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-green-800">Simulação Carregada!</h2>
                          </div>
                          <p className="text-green-700 mb-4">
                            Use as outras abas para visualizar a tabela completa, adicionar amortizações extraordinárias ou ver os gráficos.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <Calculator className="h-3 w-3 mr-1" />
                              {CalculadoraFinanciamento.formatarMoeda(dadosFinanciamento?.valorFinanciado || 0)}
                            </Badge>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              <Calendar className="h-3 w-3 mr-1" />
                              {dadosFinanciamento?.prazoMeses || 0} meses
                            </Badge>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              <Activity className="h-3 w-3 mr-1" />
                              {dadosFinanciamento?.sistema || 'N/A'}
                            </Badge>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {dadosFinanciamento?.taxaJurosNominal?.toFixed(2) || '0.00'}% a.a.
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={limparTodosDados}
                          variant="outline"
                          className="border-red-200 hover:border-red-300 hover:bg-red-50"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Limpar Dados
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="formulario" className="mt-0">
              <div className="py-6">
                {dadosFinanciamento ? (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                          <Home className="h-8 w-8 text-yellow-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Dados do Financiamento</h3>
                        <p className="text-yellow-700 mb-4 max-w-2xl mx-auto">
                          Os dados foram extraídos com sucesso do PDF. Use as outras abas para visualizar a tabela de amortização, adicionar amortizações extraordinárias e ver gráficos detalhados.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Shield className="h-3 w-3 mr-1" />
                            {CalculadoraFinanciamento.formatarMoeda(dadosFinanciamento.valorFinanciado || 0)}
                          </Badge>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <Calendar className="h-3 w-3 mr-1" />
                            {dadosFinanciamento.prazoMeses} meses
                          </Badge>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            <Activity className="h-3 w-3 mr-1" />
                            {dadosFinanciamento.sistema}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Home className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Nenhum dado de financiamento</h3>
                    <p className="text-muted-foreground max-w-md">
                      Importe um PDF da Caixa ou cole o texto manualmente para carregar os dados do financiamento e começar a simulação.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tabela" className="mt-0">
              <div className="py-6">
                {simulacao ? (
                  <div className="max-w-6xl mx-auto">
                    <div className="bg-white border rounded-lg shadow-sm">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Tabela de Amortização
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Mês
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Saldo Devedor
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amortização
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Juros
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Prestação
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {simulacao.parcelas.slice(0, 12).map((parcela) => (
                                <tr key={parcela.mes} className="hover:bg-gray-50">
                                  <td className="border border-gray-200 px-4 py-2 text-sm">
                                    {parcela.mes}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-2 text-sm">
                                    {CalculadoraFinanciamento.formatarMoeda(parcela.saldoDevedorAnterior)}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-2 text-sm">
                                    {CalculadoraFinanciamento.formatarMoeda(parcela.amortizacao)}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-2 text-sm">
                                    {CalculadoraFinanciamento.formatarMoeda(parcela.juros)}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-2 text-sm font-medium">
                                    {CalculadoraFinanciamento.formatarMoeda(parcela.prestacaoTotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {simulacao.parcelas.length > 12 && (
                          <div className="mt-4 text-center">
                            <p className="text-sm text-gray-500">
                              Mostrando primeiros 12 meses de {simulacao.parcelas.length} meses totais
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Nenhuma simulação ativa</h3>
                    <p className="text-muted-foreground max-w-md">
                      Importe um PDF da Caixa para visualizar a tabela de amortização completa.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="amortizacoes" className="mt-0">
              <div className="py-6">
                {simulacao ? (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white border rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Amortizações Extraordinárias
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-700 mb-2">
                            Adicione amortizações extraordinárias para reduzir o prazo ou o valor das prestações.
                          </p>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-800">
                              {CalculadoraFinanciamento.formatarMoeda(simulacao.economiaTotal)}
                            </p>
                            <p className="text-sm text-blue-600">
                              Economia total com amortizações extraordinárias
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Zap className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Nenhuma simulação ativa</h3>
                    <p className="text-muted-foreground max-w-md">
                      Importe um PDF da Caixa para adicionar amortizações extraordinárias.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="graficos" className="mt-0">
              <div className="py-6">
                {simulacao ? (
                  <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white border rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Resumo do Financiamento
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">Valor Total Pago</span>
                            <span className="text-lg font-bold text-green-600">
                              {CalculadoraFinanciamento.formatarMoeda(simulacao.valorTotalPago)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">Total de Juros</span>
                            <span className="text-lg font-bold text-red-600">
                              {CalculadoraFinanciamento.formatarMoeda(simulacao.valorTotalJuros)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">Total Amortizado</span>
                            <span className="text-lg font-bold text-blue-600">
                              {CalculadoraFinanciamento.formatarMoeda(simulacao.valorTotalAmortizacao)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white border rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Estatísticas
                        </h3>
                        <div className="space-y-4">
                          <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                            <p className="text-3xl font-bold text-green-800">
                              {simulacao.prazoRealMeses}
                            </p>
                            <p className="text-sm text-green-600">
                              Meses para quitar
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <p className="text-2xl font-bold text-blue-800">
                                {((simulacao.valorTotalJuros / simulacao.valorTotalPago) * 100).toFixed(1)}%
                              </p>
                              <p className="text-sm text-blue-600">
                                % de juros
                              </p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <p className="text-2xl font-bold text-purple-800">
                                {CalculadoraFinanciamento.formatarMoeda(simulacao.parcelas[0]?.prestacaoTotal || 0)}
                              </p>
                              <p className="text-sm text-purple-600">
                                Primeira parcela
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Nenhuma simulação ativa</h3>
                    <p className="text-muted-foreground max-w-md">
                      Importe um PDF da Caixa para visualizar os gráficos e análises.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm font-medium">Simulador de Financiamento CAIXA</p>
              <p className="text-xs text-muted-foreground">
                Sistemas PRICE, PRICE TR e SAC com amortizações extraordinárias
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Seguro</span>
              </div>
              <div className="flex items-center gap-1">
                <Calculator className="h-3 w-3" />
                <span>Preciso</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <span>Profissional</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}