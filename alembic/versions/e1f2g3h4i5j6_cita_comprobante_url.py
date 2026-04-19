"""cita: agregar comprobante_url

Revision ID: e1f2g3h4i5j6
Revises: f3g4h5i6j7k8
Create Date: 2026-04-19 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e1f2g3h4i5j6'
down_revision: Union[str, None] = 'f3g4h5i6j7k8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('citas', sa.Column('comprobante_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('citas', 'comprobante_url')
