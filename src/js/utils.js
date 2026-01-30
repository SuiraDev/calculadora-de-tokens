/**
 * Utilitários para a Calculadora de Tokens
 * Funções auxiliares para formatação, validação e manipulação de dados
 */

// Constantes da aplicação
const CONSTANTS = {
  TOKEN_ESTIMATION_FACTOR: 0.75, // Fator aproximado para estimar tokens (1 token ≈ 0.75 palavras)
  MIN_TOKEN_PRICE_PER_MILLION: 0.01, // Preço mínimo por milhão de tokens
  MAX_TOKEN_PRICE_PER_MILLION: 1000.0, // Preço máximo por milhão de tokens
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 1000000,
  DECIMAL_PLACES: 6,
};

/**
 * Formata um valor monetário para exibição
 * @param {number} value - Valor a ser formatado
 * @param {string} currency - Moeda (padrão: USD)
 * @param {number} decimals - Número de casas decimais
 * @returns {string} - Valor formatado
 */
function formatCurrency(value, currency = "USD", decimals = 6) {
  if (typeof value !== "number" || isNaN(value)) {
    return "$0.00";
  }

  // Para valores muito pequenos, mostrar mais casas decimais
  if (value < 0.01 && value > 0) {
    return `$${value.toFixed(decimals)}`;
  }

  // Para valores normais, usar formatação padrão
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  })
    .format(value)
    .replace("US$", "$");
}

/**
 * Formata um número para exibição com separadores de milhares
 * @param {number} value - Valor a ser formatado
 * @returns {string} - Número formatado
 */
function formatNumber(value) {
  if (typeof value !== "number" || isNaN(value)) {
    return "0";
  }

  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

/**
 * Estima o número de tokens em um texto
 * Baseado em uma aproximação simples: 1 token ≈ 0.75 palavras
 * @param {string} text - Texto para análise
 * @returns {number} - Número estimado de tokens
 */
function estimateTokens(text) {
  if (!text || typeof text !== "string") {
    return 0;
  }

  // Remove espaços extras e quebras de linha
  const cleanText = text.trim().replace(/\s+/g, " ");

  if (cleanText.length === 0) {
    return 0;
  }

  // Conta palavras
  const words = cleanText.split(" ").filter((word) => word.length > 0);

  // Estima tokens baseado no número de palavras
  const estimatedTokens = Math.ceil(
    words.length / CONSTANTS.TOKEN_ESTIMATION_FACTOR
  );

  return estimatedTokens;
}

/**
 * Valida se um valor de preço de token por milhão é válido
 * @param {number} pricePerMillion - Preço por milhão de tokens a ser validado
 * @returns {object} - Objeto com resultado da validação
 */
function validateTokenPrice(pricePerMillion) {
  const result = {
    isValid: true,
    message: "",
    value: pricePerMillion,
  };

  if (typeof pricePerMillion !== "number" || isNaN(pricePerMillion)) {
    result.isValid = false;
    result.message = "Preço deve ser um número válido";
    return result;
  }

  if (pricePerMillion < CONSTANTS.MIN_TOKEN_PRICE_PER_MILLION) {
    result.isValid = false;
    result.message = `Preço mínimo: $${CONSTANTS.MIN_TOKEN_PRICE_PER_MILLION}/1M tokens`;
    return result;
  }

  if (pricePerMillion > CONSTANTS.MAX_TOKEN_PRICE_PER_MILLION) {
    result.isValid = false;
    result.message = `Preço máximo: $${CONSTANTS.MAX_TOKEN_PRICE_PER_MILLION}/1M tokens`;
    return result;
  }

  return result;
}

/**
 * Converte preço por milhão de tokens para preço por token individual
 * @param {number} pricePerMillion - Preço por milhão de tokens
 * @returns {number} - Preço por token individual
 */
function convertPricePerMillionToPerToken(pricePerMillion) {
  return pricePerMillion / 1000000;
}

/**
 * Converte valor de USD para BRL
 * @param {number} usdValue - Valor em USD
 * @param {number} exchangeRate - Taxa de câmbio USD para BRL
 * @returns {number} - Valor em BRL
 */
function convertUSDToBRL(usdValue, exchangeRate = 5.5) {
  return usdValue * exchangeRate;
}

/**
 * Formata um valor monetário em Real brasileiro
 * @param {number} value - Valor a ser formatado
 * @returns {string} - Valor formatado em BRL
 */
function formatCurrencyBRL(value) {
  if (typeof value !== "number" || isNaN(value)) {
    return "R$ 0,00";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}

/**
 * Obtém a taxa de câmbio atual do input
 * @returns {number} - Taxa de câmbio USD para BRL
 */
function getCurrentExchangeRate() {
  const rateInput = document.getElementById("usdToBrlRate");
  const rate = parseFloat(rateInput?.value) || 5.5;
  return rate;
}

/**
 * Valida se uma quantidade é válida
 * @param {number} quantity - Quantidade a ser validada
 * @returns {object} - Objeto com resultado da validação
 */
function validateQuantity(quantity) {
  const result = {
    isValid: true,
    message: "",
    value: quantity,
  };

  if (typeof quantity !== "number" || isNaN(quantity)) {
    result.isValid = false;
    result.message = "Quantidade deve ser um número válido";
    return result;
  }

  if (quantity < CONSTANTS.MIN_QUANTITY) {
    result.isValid = false;
    result.message = `Quantidade mínima: ${CONSTANTS.MIN_QUANTITY}`;
    return result;
  }

  if (quantity > CONSTANTS.MAX_QUANTITY) {
    result.isValid = false;
    result.message = `Quantidade máxima: ${formatNumber(
      CONSTANTS.MAX_QUANTITY
    )}`;
    return result;
  }

  if (!Number.isInteger(quantity)) {
    result.isValid = false;
    result.message = "Quantidade deve ser um número inteiro";
    return result;
  }

  return result;
}

/**
 * Debounce function para limitar chamadas frequentes
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} - Função com debounce aplicado
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Adiciona classe CSS com animação
 * @param {HTMLElement} element - Elemento DOM
 * @param {string} className - Nome da classe
 * @param {number} duration - Duração em ms (opcional)
 */
function addAnimatedClass(element, className, duration = null) {
  if (!element || !className) return;

  element.classList.add(className);

  if (duration) {
    setTimeout(() => {
      element.classList.remove(className);
    }, duration);
  }
}

/**
 * Remove classe CSS com animação
 * @param {HTMLElement} element - Elemento DOM
 * @param {string} className - Nome da classe
 */
function removeAnimatedClass(element, className) {
  if (!element || !className) return;
  element.classList.remove(className);
}

/**
 * Mostra mensagem de feedback para o usuário
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo da mensagem (success, error, warning, info)
 * @param {number} duration - Duração em ms
 */
function showMessage(message, type = "info", duration = 5000) {
  // Remove mensagens existentes
  const existingMessages = document.querySelectorAll(".feedback-message");
  existingMessages.forEach((msg) => msg.remove());

  // Cria nova mensagem
  const messageElement = document.createElement("div");
  messageElement.className = `feedback-message message message-${type} fade-in`;
  messageElement.textContent = message;

  // Adiciona ao topo da página
  const main = document.querySelector("main");
  if (main) {
    main.insertBefore(messageElement, main.firstChild);
  }

  // Remove após o tempo especificado
  setTimeout(() => {
    if (messageElement.parentNode) {
      messageElement.classList.add("fade-out");
      setTimeout(() => messageElement.remove(), 300);
    }
  }, duration);
}

/**
 * Salva dados no localStorage
 * @param {string} key - Chave para armazenamento
 * @param {any} data - Dados a serem salvos
 */
function saveToLocalStorage(key, data) {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.warn("Erro ao salvar no localStorage:", error);
  }
}

/**
 * Carrega dados do localStorage
 * @param {string} key - Chave para recuperação
 * @param {any} defaultValue - Valor padrão se não encontrar
 * @returns {any} - Dados recuperados ou valor padrão
 */
function loadFromLocalStorage(key, defaultValue = null) {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.warn("Erro ao carregar do localStorage:", error);
    return defaultValue;
  }
}

