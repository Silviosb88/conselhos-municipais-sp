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
        ['pcd', 'idoso', 'cmas', 'cmdca'].forEach(tipo => {
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
            this.filteredData.cmas = [...this.municipios];
            this.filteredData.cmdca = [...this.municipios];
            
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
        ['pcd', 'idoso', 'cmas', 'cmdca'].forEach(tipo => {
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
            if (sectionId === 'conselho-pcd' || sectionId === 'conselho-idoso' || sectionId === 'cmas' || sectionId === 'cmdca') {
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
        
        const campoConselho = tipo === 'pcd' ? 'conselho_pcd_existe' : 
                             tipo === 'idoso' ? 'conselho_idoso_existe' :
                             tipo === 'cmas' ? 'cmas_existe' :
                             tipo === 'cmdca' ? 'cmdca_existe' : 'conselho_pcd_existe';
        
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
        const campoConselho = tipo === 'pcd' ? 'conselho_pcd_existe' : 
                             tipo === 'idoso' ? 'conselho_idoso_existe' :
                             tipo === 'cmas' ? 'cmas_existe' :
                             tipo === 'cmdca' ? 'cmdca_existe' : 'conselho_pcd_existe';
        const nomeConselho = tipo === 'pcd' ? 'Conselho PcD' : 
                            tipo === 'idoso' ? 'Conselho do Idoso' :
                            tipo === 'cmas' ? 'CMAS' :
                            tipo === 'cmdca' ? 'CMDCA' : 'Conselho PcD';
        
        // Atualizar contador
        countElement.textContent = `${data.length} municípios encontrados`;
        
        // Limpar tabela
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">Nenhum município encontrado com os filtros aplicados</td></tr>`;
        } else {
            data.forEach(municipio => {
                const row = document.createElement('tr');
                
                // Adicionar botão de edição apenas para PcD
                const acaoCell = tipo === 'pcd' ? 
                    `<td><button type="button" class="btn-edit" onclick="abrirModalEdicao(${municipio.id})" aria-label="Editar dados de ${this.escapeHtml(municipio.nome_municipio)}">Editar</button></td>` : 
                    '';
                
                row.innerHTML = `
                    <td><strong>${this.escapeHtml(municipio.nome_municipio)}</strong></td>
                    <td>${this.escapeHtml(municipio.drads || 'Não informado')}</td>
                    <td>Macro ${String(municipio.macrorregiao || 'N/A').padStart(2, '0')}</td>
                    <td>${this.formatNumber(municipio.populacao_2025)}</td>
                    <td>${this.renderStatusBadge(municipio[campoConselho])}</td>
                    ${acaoCell}
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
        } else if (this.currentSection === 'cmas') {
            this.renderMunicipios('cmas');
        } else if (this.currentSection === 'cmdca') {
            this.renderMunicipios('cmdca');
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



// Funções para modal de edição
function abrirModalEdicao(municipioId) {
    if (!window.app) return;
    
    const municipio = window.app.municipios.find(m => m.id === municipioId);
    if (!municipio) {
        alert('Município não encontrado');
        return;
    }
    
    // Preencher dados do modal
    document.getElementById('edit-municipio-id').value = municipio.id;
    document.getElementById('edit-municipio-nome').value = municipio.nome_municipio;
    document.getElementById('edit-drads').value = municipio.drads || 'Não informado';
    document.getElementById('edit-macrorregiao').value = `Macro ${String(municipio.macrorregiao || 'N/A').padStart(2, '0')}`;
    document.getElementById('edit-populacao').value = new Intl.NumberFormat('pt-BR').format(municipio.populacao_2025 || 0);
    document.getElementById('edit-conselho-pcd').value = municipio.conselho_pcd_existe || '';
    document.getElementById('edit-observacoes').value = municipio.observacoes || '';
    
    // Mostrar modal
    document.getElementById('modal-edit-pcd').style.display = 'flex';
    document.getElementById('modal-overlay').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Focar no primeiro campo editável
    document.getElementById('edit-conselho-pcd').focus();
}

function fecharModalEdicao() {
    document.getElementById('modal-edit-pcd').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function salvarEdicao() {
    const form = document.getElementById('form-edit-pcd');
    const formData = new FormData(form);
    
    const dados = {
        municipio_id: formData.get('municipio_id'),
        conselho_pcd_existe: formData.get('conselho_pcd_existe'),
        observacoes: formData.get('observacoes') || ''
    };
    
    if (!dados.conselho_pcd_existe) {
        alert('Por favor, selecione o status do conselho');
        return;
    }
    
    try {
        const response = await fetch('/api/municipios/editar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados)
        });
        
        if (!response.ok) {
            throw new Error('Erro ao salvar dados');
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Atualizar dados locais
            const municipio = window.app.municipios.find(m => m.id == dados.municipio_id);
            if (municipio) {
                municipio.conselho_pcd_existe = dados.conselho_pcd_existe;
                municipio.observacoes = dados.observacoes;
            }
            
            // Recarregar tabela
            window.app.aplicarFiltros('pcd');
            
            // Fechar modal
            fecharModalEdicao();
            
            alert('Dados salvos com sucesso!');
        } else {
            throw new Error(result.message || 'Erro ao salvar dados');
        }
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar dados: ' + error.message);
    }
}

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modal-edit-pcd');
        if (modal && modal.style.display === 'flex') {
            fecharModalEdicao();
        }
    }
});


// Funções de impressão e relatórios
function imprimirRelatorio(tipo) {
    if (!window.app) return;
    
    const data = window.app.filteredData[tipo] || [];
    const nomeConselho = tipo === 'pcd' ? 'Pessoa com Deficiência' : 
                        tipo === 'idoso' ? 'Idoso' :
                        tipo === 'cmas' ? 'Assistência Social (CMAS)' :
                        tipo === 'cmdca' ? 'Criança e Adolescente (CMDCA)' : 'Conselhos';
    
    // Criar janela de impressão
    const printWindow = window.open('', '_blank');
    
    const campoConselho = tipo === 'pcd' ? 'conselho_pcd_existe' : 
                         tipo === 'idoso' ? 'conselho_idoso_existe' :
                         tipo === 'cmas' ? 'cmas_existe' :
                         tipo === 'cmdca' ? 'cmdca_existe' : 'conselho_pcd_existe';
    
    // Filtrar dados por status
    const comConselho = data.filter(m => m[campoConselho] === 'Sim');
    const semConselho = data.filter(m => m[campoConselho] === 'Não há registro');
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatório - Conselhos ${nomeConselho}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #009440; border-bottom: 2px solid #009440; padding-bottom: 10px; }
                h2 { color: #333; margin-top: 30px; }
                .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .summary-item { display: inline-block; margin: 10px 20px 10px 0; }
                .summary-number { font-size: 24px; font-weight: bold; color: #009440; }
                .summary-label { font-size: 14px; color: #666; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .status-sim { background-color: #d4edda; color: #155724; padding: 2px 6px; border-radius: 3px; }
                .status-nao { background-color: #f8d7da; color: #721c24; padding: 2px 6px; border-radius: 3px; }
                .footer { margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
                @media print {
                    body { margin: 0; }
                    .no-break { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <h1>Relatório - Conselhos Municipais ${nomeConselho}</h1>
            <p><strong>Estado de São Paulo</strong></p>
            <p><strong>Data do Relatório:</strong> ${new Date().toLocaleDateString('pt-BR', { 
                year: 'numeric', month: 'long', day: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
            })}</p>
            
            <div class="summary">
                <h2>Resumo Executivo</h2>
                <div class="summary-item">
                    <div class="summary-number">${data.length}</div>
                    <div class="summary-label">Total de Municípios</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number">${comConselho.length}</div>
                    <div class="summary-label">Com Conselho Ativo</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number">${semConselho.length}</div>
                    <div class="summary-label">Sem Conselho</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number">${data.length > 0 ? Math.round((comConselho.length / data.length) * 100) : 0}%</div>
                    <div class="summary-label">Cobertura</div>
                </div>
            </div>
            
            <h2>Municípios SEM Conselho ${nomeConselho} (${semConselho.length})</h2>
            <p><em>Lista prioritária para implementação de conselhos:</em></p>
            <table class="no-break">
                <thead>
                    <tr>
                        <th>Município</th>
                        <th>DRADS</th>
                        <th>Macrorregião</th>
                        <th>População 2025</th>
                    </tr>
                </thead>
                <tbody>
                    ${semConselho.map(municipio => `
                        <tr>
                            <td><strong>${municipio.nome_municipio}</strong></td>
                            <td>${municipio.drads || 'Não informado'}</td>
                            <td>Macro ${String(municipio.macrorregiao || 'N/A').padStart(2, '0')}</td>
                            <td>${new Intl.NumberFormat('pt-BR').format(municipio.populacao_2025 || 0)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <h2>Municípios COM Conselho ${nomeConselho} (${comConselho.length})</h2>
            <p><em>Conselhos ativos para parcerias e referências:</em></p>
            <table class="no-break">
                <thead>
                    <tr>
                        <th>Município</th>
                        <th>DRADS</th>
                        <th>Macrorregião</th>
                        <th>População 2025</th>
                    </tr>
                </thead>
                <tbody>
                    ${comConselho.map(municipio => `
                        <tr>
                            <td><strong>${municipio.nome_municipio}</strong></td>
                            <td>${municipio.drads || 'Não informado'}</td>
                            <td>Macro ${String(municipio.macrorregiao || 'N/A').padStart(2, '0')}</td>
                            <td>${new Intl.NumberFormat('pt-BR').format(municipio.populacao_2025 || 0)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p><strong>Sistema de Conselhos Municipais do Estado de São Paulo</strong></p>
                <p>Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}</p>
                <p>Total de registros processados: ${data.length} municípios</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Aguardar carregamento e imprimir
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };
}

function exportarCSV(tipo) {
    if (!window.app) return;
    
    const data = window.app.filteredData[tipo] || [];
    const nomeConselho = tipo === 'pcd' ? 'PcD' : 
                        tipo === 'idoso' ? 'Idoso' :
                        tipo === 'cmas' ? 'CMAS' :
                        tipo === 'cmdca' ? 'CMDCA' : 'Conselhos';
    
    const campoConselho = tipo === 'pcd' ? 'conselho_pcd_existe' : 
                         tipo === 'idoso' ? 'conselho_idoso_existe' :
                         tipo === 'cmas' ? 'cmas_existe' :
                         tipo === 'cmdca' ? 'cmdca_existe' : 'conselho_pcd_existe';
    
    // Cabeçalho do CSV
    const headers = [
        'Município',
        'DRADS',
        'Macrorregião',
        'População 2025',
        `Conselho ${nomeConselho}`,
        'Código IBGE'
    ];
    
    // Dados do CSV
    const csvData = data.map(municipio => [
        `"${municipio.nome_municipio}"`,
        `"${municipio.drads || 'Não informado'}"`,
        `"Macro ${String(municipio.macrorregiao || 'N/A').padStart(2, '0')}"`,
        municipio.populacao_2025 || 0,
        `"${municipio[campoConselho] || 'N/A'}"`,
        `"${municipio.codigo_ibge || 'N/A'}"`
    ]);
    
    // Juntar cabeçalho e dados
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    
    // Criar e baixar arquivo
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `conselhos_${tipo}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

