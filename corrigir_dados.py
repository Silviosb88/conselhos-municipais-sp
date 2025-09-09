#!/usr/bin/env python3
"""
Script para corrigir a numeração das macrorregiões e verificar dados do Conselho do Idoso
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from models.municipio import db, Municipio
from flask import Flask

# Configurar Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'src', 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def corrigir_macrorregioes():
    """Corrige a numeração das macrorregiões de 10,20,30,40,50 para 1,2,3,4,5"""
    with app.app_context():
        print("Corrigindo numeração das macrorregiões...")
        
        # Mapeamento de correção
        correcoes = {
            10: 1,
            20: 2,
            30: 3,
            40: 4,
            50: 5
        }
        
        for macro_antiga, macro_nova in correcoes.items():
            municipios = Municipio.query.filter_by(macrorregiao=macro_antiga).all()
            print(f"Corrigindo Macrorregião {macro_antiga} -> {macro_nova}: {len(municipios)} municípios")
            
            for municipio in municipios:
                municipio.macrorregiao = macro_nova
        
        db.session.commit()
        print("Correção das macrorregiões concluída!")

def verificar_conselho_idoso():
    """Verifica os dados do Conselho do Idoso"""
    with app.app_context():
        print("\nVerificando dados do Conselho do Idoso...")
        
        # Contar municípios com dados do Conselho do Idoso
        total = Municipio.query.count()
        com_idoso = Municipio.query.filter(Municipio.conselho_idoso_existe == 'Sim').count()
        sem_idoso = Municipio.query.filter(Municipio.conselho_idoso_existe == 'Não há registro').count()
        sem_dados = total - com_idoso - sem_idoso
        
        print(f"Total de municípios: {total}")
        print(f"Com Conselho do Idoso: {com_idoso}")
        print(f"Sem Conselho do Idoso: {sem_idoso}")
        print(f"Sem dados sobre Conselho do Idoso: {sem_dados}")
        
        # Mostrar alguns exemplos
        print("\nExemplos de municípios com Conselho do Idoso:")
        exemplos_com = Municipio.query.filter(Municipio.conselho_idoso_existe == 'Sim').limit(5).all()
        for municipio in exemplos_com:
            print(f"- {municipio.nome_municipio} ({municipio.drads})")

def verificar_macrorregioes():
    """Verifica a distribuição atual das macrorregiões"""
    with app.app_context():
        print("\nDistribuição atual das macrorregiões:")
        
        from sqlalchemy import func
        stats = db.session.query(
            Municipio.macrorregiao,
            func.count(Municipio.id).label('total')
        ).filter(Municipio.macrorregiao.isnot(None)).group_by(Municipio.macrorregiao).order_by(Municipio.macrorregiao).all()
        
        for stat in stats:
            print(f"Macrorregião {stat.macrorregiao}: {stat.total} municípios")

if __name__ == '__main__':
    print("=== CORREÇÃO DE DADOS ===")
    
    # Verificar estado atual
    verificar_macrorregioes()
    
    # Corrigir numeração das macrorregiões
    corrigir_macrorregioes()
    
    # Verificar após correção
    verificar_macrorregioes()
    
    # Verificar dados do Conselho do Idoso
    verificar_conselho_idoso()
    
    print("\n=== CORREÇÃO CONCLUÍDA ===")

