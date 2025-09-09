from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Municipio(db.Model):
    __tablename__ = 'municipios'
    
    id = db.Column(db.Integer, primary_key=True)
    nome_municipio = db.Column(db.String(100), nullable=False)
    codigo_ibge = db.Column(db.String(20), unique=True)
    drads = db.Column(db.String(100))
    macrorregiao = db.Column(db.Integer)
    regiao_administrativa = db.Column(db.String(50))
    populacao_2025 = db.Column(db.Integer)
    
    # Dados dos conselhos
    conselho_pcd_existe = db.Column(db.String(20))
    cmas_existe = db.Column(db.String(20))
    cmdca_existe = db.Column(db.String(20))
    conselho_idoso_existe = db.Column(db.String(20))
    
    # Dados de estabelecimentos
    total_estabelecimentos = db.Column(db.Integer, default=0)
    estab_reabilitacao = db.Column(db.Integer, default=0)
    estab_fisio = db.Column(db.Integer, default=0)
    estab_psico = db.Column(db.Integer, default=0)
    estab_social = db.Column(db.Integer, default=0)
    
    # Controle
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow)
    fonte_dados = db.Column(db.String(200))
    
    def __repr__(self):
        return f'<Municipio {self.nome_municipio}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome_municipio': self.nome_municipio,
            'codigo_ibge': self.codigo_ibge,
            'drads': self.drads,
            'macrorregiao': self.macrorregiao,
            'regiao_administrativa': self.regiao_administrativa,
            'populacao_2025': self.populacao_2025,
            'conselho_pcd_existe': self.conselho_pcd_existe,
            'cmas_existe': self.cmas_existe,
            'cmdca_existe': self.cmdca_existe,
            'conselho_idoso_existe': self.conselho_idoso_existe,
            'total_estabelecimentos': self.total_estabelecimentos,
            'estab_reabilitacao': self.estab_reabilitacao,
            'estab_fisio': self.estab_fisio,
            'estab_psico': self.estab_psico,
            'estab_social': self.estab_social,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None,
            'fonte_dados': self.fonte_dados
        }