/**
 * Gera um ID único
 * @returns {string} - ID único
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Copia texto para a área de transferência
 * @param {string} text - Texto a ser copiado
 * @returns {Promise<boolean>} - Sucesso da operação
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand("copy");
      textArea.remove();
      return success;
    }
  } catch (error) {
    console.error("Erro ao copiar para área de transferência:", error);
    return false;
  }
}

/**
 * Converte dados para CSV
 * @param {Array} data - Array de objetos
 * @param {Array} headers - Cabeçalhos das colunas
 * @returns {string} - String CSV
 */
function convertToCSV(data, headers) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return "";
  }

  const csvHeaders = headers.join(",");
  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        // Escape aspas duplas e envolve em aspas se necessário
        if (
          typeof value === "string" &&
          (value.includes(",") || value.includes('"') || value.includes("\n"))
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",")
  );

  return [csvHeaders, ...csvRows].join("\n");
}

/**
 * Faz download de um arquivo
 * @param {string} content - Conteúdo do arquivo
 * @param {string} filename - Nome do arquivo
 * @param {string} mimeType - Tipo MIME
 */
function downloadFile(content, filename, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Valida se todos os campos obrigatórios estão preenchidos
 * @param {object} formData - Dados do formulário
 * @returns {object} - Resultado da validação
 */
function validateFormData(formData) {
  const result = {
    isValid: true,
    errors: [],
  };

  // Validar preços dos tokens (agora em $/1M tokens)
  if (!formData.inputTokenPrice || formData.inputTokenPrice <= 0) {
    result.errors.push("Valor do token de entrada é obrigatório ($/1M tokens)");
    result.isValid = false;
  }

  if (!formData.outputTokenPrice || formData.outputTokenPrice <= 0) {
    result.errors.push("Valor do token de saída é obrigatório ($/1M tokens)");
    result.isValid = false;
  }

  if (!formData.cachedTokenPrice || formData.cachedTokenPrice <= 0) {
    result.errors.push("Valor do token de cache é obrigatório ($/1M tokens)");
    result.isValid = false;
  }

  // Validar textos
  if (!formData.inputText || formData.inputText.trim().length === 0) {
    result.errors.push("Exemplo de texto de entrada é obrigatório");
    result.isValid = false;
  }

  if (!formData.outputText || formData.outputText.trim().length === 0) {
    result.errors.push("Exemplo de texto de saída é obrigatório");
    result.isValid = false;
  }

  // Validar quantidade
  if (!formData.quantity || formData.quantity < 1) {
    result.errors.push("Quantidade deve ser maior que zero");
    result.isValid = false;
  }

  return result;
}

// Exportar funções para uso global
window.TokenCalculatorUtils = {
  CONSTANTS,
  formatCurrency,
  formatCurrencyBRL,
  formatNumber,
  estimateTokens,
  validateTokenPrice,
  validateQuantity,
  convertPricePerMillionToPerToken,
  convertUSDToBRL,
  getCurrentExchangeRate,
  debounce,
  addAnimatedClass,
  removeAnimatedClass,
  showMessage,
  saveToLocalStorage,
  loadFromLocalStorage,
  generateUniqueId,
  copyToClipboard,
  convertToCSV,
  downloadFile,
  validateFormData,
};
