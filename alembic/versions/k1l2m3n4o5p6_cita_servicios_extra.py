"""cita servicios_extra

Revision ID: k1l2m3n4o5p6
Revises: j0k1l2m3n4o5
Create Date: 2026-04-22
"""
from alembic import op
import sqlalchemy as sa

revision = 'k1l2m3n4o5p6'
down_revision = 'j0k1l2m3n4o5'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('citas', sa.Column('servicios_extra', sa.JSON(), nullable=True))

def downgrade():
    op.drop_column('citas', 'servicios_extra')
