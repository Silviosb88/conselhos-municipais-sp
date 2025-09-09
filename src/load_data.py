import os
import sys
import pandas as pd
from datetime import datetime
import re

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask
from src.models.municipio import db, Municipio

def limpar_numero(valor):
    """Limpa e converte valores numéricos"""
    if pd.isna(valor):
        return None
    
    # Converter para string e limpar
    valor_str = str(valor).strip()
    
    # Remover pontos de milhares e substituir vírgula por ponto
    valor_str = valor_str.replace('.', '').replace(',', '.')
    
    # Remover espaços
    valor_str = re.sub(r'\s+', '', valor_str)
    
    try:
        return int(float(valor_str))
    except (ValueError, TypeError):
        return None

def carregar_dados():
    """Carrega dados do Excel para o banco de dados"""
    
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        # Criar tabelas
        db.create_all()
        
        # Verificar se já existem dados
        if Municipio.query.count() > 0:
            print("Dados já existem no banco. Limpando...")
            Municipio.query.delete()
            db.session.commit()
        
        # Carregar dados do Excel
        excel_path = os.path.join(os.path.dirname(__file__), 'database', 'base_dados_consolidada_corrigida.xlsx')
        
        if not os.path.exists(excel_path):
            print(f"Arquivo não encontrado: {excel_path}")
            return
        
        print("Carregando dados do Excel...")
        df = pd.read_excel(excel_path, sheet_name='Base Consolidada')
        
        print(f"Encontrados {len(df)} municípios para carregar")
        
        # Carregar dados
        for index, row in df.iterrows():
            try:
                municipio = Municipio(
                    nome_municipio=row['nome_municipio'],
                    codigo_ibge=str(row['codigo_ibge']) if pd.notna(row['codigo_ibge']) else None,
                    drads=row['drads'] if pd.notna(row['drads']) else None,
                    macrorregiao=limpar_numero(row['macrorregiao']),
                    regiao_administrativa=row['regiao_administrativa'] if pd.notna(row['regiao_administrativa']) else None,
                    populacao_2025=limpar_numero(row['populacao_2025']),
                    conselho_pcd_existe=row['conselho_pcd_existe'] if pd.notna(row['conselho_pcd_existe']) else None,
                    cmas_existe=row['cmas_existe'] if pd.notna(row['cmas_existe']) else None,
                    cmdca_existe=row['cmdca_existe'] if pd.notna(row['cmdca_existe']) else None,
                    conselho_idoso_existe=row['conselho_idoso_existe'] if pd.notna(row['conselho_idoso_existe']) else None,
                    total_estabelecimentos=limpar_numero(row['total_estabelecimentos']) or 0,
                    estab_reabilitacao=limpar_numero(row['estab_reabilitacao']) or 0,
                    estab_fisio=limpar_numero(row['estab_fisio']) or 0,
                    estab_psico=limpar_numero(row['estab_psico']) or 0,
                    estab_social=limpar_numero(row['estab_social']) or 0,
                    data_atualizacao=datetime.utcnow(),
                    fonte_dados=row['fonte_dados'] if pd.notna(row['fonte_dados']) else 'Diversos (SEDS, IBGE, CNES)'
                )
                
                db.session.add(municipio)
                
                if (index + 1) % 50 == 0:
                    print(f"Processados {index + 1} municípios...")
                    
            except Exception as e:
                print(f"Erro ao processar município {row['nome_municipio']}: {e}")
                continue
        
        # Salvar no banco
        db.session.commit()
        print(f"Dados carregados com sucesso! Total: {Municipio.query.count()} municípios")

if __name__ == '__main__':
    carregar_dados()

