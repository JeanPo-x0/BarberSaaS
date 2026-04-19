"""agregar tarjeta_habilitado a configuracion_pagos

Revision ID: h8i9j0k1l2m3
Revises: e1f2g3h4i5j6
Create Date: 2026-04-19
"""
from alembic import op
import sqlalchemy as sa

revision = 'h8i9j0k1l2m3'
down_revision = 'e1f2g3h4i5j6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('configuracion_pagos',
        sa.Column('tarjeta_habilitado', sa.Boolean(), nullable=False, server_default='false')
    )


def downgrade():
    op.drop_column('configuracion_pagos', 'tarjeta_habilitado')
