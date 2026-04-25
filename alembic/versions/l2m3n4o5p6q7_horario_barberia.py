"""horario barberia

Revision ID: l2m3n4o5p6q7
Revises: k1l2m3n4o5p6
Create Date: 2026-04-25

"""
from alembic import op
import sqlalchemy as sa

revision = 'l2m3n4o5p6q7'
down_revision = 'k1l2m3n4o5p6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('barberias', sa.Column('hora_apertura', sa.String(), nullable=True, server_default='08:00'))
    op.add_column('barberias', sa.Column('hora_cierre', sa.String(), nullable=True, server_default='20:00'))
    op.add_column('barberias', sa.Column('dias_abiertos', sa.String(), nullable=True, server_default='1,2,3,4,5,6'))


def downgrade():
    op.drop_column('barberias', 'dias_abiertos')
    op.drop_column('barberias', 'hora_cierre')
    op.drop_column('barberias', 'hora_apertura')
