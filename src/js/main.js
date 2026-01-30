/**
 * Calculadora de Tokens - Script Principal
 * Gerencia a interface do usuário e interações
 */

// Elementos DOM
const elements = {
  form: null,
  inputs: {},
  results: null,
  initialState: null,
  counters: {},
  buttons: {},
};

// Estado da aplicação
const appState = {
  isCalculating: false,
  currentResult: null,
  autoSave: true,
};

/**
 * Inicializa a aplicação
 */
function initializeApp() {
  try {
    // Capturar elementos DOM
    captureElements();

    // Configurar event listeners
    setupEventListeners();

    // Carregar dados salvos
    loadSavedData();

    // Configurar atualizações em tempo real
    setupRealTimeUpdates();

    // Buscar cotação inicial
    updateExchangeRate();

    console.log("Calculadora de Tokens inicializada com sucesso");

    // Mostrar mensagem de boas-vindas
    setTimeout(() => {
      TokenCalculatorUtils.showMessage(
        "Calculadora de Tokens carregada! Configure os custos e margens.",
        "info",
        3000
      );
    }, 500);
  } catch (error) {
    console.error("Erro ao inicializar aplicação:", error);
    TokenCalculatorUtils.showMessage(
      "Erro ao carregar a aplicação. Recarregue a página.",
      "error"
    );
  }
}

/**
 * Captura referências dos elementos DOM
 */
function captureElements() {
  elements.form = document.getElementById("tokenForm");
  elements.results = document.getElementById("results");
  elements.initialState = document.getElementById("initialState");

  // Inputs
  elements.inputs = {
    inputTokenPrice: document.getElementById("inputTokenPrice"),
    outputTokenPrice: document.getElementById("outputTokenPrice"),
    cachedTokenPrice: document.getElementById("cachedTokenPrice"),
    inputText: document.getElementById("inputText"),
    outputText: document.getElementById("outputText"),
    quantity: document.getElementById("quantity"),
    // Novos inputs de revenda
    markup: document.getElementById("markup"),
    creditValue: document.getElementById("creditValue"),
  };

  // Contadores de tokens
  elements.counters = {
    inputTokenCount: document.getElementById("inputTokenCount"),
    outputTokenCount: document.getElementById("outputTokenCount"),
  };

  // Botões
  elements.buttons = {
    clear: document.getElementById("clearBtn"),
    refreshRate: document.getElementById("refreshExchangeRate"),
  };

  // Verificar se todos os elementos foram encontrados
  const missingElements = [];

  if (!elements.form) missingElements.push("tokenForm");
  if (!elements.results) missingElements.push("results");
  if (!elements.initialState) missingElements.push("initialState");

  Object.entries(elements.inputs).forEach(([key, element]) => {
    if (!element) missingElements.push(key);
  });

  if (missingElements.length > 0) {
    console.warn(`Elementos DOM não encontrados: ${missingElements.join(", ")}`);
    // Não lança erro fatal para permitir funcionamento parcial se apenas novos inputs falharem
  }
}

/**
 * Configura os event listeners
 */
