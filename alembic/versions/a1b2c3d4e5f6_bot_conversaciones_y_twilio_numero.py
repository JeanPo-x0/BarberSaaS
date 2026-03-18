"""bot conversaciones y twilio_numero en barberias

Revision ID: a1b2c3d4e5f6
Revises: aeb919f2f8cc
Create Date: 2026-03-18 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'c3d7e8a91f02'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Campo para identificar la barberia por numero Twilio en el webhook
    op.add_column('barberias', sa.Column('twilio_numero', sa.String(), nullable=True))

    # Tabla de estado de conversaciones del bot
    op.create_table(
        'conversaciones_bot',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('telefono', sa.String(), nullable=False),
        sa.Column('paso', sa.String(), nullable=True),
        sa.Column('barberia_id', sa.Integer(), sa.ForeignKey('barberias.id'), nullable=True),
        sa.Column('servicio_id', sa.Integer(), sa.ForeignKey('servicios.id'), nullable=True),
        sa.Column('barbero_id', sa.Integer(), sa.ForeignKey('barberos.id'), nullable=True),
        sa.Column('fecha', sa.String(), nullable=True),
        sa.Column('nombre_temp', sa.String(), nullable=True),
        sa.Column('actualizado_en', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_conversaciones_bot_id', 'conversaciones_bot', ['id'], unique=False)
    op.create_index('ix_conversaciones_bot_telefono', 'conversaciones_bot', ['telefono'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_conversaciones_bot_telefono', table_name='conversaciones_bot')
    op.drop_index('ix_conversaciones_bot_id', table_name='conversaciones_bot')
    op.drop_table('conversaciones_bot')
    op.drop_column('barberias', 'twilio_numero')
