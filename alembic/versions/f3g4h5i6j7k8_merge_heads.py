"""merge heads

Revision ID: f3g4h5i6j7k8
Revises: a2b3c4d5e6f7, d2e3f4a5b6c7
Create Date: 2026-04-18 00:00:00.000000

"""
from typing import Sequence, Union

revision: str = 'f3g4h5i6j7k8'
down_revision: Union[str, Sequence[str], None] = ('a2b3c4d5e6f7', 'd2e3f4a5b6c7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
