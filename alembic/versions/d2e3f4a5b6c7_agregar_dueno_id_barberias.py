"""agregar dueno_id a barberias para multiples barberias por dueno

Revision ID: d2e3f4a5b6c7
Revises: b7f2c1d4e9a3
Create Date: 2026-03-31 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'd2e3f4a5b6c7'
down_revision = 'b7f2c1d4e9a3'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('barberias', sa.Column('dueno_id', sa.Integer(), nullable=True))
    # Backfill: link each barbershop to its owner (the 'dueno' user with matching barberia_id)
    op.execute("""
        UPDATE barberias
        SET dueno_id = (
            SELECT id FROM usuarios
            WHERE barberia_id = barberias.id AND rol = 'dueno'
            LIMIT 1
        )
        WHERE dueno_id IS NULL
    """)


def downgrade():
    op.drop_column('barberias', 'dueno_id')
