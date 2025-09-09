// Sistema de Conselhos Municipais - JavaScript com Menu Lateral
class ConselhosApp {
    constructor() {
        this.municipios = [];
        this.filteredData = {
            pcd: [],
            idoso: [],
            cmas: [],
            cmdca: []
        };
        this.macrorregioes = [];
        this.drads = [];
        this.currentSection = 'conselho-pcd';
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
    }
    
    setupEventListeners() {
        // Menu lateral
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.target.getAttribute('data-section');
                if (section) {
                    this.switchSection(section);
                }
            });
        });
        
        // Filtros para cada tipo de conselho
        ['pcd', 'idoso'].forEach(tipo => {
            const elements = {
                macrorregiao: document.getElementById(`macrorregiao-${tipo}`),
                drads: document.getElementById(`drads-${tipo}`),
                status: document.getElementById(`status-${tipo}`),
                busca: document.getElementById(`busca-${tipo}`)
            };
            
            // Event listeners para filtros automáticos
            if (elements.macrorregiao) {
                elements.macrorregiao.addEventListener('change', () => this.aplicarFiltros(tipo));
            }
            if (elements.drads) {
                elements.drads.addEventListener('change', () => this.aplicarFiltros(tipo));
            }
            if (elements.status) {
                elements.status.addEventListener('change', () => this.aplicarFiltros(tipo));
            }
            
            // Enter key para busca
            if (elements.busca) {
                elements.busca.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.aplicarFiltros(tipo);
                    }
                });
            }
        });
    }
    
    async loadInitialData() {
        try {
            // Carregar dados em paralelo
            const [municipiosResponse, macrorregiaoResponse, dradsResponse] = await Promise.all([
                fetch('/api/municipios'),
                fetch('/api/macrorregioes'),
                fetch('/api/drads')
            ]);
            
            if (!municipiosResponse.ok || !macrorregiaoResponse.ok || !dradsResponse.ok) {
                throw new Error('Erro ao carregar dados');
            }
            
            const municipiosData = await municipiosResponse.json();
            const macrorregiaoData = await macrorregiaoResponse.json();
            const dradsData = await dradsResponse.json();
            
            this.municipios = municipiosData.data || [];
            this.macrorregioes = macrorregiaoData.data || [];
            this.drads = dradsData.data || [];
            
            // Inicializar dados filtrados
            this.filteredData.pcd = [...this.municipios];
            this.filteredData.idoso = [...this.municipios];
            
            this.populateFilters();
            this.renderCurrentSection();
            this.hideLoading();
            
        } catch (error) {
            this.showError('Erro ao carregar dados: ' + error.message);
            this.hideLoading();
        }
    }
    
    populateFilters() {
        // Popula filtros para cada tipo de conselho
        ['pcd', 'idoso'].forEach(tipo => {
            // Macrorregiões
            const macroSelect = document.getElementById(`macrorregiao-${tipo}`);
            if (macroSelect) {
                // Limpar opções existentes (exceto a primeira)
                while (macroSelect.children.length > 1) {
                    macroSelect.removeChild(macroSelect.lastChild);
                }
                
                this.macrorregioes.forEach(macro => {
                    const option = document.createElement('option');
                    option.value = macro.id;
                    option.textContent = `Macrorregião ${String(macro.id).padStart(2, '0')}`;
                    macroSelect.appendChild(option);
                });
            }
            
            // DRADS
            const dradsSelect = document.getElementById(`drads-${tipo}`);
            if (dradsSelect) {
                // Limpar opções existentes (exceto a primeira)
                while (dradsSelect.children.length > 1) {
                    dradsSelect.removeChild(dradsSelect.lastChild);
                }
                
                this.drads.forEach(drad => {
                    const option = document.createElement('option');
                    option.value = drad.nome;
                    option.textContent = drad.nome;
                    dradsSelect.appendChild(option);
                });
            }
        });
    }
    
    switchSection(sectionId) {
        // Atualizar menu ativo
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
        
        // Mostrar seção correspondente
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Renderizar dados se necessário
            if (sectionId === 'conselho-pcd' || sectionId === 'conselho-idoso') {
                const tipo = sectionId.replace('conselho-', '');
                this.renderMunicipios(tipo);
            }
        }
    }
    
    aplicarFiltros(tipo) {
        const macrorregiao = document.getElementById(`macrorregiao-${tipo}`)?.value;
        const drads = document.getElementById(`drads-${tipo}`)?.value;
        const status = document.getElementById(`status-${tipo}`)?.value;
        const busca = document.getElementById(`busca-${tipo}`)?.value?.toLowerCase();
        
        const campoConselho = tipo === 'pcd' ? 'conselho_pcd_existe' : 'conselho_idoso_existe';
        
        this.filteredData[tipo] = this.municipios.filter(municipio => {
            // Filtro por macrorregião
            if (macrorregiao && municipio.macrorregiao != macrorregiao) {
                return false;
            }
            
            // Filtro por DRADS
            if (drads && municipio.drads !== drads) {
                return false;
            }
            
            // Filtro por status do conselho
            if (status && municipio[campoConselho] !== status) {
                return false;
            }
            
            // Filtro por busca
            if (busca && !municipio.nome_municipio.toLowerCase().includes(busca)) {
                return false;
            }
            
            return true;
        });
        
        this.renderMunicipios(tipo);
    }
    
    limparFiltros(tipo) {
        document.getElementById(`macrorregiao-${tipo}`).value = '';
        document.getElementById(`drads-${tipo}`).value = '';
        document.getElementById(`status-${tipo}`).value = '';
        document.getElementById(`busca-${tipo}`).value = '';
        
        this.filteredData[tipo] = [...this.municipios];
        this.renderMunicipios(tipo);
    }
    
    renderMunicipios(tipo) {
        const tbody = document.getElementById(`tbody-${tipo}`);
        const table = document.getElementById(`table-${tipo}`);
        const countElement = document.getElementById(`results-count-${tipo}`);
        const loadingElement = document.getElementById(`loading-${tipo}`);
        
        if (!tbody || !table || !countElement) return;
        
        // Ocultar loading
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        const data = this.filteredData[tipo] || [];
        const campoConselho = tipo === 'pcd' ? 'conselho_pcd_existe' : 'conselho_idoso_existe';
        const nomeConselho = tipo === 'pcd' ? 'Conselho PcD' : 'Conselho do Idoso';
        
        // Atualizar contador
        countElement.textContent = `${data.length} municípios encontrados`;
        
        // Limpar tabela
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">Nenhum município encontrado com os filtros aplicados</td></tr>`;
        } else {
            data.forEach(municipio => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${this.escapeHtml(municipio.nome_municipio)}</strong></td>
                    <td>${this.escapeHtml(municipio.drads || 'Não informado')}</td>
                    <td>Macro ${String(municipio.macrorregiao || 'N/A').padStart(2, '0')}</td>
                    <td>${this.formatNumber(municipio.populacao_2025)}</td>
                    <td>${this.renderStatusBadge(municipio[campoConselho])}</td>
                `;
                tbody.appendChild(row);
            });
        }
        
        table.style.display = 'table';
    }
    
    renderCurrentSection() {
        if (this.currentSection === 'conselho-pcd') {
            this.renderMunicipios('pcd');
        } else if (this.currentSection === 'conselho-idoso') {
            this.renderMunicipios('idoso');
        }
    }
    
    renderStatusBadge(status) {
        if (!status) return '<span class="status-badge">N/A</span>';
        
        const isPositive = status === 'Sim';
        const className = isPositive ? 'status-sim' : 'status-nao';
        const text = isPositive ? 'Sim' : (status === 'Não há registro' ? 'Não' : status);
        
        return `<span class="status-badge ${className}">${text}</span>`;
    }
    
    hideLoading() {
        document.querySelectorAll('[id^="loading-"]').forEach(element => {
            element.style.display = 'none';
        });
    }
    
    showError(message) {
        console.error(message);
        // Implementar exibição de erro se necessário
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatNumber(num) {
        if (!num) return 'N/A';
        return new Intl.NumberFormat('pt-BR').format(num);
    }
}

// Funções globais para compatibilidade com os botões
function aplicarFiltros(tipo) {
    if (window.app) {
        window.app.aplicarFiltros(tipo);
    }
}

function limparFiltros(tipo) {
    if (window.app) {
        window.app.limparFiltros(tipo);
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ConselhosApp();
});

// Melhorar acessibilidade com navegação por teclado
document.addEventListener('keydown', (e) => {
    // Esc para limpar filtros
    if (e.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT')) {
            activeElement.blur();
        }
    }
});

