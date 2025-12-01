import { DadosCaixa, FinanciamentoDados } from '../../types/financiamento';

export class CaixaPDFParserRobusto {
  /**
   * Parser robusto com múltiplos padrões e fallbacks para garantir 100% de confiabilidade
   */
  static parsePDFText(text: string): DadosCaixa | null {
    try {
      const dados: Partial<DadosCaixa> = {};
      const linhas = text.split('\n').map(linha => linha.trim()).filter(linha => linha.length > 0);

      // Função auxiliar para extrair com múltiplos padrões
      const extrairComMultiplosPadroes = (padroes: RegExp[], nomeCampo: string): string | null => {
        for (const padrao of padroes) {
          const match = text.match(padrao);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        
        // Fallback: busca por linha específica
        for (let i = 0; i < linhas.length; i++) {
          if (linhas[i] && nomeCampo && linhas[i].toLowerCase().includes(nomeCampo.toLowerCase())) {
            // Tentar extrair da mesma linha
            const mesmaLinha = linhas[i].match(/([\d.,]+%?)/);
            if (mesmaLinha) return mesmaLinha[1];
            
            // Tentar extrair da próxima linha
            if (i + 1 < linhas.length) {
              const proximaLinha = linhas[i + 1].match(/R?\$\s*([\d.,]+)/);
              if (proximaLinha) return proximaLinha[1];
              
              const proximaLinhaValor = linhas[i + 1].match(/([\d.,]+%?)/);
              if (proximaLinhaValor) return proximaLinhaValor[1];
            }
          }
        }
        
        return null;
      };

      // Extrair valor do imóvel - múltiplos padrões
      const valorImovel = extrairComMultiplosPadroes([
        /Valor do imóvel:\s*R?\$\s*([\d.,]+)/,
        /Valor Do Imóvel:\s*R?\$\s*([\d.,]+)/,
        /Valor do imovel:\s*R?\$\s*([\d.,]+)/,
        /valor imovel[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Valor do imóvel');
      if (valorImovel) dados.valorImovel = this.parseMonetary(valorImovel);

      // Extrair prazo máximo
      const prazoMaximo = extrairComMultiplosPadroes([
        /Prazo Máximo:\s*(\d+)\s*meses/i,
        /Prazo maximo:\s*(\d+)\s*meses/i,
        /prazo maximo[:\s]*(\d+)\s*meses/i
      ], 'Prazo Máximo');
      if (prazoMaximo) dados.prazoMaximo = parseInt(prazoMaximo);

      // Extrair sistema de amortização
      const sistema = extrairComMultiplosPadroes([
        /Sistema de Amortização:\s*([A-Z\s]+?)(?=\n|$)/,
        /Sistema[:\s]*([A-Z\s]+?)(?=\n|$)/i,
        /amortização[:\s]*([A-Z\s]+?)(?=\n|$)/i
      ], 'Sistema de Amortização');
      if (sistema) {
        const sistemaLimpo = sistema.replace(/[^A-Z\s]/g, '').replace(/\s+/g, ' ').trim();
        dados.sistemaAmortizacao = sistemaLimpo;
      }

      // Extrair cotação máxima financiamento
      const cotacao = extrairComMultiplosPadroes([
        /Cota máx\.\s*financiamento:\s*(\d+)%/i,
        /Cota max[:\s]*financiamento[:\s]*(\d+)%/i,
        /financiamento[:\s]*(\d+)%/i
      ], 'Cota máx. financiamento');
      if (cotacao) dados.cotacaoMaxFinanciamento = parseInt(cotacao);

      // Extrair valor de entrada
      const entrada = extrairComMultiplosPadroes([
        /Valor de entrada:\s*R?\$\s*([\d.,]+)/i,
        /entrada[:\s]*R?\$\s*([\d.,]+)/i,
        /Valor entrada[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Valor de entrada');
      if (entrada) dados.valorEntrada = this.parseMonetary(entrada);

      // Extrair entrada atualizada
      const entradaAtualizada = extrairComMultiplosPadroes([
        /Entrada Atualizada:\s*(Sim|Nao)/i,
        /entrada atualizada[:\s]*(Sim|Nao)/i
      ], 'Entrada Atualizada');
      if (entradaAtualizada) dados.entradaAtualizada = entradaAtualizada.toLowerCase() === 'sim';

      // Extrair prazo
      const prazo = extrairComMultiplosPadroes([
        /Prazo:\s*(\d+)\s*meses/i,
        /prazo[:\s]*(\d+)\s*meses/i
      ], 'Prazo');
      if (prazo) dados.prazo = parseInt(prazo);

      // Extrair valor de financiamento - múltiplos padrões robustos
      const financiamento = extrairComMultiplosPadroes([
        /Valor de Financiamento[\s\S]*?R?\$\s*([\d.,]+)/,
        /financiamento[:\s]*R?\$\s*([\d.,]+)/i,
        /Valor Financiamento[:\s]*R?\$\s*([\d.,]+)/i,
        /Financiamento.*?R\$\s*([\d.,]+)/
      ], 'Valor de Financiamento');
      if (financiamento) dados.valorFinanciamento = this.parseMonetary(financiamento);

      // Extrair despesa cartorária/leiloeiro
      const despesa = extrairComMultiplosPadroes([
        /Despesa Cartorária\/Leiloeiro:\s*R?\$\s*([\d.,]+)/i,
        /Despesa Cartoraria[:\s]*R?\$\s*([\d.,]+)/i,
        /despesa[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Despesa Cartorária');
      if (despesa) dados.despesaCartorariaLeiloeiro = this.parseMonetary(despesa);

      // Extrair apólice de seguro
      const apolice = extrairComMultiplosPadroes([
        /Apólice de Seguro:\s*(\d+)/i,
        /Apolice[:\s]*(\d+)/i,
        /seguro[:\s]*(\d+)/i
      ], 'Apólice de Seguro');
      if (apolice) dados.apoliceSeguro = parseInt(apolice);

      // Extrair primeira prestação - padrão robusto
      const primeiraPrestacao = extrairComMultiplosPadroes([
        /Primeira Prestação[\s\S]*?R?\$\s*([\d.,]+)/,
        /Primeira prestacao[:\s]*R?\$\s*([\d.,]+)/i,
        /prestação[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Primeira Prestação');
      if (primeiraPrestacao) dados.primeiraPrestacao = this.parseMonetary(primeiraPrestacao);

      // Extrair juros nominais - abordagem especializada e robusta
      let jurosNominais = extrairComMultiplosPadroes([
        /Juros Nominais\s*([\d.,]+)%/i,
        /juros nominais[:\s]*([\d.,]+)%/i
      ], 'Juros Nominais');
      
      // Fallback especializado para o layout específico
      if (!jurosNominais) {
        const jurosPattern = /Primeira Prestação.*?Juros Nominais.*?Juros Efetivos\s*\n\s*R?\$[\s\d.,]+([\d.,]+)%\s*([\d.,]+)%/;
        const jurosMatch = text.match(jurosPattern);
        if (jurosMatch) {
          jurosNominais = jurosMatch[1];
        } else {
          // Abordagem alternativa: busca contextual + split
          for (let i = 0; i < linhas.length; i++) {
            if (linhas[i] && linhas[i].includes('Primeira Prestação') && 
                linhas[i].includes('Juros Nominais') && 
                linhas[i].includes('Juros Efetivos')) {
              
              if (i + 1 < linhas.length) {
                const proximaLinha = linhas[i + 1];
                const todosValores = proximaLinha.match(/R?\$\s*([\d.,]+)|([\d.,]+)%/g);
                if (todosValores && todosValores.length >= 3) {
                  const percentuais = todosValores.slice(1).map(v => v.replace('%', ''));
                  if (percentuais.length >= 1) {
                    jurosNominais = percentuais[0];
                    break;
                  }
                }
              }
            }
          }
        }
      }
      if (jurosNominais) dados.jurosNominais = parseFloat(jurosNominais.replace(',', '.'));

      // Extrair juros efetivos - abordagem especializada e robusta
      let jurosEfetivos = extrairComMultiplosPadroes([
        /Juros Efetivos\s*([\d.,]+)%/i,
        /juros efetivos[:\s]*([\d.,]+)%/i
      ], 'Juros Efetivos');
      
      // Fallback especializado para o layout específico
      if (!jurosEfetivos) {
        const jurosPattern = /Primeira Prestação.*?Juros Nominais.*?Juros Efetivos\s*\n\s*R?\$[\s\d.,]+([\d.,]+)%\s*([\d.,]+)%/;
        const jurosMatch = text.match(jurosPattern);
        if (jurosMatch) {
          jurosEfetivos = jurosMatch[2];
        } else {
          // Abordagem alternativa: busca contextual + split
          for (let i = 0; i < linhas.length; i++) {
            if (linhas[i] && linhas[i].includes('Primeira Prestação') && 
                linhas[i].includes('Juros Nominais') && 
                linhas[i].includes('Juros Efetivos')) {
              
              if (i + 1 < linhas.length) {
                const proximaLinha = linhas[i + 1];
                const todosValores = proximaLinha.match(/R?\$\s*([\d.,]+)|([\d.,]+)%/g);
                if (todosValores && todosValores.length >= 3) {
                  const percentuais = todosValores.slice(1).map(v => v.replace('%', ''));
                  if (percentuais.length >= 2) {
                    jurosEfetivos = percentuais[1];
                    break;
                  }
                }
              }
            }
          }
        }
      }
      if (jurosEfetivos) dados.jurosEfetivos = parseFloat(jurosEfetivos.replace(',', '.'));

      // Extrair seguro à vista
      const seguroVista = extrairComMultiplosPadroes([
        /Seguro à vista\s*R?\$\s*([\d.,]+)/i,
        /Seguro a vista[:\s]*R?\$\s*([\d.,]+)/i,
        /seguro vista[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Seguro à vista');
      if (seguroVista) dados.seguroVista = this.parseMonetary(seguroVista);

      // Extrair tarifas
      const tarifas = extrairComMultiplosPadroes([
        /Tarifas\s*R?\$\s*([\d.,]+)/i,
        /tarifas[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Tarifas');
      if (tarifas) dados.tarifas = this.parseMonetary(tarifas);

      // Extrair IOF
      const iof = extrairComMultiplosPadroes([
        /IOF\s*R?\$\s*([\d.,]+)/i,
        /iof[:\s]*R?\$\s*([\d.,]+)/i
      ], 'IOF');
      if (iof) dados.iof = this.parseMonetary(iof);

      // Extrair componentes da prestação
      const amortizacaoJuros = extrairComMultiplosPadroes([
        /Amortização \+ Juros\s*R?\$\s*([\d.,]+)/i,
        /Amortizacao[\s+]*Juros[:\s]*R?\$\s*([\d.,]+)/i,
        /amortizacao[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Amortização + Juros');
      if (amortizacaoJuros) dados.amortizacaoJuros = this.parseMonetary(amortizacaoJuros);

      const seguroDFI = extrairComMultiplosPadroes([
        /Seguro DFI\s*R?\$\s*([\d.,]+)/i,
        /seguro DFI[:\s]*R?\$\s*([\d.,]+)/i,
        /DFI[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Seguro DFI');
      if (seguroDFI) dados.seguroDFI = this.parseMonetary(seguroDFI);

      const seguroMIP = extrairComMultiplosPadroes([
        /Seguro MIP\s*R?\$\s*([\d.,]+)/i,
        /seguro MIP[:\s]*R?\$\s*([\d.,]+)/i,
        /MIP[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Seguro MIP');
      if (seguroMIP) dados.seguroMIP = this.parseMonetary(seguroMIP);

      const totalSeguros = extrairComMultiplosPadroes([
        /Total Seguros\s*R?\$\s*([\d.,]+)/i,
        /total seguros[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Total Seguros');
      if (totalSeguros) dados.totalSeguros = this.parseMonetary(totalSeguros);

      const taxaAdm = extrairComMultiplosPadroes([
        /Taxa de administração\s*R?\$\s*([\d.,]+)/i,
        /taxa administracao[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Taxa de administração');
      if (taxaAdm) dados.taxaAdministracao = this.parseMonetary(taxaAdm);

      const taxaRisco = extrairComMultiplosPadroes([
        /Taxa de risco de crédito\s*R?\$\s*([\d.,]+)/i,
        /taxa risco[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Taxa de risco de crédito');
      if (taxaRisco) dados.taxaRiscoCredito = this.parseMonetary(taxaRisco);

      const taxaOperacional = extrairComMultiplosPadroes([
        /Taxa operacional mensal\s*R?\$\s*([\d.,]+)/i,
        /taxa operacional[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Taxa operacional mensal');
      if (taxaOperacional) dados.taxaOperacionalMensal = this.parseMonetary(taxaOperacional);

      // Extrair total da prestação
      const totalPrestacao = extrairComMultiplosPadroes([
        /Componentes da prestação[\s\S]*?TOTAL\s*R?\$\s*([\d.,]+)/i,
        /TOTAL[:\s]*R?\$\s*([\d.,]+)/i
      ], 'TOTAL');
      if (totalPrestacao) dados.totalPrestacao = this.parseMonetary(totalPrestacao);

      // Extrair dados do resumo
      const origemRecurso = extrairComMultiplosPadroes([
        /Origem De Recurso:\s*(\w+)/i,
        /origem recurso[:\s]*(\w+)/i
      ], 'Origem De Recurso');
      if (origemRecurso) dados.origemRecurso = origemRecurso;

      const tipoPessoa = extrairComMultiplosPadroes([
        /Tipo De Pessoa:\s*(\w+)/i,
        /tipo pessoa[:\s]*(\w+)/i
      ], 'Tipo De Pessoa');
      if (tipoPessoa) dados.tipoPessoa = tipoPessoa;

      const categoriaPessoa = extrairComMultiplosPadroes([
        /Categoria De Pessoa:\s*([^\n]+)/i,
        /categoria pessoa[:\s]*([^\n]+)/i
      ], 'Categoria De Pessoa');
      if (categoriaPessoa) dados.categoriaPessoa = categoriaPessoa;

      const tipoFinanciamento = extrairComMultiplosPadroes([
        /Tipo De Financiamento:\s*([^\n]+)/i,
        /tipo financiamento[:\s]*([^\n]+)/i
      ], 'Tipo De Financiamento');
      if (tipoFinanciamento) dados.tipoFinanciamento = tipoFinanciamento;

      const categoriaImovel = extrairComMultiplosPadroes([
        /Categoria De Imóvel:\s*([^\n]+)/i,
        /categoria imovel[:\s]*([^\n]+)/i
      ], 'Categoria De Imóvel');
      if (categoriaImovel) dados.categoriaImovel = categoriaImovel;

      const cidade = extrairComMultiplosPadroes([
        /Cidade:\s*([^\n]+)/i,
        /cidade[:\s]*([^\n]+)/i
      ], 'Cidade');
      if (cidade) {
        const cidadeUfParts = cidade.split('-');
        dados.cidade = cidadeUfParts[0]?.trim() || cidade.trim();
        dados.uf = cidadeUfParts[1]?.trim() || '';
      }

      const prazoObra = extrairComMultiplosPadroes([
        /Prazo De Obra:\s*(\d+)\s*Meses/i,
        /prazo obra[:\s]*(\d+)\s*meses/i
      ], 'Prazo De Obra');
      if (prazoObra) dados.prazoObra = parseInt(prazoObra);

      const rendaFamiliar = extrairComMultiplosPadroes([
        /Renda Familiar:\s*R?\$\s*([\d.,]+)/i,
        /renda familiar[:\s]*R?\$\s*([\d.,]+)/i,
        /Renda[:\s]*R?\$\s*([\d.,]+)/i
      ], 'Renda Familiar');
      if (rendaFamiliar) dados.rendaFamiliar = this.parseMonetary(rendaFamiliar);

      const participantes = extrairComMultiplosPadroes([
        /Número De Participantes:\s*(\d+)/i,
        /numero participantes[:\s]*(\d+)/i,
        /participantes[:\s]*(\d+)/i
      ], 'Número De Participantes');
      if (participantes) dados.numeroParticipantes = parseInt(participantes);

      const pactuacao = extrairComMultiplosPadroes([
        /Pactuação Nascimento\s*([\d.]+)%\s*(\d{2}\/\d{2}\/\d{4})/i,
        /pactuacao nascimento[:\s]*([\d.]+)%\s*(\d{2}\/\d{2}\/\d{4})/i
      ], 'Pactuação Nascimento');
      if (pactuacao) {
        // Para pactuação, precisamos extrair dois valores
        const pactuacaoMatch = text.match(/Pactuação Nascimento\s*([\d.]+)%\s*(\d{2}\/\d{2}\/\d{4})/i);
        if (pactuacaoMatch) {
          dados.pactuacaoNascimento = parseFloat(pactuacaoMatch[1].replace('.', ''));
          dados.dataNascimento = pactuacaoMatch[2];
        }
      }

      // Valores padrão
      dados.incorporarTarifas = true;

      // Validação cruzada e correção automática
      this.validarECorrigirDados(dados);

      return dados as DadosCaixa;
    } catch (error) {
      console.error('Erro ao fazer parse do PDF:', error);
      return null;
    }
  }

  /**
   * Validação cruzada dos dados extraídos com correção automática
   */
  private static validarECorrigirDados(dados: Partial<DadosCaixa>): void {
    // Correção 1: Se valorFinanciamento não foi encontrado mas temos valorImovel e valorEntrada
    if (!dados.valorFinanciamento && dados.valorImovel && dados.valorEntrada) {
      dados.valorFinanciamento = dados.valorImovel - dados.valorEntrada;
      console.log('Correção automática: valorFinanciamento calculado como diferença');
    }

    // Correção 2: Se valorEntrada não foi encontrado mas temos os outros valores
    if (!dados.valorEntrada && dados.valorImovel && dados.valorFinanciamento) {
      dados.valorEntrada = dados.valorImovel - dados.valorFinanciamento;
      console.log('Correção automática: valorEntrada calculado como diferença');
    }

    // Correção 3: Se totalPrestação não foi encontrado mas temos primeiraPrestação
    if (!dados.totalPrestacao && dados.primeiraPrestacao) {
      dados.totalPrestacao = dados.primeiraPrestacao;
      console.log('Correção automática: totalPrestacao igualado à primeiraPrestacao');
    }

    // Correção 4: Se prazo não foi encontrado mas temos prazoMaximo
    if (!dados.prazo && dados.prazoMaximo) {
      dados.prazo = dados.prazoMaximo;
      console.log('Correção automática: prazo igualado ao prazoMaximo');
    }

    // Correção 5: Validar consistência entre valores
    if (dados.valorImovel && dados.valorFinanciamento && dados.valorEntrada) {
      const somaFinanciamentoEntrada = dados.valorFinanciamento + dados.valorEntrada;
      const diferenca = Math.abs(somaFinanciamentoEntrada - dados.valorImovel);
      
      // Se a diferença for pequena (menos de 1%), ajustar o valor do imóvel
      if (diferenca < dados.valorImovel * 0.01) {
        dados.valorImovel = somaFinanciamentoEntrada;
        console.log('Correção automática: valorImovel ajustado para consistência matemática');
      }
    }

    // Correção 6: Validar sistema de amortização
    if (dados.sistemaAmortizacao && typeof dados.sistemaAmortizacao === 'string') {
      const sistema = dados.sistemaAmortizacao.toUpperCase().trim();
      if (sistema.includes('PRICE') && sistema.includes('TR')) {
        dados.sistemaAmortizacao = 'PRICE TR';
      } else if (sistema.includes('PRICE')) {
        dados.sistemaAmortizacao = 'PRICE';
      } else if (sistema.includes('SAC')) {
        dados.sistemaAmortizacao = 'SAC';
      }
    }

    // Correção 7: Padrões para campos booleanos
    if (dados.entradaAtualizada === undefined) {
      dados.entradaAtualizada = false; // Padrão seguro
    }
  }

  /**
   * Parse monetário robusto que lida com múltiplos formatos
   */
  static parseMonetary(value: string): number {
    if (!value || typeof value !== 'string') return 0;
    
    // Remove R$, espaços e outros caracteres não numéricos exceto vírgula e ponto
    const cleanValue = value
      .replace(/R?\$\s*/g, '')
      .replace(/[^\d.,]/g, '')
      .trim();
    
    // Converte formato brasileiro (1.234,56) para formato americano (1234.56)
    let normalizedValue = cleanValue;
    
    // Se tiver ambos ponto e vírgula, assume formato brasileiro
    if (cleanValue.includes('.') && cleanValue.includes(',')) {
      // Remove pontos de milhar e substitui vírgula decimal por ponto
      normalizedValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else if (cleanValue.includes(',')) {
      // Se só tiver vírgula, substitui por ponto
      normalizedValue = cleanValue.replace(',', '.');
    }
    
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Conversão para formato padrão do aplicativo
   */
  static converterParaFinanciamentoDados(dadosCaixa: DadosCaixa): FinanciamentoDados {
    return {
      // Dados básicos
      valorImovel: dadosCaixa.valorImovel,
      valorFinanciado: dadosCaixa.valorFinanciamento,
      valorAvaliacao: dadosCaixa.valorImovel,
      valorEntrada: dadosCaixa.valorEntrada,
      taxaJurosNominal: dadosCaixa.jurosNominais,
      taxaJurosEfetiva: dadosCaixa.jurosEfetivos,
      prazoMeses: dadosCaixa.prazo,
      prazoObra: dadosCaixa.prazoObra,
      sistema: this.normalizarSistema(dadosCaixa.sistemaAmortizacao),
      cotacaoMaxFinanciamento: dadosCaixa.cotacaoMaxFinanciamento,

      // Dados do cliente
      rendaFamiliar: dadosCaixa.rendaFamiliar,
      numeroParticipantes: dadosCaixa.numeroParticipantes,
      tipoPessoa: dadosCaixa.tipoPessoa === 'Fisica' ? 'Fisica' : 'Juridica',
      categoriaPessoa: dadosCaixa.categoriaPessoa,

      // Dados do financiamento
      origemRecurso: dadosCaixa.origemRecurso === 'SBPE' ? 'SBPE' : 'FGTS',
      tipoFinanciamento: dadosCaixa.tipoFinanciamento,
      categoriaImovel: dadosCaixa.categoriaImovel,
      cidade: dadosCaixa.cidade,
      uf: dadosCaixa.uf,

      // Componentes mensais
      seguroDFI: dadosCaixa.seguroDFI,
      seguroMIP: dadosCaixa.seguroMIP,
      taxaAdministracao: dadosCaixa.taxaAdministracao,
      taxaRiscoCredito: dadosCaixa.taxaRiscoCredito,
      taxaOperacionalMensal: dadosCaixa.taxaOperacionalMensal,

      // Despesas
      despesaCartoraria: dadosCaixa.despesaCartorariaLeiloeiro,
      despesaLeiloeiro: 0,
      apoliceSeguro: dadosCaixa.apoliceSeguro,
      incorporarTarifas: true,

      // Taxas à vista
      seguroVista: dadosCaixa.seguroVista,
      tarifas: dadosCaixa.tarifas,
      iof: dadosCaixa.iof
    };
  }

  private static normalizarSistema(sistema: string): 'PRICE' | 'SAC' | 'PRICE TR' {
    if (!sistema || typeof sistema !== 'string') return 'PRICE';
    
    const sistemaNormalizado = sistema.toUpperCase().trim();
    if (sistemaNormalizado.includes('PRICE TR') || sistemaNormalizado.includes('TR')) {
      return 'PRICE TR';
    } else if (sistemaNormalizado.includes('PRICE')) {
      return 'PRICE';
    } else if (sistemaNormalizado.includes('SAC')) {
      return 'SAC';
    }
    return 'PRICE';
  }

  /**
   * Validação robusta dos dados extraídos
   */
  static validarDadosExtraidos(dados: DadosCaixa): boolean {
    const camposEssenciais = [
      'valorImovel', 'valorFinanciamento', 'valorEntrada', 'prazo',
      'primeiraPrestacao', 'jurosNominais', 'jurosEfetivos'
    ];

    for (const campo of camposEssenciais) {
      const valor = dados[campo as keyof DadosCaixa];
      if (valor === undefined || valor === null || (typeof valor === 'number' && valor <= 0)) {
        console.warn(`Campo essencial ausente ou inválido: ${campo}`);
        return false;
      }
    }

    // Validações de consistência
    if (dados.valorImovel !== dados.valorFinanciamento + dados.valorEntrada) {
      const diferenca = Math.abs(dados.valorImovel - (dados.valorFinanciamento + dados.valorEntrada));
      if (diferenca > dados.valorImovel * 0.01) { // Mais de 1% de diferença
        console.warn('Inconsistência matemática nos valores principais');
        return false;
      }
    }

    return true;
  }

  /**
   * Retorna campos faltantes para diagnóstico
   */
  static getCamposFaltantes(dados: Partial<DadosCaixa>): string[] {
    const camposObrigatorios = [
      'valorImovel', 'valorFinanciamento', 'valorEntrada', 'prazo',
      'primeiraPrestacao', 'jurosNominais', 'jurosEfetivos'
    ];

    const camposFaltantes: string[] = [];
    
    for (const campo of camposObrigatorios) {
      const valor = dados[campo as keyof DadosCaixa];
      if (valor === undefined || valor === null || (typeof valor === 'number' && valor <= 0)) {
        camposFaltantes.push(campo);
      }
    }

    return camposFaltantes;
  }
}