function setupEventListeners() {
  // Submissão do formulário
  elements.form.addEventListener("submit", handleFormSubmit);

  // Botão limpar
  elements.buttons.clear.addEventListener("click", handleClearForm);

  // Inputs de texto para contagem de tokens
  elements.inputs.inputText.addEventListener(
    "input",
    TokenCalculatorUtils.debounce(updateInputTokenCount, 300)
  );

  elements.inputs.outputText.addEventListener(
    "input",
    TokenCalculatorUtils.debounce(updateOutputTokenCount, 300)
  );

  // Validação em tempo real dos preços
  Object.entries(elements.inputs).forEach(([key, input]) => {
    if (key.includes("Price")) {
      input.addEventListener(
        "input",
        TokenCalculatorUtils.debounce(() => validatePriceInput(input), 300)
      );
    }
  });

  // Validação da quantidade
  elements.inputs.quantity.addEventListener(
    "input",
    TokenCalculatorUtils.debounce(validateQuantityInput, 300)
  );

  // Auto-save quando habilitado
  if (appState.autoSave) {
    Object.values(elements.inputs).forEach((input) => {
      input.addEventListener(
        "input",
        TokenCalculatorUtils.debounce(saveFormData, 1000)
      );
    });
  }

  // Atalhos de teclado
  document.addEventListener("keydown", handleKeyboardShortcuts);

  // Listener para taxa de câmbio
  const exchangeRateInput = document.getElementById("usdToBrlRate");
  if (exchangeRateInput) {
    exchangeRateInput.addEventListener(
      "input",
      TokenCalculatorUtils.debounce(updateCurrencyConversion, 300)
    );
    // Definir valor padrão se vazio
    if (!exchangeRateInput.value) exchangeRateInput.value = "5.50";
  }

  // Botão de refresh da taxa de câmbio
  if (elements.buttons.refreshRate) {
    elements.buttons.refreshRate.addEventListener("click", () => updateExchangeRate(true));
  }
}

/**
 * Configura atualizações em tempo real
 */
function setupRealTimeUpdates() {
  // Atualizar contadores de tokens iniciais
  updateInputTokenCount();
  updateOutputTokenCount();
}

/**
 * Manipula a submissão do formulário
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  if (appState.isCalculating) {
    return;
  }

  try {
    appState.isCalculating = true;
    showLoadingState();

    // Coletar dados do formulário
    const formData = collectFormData();

    // Validar dados
    const validation = TokenCalculatorUtils.validateFormData(formData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("\n"));
    }

    // Calcular
    const result = window.tokenCalculator.calculate(formData);

    // Exibir resultados
    displayResults(result);

    // Salvar estado atual
    appState.currentResult = result;

    // Feedback de sucesso
    TokenCalculatorUtils.showMessage(
      "Cálculo realizado com sucesso!",
      "success",
      3000
    );
  } catch (error) {
    console.error("Erro no cálculo:", error);
    TokenCalculatorUtils.showMessage(
      `Erro no cálculo: ${error.message}`,
      "error"
    );
  } finally {
    appState.isCalculating = false;
    hideLoadingState();
  }
}

/**
 * Coleta dados do formulário
 */
function collectFormData() {
  return {
    inputTokenPrice: parseFloat(elements.inputs.inputTokenPrice.value) || 0,
    outputTokenPrice: parseFloat(elements.inputs.outputTokenPrice.value) || 0,
    cachedTokenPrice: parseFloat(elements.inputs.cachedTokenPrice.value) || 0,
    inputText: elements.inputs.inputText.value.trim(),
    outputText: elements.inputs.outputText.value.trim(),
    quantity: parseInt(elements.inputs.quantity.value) || 1,
    resaleSettings: {
      markup: parseFloat(elements.inputs.markup.value) || 0,
      creditValue: parseFloat(elements.inputs.creditValue.value) || 0,
    }
  };
}

/**
 * Exibe os resultados do cálculo
 */
function displayResults(result) {
  // Ocultar estado inicial
  elements.initialState.classList.add("hidden");

  // Mostrar área de resultados
  elements.results.classList.remove("hidden");
  TokenCalculatorUtils.addAnimatedClass(elements.results, "fade-in");

  // Atualizar resumo executivo
  updateExecutiveSummary(result.summary);

  // Atualizar Análise Financeira
  if (result.financials) {
    updateFinancialAnalysis(result.financials);
  }

  // Atualizar detalhamento
  updateBreakdownDetails(result.breakdown, result.summary.quantity);

  // Atualizar cenários (se mais de um)
  if (result.summary.quantity > 1 || result.scenarios.length > 1) {
    updateScenariosTable(result.scenarios);
    document.getElementById("multipleScenarios").classList.remove("hidden");
  } else {
    document.getElementById("multipleScenarios").classList.add("hidden");
  }
}

