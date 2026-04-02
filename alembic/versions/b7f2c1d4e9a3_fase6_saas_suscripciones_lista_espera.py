"""fase6 saas suscripciones lista_espera subdominio

Revision ID: b7f2c1d4e9a3
Revises: a1b2c3d4e5f6
Create Date: 2026-03-31 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b7f2c1d4e9a3'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Nuevos campos en barberias
    op.add_column('barberias', sa.Column('subdominio', sa.String(), nullable=True))
    op.create_unique_constraint('uq_barberias_subdominio', 'barberias', ['subdominio'])

    # Tabla suscripciones
    op.create_table(
        'suscripciones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('barberia_id', sa.Integer(), sa.ForeignKey('barberias.id'), nullable=False),
        sa.Column('plan', sa.String(), nullable=True, server_default='basico'),
        sa.Column('estado', sa.String(), nullable=True, server_default='trial'),
        sa.Column('periodo', sa.String(), nullable=True, server_default='mensual'),
        sa.Column('fecha_inicio', sa.DateTime(), nullable=True),
        sa.Column('fecha_trial_fin', sa.DateTime(), nullable=True),
        sa.Column('fecha_renovacion', sa.DateTime(), nullable=True),
        sa.Column('stripe_customer_id', sa.String(), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(), nullable=True),
        sa.Column('stripe_price_id', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('barberia_id'),
    )
    op.create_index('ix_suscripciones_id', 'suscripciones', ['id'], unique=False)

    # Tabla lista_espera
    op.create_table(
        'lista_espera',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('barberia_id', sa.Integer(), sa.ForeignKey('barberias.id'), nullable=False),
        sa.Column('barbero_id', sa.Integer(), sa.ForeignKey('barberos.id'), nullable=True),
        sa.Column('servicio_id', sa.Integer(), sa.ForeignKey('servicios.id'), nullable=True),
        sa.Column('cliente_nombre', sa.String(), nullable=False),
        sa.Column('cliente_telefono', sa.String(), nullable=False),
        sa.Column('fecha_preferida', sa.DateTime(), nullable=True),
        sa.Column('posicion', sa.Integer(), nullable=False),
        sa.Column('estado', sa.String(), nullable=True, server_default='esperando'),
        sa.Column('notificado_en', sa.DateTime(), nullable=True),
        sa.Column('creado_en', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_lista_espera_id', 'lista_espera', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_lista_espera_id', table_name='lista_espera')
    op.drop_table('lista_espera')
    op.drop_index('ix_suscripciones_id', table_name='suscripciones')
    op.drop_table('suscripciones')
    op.drop_constraint('uq_barberias_subdominio', 'barberias', type_='unique')
    op.drop_column('barberias', 'subdominio')
