"""sistema_pagos: configuracion_pagos + cita payment fields

Revision ID: a2b3c4d5e6f7
Revises: b7f2c1d4e9a3
Create Date: 2026-04-18 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, None] = 'b7f2c1d4e9a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'configuracion_pagos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('barberia_id', sa.Integer(), nullable=False),
        sa.Column('sinpe_habilitado', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('sinpe_numero', sa.String(), nullable=True),
        sa.Column('sinpe_nombre', sa.String(), nullable=True),
        sa.Column('efectivo_habilitado', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('deposito_requerido', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('deposito_porcentaje', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('cancelacion_porcentaje', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('cancelacion_horas_minimo', sa.Integer(), nullable=True, server_default='24'),
        sa.ForeignKeyConstraint(['barberia_id'], ['barberias.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('barberia_id'),
    )
    op.create_index('ix_configuracion_pagos_id', 'configuracion_pagos', ['id'], unique=False)

    op.add_column('citas', sa.Column('estado_pago', sa.String(), nullable=True, server_default='exento'))
    op.add_column('citas', sa.Column('metodo_pago', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('citas', 'metodo_pago')
    op.drop_column('citas', 'estado_pago')
    op.drop_index('ix_configuracion_pagos_id', table_name='configuracion_pagos')
    op.drop_table('configuracion_pagos')