/**
 * Atualiza o painel de Análise Financeira
 */
function updateFinancialAnalysis(financials) {
  const el = (id) => document.getElementById(id); // Helper

  // Lucro e Margem
  if (el('finProfit')) el('finProfit').textContent = TokenCalculatorUtils.formatCurrency(financials.grossProfit);
  if (el('finProfitMargin')) el('finProfitMargin').textContent = `(${financials.margin.toFixed(1)}%)`;

  // Tokens por Crédito
  if (el('finTokensPerCredit')) el('finTokensPerCredit').textContent = TokenCalculatorUtils.formatNumber(financials.tokensPerCredit);
  if (el('finCreditValueBase')) el('finCreditValueBase').textContent = TokenCalculatorUtils.formatCurrency(financials.creditUnitValue, "USD", 2);

  // Custo x Venda
  if (el('finCostBuy')) el('finCostBuy').textContent = TokenCalculatorUtils.formatCurrency(financials.totalCost);
  if (el('finPriceSell')) el('finPriceSell').textContent = TokenCalculatorUtils.formatCurrency(financials.totalSalePrice);
}

/**
 * Atualiza o resumo executivo
 */
function updateExecutiveSummary(summary) {
  // Atualizar custo em USD
  document.getElementById("totalCost").textContent =
    TokenCalculatorUtils.formatCurrency(summary.totalCost);

  // Atualizar custo em BRL
  const exchangeRate = TokenCalculatorUtils.getCurrentExchangeRate();
  const totalCostBRL = TokenCalculatorUtils.convertUSDToBRL(
    summary.totalCost,
    exchangeRate
  );
  const totalCostBRLElement = document.getElementById("totalCostBRL");
  if (totalCostBRLElement) {
    totalCostBRLElement.textContent =
      TokenCalculatorUtils.formatCurrencyBRL(totalCostBRL);
  }

  document.getElementById("totalTokens").textContent =
    TokenCalculatorUtils.formatNumber(summary.totalTokens);
}

/**
 * Atualiza os detalhes do breakdown
 */
function updateBreakdownDetails(breakdown, quantity) {
  // Tokens de entrada
  document.getElementById("inputTokensDetail").textContent =
    TokenCalculatorUtils.formatNumber(breakdown.input.tokens * quantity);
  document.getElementById("inputCostDetail").textContent =
    TokenCalculatorUtils.formatCurrency(breakdown.input.totalCost);

  // Tokens de saída
  document.getElementById("outputTokensDetail").textContent =
    TokenCalculatorUtils.formatNumber(breakdown.output.tokens * quantity);
  document.getElementById("outputCostDetail").textContent =
    TokenCalculatorUtils.formatCurrency(breakdown.output.totalCost);

  // Tokens de cache
  document.getElementById("cachedTokensDetail").textContent =
    TokenCalculatorUtils.formatNumber(breakdown.cached.tokens * quantity);
  document.getElementById("cachedCostDetail").textContent =
    TokenCalculatorUtils.formatCurrency(breakdown.cached.totalCost);
}

/**
 * Atualiza a tabela de cenários
 */
function updateScenariosTable(scenarios) {
  const tableBody = document.getElementById("scenariosTable");

  // Limpar tabela
  tableBody.innerHTML = "";

  // Adicionar linhas
  scenarios.forEach((scenario) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50 border-b border-gray-100 last:border-none transition-colors";

    row.innerHTML = `
            <td class="px-6 py-3 text-sm text-gray-900 font-medium">
                ${TokenCalculatorUtils.formatNumber(scenario.quantity)}
            </td>
            <td class="px-6 py-3 text-sm text-gray-600">
                ${TokenCalculatorUtils.formatNumber(scenario.totalTokens)}
            </td>
            <td class="px-6 py-3 text-sm font-semibold text-primary text-right">
                ${TokenCalculatorUtils.formatCurrency(scenario.totalCost)}
            </td>
        `;

    tableBody.appendChild(row);
  });
}

