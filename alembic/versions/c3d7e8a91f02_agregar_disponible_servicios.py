"""agregar disponible a servicios

Revision ID: c3d7e8a91f02
Revises: aeb919f2f8cc
Create Date: 2026-03-18 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c3d7e8a91f02'
down_revision: Union[str, Sequence[str], None] = 'aeb919f2f8cc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('servicios', sa.Column('disponible', sa.Boolean(), nullable=True, server_default='true'))


def downgrade() -> None:
    op.drop_column('servicios', 'disponible')
