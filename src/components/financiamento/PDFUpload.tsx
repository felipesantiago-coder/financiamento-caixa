'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Eye,
  Calculator,
  Info,
  TrendingUp
} from 'lucide-react';
import { DadosCaixa, FinanciamentoDados } from '@/types/financiamento';
import { CaixaPDFParserRobusto } from '@/lib/parser/caixa-pdf-parser-robusto';
import { CalculadoraFinanciamento } from '@/lib/calculos/financiamento';

interface PDFUploadProps {
  onDadosExtraidos: (dados: FinanciamentoDados) => void;
}

export function PDFUpload({ onDadosExtraidos }: PDFUploadProps) {
  const [processando, setProcessando] = useState(false);
  const [dadosExtraidos, setDadosExtraidos] = useState<DadosCaixa | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [progresso, setProgresso] = useState(0);
  const [textoPDF, setTextoPDF] = useState<string>('');
  const [modoTexto, setModoTexto] = useState(false);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErro('Por favor, selecione um arquivo PDF válido.');
      return;
    }

    setProcessando(true);
    setErro(null);
    setProgresso(20);

    try {
      // Ler o arquivo PDF
      const arrayBuffer = await file.arrayBuffer();
      setProgresso(50);

      // Importar e usar pdfjs-dist com configuração alternativa
      const pdfjs = await import('pdfjs-dist');
      
      // Tentar abordagem mais simples primeiro
      try {
        // Configuração do worker com fallback local
        if (typeof window !== 'undefined') {
          // Tentar usar CDN primeiro
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        }
        
        // Carregar o documento PDF
        const loadingTask = pdfjs.getDocument({ 
          data: arrayBuffer,
          // Configurações mínimas para evitar conflitos
          disableAutoFetch: true,
          disableStream: true
        });
        
        const pdf = await loadingTask.promise;
        setProgresso(70);

        // Extrair texto de todas as páginas
        let fullText = '';
        const numPages = pdf.numPages;
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false
          });
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
          setProgresso(70 + (pageNum / numPages) * 20);
        }

        setProgresso(90);
        
        // Processar o texto extraído
        const dados = CaixaPDFParserRobusto.parsePDFText(fullText);
        setProgresso(100);

        if (!dados) {
          throw new Error('Não foi possível extrair os dados do PDF. Verifique se o formato está correto.');
        }

        // Validar dados extraídos
        if (!CaixaPDFParserRobusto.validarDadosExtraidos(dados)) {
          throw new Error('Dados extraídos são inválidos ou incompletos.');
        }

        setDadosExtraidos(dados);

        // Converter para formato do aplicativo
        const dadosFinanciamento = CaixaPDFParserRobusto.converterParaFinanciamentoDados(dados);
        
        // Validar conversão
        const validacao = CalculadoraFinanciamento.validarDadosCaixa(dadosFinanciamento);
        if (!validacao.valido) {
          console.warn('Avisos de validação:', validacao.erros);
        }

        onDadosExtraidos(dadosFinanciamento);
        
      } catch (pdfError) {
        console.warn('Erro no processamento PDF, tentando fallback:', pdfError);
        
        // Fallback: desabilitar worker completamente
        const pdfjsFallback = await import('pdfjs-dist');
        pdfjsFallback.GlobalWorkerOptions.workerSrc = '';
        
        const loadingTask = pdfjsFallback.getDocument({ 
          data: arrayBuffer,
          disableWorker: true,
          disableAutoFetch: true,
          disableStream: true,
          isEvalSupported: false
        });
        
        const pdf = await loadingTask.promise;
        setProgresso(70);

        // Extrair texto de todas as páginas
        let fullText = '';
        const numPages = pdf.numPages;
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false
          });
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
          setProgresso(70 + (pageNum / numPages) * 20);
        }

        setProgresso(90);
        
        // Processar o texto extraído
        const dados = CaixaPDFParserRobusto.parsePDFText(fullText);
        setProgresso(100);

        if (!dados) {
          throw new Error('Não foi possível extrair os dados do PDF. Tente usar a opção "Colar texto do PDF".');
        }

        // Validar dados extraídos
        if (!CaixaPDFParserRobusto.validarDadosExtraidos(dados)) {
          throw new Error('Dados extraídos são inválidos ou incompletos.');
        }

        setDadosExtraidos(dados);

        // Converter para formato do aplicativo
        const dadosFinanciamento = CaixaPDFParserRobusto.converterParaFinanciamentoDados(dados);
        
        // Validar conversão
        const validacao = CalculadoraFinanciamento.validarDadosCaixa(dadosFinanciamento);
        if (!validacao.valido) {
          console.warn('Avisos de validação:', validacao.erros);
        }

        onDadosExtraidos(dadosFinanciamento);
      }

    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      
      // Tratamento mais específico de erros
      let errorMessage = 'Erro ao processar o PDF. Verifique se o arquivo não está corrompido.';
      
      if (error instanceof Error) {
        if (error.message.includes('No "GlobalWorkerOptions.workerSrc" specified')) {
          errorMessage = 'Erro de configuração do processamento de PDF. Tente usar a opção "Colar texto do PDF" ou recarregue a página.';
        } else if (error.message.includes('API version') && error.message.includes('Worker version')) {
          errorMessage = 'Erro de compatibilidade do processamento de PDF. Tente usar a opção "Colar texto do PDF" ou recarregue a página.';
        } else if (error.message.includes('getDocument') || error.message.includes('pdfjs-dist')) {
          errorMessage = 'Erro ao carregar a biblioteca de processamento de PDF. Tente usar a opção "Colar texto do PDF" ou recarregue a página.';
        } else if (error.message.includes('worker') || error.message.includes('fake worker')) {
          errorMessage = 'Erro ao configurar o processamento de PDF. Tente usar a opção "Colar texto do PDF" ou recarregue a página.';
        } else if (error.message.includes('CORS') || error.message.includes('Cross-Origin')) {
          errorMessage = 'Erro de segurança ao carregar o PDF. Tente usar a opção "Colar texto do PDF" ou recarregue a página.';
        } else if (error.message.includes('MIME type') || error.message.includes('disallowed MIME type')) {
          errorMessage = 'Erro de configuração do processamento de PDF. Tente usar a opção "Colar texto do PDF" ou recarregue a página.';
        } else if (error.message.includes('Failed to load') || error.message.includes('Invalid PDF')) {
          errorMessage = 'Não foi possível carregar o arquivo PDF. Verifique se o arquivo não está corrompido ou protegido.';
        } else if (error.message.includes('não foi possível extrair texto')) {
          errorMessage = 'Não foi possível extrair texto do PDF. O arquivo pode estar corrompido, ser uma imagem ou estar protegido por senha.';
        } else if (error.message.includes('Dados incompletos')) {
          errorMessage = `Dados incompletos ou inválidos. ${error.message}`;
        } else if (error.message.includes('muito grande')) {
          errorMessage = error.message;
        } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          errorMessage = 'Erro de rede ao carregar o PDF. Verifique sua conexão e tente novamente.';
        }
      }
      
      setErro(errorMessage);
    } finally {
      setProcessando(false);
      setTimeout(() => setProgresso(0), 1000);
    }
  }, [onDadosExtraidos]);

  // Função para processar texto colado
  const handleTextoProcess = useCallback(() => {
    if (!textoPDF.trim()) {
      setErro('Por favor, cole o texto do PDF na área de texto.');
      return;
    }

    setProcessando(true);
    setErro(null);
    setProgresso(50);

    try {
      // Fazer parse dos dados
      const dados = CaixaPDFParserRobusto.parsePDFText(textoPDF);
      setProgresso(80);

      if (!dados) {
        throw new Error('Não foi possível extrair os dados do texto. Verifique se o formato está correto.');
      }

      // Validar dados extraídos
      if (!CaixaPDFParserRobusto.validarDadosExtraidos(dados)) {
        throw new Error('Dados extraídos são inválidos ou incompletos.');
      }

      setProgresso(100);
      setDadosExtraidos(dados);

      // Converter para formato do aplicativo
      const dadosFinanciamento = CaixaPDFParserRobusto.converterParaFinanciamentoDados(dados);
      
      // Validar conversão
      const validacao = CalculadoraFinanciamento.validarDadosCaixa(dadosFinanciamento);
      if (!validacao.valido) {
        console.warn('Avisos de validação:', validacao.erros);
      }

      onDadosExtraidos(dadosFinanciamento);

    } catch (error) {
      console.error('Erro ao processar texto:', error);
      setErro(error instanceof Error ? error.message : 'Erro desconhecido ao processar o texto.');
    } finally {
      setProcessando(false);
      setTimeout(() => setProgresso(0), 1000);
    }
  }, [textoPDF, onDadosExtraidos]);

  const limparDados = () => {
    setDadosExtraidos(null);
    setErro(null);
    setTextoPDF('');
    setProgresso(0);
    setModoTexto(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header Principal */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Importar Simulação Caixa</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Carregue um PDF de simulação da Caixa Econômica Federal ou cole o texto para extrair automaticamente todos os dados
          </p>
        </div>
      </div>

      {/* Área de Upload */}
      <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors duration-300">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Input de File Customizado */}
            <div className="space-y-4">
              <Label htmlFor="pdf-upload" className="text-base font-medium cursor-pointer">
                <div className="inline-flex flex-col items-center justify-center w-full max-w-md p-8 border-2 border-muted rounded-lg hover:bg-muted/50 transition-colors">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Clique para selecionar o PDF</p>
                    <p className="text-sm text-muted-foreground">ou arraste o arquivo para cá</p>
                    <p className="text-xs text-muted-foreground">Apenas arquivos PDF são aceitos</p>
                  </div>
                </div>
              </Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={processando}
                className="hidden"
              />
            </div>

            {/* Status de Processamento */}
            {processando && (
              <div className="space-y-4 p-6 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                  <span className="text-lg font-medium">Processando...</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progresso</span>
                    <span>{progresso}%</span>
                  </div>
                  <Progress value={progresso} className="w-full h-2" />
                </div>
              </div>
            )}

            {/* Mensagens de Status */}
            {erro && (
              <Alert variant="destructive" className="max-w-md mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro no processamento</AlertTitle>
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            {dadosExtraidos && (
              <Alert className="max-w-md mx-auto border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Dados extraídos com sucesso!</AlertTitle>
                <AlertDescription className="text-green-700">
                  A simulação foi importada e os dados estão prontos para uso.
                </AlertDescription>
              </Alert>
            )}

            {/* Botão para alternar para modo texto */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setModoTexto(!modoTexto)}
                className="text-sm"
              >
                {modoTexto ? 'Voltar para Upload de PDF' : 'Ou cole o texto do PDF manualmente'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área de Texto Manual */}
      {modoTexto && (
        <Card className="border-2 border-dashed border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Colar Texto do PDF
            </CardTitle>
            <CardDescription>
              Copie o texto do PDF da simulação da Caixa e cole aqui para extração automática dos dados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="texto-pdf">Texto do PDF</Label>
              <textarea
                id="texto-pdf"
                value={textoPDF}
                onChange={(e) => setTextoPDF(e.target.value)}
                placeholder="Cole aqui o texto completo do PDF da simulação da Caixa..."
                className="w-full h-64 p-3 border border-input bg-background text-foreground rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                disabled={processando}
              />
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={handleTextoProcess}
                disabled={processando || !textoPDF.trim()}
                className="min-w-32"
              >
                {processando ? 'Processando...' : 'Processar Texto'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados Extraídos */}
      {dadosExtraidos && (
        <div className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card Principal - Dados do Financiamento */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calculator className="h-5 w-5" />
                  Dados do Financiamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Valor do Imóvel</p>
                      <p className="text-2xl font-bold text-primary">
                        {CalculadoraFinanciamento.formatarMoeda(dadosExtraidos.valorImovel)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Valor Financiado</p>
                      <p className="text-xl font-semibold">
                        {CalculadoraFinanciamento.formatarMoeda(dadosExtraidos.valorFinanciamento)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Valor de Entrada</p>
                      <p className="text-xl font-semibold">
                        {CalculadoraFinanciamento.formatarMoeda(dadosExtraidos.valorEntrada)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Prazo</p>
                      <p className="text-xl font-semibold">
                        {dadosExtraidos.prazo} <span className="text-base font-normal">meses</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default" className="px-3 py-1">
                    {dadosExtraidos.sistemaAmortizacao}
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1">
                    {dadosExtraidos.origemRecurso}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    {dadosExtraidos.cotacaoMaxFinanciamento}% financiamento
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Card Secundário - Valores Mensais */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="h-5 w-5" />
                  Valores Mensais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600 mb-2">Primeira Prestação</p>
                  <p className="text-2xl font-bold text-green-700">
                    {CalculadoraFinanciamento.formatarMoeda(dadosExtraidos.primeiraPrestacao)}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Seguro DFI</p>
                    <p className="font-semibold">
                      {CalculadoraFinanciamento.formatarMoeda(dadosExtraidos.seguroDFI || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Seguro MIP</p>
                    <p className="font-semibold">
                      {CalculadoraFinanciamento.formatarMoeda(dadosExtraidos.seguroMIP || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Taxa Operacional</p>
                    <p className="font-semibold">
                      {CalculadoraFinanciamento.formatarMoeda(dadosExtraidos.taxaOperacionalMensal || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Juros Nominais</p>
                    <p className="font-semibold">{dadosExtraidos.jurosNominais.toFixed(2)}% a.a.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs de Detalhes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Detalhadas</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="resumo" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="resumo" className="text-sm">Resumo</TabsTrigger>
                  <TabsTrigger value="detalhes" className="text-sm">Detalhes</TabsTrigger>
                  <TabsTrigger value="texto" className="text-sm">Texto Original</TabsTrigger>
                </TabsList>

                <TabsContent value="resumo" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Informações Gerais */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Informações Gerais
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm font-medium">Origem de Recurso</span>
                          <Badge variant="secondary">{dadosExtraidos.origemRecurso}</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm font-medium">Tipo de Pessoa</span>
                          <span className="text-sm">{dadosExtraidos.tipoPessoa}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm font-medium">Categoria</span>
                          <span className="text-sm">{dadosExtraidos.categoriaPessoa || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm font-medium">Tipo Financiamento</span>
                          <span className="text-sm">{dadosExtraidos.tipoFinanciamento || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Localização e Prazos */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Localização e Prazos
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm font-medium">Cidade</span>
                          <span className="text-sm">{dadosExtraidos.cidade || 'N/A'}{dadosExtraidos.uf ? ` - ${dadosExtraidos.uf}` : ''}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm font-medium">Prazo de Obra</span>
                          <span className="text-sm">{dadosExtraidos.prazoObra || 'N/A'} meses</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm font-medium">Renda Familiar</span>
                          <span className="text-sm">{CalculadoraFinanciamento.formatarMoeda(dadosExtraidos.rendaFamiliar || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm font-medium">Participantes</span>
                          <span className="text-sm">{dadosExtraidos.numeroParticipantes || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="texto" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-lg">Texto Original do PDF</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(textoPDF)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Copiar Texto
                      </Button>
                    </div>
                    <ScrollArea className="h-96 w-full border rounded-md p-4">
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {textoPDF}
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}