/**
 * Atualiza contador de tokens de entrada
 */
function updateInputTokenCount() {
  const text = elements.inputs.inputText.value;
  const tokenCount = TokenCalculatorUtils.estimateTokens(text);

  elements.counters.inputTokenCount.textContent = TokenCalculatorUtils.formatNumber(tokenCount);

  // Atualizar display no label também
  const displayLabel = document.getElementById("inputTokenCountDisplay");
  if (displayLabel) {
    displayLabel.innerHTML = `${TokenCalculatorUtils.formatNumber(tokenCount)} tokens`;
  }
}

/**
 * Atualiza contador de tokens de saída
 */
function updateOutputTokenCount() {
  const text = elements.inputs.outputText.value;
  const tokenCount = TokenCalculatorUtils.estimateTokens(text);

  elements.counters.outputTokenCount.textContent = TokenCalculatorUtils.formatNumber(tokenCount);

  // Atualizar display no label também
  const displayLabel = document.getElementById("outputTokenCountDisplay");
  if (displayLabel) {
    displayLabel.innerHTML = `${TokenCalculatorUtils.formatNumber(tokenCount)} tokens`;
  }
}

/**
 * Valida input de preço
 */
function validatePriceInput(input) {
  const value = parseFloat(input.value);
  const validation = TokenCalculatorUtils.validateTokenPrice(value);

  // Remover classes anteriores
  input.classList.remove("input-valid", "input-invalid", "input-warning");

  if (input.value === "") {
    return; // Campo vazio, sem validação
  }

  if (validation.isValid) {
    input.classList.add("input-valid");
  } else {
    input.classList.add("input-invalid");
  }
}

/**
 * Valida input de quantidade
 */
function validateQuantityInput() {
  const value = parseInt(elements.inputs.quantity.value);
  const validation = TokenCalculatorUtils.validateQuantity(value);

  // Remover classes anteriores
  elements.inputs.quantity.classList.remove(
    "input-valid",
    "input-invalid",
    "input-warning"
  );

  if (elements.inputs.quantity.value === "") {
    return; // Campo vazio, sem validação
  }

  if (validation.isValid) {
    elements.inputs.quantity.classList.add("input-valid");
  } else {
    elements.inputs.quantity.classList.add("input-invalid");
  }
}

/**
 * Limpa o formulário
 */
function handleClearForm() {
  // Confirmar ação
  if (appState.currentResult) {
    const confirmed = confirm("Tem certeza que deseja limpar todos os campos?");
    if (!confirmed) {
      return;
    }
  }

  // Limpar inputs
  Object.values(elements.inputs).forEach((input) => {
    // Manter valores padrão para markup e crédito
    if (input.id === 'markup') { input.value = "30"; return; }
    if (input.id === 'creditValue') { input.value = "1.00"; return; }

    input.value = "";
    input.classList.remove("input-valid", "input-invalid", "input-warning");
  });

  // Resetar quantidade para 1
  elements.inputs.quantity.value = "1";

  // Atualizar contadores
  updateInputTokenCount();
  updateOutputTokenCount();

  // Ocultar resultados
  elements.results.classList.add("hidden");
  elements.initialState.classList.remove("hidden");

  // Limpar estado
  appState.currentResult = null;

  // Remover dados salvos
  TokenCalculatorUtils.saveToLocalStorage("form_data", {});

  // Feedback
  TokenCalculatorUtils.showMessage(
    "Formulário limpo com sucesso!",
    "info",
    2000
  );
}

/**
 * Salva dados do formulário
 */
function saveFormData() {
  if (!appState.autoSave) return;

  const formData = collectFormData();
  TokenCalculatorUtils.saveToLocalStorage("form_data", formData);
}

/**
 * Carrega dados salvos
 */
