"""barbero login campos

Revision ID: j0k1l2m3n4o5
Revises: i9j0k1l2m3n4
Create Date: 2026-04-22

"""
from alembic import op
import sqlalchemy as sa

revision = 'j0k1l2m3n4o5'
down_revision = 'i9j0k1l2m3n4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('barberos', sa.Column('email', sa.String(), nullable=True))
    op.add_column('barberos', sa.Column('password_hash', sa.String(), nullable=True))
    op.add_column('barberos', sa.Column('inv_token_hash', sa.String(), nullable=True))
    op.add_column('barberos', sa.Column('inv_token_expires', sa.DateTime(), nullable=True))
    op.add_column('barberos', sa.Column('cuenta_activa', sa.Boolean(), nullable=True, server_default='false'))
    try:
        op.create_index('ix_barberos_email', 'barberos', ['email'], unique=True)
    except Exception:
        pass


def downgrade():
    try:
        op.drop_index('ix_barberos_email', table_name='barberos')
    except Exception:
        pass
    op.drop_column('barberos', 'cuenta_activa')
    op.drop_column('barberos', 'inv_token_expires')
    op.drop_column('barberos', 'inv_token_hash')
    op.drop_column('barberos', 'password_hash')
    op.drop_column('barberos', 'email')
