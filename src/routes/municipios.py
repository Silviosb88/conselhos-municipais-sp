from flask import Blueprint, jsonify, request
from src.models.municipio import Municipio, db
from sqlalchemy import or_, and_, case, func

municipios_bp = Blueprint('municipios', __name__)

@municipios_bp.route('/municipios', methods=['GET'])
def listar_municipios():
    """Lista municípios com filtros opcionais"""
    try:
        # Parâmetros de filtro
        macrorregiao = request.args.get('macrorregiao')
        drads = request.args.get('drads')
        conselho_pcd = request.args.get('conselho_pcd')
        busca = request.args.get('busca')
        
        # Query base
        query = Municipio.query
        
        # Aplicar filtros
        if macrorregiao:
            query = query.filter(Municipio.macrorregiao == int(macrorregiao))
        
        if drads:
            query = query.filter(Municipio.drads.ilike(f'%{drads}%'))
        
        if conselho_pcd:
            query = query.filter(Municipio.conselho_pcd_existe == conselho_pcd)
        
        if busca:
            query = query.filter(Municipio.nome_municipio.ilike(f'%{busca}%'))
        
        # Ordenar por nome
        municipios = query.order_by(Municipio.nome_municipio).all()
        
        return jsonify({
            'success': True,
            'data': [municipio.to_dict() for municipio in municipios],
            'total': len(municipios)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@municipios_bp.route('/municipios/<int:municipio_id>', methods=['GET'])
def obter_municipio(municipio_id):
    """Obtém dados de um município específico"""
    try:
        municipio = Municipio.query.get_or_404(municipio_id)
        return jsonify({
            'success': True,
            'data': municipio.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@municipios_bp.route('/municipios/<int:municipio_id>', methods=['PUT'])
def atualizar_municipio(municipio_id):
    """Atualiza dados de um município"""
    try:
        municipio = Municipio.query.get_or_404(municipio_id)
        data = request.get_json()
        
        # Campos que podem ser atualizados
        campos_atualizaveis = [
            'conselho_pcd_existe', 'cmas_existe', 'cmdca_existe', 
            'conselho_idoso_existe', 'drads', 'populacao_2025'
        ]
        
        for campo in campos_atualizaveis:
            if campo in data:
                setattr(municipio, campo, data[campo])
        
        # Atualizar data de modificação
        from datetime import datetime
        municipio.data_atualizacao = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Município atualizado com sucesso',
            'data': municipio.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@municipios_bp.route('/estatisticas', methods=['GET'])
def obter_estatisticas():
    """Obtém estatísticas gerais dos conselhos"""
    try:
        total_municipios = Municipio.query.count()
        
        # Estatísticas gerais
        com_conselho_pcd = Municipio.query.filter(Municipio.conselho_pcd_existe == 'Sim').count()
        sem_conselho_pcd = Municipio.query.filter(Municipio.conselho_pcd_existe == 'Não há registro').count()
        
        # Estatísticas por macrorregião - versão simplificada
        stats_macro_raw = db.session.query(
            Municipio.macrorregiao,
            func.count(Municipio.id).label('total')
        ).filter(Municipio.macrorregiao.isnot(None)).group_by(Municipio.macrorregiao).all()
        
        # Calcular conselhos PcD por macrorregião separadamente
        stats_macro = []
        for macro_stat in stats_macro_raw:
            macro_id = macro_stat.macrorregiao
            total_macro = macro_stat.total
            
            com_pcd_macro = Municipio.query.filter(
                Municipio.macrorregiao == macro_id,
                Municipio.conselho_pcd_existe == 'Sim'
            ).count()
            
            percentual = round((com_pcd_macro / total_macro) * 100, 1) if total_macro > 0 else 0
            
            stats_macro.append({
                'macrorregiao': macro_id,
                'total': total_macro,
                'com_conselho_pcd': com_pcd_macro,
                'percentual': percentual
            })
        
        return jsonify({
            'success': True,
            'data': {
                'total_municipios': total_municipios,
                'com_conselho_pcd': com_conselho_pcd,
                'sem_conselho_pcd': sem_conselho_pcd,
                'percentual_com_conselho': round((com_conselho_pcd / total_municipios) * 100, 1) if total_municipios > 0 else 0,
                'por_macrorregiao': stats_macro
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@municipios_bp.route('/macrorregioes', methods=['GET'])
def listar_macrorregioes():
    """Lista as macrorregiões disponíveis"""
    try:
        macrorregioes = db.session.query(
            Municipio.macrorregiao,
            func.count(Municipio.id).label('total_municipios')
        ).filter(Municipio.macrorregiao.isnot(None)).group_by(Municipio.macrorregiao).order_by(Municipio.macrorregiao).all()
        
        return jsonify({
            'success': True,
            'data': [
                {
                    'id': macro.macrorregiao,
                    'nome': f'Macrorregião {int(macro.macrorregiao)}',
                    'total_municipios': macro.total_municipios
                }
                for macro in macrorregioes
            ]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@municipios_bp.route('/drads', methods=['GET'])
def listar_drads():
    """Lista as DRADS disponíveis"""
    try:
        drads = db.session.query(
            Municipio.drads,
            func.count(Municipio.id).label('total_municipios')
        ).filter(Municipio.drads.isnot(None)).group_by(Municipio.drads).order_by(Municipio.drads).all()
        
        return jsonify({
            'success': True,
            'data': [
                {
                    'nome': drad.drads,
                    'total_municipios': drad.total_municipios
                }
                for drad in drads
            ]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

