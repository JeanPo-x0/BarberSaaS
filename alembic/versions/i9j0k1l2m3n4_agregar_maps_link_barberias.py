"""agregar maps_link a barberias

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-04-21
"""
from alembic import op
import sqlalchemy as sa

revision = 'i9j0k1l2m3n4'
down_revision = 'h8i9j0k1l2m3'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('barberias',
        sa.Column('maps_link', sa.String(), nullable=True)
    )


def downgrade():
    op.drop_column('barberias', 'maps_link')
