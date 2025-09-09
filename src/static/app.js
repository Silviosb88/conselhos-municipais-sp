// Sistema de Conselhos Municipais - JavaScript
class ConselhosApp {
    constructor() {
        this.municipios = [];
        this.filteredMunicipios = [];
        this.macrorregioes = [];
        this.drads = [];
        this.stats = null;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
    }
    
    setupEventListeners() {
        // Navegação por abas
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.id));
        });
        
        // Filtros
        document.getElementById('aplicar-filtros').addEventListener('click', () => this.applyFilters());
        document.getElementById('limpar-filtros').addEventListener('click', () => this.clearFilters());
        
        // Enter key para busca
        document.getElementById('busca').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.applyFilters();
            }
        });
        
        // Filtros automáticos
        document.getElementById('macrorregiao').addEventListener('change', () => this.applyFilters());
        document.getElementById('drads').addEventListener('change', () => this.applyFilters());
        document.getElementById('conselho-pcd').addEventListener('change', () => this.applyFilters());
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
            this.filteredMunicipios = [...this.municipios];
            this.macrorregioes = macrorregiaoData.data || [];
            this.drads = dradsData.data || [];
            
            this.populateFilters();
            this.renderMunicipios();
            this.hideLoading();
            
        } catch (error) {
            this.showError('Erro ao carregar dados: ' + error.message);
            this.hideLoading();
        }
    }
    
    async loadStats() {
        try {
            document.getElementById('stats-loading').style.display = 'block';
            document.getElementById('stats-content').style.display = 'none';
            
            const response = await fetch('/api/estatisticas');
            if (!response.ok) throw new Error('Erro ao carregar estatísticas');
            
            const data = await response.json();
            this.stats = data.data;
            
            this.renderStats();
            
            document.getElementById('stats-loading').style.display = 'none';
            document.getElementById('stats-content').style.display = 'block';
            
        } catch (error) {
            this.showError('Erro ao carregar estatísticas: ' + error.message);
            document.getElementById('stats-loading').style.display = 'none';
        }
    }
    
    populateFilters() {
        // Macrorregiões
        const macroSelect = document.getElementById('macrorregiao');
        this.macrorregioes.forEach(macro => {
            const option = document.createElement('option');
            option.value = macro.id;
            option.textContent = macro.nome;
            macroSelect.appendChild(option);
        });
        
        // DRADS
        const dradsSelect = document.getElementById('drads');
        this.drads.forEach(drad => {
            const option = document.createElement('option');
            option.value = drad.nome;
            option.textContent = drad.nome;
            dradsSelect.appendChild(option);
        });
    }
    
    applyFilters() {
        const macrorregiao = document.getElementById('macrorregiao').value;
        const drads = document.getElementById('drads').value;
        const conselhoPcd = document.getElementById('conselho-pcd').value;
        const busca = document.getElementById('busca').value.toLowerCase();
        
        this.filteredMunicipios = this.municipios.filter(municipio => {
            // Filtro por macrorregião
            if (macrorregiao && municipio.macrorregiao != macrorregiao) {
                return false;
            }
            
            // Filtro por DRADS
            if (drads && municipio.drads !== drads) {
                return false;
            }
            
            // Filtro por conselho PcD
            if (conselhoPcd && municipio.conselho_pcd_existe !== conselhoPcd) {
                return false;
            }
            
            // Filtro por busca
            if (busca && !municipio.nome_municipio.toLowerCase().includes(busca)) {
                return false;
            }
            
            return true;
        });
        
        this.renderMunicipios();
    }
    
    clearFilters() {
        document.getElementById('macrorregiao').value = '';
        document.getElementById('drads').value = '';
        document.getElementById('conselho-pcd').value = '';
        document.getElementById('busca').value = '';
        
        this.filteredMunicipios = [...this.municipios];
        this.renderMunicipios();
    }
    
    renderMunicipios() {
        const tbody = document.getElementById('municipios-tbody');
        const table = document.getElementById('municipios-table');
        const countElement = document.getElementById('results-count');
        
        // Atualizar contador
        countElement.textContent = `${this.filteredMunicipios.length} municípios encontrados`;
        
        // Limpar tabela
        tbody.innerHTML = '';
        
        if (this.filteredMunicipios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">Nenhum município encontrado com os filtros aplicados</td></tr>';
        } else {
            this.filteredMunicipios.forEach(municipio => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${this.escapeHtml(municipio.nome_municipio)}</strong></td>
                    <td>${this.escapeHtml(municipio.drads || 'Não informado')}</td>
                    <td>Macro ${municipio.macrorregiao || 'N/A'}</td>
                    <td>${this.formatNumber(municipio.populacao_2025)}</td>
                    <td>${this.renderStatusBadge(municipio.conselho_pcd_existe)}</td>
                    <td>${this.renderStatusBadge(municipio.cmas_existe)}</td>
                    <td>${this.renderStatusBadge(municipio.cmdca_existe)}</td>
                `;
                tbody.appendChild(row);
            });
        }
        
        table.style.display = 'table';
    }
    
    renderStats() {
        if (!this.stats) return;
        
        // Estatísticas gerais
        const statsGrid = document.getElementById('stats-grid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${this.stats.total_municipios}</div>
                <div class="stat-label">Total de Municípios</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.stats.com_conselho_pcd}</div>
                <div class="stat-label">Com Conselho PcD</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.stats.sem_conselho_pcd}</div>
                <div class="stat-label">Sem Conselho PcD</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.stats.percentual_com_conselho}%</div>
                <div class="stat-label">Percentual com Conselho</div>
            </div>
        `;
        
        // Estatísticas por macrorregião
        const macroTbody = document.getElementById('stats-macro-tbody');
        macroTbody.innerHTML = '';
        
        this.stats.por_macrorregiao.forEach(macro => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>Macrorregião ${macro.macrorregiao}</td>
                <td>${macro.total}</td>
                <td>${macro.com_conselho_pcd}</td>
                <td>${macro.percentual}%</td>
            `;
            macroTbody.appendChild(row);
        });
    }
    
    renderStatusBadge(status) {
        if (!status) return '<span class="status-badge">N/A</span>';
        
        const isPositive = status === 'Sim';
        const className = isPositive ? 'status-sim' : 'status-nao';
        const text = isPositive ? 'Sim' : (status === 'Não há registro' ? 'Não' : status);
        
        return `<span class="status-badge ${className}">${text}</span>`;
    }
    
    switchTab(tabId) {
        // Remover active de todas as abas
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Ativar aba selecionada
        const activeTab = document.getElementById(tabId);
        const targetTabId = tabId.replace('-btn', '-tab');
        const targetContent = document.getElementById(targetTabId);
        
        if (activeTab && targetContent) {
            activeTab.classList.add('active');
            activeTab.setAttribute('aria-selected', 'true');
            targetContent.classList.add('active');
            
            // Carregar dados específicos da aba
            if (tabId === 'estatisticas-btn' && !this.stats) {
                this.loadStats();
            }
        }
    }
    
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
    
    showError(message) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
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

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new ConselhosApp();
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