function loadSavedData() {
  const savedData = TokenCalculatorUtils.loadFromLocalStorage("form_data", {});

  if (savedData && Object.keys(savedData).length > 0) {
    // Preencher campos normais
    Object.entries(savedData).forEach(([key, value]) => {
      // Ignorar resaleSettings aqui, tratar abaixo
      if (key !== 'resaleSettings' && elements.inputs[key] && value !== undefined && value !== null) {
        elements.inputs[key].value = value;
      }
    });

    // Preencher resaleSettings se existir
    if (savedData.resaleSettings) {
      if (elements.inputs.markup && savedData.resaleSettings.markup)
        elements.inputs.markup.value = savedData.resaleSettings.markup;
      if (elements.inputs.creditValue && savedData.resaleSettings.creditValue)
        elements.inputs.creditValue.value = savedData.resaleSettings.creditValue;
    }

    // Atualizar contadores
    updateInputTokenCount();
    updateOutputTokenCount();

    // Validar campos preenchidos
    setTimeout(() => {
      Object.entries(elements.inputs).forEach(([key, input]) => {
        if (typeof key === 'string' && key.includes("Price") && input.value) {
          validatePriceInput(input);
        }
      });

      if (elements.inputs.quantity.value) {
        validateQuantityInput();
      }
    }, 100);
  }
}

/**
 * Mostra estado de carregamento
 */
function showLoadingState() {
  const submitBtn = elements.form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<iconify-icon icon="hugeicons:loading-03" class="animate-spin text-lg"></iconify-icon> Calculando...';
    submitBtn.classList.add("opacity-80", "cursor-wait");
  }
}

/**
 * Oculta estado de carregamento
 */
function hideLoadingState() {
  const submitBtn = elements.form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<iconify-icon icon="hugeicons:calculator-01"></iconify-icon> Calcular';
    submitBtn.classList.remove("opacity-80", "cursor-wait");
  }
}

/**
 * Atualiza a conversão de moeda quando a taxa de câmbio muda
 */
function updateCurrencyConversion() {
  if (appState.currentResult) {
    updateExecutiveSummary(appState.currentResult.summary);
  }
}

/**
 * Busca e atualiza a taxa de câmbio via API
 * @param {boolean} isManual - Se a atualização foi solicitada manualmente
 */
async function updateExchangeRate(isManual = false) {
  const btn = elements.buttons.refreshRate;
  const input = document.getElementById("usdToBrlRate");

  if (!input) return;

  try {
    // Estado de carregamento
    if (btn) {
      btn.disabled = true;
      btn.classList.add("animate-spin");
    }

    const rate = await TokenCalculatorUtils.fetchExchangeRate();

    if (rate) {
      input.value = rate.toFixed(2);
      updateCurrencyConversion();

      // Feedback apenas se for acionado manualmente
      if (isManual) {
        TokenCalculatorUtils.showMessage(`Dólar atualizado: R$ ${rate.toFixed(2)}`, "success", 2000);
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar câmbio:", error);
    if (isManual) {
      TokenCalculatorUtils.showMessage("Não foi possível atualizar o dólar automaticamente.", "warning");
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("animate-spin");
    }
  }
}

/**
 * Manipula atalhos de teclado
 */
function handleKeyboardShortcuts(event) {
  // Ctrl/Cmd + Enter para calcular
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    if (!appState.isCalculating) {
      elements.form.dispatchEvent(new Event("submit"));
    }
  }

  // Ctrl/Cmd + R para limpar (sobrescrever reload)
  if ((event.ctrlKey || event.metaKey) && event.key === "r" && event.shiftKey) {
    event.preventDefault();
    handleClearForm();
  }

  // Escape para focar no primeiro campo
  if (event.key === "Escape") {
    elements.inputs.inputTokenPrice.focus();
  }
}

/**
 * Manipula erros globais
 */
window.addEventListener("error", (event) => {
  console.error("Erro global:", event.error);
});

// Inicializar quando DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
